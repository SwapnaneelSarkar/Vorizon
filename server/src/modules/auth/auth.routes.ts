import { Router } from 'express';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '@vorizon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { makeRateLimiter } from '../../middleware/rateLimit.js';
import * as ctrl from './auth.controller.js';

export const authRoutes = Router();

// Throttle credential endpoints to slow brute-force attempts (disabled in tests).
const authLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  prefix: 'rl:auth:',
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
});

authRoutes.post('/register', authLimiter, validate(registerSchema), asyncHandler(ctrl.registerHandler));
authRoutes.post('/login', authLimiter, validate(loginSchema), asyncHandler(ctrl.loginHandler));
authRoutes.post('/google', authLimiter, validate(googleAuthSchema), asyncHandler(ctrl.googleHandler));
authRoutes.post('/refresh', validate(refreshSchema), asyncHandler(ctrl.refreshHandler));
authRoutes.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(ctrl.forgotPasswordHandler),
);
authRoutes.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(ctrl.resetPasswordHandler),
);
authRoutes.post('/logout', requireAuth, asyncHandler(ctrl.logoutHandler));
authRoutes.get('/me', requireAuth, asyncHandler(ctrl.meHandler));
authRoutes.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(ctrl.changePasswordHandler),
);
