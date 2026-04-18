import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { validateBody, validateCookie } from '../../shared/middlewares/validation';
import { RegisterDtoSchema, LoginDtoSchema, LogoutAllDtoSchema, CookieRefreshTokenDtoSchema } from './auth.dto';

const router = Router();
const authRepo = new AuthRepository();
const authService = new AuthService(authRepo);
const authController = new AuthController(authService);

router.post('/register', validateBody(RegisterDtoSchema), (req, res) => authController.register(req, res));
router.post('/login', validateBody(LoginDtoSchema), (req, res) => authController.login(req, res));
router.post('/refresh', validateCookie(CookieRefreshTokenDtoSchema), (req, res) => authController.refresh(req, res));
router.post('/logout', validateCookie(CookieRefreshTokenDtoSchema), (req, res) => authController.logout(req, res));
router.post('/logout-all', validateBody(LogoutAllDtoSchema), (req, res) => authController.logoutAll(req, res));

export default router;
