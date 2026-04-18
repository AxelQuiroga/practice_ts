import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.register(email, password);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ error: message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.login(email, password);

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

      res.status(200).json({ user: result.user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

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

      res.status(200).json({ message: 'Token refreshed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({ error: message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({ error: message });
    }
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId;

      if (!userId) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }

      await this.authService.logoutAll(userId);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({ message: 'Logged out from all devices' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({ error: message });
    }
  }
}
