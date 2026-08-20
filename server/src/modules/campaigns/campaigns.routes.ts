import { Router } from 'express';
import { createCampaignSchema } from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './campaigns.service.js';
import * as callsSvc from '../calls/calls.service.js';

export const campaignRoutes = Router();

campaignRoutes.use(requireAuth);

campaignRoutes.post(
  '/',
  validate(createCampaignSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.createCampaign(req.user!.organizationId, req.body);
    res.status(201).json({ data: dto });
  }),
);

campaignRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const dtos = await svc.listCampaigns(req.user!.organizationId);
    res.json({ data: dtos });
  }),
);

campaignRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const dto = await svc.getCampaign(req.user!.organizationId, req.params.id);
    res.json({ data: dto });
  }),
);

campaignRoutes.get(
  '/:id/calls',
  asyncHandler(async (req, res) => {
    const items = await callsSvc.listCallsForCampaign(req.user!.organizationId, req.params.id);
    res.json({ data: items });
  }),
);

campaignRoutes.post(
  '/:id/launch',
  asyncHandler(async (req, res) => {
    const dto = await svc.launchCampaign(req.user!.organizationId, req.params.id);
    res.json({ data: dto });
  }),
);

campaignRoutes.post(
  '/:id/pause',
  asyncHandler(async (req, res) => {
    const dto = await svc.pauseCampaign(req.user!.organizationId, req.params.id);
    res.json({ data: dto });
  }),
);

campaignRoutes.post(
  '/:id/resume',
  asyncHandler(async (req, res) => {
    const dto = await svc.resumeCampaign(req.user!.organizationId, req.params.id);
    res.json({ data: dto });
  }),
);

campaignRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteCampaign(req.user!.organizationId, req.params.id);
    res.status(204).send();
  }),
);
