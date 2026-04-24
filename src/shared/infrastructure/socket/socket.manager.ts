import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import env from "dotenv";
import { chatService } from "../../../shared/config/dependencies";
import { TicketStatus } from "../../../modules/auth/entities/Ticket";

env.config();

interface UserPayload {
    userId: string;
    email: string;
    role: string;
}

let io: Server | null = null;

export const initSocket = (httpServer: HTTPServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    io.use((socket: Socket, next) => {
        console.log("🔍 Intento de conexión detectado..."); // <--- LOG DE DEBUG
        try {
            const cookieHeader = socket.handshake.headers.cookie;
             console.log("🍪 Cookie recibida:", cookieHeader); // <--- LOG DE DEBUG

            if (!cookieHeader) {
                 console.log("❌ No hay cookies en el handshake");
                return next(new Error("No autorizado - sin cookies"));
            }

            const cookies = Object.fromEntries(
                cookieHeader.split("; ").map((c) => {
                    const [key, value] = c.split("=");
                    return [key, value];
                })
            );

            const token = cookies["accessToken"];

            if (!token) {
                return next(new Error("No autorizado - sin token"));
            }

            const payload = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            ) as UserPayload;

            socket.data.user = payload;

            next();
        } catch (error) {
            console.error("❌ Error JWT:", error);

            next(new Error("No autorizado"));
        }
    });

    io.on("connection", async (socket: Socket) => {
        console.log("🟢 Cliente conectado:", socket.id);



        const user = socket.data.user;

        if (!user) {
            socket.disconnect(true);
            return;
        }
        // 👇 lógica de negocio
        if (user.role === "ADMIN") {
            socket.join("admins");
            console.log(`👑 Admin conectado: ${user.email}`);
        }
        // Todos los usuarios se unen a su propia sala privada
        socket.join(user.userId);
        console.log(`User ${user.email} se unió a su sala privada: ${user.userId}`);

        // Adentro de io.on("connection", ...)
        const history = await chatService.getHistory(user.userId);
        socket.emit("support:history", history);

        // El cliente envía un mensaje de soporte
        socket.on("support:message", async (data: { text: string; ticketId?: string; subject?: string }, callback: Function) => {
            try {
                let ticketId = data.ticketId;

                // 1. Si no hay ticketId, creamos uno nuevo (Límite de 5 se chequea en el servicio)
                if (!ticketId) {
                    if (!data.subject) {
                        return callback({ success: false, message: "El asunto es requerido para abrir un nuevo ticket" });
                    }
                    const newTicket = await chatService.createTicket(user.userId, data.subject);
                    ticketId = newTicket.id;
                    socket.join(`ticket:${ticketId}`);
                    
                    // Notificamos a los admins que hay un nuevo ticket en la lista
                    io?.to("admins").emit("support:ticket_created", {
                        ...newTicket,
                        userEmail: user.email
                    });
                } else {
                    // Si ya existe, nos aseguramos de estar en la sala
                    socket.join(`ticket:${ticketId}`);
                }

                // 2. Guardamos el mensaje vinculado al ticket
                const savedMessage = await chatService.saveMessage({
                    content: data.text,
                    sender_id: user.userId,
                    receiver_id: user.role === "ADMIN" ? "user" : "admins", // Simplificado
                    isAdminMessage: user.role === "ADMIN",
                    ticket_id: ticketId
                });

                // 3. Emitimos el mensaje a la sala específica del ticket
                io?.to(`ticket:${ticketId}`).emit("support:new_message", {
                    ...savedMessage,
                    ticketId
                });

                // 4. Confirmamos al cliente
                callback({ success: true, ticketId });
            } catch (error: any) {
                console.error("❌ Error al procesar mensaje:", error);
                callback({ success: false, message: error.message || "Error al enviar el mensaje" });
            }
        });

      
        socket.on("support:response", async (data: { ticketId: string; response: string }, callback: Function) => {
            try {
                if (user.role !== "ADMIN") return callback({ success: false, message: "No autorizado" });

                // 1. Guardamos la respuesta vinculada al ticket
                const savedResponse = await chatService.saveMessage({
                    content: data.response,
                    sender_id: user.userId,
                    receiver_id: "user", // El receptor se infiere del ticket en el cliente
                    isAdminMessage: true,
                    ticket_id: data.ticketId
                });

                // 2. Transición automática de estado: OPEN -> IN_PROGRESS
                await chatService.updateTicketStatus(data.ticketId, TicketStatus.IN_PROGRESS);

                // 3. Emitimos a la sala del ticket (usuario y otros admins suscritos)
                io?.to(`ticket:${data.ticketId}`).emit("support:new_message", {
                    ...savedResponse,
                    ticketId: data.ticketId
                });

                callback({ success: true });
            } catch (error) {
                console.error("❌ Error al procesar respuesta:", error);
                callback({ success: false });
            }
        });

        // Handler para resolver tickets
        socket.on("support:resolve_ticket", async (data: { ticketId: string }, callback: Function) => {
            try {
                if (user.role !== "ADMIN") return callback({ success: false, message: "No autorizado" });

                await chatService.resolveTicket(data.ticketId);
                
                // Notificamos a la sala que el ticket se cerró
                io?.to(`ticket:${data.ticketId}`).emit("support:ticket_resolved", { ticketId: data.ticketId });

                callback({ success: true });
            } catch (error) {
                console.error("❌ Error al resolver ticket:", error);
                callback({ success: false });
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 Cliente desconectado:", socket.id);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.io no fue inicializado!");
    }
    return io;
};