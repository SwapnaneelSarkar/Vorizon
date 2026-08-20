import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env.js';
import { ExotelClient } from '../src/voice/exotelClient.js';
import { ExotelVoiceEngine } from '../src/voice/ExotelVoiceEngine.js';

// ExotelClient + engine read config at construction; set it for isolated runs.
env.EXOTEL_API_KEY = env.EXOTEL_API_KEY || 'test-exo-key';
env.EXOTEL_API_TOKEN = env.EXOTEL_API_TOKEN || 'test-exo-token';
env.EXOTEL_SID = env.EXOTEL_SID || 'test-sid';
env.EXOTEL_CALLER_ID = env.EXOTEL_CALLER_ID || '+15551110000';
env.EXOTEL_FLOW_URL = env.EXOTEL_FLOW_URL || 'http://exotel.flow/app/123';

afterEach(() => vi.restoreAllMocks());

describe('ExotelVoiceEngine.startOutboundCall', () => {
  it('threads the recording disclosure into the call CustomField (was silently dropped)', async () => {
    const connect = vi
      .spyOn(ExotelClient.prototype, 'connectToFlow')
      .mockResolvedValue({ sid: 'exo-sid-1' });

    const engine = new ExotelVoiceEngine();
    const res = await engine.startOutboundCall({
      organizationId: 'org1',
      aiEmployeeId: 'emp1',
      campaignId: 'camp1',
      contactId: 'contact1',
      contactName: 'Alice',
      to: '+14155551234',
      disclosure: 'This call may be recorded for quality.',
    });

    expect(res.externalCallId).toBe('exo-sid-1');
    const arg = connect.mock.calls[0][0];
    const custom = JSON.parse(arg.customField as string);
    expect(custom.disclosure).toBe('This call may be recorded for quality.');
    expect(custom.organizationId).toBe('org1');
    expect(custom.contactId).toBe('contact1');
  });
});
