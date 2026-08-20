import { Router } from 'express';
import { inboundLeadSchema, startConnectSchema, type ConnectorProvider } from '@vorizon/shared';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';
import { ingestLead } from './leads.service.js';
import * as svc from './integrations.service.js';

export const integrationRoutes = Router();

/**
 * Inbound lead webhook — public, authenticated by the per-org intake token
 * (?token=…). Registered before the generic /:provider routes. Ad-platform
 * connectors post normalized leads here to enter the pipeline.
 */
integrationRoutes.post(
  '/leads/inbound/:orgId',
  validate(inboundLeadSchema),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    if (!svc.verifyLeadIntakeToken(orgId, req.query.token as string)) {
      throw ApiError.unauthorized('Invalid lead intake token');
    }
    const source = (req.query.source as string) || 'webhook';
    const dto = await ingestLead(orgId, source, req.body);
    res.status(201).json({ data: dto });
  }),
);

/**
 * OAuth callback — public (arrives via browser redirect from the provider),
 * authenticated by the signed state param. Redirects back to the app.
 */
integrationRoutes.get(
  '/:provider/callback',
  asyncHandler(async (req, res) => {
    const provider = req.params.provider as ConnectorProvider;
    const { code, state, error } = req.query as Record<string, string>;
    const appUrl = env.APP_BASE_URL.replace(/\/$/, '');

    if (error) {
      return res.redirect(
        `${appUrl}/integrations?error=${encodeURIComponent(error)}&provider=${encodeURIComponent(provider)}`,
      );
    }
    const verified = state ? svc.verifyState(state) : null;
    if (!verified || verified.provider !== provider || !code) {
      return res.redirect(`${appUrl}/integrations?error=invalid_state`);
    }
    try {
      await svc.handleCallback(provider, code, verified.orgId);
      res.redirect(`${appUrl}/integrations?connected=${provider}`);
    } catch (err) {
      logger.error({ err, provider }, 'OAuth callback failed');
      res.redirect(`${appUrl}/integrations?error=connect_failed`);
    }
  }),
);

// ---- authenticated management ----
integrationRoutes.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [connectors, leadIntakeUrl] = [
      await svc.listConnectors(req.user!.organizationId),
      svc.leadIntakeUrl(req.user!.organizationId),
    ];
    res.json({ data: { connectors, leadIntakeUrl } });
  }),
);

integrationRoutes.post(
  '/:provider/connect',
  requireAuth,
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    const parsed = startConnectSchema.safeParse({ provider: req.params.provider });
    if (!parsed.success) throw ApiError.badRequest('Unknown connector');
    const result = svc.startConnect(req.user!.organizationId, parsed.data.provider);
    res.json({ data: result });
  }),
);

integrationRoutes.delete(
  '/:provider',
  requireAuth,
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    await svc.disconnect(
      req.user!.organizationId,
      req.params.provider as ConnectorProvider,
      req.user!.userId,
    );
    res.status(204).send();
  }),
);
