import { Request, Response } from 'express';
import { IAuthService } from './auth.types';
import { RegisterDto, LoginDto, LogoutAllDto, AuthResponseDtoSchema, TokenResponseDtoSchema } from './auth.dto';

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    const dto: RegisterDto = req.body;
    const result = await this.authService.register(dto.email, dto.password);
    const validatedResponse = AuthResponseDtoSchema.parse(result);
    res.status(201).json(validatedResponse);
  }

  async login(req: Request, res: Response): Promise<void> {
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
  }

  async refresh(req: Request, res: Response): Promise<void> {
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
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.cookies;
    await this.authService.logout(refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    const validatedResponse = TokenResponseDtoSchema.parse({ message: 'Logged out successfully' });
    res.status(200).json(validatedResponse);
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    const dto: LogoutAllDto = req.body;
    await this.authService.logoutAll(dto.userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    const validatedResponse = TokenResponseDtoSchema.parse({ message: 'Logged out from all devices' });
    res.status(200).json(validatedResponse);
  }

  async getProfile(req: Request, res: Response): Promise<void> {
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
}
