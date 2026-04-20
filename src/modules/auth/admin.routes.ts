import { Router } from 'express';
import { authMiddleware, requireRole } from '../../shared/middlewares/auth';
import { UserRole } from './entities/User';
import { NextFunction, Request, Response } from 'express';
import { authController } from '../../shared/config/dependencies';

const router = Router();

router.get('/users', authMiddleware, requireRole(UserRole.ADMIN), (req: Request, res: Response, next: NextFunction) => authController.findAllUsers(req, res, next));
router.delete('/users/:id', authMiddleware, requireRole(UserRole.ADMIN), (req: Request, res: Response, next: NextFunction) => authController.deleteUser(req, res, next));
router.get('/stats', authMiddleware, requireRole(UserRole.ADMIN), (req: Request, res: Response, next: NextFunction) => authController.getAdminStats(req, res, next));

export default router;