import { AuthRepository } from "../../modules/auth/auth.repository";
import { AuthService } from "../../modules/auth/auth.service";
import { AuthController } from "../../modules/auth/auth.controller";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
export const authController = new AuthController(authService);