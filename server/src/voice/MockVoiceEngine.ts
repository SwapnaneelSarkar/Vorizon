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
    try {
      if (this.client) return await this.anthropicTurn(ctx);
      if (env.OPENAI_API_KEY) return await this.openAiTurn(ctx);
    } catch (err) {
      logger.error({ err }, 'Interview LLM call failed');
      return { reply: 'Sorry, I had trouble responding just now. Please try again.' };
    }
    return {
      reply:
        `[offline test mode] I'm the AI employee. You said: "${ctx.message}". ` +
        `Set ANTHROPIC_API_KEY or OPENAI_API_KEY to enable real responses.`,
    };
  }

  private async anthropicTurn(ctx: InterviewContext) {
    const response = await this.client!.messages.create({
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
  }

  private async openAiTurn(ctx: InterviewContext) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          max_tokens: 500,
          messages: [
            { role: 'system', content: ctx.systemPrompt },
            ...ctx.history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: ctx.message },
          ],
        }),
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        logger.error({ status: res.status, body: text.slice(0, 300) }, 'OpenAI API call failed');
        throw new Error(`OpenAI API error ${res.status}`);
      }
      const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
      return { reply: data.choices?.[0]?.message?.content?.trim() || '(no response)' };
    } finally {
      clearTimeout(timer);
    }
  }
}
