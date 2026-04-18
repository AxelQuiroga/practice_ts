import { Router } from 'express';
import { authMiddleware, requireRole, requireAdmin } from '../middlewares/auth';
import { UserRole } from '../entities/User';

const router = Router();

// Pública - no requiere autenticación
router.get('/public', (req, res) => {
  res.json({ message: 'This is a public route' });
});

// Autenticada - requiere login, cualquier rol
router.get('/authenticated', authMiddleware, (req, res) => {
  res.json({ 
    message: 'This is an authenticated route',
    user: req.user 
  });
});

// Solo ADMIN - requiere login y rol admin
router.get('/admin', authMiddleware, requireAdmin, (req, res) => {
  res.json({ 
    message: 'This is an admin-only route',
    user: req.user 
  });
});

// Roles específicos - ejemplo: solo USER o ADMIN
router.get('/user-or-admin', authMiddleware, requireRole(UserRole.USER, UserRole.ADMIN), (req, res) => {
  res.json({ 
    message: 'This route is for USER or ADMIN roles',
    user: req.user 
  });
});

export default router;
