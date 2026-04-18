import { Router } from 'express';
import { authMiddleware, requireRole, requireAdmin } from '../../shared/middlewares/auth';
import { UserRole } from './entities/User';
import { ProtectedRouteResponseDtoSchema, ProtectedUserResponseDtoSchema } from './auth.dto';

const router = Router();

router.get('/authenticated', authMiddleware, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const userDto = ProtectedUserResponseDtoSchema.parse({
    id: req.user.userId,
    email: req.user.email,
    role: req.user.role,
  });

  const response = ProtectedRouteResponseDtoSchema.parse({
    message: 'This is an authenticated route',
    user: userDto,
  });

  res.json(response);
});

router.get('/admin', authMiddleware, requireAdmin, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const userDto = ProtectedUserResponseDtoSchema.parse({
    id: req.user.userId,
    email: req.user.email,
    role: req.user.role,
  });

  const response = ProtectedRouteResponseDtoSchema.parse({
    message: 'This is an admin-only route',
    user: userDto,
  });

  res.json(response);
});

router.get('/user-or-admin', authMiddleware, requireRole(UserRole.USER, UserRole.ADMIN), (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const userDto = ProtectedUserResponseDtoSchema.parse({
    id: req.user.userId,
    email: req.user.email,
    role: req.user.role,
  });

  const response = ProtectedRouteResponseDtoSchema.parse({
    message: 'This route is for USER or ADMIN roles',
    user: userDto,
  });

  res.json(response);
});

export default router;
