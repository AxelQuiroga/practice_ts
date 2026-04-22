import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import env from "dotenv";

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

    io.on("connection", (socket: Socket) => {
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

        // El cliente envía un mensaje de soporte
        socket.on("support:message", (data: { text: string }) => {
            // Le avisamos a los ADMINS que hay un nuevo mensaje
            // Incluimos quién lo mandó para que el admin sepa a quién responder
            io?.to("admins").emit("support:new_message", {
                userId: user.userId,
                email: user.email,
                text: data.text,
                timestamp: new Date()
            });
        });
      
        socket.on("support:response", (data: { userId: string; response: string }) => {
            if (user.role !== "ADMIN") {
                console.warn(`⚠️ Intento de respuesta de soporte no autorizada por: ${user.email}`);
                return;
            }

            io?.to(data.userId).emit("support:response", {
                response: data.response,
                adminId: user.userId,
                adminEmail: user.email,
                timestamp: new Date(),
            });
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