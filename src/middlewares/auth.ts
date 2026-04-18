import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../entities/User';

declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const authService = new AuthService();
    const decoded = authService.verifyAccessToken(accessToken);

    req.user = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(401).json({ error: message });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
