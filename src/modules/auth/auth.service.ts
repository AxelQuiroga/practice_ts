import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserResponseDto, IAuthService, IAuthRepository } from './auth.types';
import { AppError } from '../../shared/middlewares/errorHandler';
import { User, UserRole } from './entities/User';
import { getIO } from '../../shared/infrastructure/socket/socket.manager';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService implements IAuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async register(email: string, password: string): Promise<{ user: UserResponseDto }> {
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.authRepository.create({
      email,
      password: hashedPassword,
    });

    const io = getIO();
    const responseDto = this.toUserResponseDto(user);
    io.to("admins").emit("user:created", responseDto);
    return { user: responseDto };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponseDto }> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.toUserResponseDto(user) };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenData = await this.authRepository.findRefreshToken(refreshToken);
    if (!tokenData || tokenData.isRevoked || tokenData.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await this.authRepository.findById(tokenData.userId);
    if (!user) {
      throw new AppError(401, 'User not found');
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

  verifyAccessToken(token: string): { userId: string; email: string; role: string } {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    try {
      return jwt.verify(token, secret) as { userId: string; email: string; role: string };
    } catch (error) {
      throw new AppError(401, 'Invalid access token');
    }
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

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.authRepository.findAllUsers()

    return users.map(user => this.toUserResponseDto(user));
  }

  async deleteUser(id: string, adminId:string): Promise<void> {
    if(id === adminId){
      throw new AppError(403,"Operación bloqueada: No podés eliminarte a vos mismo.");
    }
    const userToDelete = await this.authRepository.findById(id);
    if (!userToDelete) throw new AppError(404,"Usuario no encontrado.");

    if (userToDelete.role === UserRole.ADMIN) {
      const adminCount = await this.authRepository.countByRole(UserRole.ADMIN);
      
      if (adminCount <= 1) {
        throw new AppError(403,"Operación bloqueada: No puedes eliminar al último administrador del sistema.");
      }
    }

    await this.authRepository.revokeAllUserTokens(id); 

    return this.authRepository.deleteUser(id);
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.authRepository.countByRole(role);
  }
}
