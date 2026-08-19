import type { Request, Response } from 'express';
import * as authService from './auth.service.js';

export async function registerHandler(req: Request, res: Response) {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
}

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json({ data: result });
}

export async function googleHandler(req: Request, res: Response) {
  const result = await authService.loginWithGoogle(req.body.idToken);
  res.json({ data: result });
}

export async function refreshHandler(req: Request, res: Response) {
  const result = await authService.refresh(req.body.refreshToken);
  res.json({ data: result });
}

export async function logoutHandler(req: Request, res: Response) {
  if (req.user) await authService.logout(req.user.userId);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response) {
  const result = await authService.me(req.user!.userId);
  res.json({ data: result });
}

export async function changePasswordHandler(req: Request, res: Response) {
  await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  res.status(204).send();
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await authService.forgotPassword(req.body.email);
  // Always 204 — never reveal whether the email exists.
  res.status(204).send();
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
  res.status(204).send();
}
