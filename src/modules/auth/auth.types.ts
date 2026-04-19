import { UserResponseDto } from './auth.dto';
import { User } from './entities/User';

export interface IAuthRepository {
  findByEmail(email: string): Promise<any>;
  findById(id: string): Promise<any>;
  create(userData: any): Promise<any>;
  createRefreshToken(tokenData: any): Promise<any>;
  findRefreshToken(token: string): Promise<any>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  findAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
}

export interface IAuthService {
  register(email: string, password: string): Promise<{ user: UserResponseDto }>;
  login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: UserResponseDto }>;
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
  logoutAll(userId: string): Promise<void>;
  verifyAccessToken(token: string): { userId: string; email: string; role: string };
  findAllUsers(): Promise<UserResponseDto[]>;
  deleteUser(id: string): Promise<void>;
}

export type { UserResponseDto };
