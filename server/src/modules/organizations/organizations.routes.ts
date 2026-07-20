import { Router } from 'express';
import { createUserSchema, updateRoleSchema } from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { recordAudit } from '../../utils/audit.js';
import * as svc from './organizations.service.js';

export const organizationRoutes = Router();

organizationRoutes.use(requireAuth);

// List members — owner/admin only.
organizationRoutes.get(
  '/users',
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    const users = await svc.listUsers(req.user!.organizationId);
    res.json({ data: users });
  }),
);

// Create a member — owner/admin only.
organizationRoutes.post(
  '/users',
  requireRole('owner', 'admin'),
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const result = await svc.createUser(req.user!.organizationId, req.body);
    await recordAudit({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.userId,
      action: 'user.create',
      targetType: 'User',
      targetId: result.user.id,
      metadata: { role: result.user.role },
    });
    res.status(201).json({ data: result });
  }),
);

// Change a member's role — owner only.
organizationRoutes.patch(
  '/users/:userId/role',
  requireRole('owner'),
  validate(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const user = await svc.updateUserRole(
      req.user!.organizationId,
      req.user!.userId,
      req.params.userId,
      req.body.role,
    );
    await recordAudit({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.userId,
      action: 'user.role_change',
      targetType: 'User',
      targetId: user.id,
      metadata: { role: user.role },
    });
    res.json({ data: user });
  }),
);

// Remove a member — owner only.
organizationRoutes.delete(
  '/users/:userId',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    await svc.deleteUser(req.user!.organizationId, req.user!.userId, req.params.userId);
    await recordAudit({
      organizationId: req.user!.organizationId,
      actorUserId: req.user!.userId,
      action: 'user.delete',
      targetType: 'User',
      targetId: req.params.userId,
    });
    res.status(204).send();
  }),
);
