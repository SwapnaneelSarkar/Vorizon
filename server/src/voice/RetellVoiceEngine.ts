import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AIEmployee } from '../models/AIEmployee.js';
import { compileSystemPrompt } from '../modules/interview/promptCompiler.js';
import { MockVoiceEngine } from './MockVoiceEngine.js';
import { RetellClient } from './retellClient.js';
import type { InterviewContext, OutboundCallParams, VoiceEngine } from './VoiceEngine.js';

/**
 * Real telephony via Retell AI.
 *
 * Each AI employee is synced to its OWN Retell LLM + agent, built from that
 * employee's configured brain (knowledge, responsibilities, tone, rules,
 * language) — so a real call actually reflects how the business set the employee
 * up, rather than a single shared demo agent. Outbound calls dial through the
 * employee's agent; inbound numbers are bound to it. Outcomes return on the
 * Retell webhook (see retellWebhook.ts).
 *
 * The dashboard "interview" is a text chat, not a phone call, so it reuses the
 * same Claude-backed implementation as the mock engine.
 */
export class RetellVoiceEngine implements VoiceEngine {
  readonly provider = 'retell';
  private client = new RetellClient();
  private interviewer = new MockVoiceEngine();

  /**
   * Create (or update) this employee's Retell LLM + agent from its live config,
   * and persist the ids so a re-sync updates the same objects. Returns the agent
   * id used to dial / answer for this employee.
   */
  async syncAssistant(employeeId: string) {
    const employee = await AIEmployee.findById(employeeId);
    if (!employee) throw new Error(`Employee ${employeeId} not found`);

    const generalPrompt = await compileSystemPrompt(employee, 'production');
    const model = env.RETELL_LLM_MODEL;
    const voiceId = mapVoice(employee.voice);
    const language = mapLanguage(employee.language);

    // Reuse existing objects on re-sync; otherwise create fresh ones.
    let llmId = employee.assistantLlmId ?? undefined;
    if (llmId) {
      await this.client.updateRetellLlm(llmId, { general_prompt: generalPrompt, model });
    } else {
      ({ llm_id: llmId } = await this.client.createRetellLlm({ general_prompt: generalPrompt, model }));
    }

    let agentId = employee.assistantExternalId ?? undefined;
    if (agentId) {
      await this.client.updateAgent(agentId, { voice_id: voiceId, language, agent_name: employee.name });
    } else {
      ({ agent_id: agentId } = await this.client.createAgent({
        response_engine: { type: 'retell-llm', llm_id: llmId },
        voice_id: voiceId,
        language,
        agent_name: employee.name,
      }));
    }

    await AIEmployee.updateOne(
      { _id: employee._id },
      { $set: { assistantLlmId: llmId, assistantExternalId: agentId, voiceProvider: this.provider } },
    );
    logger.info({ employeeId, agentId, llmId }, 'Synced employee to its own Retell agent');
    return { assistantId: agentId };
  }

  /**
   * Return the inbound number and bind it to this employee's agent so real
   * inbound calls reach the employee's configured AI. With a single shared
   * number, the last employee bound wins (buy per-employee numbers to separate
   * multiple inbound employees).
   */
  async provisionInboundNumber(employeeId: string) {
    const phoneNumber = env.RETELL_FROM_NUMBER || (await this.firstAccountNumber());

    const employee = await AIEmployee.findById(employeeId).select('assistantExternalId');
    if (employee?.assistantExternalId) {
      await this.client
        .updatePhoneNumber(phoneNumber, { inbound_agent_id: employee.assistantExternalId })
        .catch((err) => logger.error({ err, employeeId, phoneNumber }, 'Binding inbound number to agent failed'));
    }
    return { phoneNumber };
  }

  private async firstAccountNumber(): Promise<string> {
    const numbers = await this.client.listPhoneNumbers();
    if (!numbers.length) {
      throw new Error('No phone numbers in the Retell account — buy one or set RETELL_FROM_NUMBER');
    }
    return numbers[0].phone_number;
  }

  interviewTurn(ctx: InterviewContext) {
    return this.interviewer.interviewTurn(ctx);
  }

  async startOutboundCall(params: OutboundCallParams): Promise<{ externalCallId: string }> {
    const from = env.RETELL_FROM_NUMBER;
    if (!from) throw new Error('RETELL_FROM_NUMBER is required for outbound calling');

    // Prefer this employee's own agent; fall back to a shared configured agent.
    const agentId = params.agentId || env.RETELL_AGENT_ID;

    const call = await this.client.createPhoneCall({
      from_number: from,
      to_number: params.to,
      ...(agentId ? { override_agent_id: agentId } : {}),
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

    logger.info({ callId: call.call_id, to: params.to, agentId, campaignId: params.campaignId }, 'Retell call dialed');
    return { externalCallId: call.call_id };
  }
}

/** Map a stored voice preference to a Retell voice id; pass through real ids. */
function mapVoice(voice: string | undefined | null): string {
  if (voice && voice.includes('-')) return voice; // already a Retell voice id (e.g. 11labs-Adrian)
  return env.RETELL_VOICE_ID;
}

/** Map an employee language ("en", "en-US") to a Retell language code. */
function mapLanguage(language: string | undefined | null): string {
  if (!language) return 'en-US';
  if (language.includes('-')) return language;
  const map: Record<string, string> = { en: 'en-US', es: 'es-ES', hi: 'hi-IN', fr: 'fr-FR', de: 'de-DE' };
  return map[language] ?? 'en-US';
}
