import { AuthRepository } from "../../modules/auth/auth.repository";
import { AuthService } from "../../modules/auth/auth.service";
import { AuthController } from "../../modules/auth/auth.controller";
import { ChatRepository } from "../../modules/auth/chat.repository";
import { ChatService } from "../../modules/auth/chat/chat.service";

export const chatRepository = new ChatRepository();
export const chatService = new ChatService(chatRepository);
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
export const authController = new AuthController(authService);