import { Router } from 'express';
import mongoose from 'mongoose';
import { authRoutes } from './modules/auth/auth.routes.js';
import { employeeRoutes } from './modules/aiEmployees/aiEmployees.routes.js';
import { contactRoutes } from './modules/contacts/contacts.routes.js';
import { campaignRoutes } from './modules/campaigns/campaigns.routes.js';
import { callRoutes } from './modules/calls/calls.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { organizationRoutes } from './modules/organizations/organizations.routes.js';
import { complianceRoutes } from './modules/compliance/compliance.routes.js';
import { paymentRoutes } from './modules/payments/payments.routes.js';
import { integrationRoutes } from './modules/integrations/integrations.routes.js';
import { whatsappRoutes } from './modules/integrations/whatsapp.routes.js';
import { leadRoutes } from './modules/integrations/leads.routes.js';
import { retellWebhookRoutes } from './voice/retellWebhook.js';
import { exotelWebhookRoutes } from './voice/exotelWebhook.js';
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
apiRouter.use('/calls', callRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/compliance', complianceRoutes);
apiRouter.use('/payments', paymentRoutes);
// WhatsApp Cloud API webhook — mounted before the generic integration routes
// so /integrations/whatsapp/webhook is handled here (public, Meta-verified).
apiRouter.use('/integrations/whatsapp', whatsappRoutes);
apiRouter.use('/integrations', integrationRoutes);
apiRouter.use('/leads', leadRoutes);
// Voice-provider webhooks (authenticated by signature/token, no JWT).
apiRouter.use('/voice', retellWebhookRoutes);
apiRouter.use('/voice', exotelWebhookRoutes);

// Dev-only helpers (mock inbound call simulation) — disabled in production.
if (env.NODE_ENV !== 'production') {
  apiRouter.use('/dev', devRoutes);
}
