import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './calls.service.js';

export const callRoutes = Router();

callRoutes.use(requireAuth);

callRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const dto = await svc.getCall(req.user!.organizationId, req.params.id);
    res.json({ data: dto });
  }),
);
