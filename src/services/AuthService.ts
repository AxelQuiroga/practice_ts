import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/AuthRepository';
import { User } from '../entities/User';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(email: string, password: string): Promise<{ user: Omit<User, 'password'> }> {
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.authRepository.create({
      email,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenData = await this.authRepository.findRefreshToken(refreshToken);
    if (!tokenData || tokenData.isRevoked || tokenData.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await this.authRepository.findById(tokenData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.authRepository.revokeRefreshToken(refreshToken);

    const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.authRepository.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.revokeAllUserTokens(userId);
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    return jwt.sign(
      { userId, email, role },
      secret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.createRefreshToken({
      token,
      userId,
      expiresAt,
    });

    return token;
  }

  verifyAccessToken(token: string): { userId: string; email: string; role: string } {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    try {
      return jwt.verify(token, secret) as { userId: string; email: string; role: string };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}
