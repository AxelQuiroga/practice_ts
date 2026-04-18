import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthRepository } from '../../modules/auth/auth.repository';
import { UserRole } from '../../modules/auth/entities/User';
import { AppError } from './errorHandler';
  
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      throw new AppError(401, 'Access token required');
    }

    const authService = new AuthService(new AuthRepository());
    const decoded = authService.verifyAccessToken(accessToken);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const userRole = req.user.role as UserRole;
      
      if (!allowedRoles.includes(userRole)) {
        throw new AppError(
          403,
          'Insufficient permissions',
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
