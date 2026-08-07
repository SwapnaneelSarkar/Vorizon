import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { ensureDb } from '../src/config/db.js';
import { drainDueJobs } from '../src/modules/campaigns/campaignWorker.js';

describe('serverless helpers', () => {
  it('ensureDb is a fast no-op on a live connection and safe under concurrency', async () => {
    expect(mongoose.connection.readyState).toBe(1); // connected by test setup
    await Promise.all([ensureDb(), ensureDb(), ensureDb()]);
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('drainDueJobs is a no-op returning 0 when Firebase is not configured', async () => {
    expect(await drainDueJobs(1000)).toBe(0);
  });
});
