import { DataSource } from 'typeorm';
import { User } from '../../modules/auth/entities/User';
import { RefreshToken } from '../../modules/auth/entities/RefreshToken';
import { ChatMessage } from '../../modules/auth/entities/ChatMessage';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'test',
  synchronize: true,
  logging: true,
  entities: [User, RefreshToken, ChatMessage],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
