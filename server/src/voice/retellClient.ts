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

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
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
        throw new RetellApiError(res.status, text);
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
}
