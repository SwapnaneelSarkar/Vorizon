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
