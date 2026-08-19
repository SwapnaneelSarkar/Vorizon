import { Router } from 'express';
import { createContactSchema, paginationQuerySchema } from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../middleware/upload.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import * as svc from './contacts.service.js';

export const contactRoutes = Router();

contactRoutes.use(requireAuth);

contactRoutes.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const campaignId = typeof req.body.campaignId === 'string' ? req.body.campaignId : undefined;
    const result = await svc.importContacts(req.user!.organizationId, req.file, campaignId);
    res.status(201).json({ data: result });
  }),
);

contactRoutes.post(
  '/',
  validate(createContactSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.createContact(req.user!.organizationId, req.body);
    res.status(201).json({ data: dto });
  }),
);

contactRoutes.get(
  '/',
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { campaignId, validationStatus, page, limit } = req.query as unknown as {
      campaignId?: string;
      validationStatus?: string;
      page: number;
      limit: number;
    };
    const result = await svc.listContacts(req.user!.organizationId, {
      campaignId,
      validationStatus,
      page,
      limit,
    });
    res.json({ data: result });
  }),
);

contactRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteContact(req.user!.organizationId, req.params.id);
    res.status(204).send();
  }),
);
