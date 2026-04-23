import { Request, Response, NextFunction } from 'express';
import { IAuthService } from './auth.types';
import { RegisterDto, LoginDto, LogoutAllDto, AuthResponseDtoSchema, TokenResponseDtoSchema, UsersListResponseDtoSchema, AdminStatsResponseDtoSchema } from './auth.dto';
import { UserRole } from './entities/User';
import { getIO } from "../../shared/infrastructure/socket/socket.manager";

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
   try {
     const dto: RegisterDto = req.body;
    const result = await this.authService.register(dto.email, dto.password);
    const validatedResponse = AuthResponseDtoSchema.parse(result);
    res.status(201).json(validatedResponse);
    const io = getIO();
    io.to("admins").emit("user:created", validatedResponse);
   } catch (error) {
    next(error);
   }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
   try {
    const dto: LoginDto = req.body;
    const result = await this.authService.login(dto.email, dto.password);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const validatedResponse = AuthResponseDtoSchema.parse({ user: result.user });
    res.status(200).json(validatedResponse);
   } catch (error) {
    next(error);
   }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
   try {
     const { refreshToken } = req.cookies;
    const result = await this.authService.refresh(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const validatedResponse = TokenResponseDtoSchema.parse({ message: 'Token refreshed' });
    res.status(200).json(validatedResponse);
   } catch (error) {
    next(error);
   }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.cookies;
    await this.authService.logout(refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    const validatedResponse = TokenResponseDtoSchema.parse({ message: 'Logged out successfully' });
    res.status(200).json(validatedResponse);
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: LogoutAllDto = req.body;
    await this.authService.logoutAll(dto.userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    const validatedResponse = TokenResponseDtoSchema.parse({ message: 'Logged out from all devices' });
    res.status(200).json(validatedResponse);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // El middleware ya pobló req.user con los datos del token
    const validatedResponse = AuthResponseDtoSchema.parse({
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        // Nota: Si necesitáramos más datos (como createdAt), 
        // acá llamaríamos al authService.findById
      }
    });

    res.status(200).json(validatedResponse);
  }

  async findAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
    const result = await this.authService.findAllUsers();
    const validatedResponse = UsersListResponseDtoSchema.parse({ users: result });
    res.status(200).json(validatedResponse);
    } catch (error) {
      next(error);
    }
  } 

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
     const { id } = req.params;
     const adminId = req.user?.userId;
    await this.authService.deleteUser(id as string, adminId as string);
    const validatedResponse = TokenResponseDtoSchema.parse({ message: 'User deleted successfully' });
    res.status(200).json(validatedResponse);
    } catch (error) {
      next(error);
    }
  }   

  async getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalUsers = await this.authService.countByRole(UserRole.USER);
      const totalAdmins = await this.authService.countByRole(UserRole.ADMIN);

      const validatedResponse = AdminStatsResponseDtoSchema.parse({
        totalUsers,
        totalAdmins,
      });

      res.status(200).json(validatedResponse);
    } catch (error) {
      next(error);
    }
  }
}
