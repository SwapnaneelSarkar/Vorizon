import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const BASE_URL = 'https://api.retellai.com';
const TIMEOUT_MS = 15_000;

export interface RetellCall {
  call_id: string;
  call_status?: string;
  direction?: 'inbound' | 'outbound';
  from_number?: string;
  to_number?: string;
  metadata?: Record<string, unknown>;
  start_timestamp?: number;
  end_timestamp?: number;
  disconnection_reason?: string;
  transcript?: string;
  transcript_object?: { role: string; content: string }[];
  call_analysis?: {
    call_summary?: string;
    call_successful?: boolean;
    custom_analysis_data?: Record<string, unknown>;
  };
}

export interface RetellPhoneNumber {
  phone_number: string;
  nickname?: string;
}

export interface RetellLlm {
  llm_id: string;
}

export interface RetellAgent {
  agent_id: string;
  agent_name?: string;
}

export class RetellApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    message?: string,
  ) {
    super(message ?? `Retell API error ${status}`);
  }
}

/**
 * Thin authenticated client for the Retell REST API. Every failure is logged
 * with status + response body and surfaced as RetellApiError so callers can
 * decide whether to degrade or abort.
 */
export class RetellClient {
  constructor(private apiKey: string = env.RETELL_API_KEY) {
    if (!this.apiKey) throw new Error('RetellClient requires RETELL_API_KEY');
  }

  private async request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        logger.error({ path, status: res.status, body: text.slice(0, 500) }, 'Retell API call failed');
        // Truncate what the error carries: it gets serialized in full at every
        // {err} log sink, and third-party bodies are outside our redact policy.
        throw new RetellApiError(res.status, text.slice(0, 500));
      }
      return (text ? JSON.parse(text) : {}) as T;
    } catch (err) {
      if (err instanceof RetellApiError) throw err;
      logger.error({ err, path }, 'Retell API request error');
      throw new RetellApiError(0, '', `Retell API unreachable: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Place an outbound phone call through a Retell agent. */
  createPhoneCall(input: {
    from_number: string;
    to_number: string;
    override_agent_id?: string;
    metadata?: Record<string, unknown>;
    retell_llm_dynamic_variables?: Record<string, string>;
  }): Promise<RetellCall> {
    return this.request<RetellCall>('POST', '/v2/create-phone-call', input);
  }

  getCall(callId: string): Promise<RetellCall> {
    return this.request<RetellCall>('GET', `/v2/get-call/${callId}`);
  }

  listPhoneNumbers(): Promise<RetellPhoneNumber[]> {
    return this.request<RetellPhoneNumber[]>('GET', '/list-phone-numbers');
  }

  // ---- Per-employee agent management (used by syncAssistant) ----

  /** Create a Retell LLM (the "brain") from a compiled system prompt. */
  createRetellLlm(input: { general_prompt: string; model?: string }): Promise<RetellLlm> {
    return this.request<RetellLlm>('POST', '/create-retell-llm', input);
  }

  /** Update an existing Retell LLM's prompt (re-sync after config edits). */
  updateRetellLlm(llmId: string, input: { general_prompt: string; model?: string }): Promise<RetellLlm> {
    return this.request<RetellLlm>('PATCH', `/update-retell-llm/${llmId}`, input);
  }

  /** Create an agent bound to a Retell LLM, with a voice + language. */
  createAgent(input: {
    response_engine: { type: 'retell-llm'; llm_id: string };
    voice_id: string;
    agent_name?: string;
    language?: string;
  }): Promise<RetellAgent> {
    return this.request<RetellAgent>('POST', '/create-agent', input);
  }

  /** Update an existing agent's voice/language/name. */
  updateAgent(
    agentId: string,
    input: { voice_id?: string; agent_name?: string; language?: string },
  ): Promise<RetellAgent> {
    return this.request<RetellAgent>('PATCH', `/update-agent/${agentId}`, input);
  }

  /** Bind a provisioned number to an agent for inbound calls. */
  updatePhoneNumber(phoneNumber: string, input: { inbound_agent_id?: string }): Promise<RetellPhoneNumber> {
    return this.request<RetellPhoneNumber>('PATCH', `/update-phone-number/${encodeURIComponent(phoneNumber)}`, input);
  }
}
