import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './billing.service.js';

export const billingRoutes = Router();

billingRoutes.use(requireAuth);

billingRoutes.get(
  '/usage',
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const summary = await svc.getUsageSummary(req.user!.organizationId, { from, to });
    res.json({ data: summary });
  }),
);

billingRoutes.get(
  '/estimate',
  asyncHandler(async (req, res) => {
    const estimate = await svc.getEstimate(req.user!.organizationId);
    res.json({ data: estimate });
  }),
);
