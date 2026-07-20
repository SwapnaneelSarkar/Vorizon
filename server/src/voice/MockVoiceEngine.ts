import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { InterviewContext, VoiceEngine } from './VoiceEngine.js';

/**
 * Phase 1 voice engine. Telephony is simulated, but interviewTurn calls a real
 * Claude model so testing is genuinely functional. If ANTHROPIC_API_KEY is
 * unset it falls back to a deterministic offline reply so the app still works.
 */
export class MockVoiceEngine implements VoiceEngine {
  readonly provider = 'mock';
  private client: Anthropic | null;

  constructor() {
    this.client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;
  }

  async syncAssistant(employeeId: string) {
    return { assistantId: `mock-assistant-${employeeId}` };
  }

  async provisionInboundNumber(employeeId: string) {
    // Deterministic fake number derived from the id (no randomness at runtime).
    const digits = employeeId.replace(/\D/g, '').padStart(10, '0').slice(-10);
    return { phoneNumber: `+1${digits}` };
  }

  async interviewTurn(ctx: InterviewContext) {
    if (!this.client) {
      return {
        reply:
          `[offline test mode] I'm the AI employee. You said: "${ctx.message}". ` +
          `Set ANTHROPIC_API_KEY to enable real Claude responses.`,
      };
    }
    try {
      const response = await this.client.messages.create({
        model: env.INTERVIEW_MODEL,
        max_tokens: 500,
        system: ctx.systemPrompt,
        messages: [
          ...ctx.history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: ctx.message },
        ],
      });
      const reply = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
        .trim();
      return { reply: reply || '(no response)' };
    } catch (err) {
      logger.error({ err }, 'Interview LLM call failed');
      return { reply: 'Sorry, I had trouble responding just now. Please try again.' };
    }
  }
}
