import { Router } from 'express';
import { inboundLeadSchema, type LeadStatus } from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './leads.service.js';

export const leadRoutes = Router();

leadRoutes.use(requireAuth);

leadRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await svc.listLeads(req.user!.organizationId, {
      status: req.query.status as LeadStatus | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ data: result });
  }),
);

leadRoutes.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await svc.leadStats(req.user!.organizationId);
    res.json({ data: stats });
  }),
);

// Manual lead entry (also used to test the pipeline from the dashboard).
leadRoutes.post(
  '/',
  validate(inboundLeadSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.ingestLead(req.user!.organizationId, 'manual', req.body);
    res.status(201).json({ data: dto });
  }),
);
