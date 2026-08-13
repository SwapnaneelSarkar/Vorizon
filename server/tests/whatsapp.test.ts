import { createHmac } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

// Values are set in tests/setup.ts before config/env.ts is imported.
const VERIFY = 'test-verify-token-123';
const SECRET = 'test-meta-app-secret';
const app = createApp();

describe('WhatsApp webhook verification (GET)', () => {
  it('echoes hub.challenge when the verify token matches', async () => {
    const res = await request(app)
      .get('/api/integrations/whatsapp/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY, 'hub.challenge': 'CHALLENGE_42' })
      .expect(200);
    expect(res.text).toBe('CHALLENGE_42');
  });

  it('rejects a wrong verify token with 403', async () => {
    await request(app)
      .get('/api/integrations/whatsapp/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'WRONG', 'hub.challenge': 'x' })
      .expect(403);
  });

  it('rejects when mode is not subscribe', async () => {
    await request(app)
      .get('/api/integrations/whatsapp/webhook')
      .query({ 'hub.mode': 'unsubscribe', 'hub.verify_token': VERIFY, 'hub.challenge': 'x' })
      .expect(403);
  });
});

describe('WhatsApp webhook messages (POST)', () => {
  const body = JSON.stringify({
    entry: [
      {
        changes: [
          { value: { messages: [{ from: '+919182375089', type: 'text', text: { body: 'hi' } }] } },
        ],
      },
    ],
  });

  it('rejects an unsigned payload with 401', async () => {
    await request(app)
      .post('/api/integrations/whatsapp/webhook')
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(401);
  });

  it('rejects a payload with a wrong signature', async () => {
    await request(app)
      .post('/api/integrations/whatsapp/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', 'sha256=deadbeef')
      .send(body)
      .expect(401);
  });

  it('accepts a correctly-signed payload with 200', async () => {
    const sig = 'sha256=' + createHmac('sha256', SECRET).update(Buffer.from(body)).digest('hex');
    await request(app)
      .post('/api/integrations/whatsapp/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', sig)
      .send(body)
      .expect(200);
  });
});
