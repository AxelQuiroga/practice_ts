import { z } from 'zod';

// Request DTOs
export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const LogoutAllDtoSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const CookieRefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Response DTOs
export const UserResponseDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProtectedUserResponseDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
});

export const AuthResponseDtoSchema = z.object({
  user: UserResponseDtoSchema,
});

export const TokenResponseDtoSchema = z.object({
  message: z.string(),
});

export const ProtectedRouteResponseDtoSchema = z.object({
  message: z.string(),
  user: ProtectedUserResponseDtoSchema,
});

export const UsersListResponseDtoSchema = z.object({
  users: z.array(UserResponseDtoSchema),
});

export const AdminStatsResponseDtoSchema = z.object({
  totalUsers: z.number(),
  totalAdmins: z.number(),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;
export type LogoutAllDto = z.infer<typeof LogoutAllDtoSchema>;
export type CookieRefreshTokenDto = z.infer<typeof CookieRefreshTokenDtoSchema>;
export type UserResponseDto = z.infer<typeof UserResponseDtoSchema>;
export type ProtectedUserResponseDto = z.infer<typeof ProtectedUserResponseDtoSchema>;
export type AuthResponseDto = z.infer<typeof AuthResponseDtoSchema>;
export type TokenResponseDto = z.infer<typeof TokenResponseDtoSchema>;
export type ProtectedRouteResponseDto = z.infer<typeof ProtectedRouteResponseDtoSchema>;
export type UsersListResponseDto = z.infer<typeof UsersListResponseDtoSchema>;
export type AdminStatsResponseDto = z.infer<typeof AdminStatsResponseDtoSchema>;
