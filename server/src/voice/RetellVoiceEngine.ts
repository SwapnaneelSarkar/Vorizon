import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { MockVoiceEngine } from './MockVoiceEngine.js';
import { RetellClient } from './retellClient.js';
import type { InterviewContext, OutboundCallParams, VoiceEngine } from './VoiceEngine.js';

/**
 * Real telephony via Retell AI. Outbound calls are dialed through the Retell
 * agent configured in RETELL_AGENT_ID from the number in RETELL_FROM_NUMBER;
 * call outcomes come back on the Retell webhook (see retellWebhook.ts).
 *
 * The dashboard "interview" is a text chat, not a phone call, so it reuses the
 * same Claude-backed implementation as the mock engine.
 */
export class RetellVoiceEngine implements VoiceEngine {
  readonly provider = 'retell';
  private client = new RetellClient();
  private interviewer = new MockVoiceEngine();

  async syncAssistant(employeeId: string) {
    if (!env.RETELL_AGENT_ID) {
      throw new Error('RETELL_AGENT_ID is required (create an agent in the Retell dashboard)');
    }
    logger.info({ employeeId, agentId: env.RETELL_AGENT_ID }, 'Employee bound to Retell agent');
    return { assistantId: env.RETELL_AGENT_ID };
  }

  async provisionInboundNumber(_employeeId: string) {
    if (env.RETELL_FROM_NUMBER) return { phoneNumber: env.RETELL_FROM_NUMBER };
    const numbers = await this.client.listPhoneNumbers();
    if (!numbers.length) {
      throw new Error('No phone numbers in the Retell account — buy one or set RETELL_FROM_NUMBER');
    }
    return { phoneNumber: numbers[0].phone_number };
  }

  interviewTurn(ctx: InterviewContext) {
    return this.interviewer.interviewTurn(ctx);
  }

  async startOutboundCall(params: OutboundCallParams): Promise<{ externalCallId: string }> {
    const from = env.RETELL_FROM_NUMBER;
    if (!from) throw new Error('RETELL_FROM_NUMBER is required for outbound calling');

    const call = await this.client.createPhoneCall({
      from_number: from,
      to_number: params.to,
      ...(env.RETELL_AGENT_ID ? { override_agent_id: env.RETELL_AGENT_ID } : {}),
      // Round-tripped back to us on the webhook to attribute the call.
      metadata: {
        organizationId: params.organizationId,
        aiEmployeeId: params.aiEmployeeId,
        campaignId: params.campaignId,
        contactId: params.contactId,
      },
      // Exposed to the agent prompt as {{contact_name}} / {{recording_disclosure}}.
      retell_llm_dynamic_variables: {
        contact_name: params.contactName,
        recording_disclosure: params.disclosure ?? '',
      },
    });

    logger.info({ callId: call.call_id, to: params.to, campaignId: params.campaignId }, 'Retell call dialed');
    return { externalCallId: call.call_id };
  }
}
