import { Router } from 'express';
import mongoose from 'mongoose';
import { authRoutes } from './modules/auth/auth.routes.js';
import { employeeRoutes } from './modules/aiEmployees/aiEmployees.routes.js';
import { contactRoutes } from './modules/contacts/contacts.routes.js';
import { campaignRoutes } from './modules/campaigns/campaigns.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { organizationRoutes } from './modules/organizations/organizations.routes.js';
import { complianceRoutes } from './modules/compliance/compliance.routes.js';
import { paymentRoutes } from './modules/payments/payments.routes.js';
import { retellWebhookRoutes } from './voice/retellWebhook.js';
import { devRoutes } from './modules/dev/dev.routes.js';
import { env } from './config/env.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', ts: new Date().toISOString() } });
});

// Readiness: reports DB connectivity for load balancers / orchestrators.
apiRouter.get('/ready', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res
    .status(dbReady ? 200 : 503)
    .json({ data: { ready: dbReady, db: dbReady ? 'connected' : 'disconnected' } });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/organizations', organizationRoutes);
apiRouter.use('/ai-employees', employeeRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/compliance', complianceRoutes);
apiRouter.use('/payments', paymentRoutes);
// Voice-provider webhooks (signature-authenticated, no JWT).
apiRouter.use('/voice', retellWebhookRoutes);

// Dev-only helpers (mock inbound call simulation) — disabled in production.
if (env.NODE_ENV !== 'production') {
  apiRouter.use('/dev', devRoutes);
}
