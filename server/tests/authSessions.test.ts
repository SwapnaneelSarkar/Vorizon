import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { forgotPassword, resetPassword } from '../src/modules/auth/auth.service.js';

const app = createApp();

async function registerUser() {
  const email = `sess${Date.now()}${Math.floor(performance.now() * 1000) % 100000}@t.co`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Sess Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  return { email, tokens: res.body.data.tokens as { accessToken: string; refreshToken: string } };
}

describe('auth: concurrent sessions', () => {
  it('keeps a second device signed in after a first logs in, and rotates only its own session', async () => {
    const { email } = await registerUser();

    // Two independent logins = two devices/sessions.
    const a = (await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200))
      .body.data.tokens;
    const b = (await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200))
      .body.data.tokens;

    // Both sessions can refresh (the old single-hash design would have logged A out).
    const a2 = await request(app).post('/api/auth/refresh').send({ refreshToken: a.refreshToken }).expect(200);
    await request(app).post('/api/auth/refresh').send({ refreshToken: b.refreshToken }).expect(200);

    // Rotating A's session does not affect B; A's OLD token is now invalid.
    await request(app).post('/api/auth/refresh').send({ refreshToken: a.refreshToken }).expect(401);
    // A's rotated token still works.
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: a2.body.data.tokens.refreshToken })
      .expect(200);
  });
});

describe('auth: reset-OTP brute-force lockout', () => {
  it('burns the reset code after too many wrong guesses', async () => {
    const { email } = await registerUser();
    await forgotPassword(email);

    // Five wrong guesses each reject; the fifth burns the OTP.
    for (let i = 0; i < 5; i++) {
      await expect(resetPassword(email, '000000', 'newpassword123')).rejects.toThrow();
    }

    const user = await User.findOne({ email });
    expect(user?.resetOtpHash).toBeNull();
    expect(user?.resetOtpExpiresAt).toBeNull();
  });
});
