import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import env from "dotenv";

env.config();

interface UserPayload {
    id: string;
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

        console.log("Usuario:", socket.data.user);

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