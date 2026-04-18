import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';

export class AuthRepository {
  private userRepository: Repository<User>;
  private refreshTokenRepository: Repository<RefreshToken>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async createRefreshToken(tokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.refreshTokenRepository.create(tokenData);
    return await this.refreshTokenRepository.save(token);
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findOne({
      where: { token, isRevoked: false },
      relations: ['user'],
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
