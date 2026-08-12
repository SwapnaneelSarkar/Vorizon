import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Deterministic integration secrets for webhook-signature tests. Set before any
// test file imports src/config/env.ts. VOICE_PROVIDER stays mock — no live calls.
process.env.RETELL_API_KEY = 'test-retell-key';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test-rzp-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';

// Force Firebase OFF in tests even when a developer's server/.env configures it
// (dotenv never overrides pre-set vars). Otherwise the campaign queue would go
// durable against live Firestore and in-process drain() would be a no-op.
process.env.FIREBASE_PROJECT_ID = '';
process.env.FIREBASE_SERVICE_ACCOUNT = '';
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Likewise force email + interview LLMs OFF so tests never call live services.
process.env.RESEND_API_KEY = '';
process.env.ANTHROPIC_API_KEY = '';
process.env.OPENAI_API_KEY = '';

// Force Exotel webhook token OFF (server/.env may set it) so webhook tests
// exercise the open path; keep the provider on the mock engine.
process.env.EXOTEL_WEBHOOK_TOKEN = '';

// Force all connector OAuth app credentials OFF so the catalog is deterministic
// (configured:false) regardless of what a developer's server/.env sets.
for (const k of [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'META_APP_ID',
  'META_APP_SECRET',
  'HUBSPOT_CLIENT_ID',
  'HUBSPOT_CLIENT_SECRET',
  'SALESFORCE_CLIENT_ID',
  'SALESFORCE_CLIENT_SECRET',
  'ZOHO_CLIENT_ID',
  'ZOHO_CLIENT_SECRET',
  'TWILIO_CLIENT_ID',
  'TWILIO_CLIENT_SECRET',
  'STRIPE_CLIENT_ID',
  'STRIPE_CLIENT_SECRET',
]) {
  process.env[k] = '';
}

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
