import { z } from 'zod';
import { ROLES } from '../enums.js';

/** Shared password policy: min 8 chars, at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  orgName: z.string().min(2, 'Organization name is required'),
  name: z.string().min(2, 'Your name is required'),
  email: z.string().email(),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(ROLES).default('member'),
  password: passwordSchema.optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),
});
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
