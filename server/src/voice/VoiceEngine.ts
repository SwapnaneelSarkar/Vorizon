import type { CallOutcome } from '@vorizon/shared';

export interface CallEvent {
  externalCallId: string;
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

/**
 * Provider-agnostic boundary between Vorizon and the real-time voice stack.
 * Phase 1 = MockVoiceEngine. Phase 2 swaps in VapiVoiceEngine with no changes
 * required outside this folder.
 */
export interface VoiceEngine {
  readonly provider: string;
  syncAssistant(employeeId: string): Promise<{ assistantId: string }>;
  provisionInboundNumber(employeeId: string): Promise<{ phoneNumber: string }>;
  interviewTurn(ctx: InterviewContext): Promise<{ reply: string }>;
}
