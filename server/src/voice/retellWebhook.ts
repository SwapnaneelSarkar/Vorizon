import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type { CallOutcome } from '@vorizon/shared';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { optOutPhone } from '../modules/compliance/compliance.service.js';
import { handleCallEnded } from './handleCallEvent.js';
import type { RetellCall } from './retellClient.js';

/**
 * Retell signs webhooks with HMAC-SHA256 over the raw body, keyed by the API
 * key (header: x-retell-signature). Accepts an optional "v1=" prefix.
 */
function verifySignature(rawBody: Buffer, signature: string): boolean {
  if (!env.RETELL_API_KEY || !signature) return false;
  const provided = signature.startsWith('v1=') ? signature.slice(3) : signature;
  const expected = createHmac('sha256', env.RETELL_API_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Map Retell disconnection reasons onto Vorizon call outcomes. */
function mapOutcome(reason: string | undefined): CallOutcome {
  switch (reason) {
    case 'call_transfer':
      return 'transferred';
    case 'user_hangup':
    case 'agent_hangup':
    case 'call_completed':
      return 'completed';
    case 'dial_no_answer':
    case 'dial_busy':
    case 'voicemail_reached':
    case 'machine_detected':
      return 'no_answer';
    default:
      return 'failed';
  }
}

interface RetellWebhookBody {
  event: 'call_started' | 'call_ended' | 'call_analyzed';
  call: RetellCall;
}

export const retellWebhookRoutes = Router();

retellWebhookRoutes.post(
  '/retell/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.header('x-retell-signature') ?? '';
    if (env.RETELL_VERIFY_WEBHOOK && (!req.rawBody || !verifySignature(req.rawBody, signature))) {
      throw ApiError.unauthorized('Invalid Retell webhook signature');
    }

    const { event, call } = req.body as RetellWebhookBody;
    if (!call?.call_id) throw ApiError.badRequest('Malformed webhook payload');

    const meta = (call.metadata ?? {}) as Record<string, string | undefined>;
    const orgId = meta.organizationId;

    if (event === 'call_ended') {
      if (!orgId || !meta.aiEmployeeId) {
        // Not one of ours (e.g. dashboard test call) — acknowledge and move on.
        logger.warn({ callId: call.call_id }, 'Retell call without Vorizon metadata; ignoring');
        return res.json({ received: true });
      }
      const durationSec =
        call.end_timestamp && call.start_timestamp
          ? Math.max(0, Math.round((call.end_timestamp - call.start_timestamp) / 1000))
          : 0;
      const outcome = mapOutcome(call.disconnection_reason);
      await handleCallEnded({
        externalCallId: call.call_id,
        provider: 'retell',
        status: 'ended',
        direction: call.direction ?? 'outbound',
        organizationId: orgId,
        aiEmployeeId: meta.aiEmployeeId,
        from: call.from_number ?? '',
        to: call.to_number ?? '',
        contactId: meta.contactId,
        campaignId: meta.campaignId,
        durationSec,
        outcome,
        escalated: outcome === 'transferred',
        transcript: (call.transcript_object ?? []).map((t) => ({
          role: t.role === 'agent' ? ('ai' as const) : ('customer' as const),
          text: t.content,
          at: new Date().toISOString(),
        })),
      });
    } else if (event === 'call_analyzed') {
      // Compliance hook: a post-call analysis field named `opt_out_requested`
      // (configure in the Retell agent's analysis schema) auto-DNCs the number.
      const optOut = call.call_analysis?.custom_analysis_data?.opt_out_requested;
      if (optOut === true && orgId && call.to_number) {
        await optOutPhone(orgId, call.to_number, { source: 'in-call request (Retell)' });
        logger.info({ callId: call.call_id, to: call.to_number }, 'Caller opted out during call');
      }
    }
    // call_started and anything unrecognized: acknowledge without action.
    res.json({ received: true });
  }),
);
