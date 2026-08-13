import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logger } from '../../utils/logger.js';

/**
 * WhatsApp Cloud API (Meta) webhook.
 *
 * GET  — the verification handshake. Meta calls this once when you click
 *        "Verify and save": it sends hub.mode=subscribe, hub.verify_token and
 *        hub.challenge. We echo the challenge back as plain text only when the
 *        token matches WHATSAPP_VERIFY_TOKEN.
 * POST — inbound messages and status updates, signed by Meta with
 *        X-Hub-Signature-256 (HMAC-SHA256 of the raw body, keyed by the app
 *        secret). We verify the signature, then acknowledge with 200 (always,
 *        so Meta does not retry) after best-effort processing.
 */
export const whatsappRoutes = Router();

whatsappRoutes.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && env.WHATSAPP_VERIFY_TOKEN && token === env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).type('text/plain').send(String(challenge ?? ''));
  }
  logger.warn('WhatsApp webhook verification rejected');
  return res.sendStatus(403);
});

function signatureOk(rawBody: Buffer | undefined, header: string | undefined): boolean {
  // If no app secret is configured we cannot verify — reject to be safe.
  if (!env.META_APP_SECRET || !rawBody || !header) return false;
  const expected = 'sha256=' + createHmac('sha256', env.META_APP_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface WaWebhookBody {
  entry?: {
    changes?: {
      value?: {
        messages?: { from?: string; type?: string; text?: { body?: string } }[];
        statuses?: { id?: string; status?: string }[];
      };
    }[];
  }[];
}

whatsappRoutes.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    if (!signatureOk(req.rawBody, req.header('x-hub-signature-256'))) {
      logger.warn('WhatsApp webhook rejected: bad signature');
      return res.sendStatus(401);
    }
    // Best-effort processing; never fail the ack (Meta retries aggressively).
    try {
      const body = req.body as WaWebhookBody;
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          for (const msg of change.value?.messages ?? []) {
            logger.info(
              { from: msg.from, type: msg.type, text: msg.text?.body?.slice(0, 80) },
              'WhatsApp inbound message',
            );
          }
          for (const st of change.value?.statuses ?? []) {
            logger.info({ id: st.id, status: st.status }, 'WhatsApp status update');
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'WhatsApp webhook processing error');
    }
    res.sendStatus(200);
  }),
);
