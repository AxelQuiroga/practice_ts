import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { AppDataSource } from './shared/config/database';

dotenv.config();

const PORT = process.env.PORT || 3009;

const initializeServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during Data Source initialization:', error);
    process.exit(1);
  }
};

initializeServer();
