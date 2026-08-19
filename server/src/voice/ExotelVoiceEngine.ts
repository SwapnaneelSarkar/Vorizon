import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ExotelClient } from './exotelClient.js';
import { MockVoiceEngine } from './MockVoiceEngine.js';
import type { InterviewContext, OutboundCallParams, VoiceEngine } from './VoiceEngine.js';

/**
 * Real telephony via Exotel. Outbound calls are placed with Exotel's Connect
 * API, dialing the customer and connecting them to a Call Flow (EXOTEL_FLOW_URL)
 * that runs the Exotel Voicebot applet. Call outcomes arrive on the status
 * webhook (see exotelWebhook.ts).
 *
 * Important: the conversational AI (voice, prompt, knowledge) is configured in
 * the Exotel Voicebot dashboard — Exotel exposes no API to manage it — so this
 * engine only triggers and tracks calls; it does not own the bot's brain. The
 * dashboard "interview" chat therefore reuses the Claude/OpenAI-backed text
 * implementation from MockVoiceEngine.
 */
export class ExotelVoiceEngine implements VoiceEngine {
  readonly provider = 'exotel';
  private client = new ExotelClient();
  private interviewer = new MockVoiceEngine();

  async syncAssistant(employeeId: string) {
    // No API to sync knowledge into the Exotel Voicebot; it is built in Exotel's
    // dashboard. We just record the binding for traceability.
    logger.info({ employeeId }, 'Employee will use the Exotel Voicebot flow (configured in Exotel)');
    return { assistantId: env.EXOTEL_FLOW_URL || 'exotel-voicebot' };
  }

  async provisionInboundNumber(_employeeId: string) {
    if (!env.EXOTEL_CALLER_ID) {
      throw new Error('EXOTEL_CALLER_ID (an ExoPhone) is required — buy/assign one in Exotel');
    }
    return { phoneNumber: env.EXOTEL_CALLER_ID };
  }

  interviewTurn(ctx: InterviewContext) {
    return this.interviewer.interviewTurn(ctx);
  }

  async startOutboundCall(params: OutboundCallParams): Promise<{ externalCallId: string }> {
    if (!env.EXOTEL_CALLER_ID || !env.EXOTEL_FLOW_URL) {
      throw new Error('EXOTEL_CALLER_ID and EXOTEL_FLOW_URL are required for outbound calling');
    }
    const token = env.EXOTEL_WEBHOOK_TOKEN ? `?token=${encodeURIComponent(env.EXOTEL_WEBHOOK_TOKEN)}` : '';
    // Must point at the API host, not APP_BASE_URL (the Vercel-hosted client) —
    // Exotel calls this back directly, and the client has no such route.
    const base = (env.API_BASE_URL || env.APP_BASE_URL).replace(/\/$/, '');
    const statusCallback = `${base}/api/voice/exotel/webhook${token}`;

    // Round-tripped back to us on the status webhook to attribute the call.
    const customField = JSON.stringify({
      organizationId: params.organizationId,
      aiEmployeeId: params.aiEmployeeId,
      campaignId: params.campaignId,
      contactId: params.contactId,
    });

    const { sid } = await this.client.connectToFlow({
      to: params.to,
      callerId: env.EXOTEL_CALLER_ID,
      flowUrl: env.EXOTEL_FLOW_URL,
      statusCallback,
      customField,
    });

    logger.info({ callSid: sid, to: params.to, campaignId: params.campaignId }, 'Exotel call dialed');
    return { externalCallId: sid };
  }
}
