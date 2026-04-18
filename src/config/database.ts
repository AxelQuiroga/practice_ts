import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
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
  logging: false,
  entities: [User, RefreshToken],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
