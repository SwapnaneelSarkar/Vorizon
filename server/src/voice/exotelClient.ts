import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const TIMEOUT_MS = 20_000;

export interface ExotelConnectResult {
  /** Exotel Call Sid — our externalCallId. */
  sid: string;
  status?: string;
}

export class ExotelApiError extends Error {
  constructor(
    public status: number,
    body: string,
    message?: string,
  ) {
    // Truncate: this string is serialized at every {err} log sink and third-party
    // bodies are outside the redact policy.
    super(message ?? `Exotel API error ${status}: ${body.slice(0, 300)}`);
  }
}

/**
 * Thin authenticated client for Exotel's telephony (Connect) API. Basic auth
 * with the API key/token; the response is form/JSON. Every failure is logged
 * with status + a truncated body and surfaced as ExotelApiError.
 *
 * Exotel has no HMAC on inbound webhooks and the Voicebot has no REST API, so
 * this client only covers the outbound Connect endpoint plus a read-only ping.
 */
export class ExotelClient {
  private base: string;
  private authHeader: string;

  constructor() {
    if (!env.EXOTEL_API_KEY || !env.EXOTEL_API_TOKEN || !env.EXOTEL_SID) {
      throw new Error('ExotelClient requires EXOTEL_API_KEY, EXOTEL_API_TOKEN and EXOTEL_SID');
    }
    const host = env.EXOTEL_SUBDOMAIN.replace(/^https?:\/\//, '');
    this.base = `https://${host}/v1/Accounts/${env.EXOTEL_SID}`;
    this.authHeader =
      'Basic ' + Buffer.from(`${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}`).toString('base64');
  }

  private async request<T>(method: 'GET' | 'POST', path: string, form?: Record<string, string>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${this.base}${path}`, {
        method,
        headers: {
          Authorization: this.authHeader,
          ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        body: form ? new URLSearchParams(form).toString() : undefined,
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        logger.error({ path, status: res.status, body: text.slice(0, 300) }, 'Exotel API call failed');
        throw new ExotelApiError(res.status, text);
      }
      return (text ? JSON.parse(text) : {}) as T;
    } catch (err) {
      if (err instanceof ExotelApiError) throw err;
      logger.error({ err, path }, 'Exotel API request error');
      throw new ExotelApiError(0, '', `Exotel API unreachable: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Place an outbound call that connects the customer to a Call Flow (App) —
   * the flow runs the Voicebot applet. Returns the Exotel Call Sid.
   */
  async connectToFlow(input: {
    to: string;
    callerId: string;
    flowUrl: string;
    statusCallback: string;
    customField?: string;
  }): Promise<ExotelConnectResult> {
    const res = await this.request<{ Call?: { Sid?: string; Status?: string } }>(
      'POST',
      '/Calls/connect.json',
      {
        From: input.to, // the customer we are dialing
        CallerId: input.callerId, // an ExoPhone we own
        Url: input.flowUrl, // App Bazaar flow that runs the Voicebot
        CallType: 'trans',
        StatusCallback: input.statusCallback,
        ...(input.customField ? { CustomField: input.customField } : {}),
      },
    );
    const sid = res.Call?.Sid;
    if (!sid) throw new ExotelApiError(0, JSON.stringify(res), 'Exotel connect returned no Call Sid');
    return { sid, status: res.Call?.Status };
  }

  /** Read-only credentials/connectivity check (no call placed). */
  async ping(): Promise<boolean> {
    await this.request('GET', '/Calls.json?PageSize=1');
    return true;
  }
}
