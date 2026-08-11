import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type { CallOutcome } from '@vorizon/shared';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { handleCallEnded } from './handleCallEvent.js';

/**
 * Exotel does not sign status callbacks, so authenticity is a shared secret
 * appended to the callback URL (?token=…) and compared here. When
 * EXOTEL_WEBHOOK_TOKEN is unset the endpoint is unauthenticated (dev only).
 */
function tokenOk(provided: string | undefined): boolean {
  if (!env.EXOTEL_WEBHOOK_TOKEN) return true;
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(env.EXOTEL_WEBHOOK_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Map Exotel call status onto a Vorizon call outcome. */
function mapOutcome(status: string | undefined): CallOutcome {
  switch ((status ?? '').toLowerCase()) {
    case 'completed':
      return 'completed';
    case 'busy':
    case 'no-answer':
      return 'no_answer';
    default:
      return 'failed'; // failed, canceled, unknown
  }
}

export const exotelWebhookRoutes = Router();

/**
 * Exotel posts call-status params (CallSid, Status, ConversationDuration,
 * From/To, CustomField). Fields may arrive in the body (form) or query string,
 * so we read from both. CustomField carries our org/campaign/contact ids.
 */
exotelWebhookRoutes.post(
  '/exotel/webhook',
  asyncHandler(async (req, res) => {
    const token = (req.query.token as string) ?? undefined;
    if (!tokenOk(token)) throw ApiError.unauthorized('Invalid Exotel webhook token');

    const p = { ...(req.query as Record<string, string>), ...(req.body as Record<string, string>) };
    const callSid = p.CallSid || p.Sid;
    if (!callSid) throw ApiError.badRequest('Malformed webhook payload (no CallSid)');

    let meta: Record<string, string | undefined> = {};
    try {
      meta = p.CustomField ? (JSON.parse(p.CustomField) as Record<string, string>) : {};
    } catch {
      // CustomField may be a plain string in manual test calls — ignore.
    }

    if (!meta.organizationId || !meta.aiEmployeeId) {
      logger.warn({ callSid }, 'Exotel call without Vorizon metadata; ignoring');
      return res.json({ received: true });
    }

    const durationSec = Number(p.ConversationDuration || p.DialCallDuration || p.CallDuration || 0) || 0;
    const outcome = mapOutcome(p.Status);

    await handleCallEnded({
      externalCallId: callSid,
      provider: 'exotel',
      status: 'ended',
      direction: (p.Direction === 'incoming' ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
      organizationId: meta.organizationId,
      aiEmployeeId: meta.aiEmployeeId,
      from: p.CallerId || p.From || '',
      to: p.To || '',
      contactId: meta.contactId,
      campaignId: meta.campaignId,
      durationSec,
      outcome,
      escalated: false,
    });

    res.json({ received: true });
  }),
);
