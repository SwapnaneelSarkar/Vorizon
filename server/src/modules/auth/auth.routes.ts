import { Router } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@vorizon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as ctrl from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), asyncHandler(ctrl.registerHandler));
authRoutes.post('/login', validate(loginSchema), asyncHandler(ctrl.loginHandler));
authRoutes.post('/refresh', validate(refreshSchema), asyncHandler(ctrl.refreshHandler));
authRoutes.post('/logout', requireAuth, asyncHandler(ctrl.logoutHandler));
authRoutes.get('/me', requireAuth, asyncHandler(ctrl.meHandler));
