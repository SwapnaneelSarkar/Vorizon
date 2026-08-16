import { Router } from 'express';
import type { WalletDTO } from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './billing.service.js';
import { LOW_BALANCE_USD, getWallet, listTransactions } from './wallet.service.js';

export const billingRoutes = Router();

billingRoutes.use(requireAuth);

billingRoutes.get(
  '/wallet',
  asyncHandler(async (req, res) => {
    const orgId = req.user!.organizationId;
    const [wallet, txns] = await Promise.all([getWallet(orgId), listTransactions(orgId)]);
    const data: WalletDTO = {
      ...wallet,
      lowThresholdUsd: LOW_BALANCE_USD,
      transactions: txns.map((t) => ({
        id: String((t as { _id: unknown })._id),
        type: t.type as 'credit' | 'debit',
        amountUsd: t.amountUsd,
        balanceAfterUsd: t.balanceAfterUsd,
        reason: t.reason,
        createdAt: (t as unknown as { createdAt: Date }).createdAt.toISOString(),
      })),
    };
    res.json({ data });
  }),
);

billingRoutes.get(
  '/usage',
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const summary = await svc.getUsageSummary(req.user!.organizationId, { from, to });
    res.json({ data: summary });
  }),
);

billingRoutes.get(
  '/estimate',
  asyncHandler(async (req, res) => {
    const estimate = await svc.getEstimate(req.user!.organizationId);
    res.json({ data: estimate });
  }),
);
