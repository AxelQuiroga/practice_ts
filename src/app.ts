import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import protectedRoutes from './modules/auth/protected';
import { errorHandler, notFoundHandler } from './shared/middlewares/errorHandler';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // URL de Vite (cambiar si usás otro puerto)
  credentials: true // FUNDAMENTAL para que el browser acepte y envíe cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
