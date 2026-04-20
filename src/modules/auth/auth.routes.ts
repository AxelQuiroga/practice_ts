import { Router } from 'express';
import { validateBody, validateCookie } from '../../shared/middlewares/validation';
import { authMiddleware } from '../../shared/middlewares/auth';
import { RegisterDtoSchema, LoginDtoSchema, LogoutAllDtoSchema, CookieRefreshTokenDtoSchema } from './auth.dto';
import { NextFunction, Request, Response } from 'express';
import { authController } from '../../shared/config/dependencies';

const router = Router();

router.post('/register', validateBody(RegisterDtoSchema), (req: Request, res: Response, next: NextFunction) => authController.register(req, res, next));
router.post('/login', validateBody(LoginDtoSchema), (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next));
router.post('/refresh', validateCookie(CookieRefreshTokenDtoSchema), (req: Request, res: Response, next: NextFunction) => authController.refresh(req, res, next));
router.post('/logout', validateCookie(CookieRefreshTokenDtoSchema), (req: Request, res: Response, next: NextFunction) => authController.logout(req, res, next));
router.post('/logout-all', validateBody(LogoutAllDtoSchema), (req: Request, res: Response, next: NextFunction) => authController.logoutAll(req, res, next));
router.get('/profile', authMiddleware, (req: Request, res: Response, next: NextFunction) => authController.getProfile(req, res, next));

export default router;
