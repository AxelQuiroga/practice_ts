import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import env from "dotenv";
import { chatService } from "../../../shared/config/dependencies";

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
        try {
            const cookieHeader = socket.handshake.headers.cookie;

            if (!cookieHeader) {
                return next(new Error("No autorizado - sin cookies"));
            }

            const cookies = Object.fromEntries(
                cookieHeader.split("; ").map((c) => {
                    const [key, value] = c.split("=");
                    return [key, value];
                })
            );

            const token = cookies["access_token"];

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
    socket.on("support:message", async (data: { text: string }, callback: Function) => {
    try {
        // 1. Guardamos en DB a través del servicio
        const savedMessage = await chatService.saveMessage({
            content: data.text,
            sender_id: user.userId,
            receiver_id: "admins",
            isAdminMessage: user.role === "ADMIN"
        });

        // 2. Avisamos a los administradores en tiempo real
        // Mandamos el objeto que nos devolvió el servicio (que ya tiene ID y fecha)
        io?.to("admins").emit("support:new_message", savedMessage);

        // 3. Confirmamos al cliente que todo salió bien
        callback({ success: true, message: "Mensaje enviado correctamente" });
    } catch (error) {
        console.error("❌ Error al procesar mensaje:", error);
        callback({ success: false, message: "Error al enviar el mensaje" });
    }
});

      
        socket.on("support:response", async (data: { userId: string; response: string }, callback: Function) => {
    try {
        // 1. Doble check de seguridad (Senior mindset)
        if (user.role !== "ADMIN") return callback({ success: false, message: "No autorizado" });

        // 2. Guardamos la respuesta del admin en la DB
        const savedResponse = await chatService.saveMessage({
            content: data.response,
            sender_id: user.userId, // El ID del admin
            receiver_id: data.userId, // El ID del usuario que preguntó
            isAdminMessage: true
        });

        // 3. Le mandamos la respuesta al usuario específico (a su sala privada)
        io?.to(data.userId).emit("support:response", savedResponse);

        // 4. Confirmamos al admin que se envió
        callback({ success: true });
    } catch (error) {
        console.error("❌ Error al procesar respuesta:", error);
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