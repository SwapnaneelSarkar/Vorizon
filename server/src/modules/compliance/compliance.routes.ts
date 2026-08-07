import { Router } from 'express';
import {
  addDncSchema,
  optOutSchema,
  recordConsentSchema,
  updateComplianceSettingsSchema,
} from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './compliance.service.js';

export const complianceRoutes = Router();

complianceRoutes.use(requireAuth);

// Current compliance state: consent, disclosure settings, DNC size.
complianceRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const dto = await svc.getComplianceSettings(req.user!.organizationId);
    res.json({ data: dto });
  }),
);

// Explicit AI-calling consent — owner/admin only; stores timestamp + IP.
complianceRoutes.post(
  '/consent',
  requireRole('owner', 'admin'),
  validate(recordConsentSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.recordConsent(req.user!.organizationId, req.user!.userId, req.ip);
    res.json({ data: dto });
  }),
);

// Jurisdiction settings (recording disclosure) — owner/admin only.
complianceRoutes.patch(
  '/settings',
  requireRole('owner', 'admin'),
  validate(updateComplianceSettingsSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.updateComplianceSettings(
      req.user!.organizationId,
      req.user!.userId,
      req.body,
    );
    res.json({ data: dto });
  }),
);

// ---- Do Not Call list ----
complianceRoutes.get(
  '/dnc',
  asyncHandler(async (req, res) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await svc.listDnc(req.user!.organizationId, { page, limit });
    res.json({ data: result });
  }),
);

complianceRoutes.post(
  '/dnc',
  validate(addDncSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.addToDnc(req.user!.organizationId, req.body.phone, 'manual', {
      userId: req.user!.userId,
      note: req.body.note,
    });
    res.status(201).json({ data: dto });
  }),
);

complianceRoutes.delete(
  '/dnc/:id',
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    await svc.removeFromDnc(req.user!.organizationId, req.params.id, req.user!.userId);
    res.status(204).send();
  }),
);

// Opt a phone number out of all future AI calls (adds to DNC + flags contacts).
complianceRoutes.post(
  '/opt-out',
  validate(optOutSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.optOutPhone(req.user!.organizationId, req.body.phone, {
      userId: req.user!.userId,
      source: 'dashboard',
    });
    res.status(201).json({ data: dto });
  }),
);
