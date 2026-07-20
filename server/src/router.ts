import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { employeeRoutes } from './modules/aiEmployees/aiEmployees.routes.js';
import { contactRoutes } from './modules/contacts/contacts.routes.js';
import { campaignRoutes } from './modules/campaigns/campaigns.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { devRoutes } from './modules/dev/dev.routes.js';
import { env } from './config/env.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', ts: new Date().toISOString() } });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/ai-employees', employeeRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/analytics', analyticsRoutes);

// Dev-only helpers (mock inbound call simulation) — disabled in production.
if (env.NODE_ENV !== 'production') {
  apiRouter.use('/dev', devRoutes);
}
