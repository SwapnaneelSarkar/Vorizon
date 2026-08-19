import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyIdToken = vi.fn();

// Mock only our own Firebase boundary (config/firebase.ts), not firebase-admin
// internals — isFirebaseEnabled is a computed const elsewhere in the test
// suite (Firebase forced off in setup.ts), so this is the one seam that lets
// us control Google-token verification deterministically without a live
// Firebase project or a real Google ID token.
vi.mock('../src/config/firebase.js', () => ({
  getAuthAdmin: () => ({ verifyIdToken }),
  getDb: () => null,
  isFirebaseEnabled: false,
  closeFirebase: async () => undefined,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

function googleToken(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uid: 'google-uid-1',
    email: 'googler@example.test',
    email_verified: true,
    name: 'Googler One',
    ...overrides,
  };
}

describe('Google sign-in', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it('creates a new org + owner user on first sign-in', async () => {
    verifyIdToken.mockResolvedValue(googleToken());

    const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-firebase-id-token' }).expect(200);
    expect(res.body.data.user.email).toBe('googler@example.test');
    expect(res.body.data.user.role).toBe('owner');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.data.tokens.accessToken}`)
      .expect(200);
    expect(me.body.data.organization).toBeTruthy();
  });

  it('reuses the same user on a second sign-in with the same Google account', async () => {
    verifyIdToken.mockResolvedValue(googleToken({ email: 'repeat@example.test' }));

    const first = await request(app).post('/api/auth/google').send({ idToken: 'fake-firebase-id-token' }).expect(200);
    const second = await request(app).post('/api/auth/google').send({ idToken: 'fake-firebase-id-token' }).expect(200);
    expect(second.body.data.user.id).toBe(first.body.data.user.id);
  });

  it('links to an existing password account with the same verified email', async () => {
    const email = `linkme${Date.now()}@acme.test`;
    const registered = await request(app)
      .post('/api/auth/register')
      .send({ orgName: 'Acme', name: 'Ann', email, password: 'password123' })
      .expect(201);

    verifyIdToken.mockResolvedValue(googleToken({ email }));
    const google = await request(app).post('/api/auth/google').send({ idToken: 'fake-firebase-id-token' }).expect(200);

    expect(google.body.data.user.id).toBe(registered.body.data.user.id);
  });

  it('rejects an unverified email', async () => {
    verifyIdToken.mockResolvedValue(googleToken({ email_verified: false }));
    await request(app).post('/api/auth/google').send({ idToken: 'fake-firebase-id-token' }).expect(401);
  });

  it('rejects a token that fails verification', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    await request(app).post('/api/auth/google').send({ idToken: 'fake-firebase-id-token' }).expect(401);
  });
});
