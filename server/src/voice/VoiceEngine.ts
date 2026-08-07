import type { CallOutcome } from '@vorizon/shared';

export interface CallEvent {
  externalCallId: string;
  provider?: string;
  status: 'started' | 'in_progress' | 'ended';
  direction: 'inbound' | 'outbound';
  organizationId: string;
  aiEmployeeId: string;
  from: string;
  to: string;
  contactId?: string;
  campaignId?: string;
  durationSec?: number;
  outcome?: CallOutcome;
  transcript?: { role: 'ai' | 'customer'; text: string; at: string }[];
  escalated?: boolean;
}

export interface InterviewContext {
  systemPrompt: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  message: string;
  language: string;
}

export interface OutboundCallParams {
  organizationId: string;
  aiEmployeeId: string;
  campaignId: string;
  contactId: string;
  contactName: string;
  /** E.164 destination. */
  to: string;
  /** Recording disclosure to announce at call start; null when disabled. */
  disclosure: string | null;
}

/**
 * Provider-agnostic boundary between Vorizon and the real-time voice stack.
 * MockVoiceEngine simulates telephony; RetellVoiceEngine places real calls.
 * Nothing outside this folder knows which provider is active.
 */
export interface VoiceEngine {
  readonly provider: string;
  syncAssistant(employeeId: string): Promise<{ assistantId: string }>;
  provisionInboundNumber(employeeId: string): Promise<{ phoneNumber: string }>;
  interviewTurn(ctx: InterviewContext): Promise<{ reply: string }>;
  /**
   * Place a real outbound call. Engines that implement this dial asynchronously:
   * the call outcome arrives later via the provider webhook (handleCallEnded).
   * Engines without it (mock) get simulated outcomes from the campaign runner.
   */
  startOutboundCall?(params: OutboundCallParams): Promise<{ externalCallId: string }>;
}
