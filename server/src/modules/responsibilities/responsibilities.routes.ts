import { Router } from 'express';
import { RESPONSIBILITY_PRESETS, setResponsibilitiesSchema } from '@vorizon/shared';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './responsibilities.service.js';

export const responsibilityRoutes = Router({ mergeParams: true });

responsibilityRoutes.get('/presets', (_req, res) => {
  res.json({ data: RESPONSIBILITY_PRESETS });
});

responsibilityRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const dtos = await svc.listResponsibilities(req.user!.organizationId, req.params.id);
    res.json({ data: dtos });
  }),
);

responsibilityRoutes.put(
  '/',
  validate(setResponsibilitiesSchema),
  asyncHandler(async (req, res) => {
    const dtos = await svc.setResponsibilities(req.user!.organizationId, req.params.id, req.body);
    res.json({ data: dtos });
  }),
);
