import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './analytics.service.js';

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth);

analyticsRoutes.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const data = await svc.getDashboard(req.user!.organizationId);
    res.json({ data });
  }),
);
