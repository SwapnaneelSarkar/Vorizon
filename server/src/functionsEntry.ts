/**
 * Firebase Cloud Functions entrypoint (Vercel client + Firebase API deploy).
 *
 * - `api` wraps the whole Express app; routes keep their /api prefix, so the
 *   client's VITE_API_BASE_URL is `<function-url>/api`.
 * - `campaignWorker` replaces the resident polling loop: a scheduled function
 *   drains the durable Firestore queue every minute. Jobs enqueued by `api`
 *   instances wait safely in Firestore until the next tick.
 *
 * The long-running deployment path (Render/Docker, src/index.ts) is unchanged.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createApp } from './app.js';
import { ensureDb } from './config/db.js';
import { drainDueJobs } from './modules/campaigns/campaignWorker.js';
import { logBootDiagnostics } from './utils/diagnostics.js';
import { logger } from './utils/logger.js';

const app = createApp();
logBootDiagnostics('cloud-functions');

export const api = onRequest(
  { region: 'us-central1', timeoutSeconds: 120, memory: '512MiB', maxInstances: 4 },
  async (req, res) => {
    await ensureDb();
    app(req, res);
  },
);

export const campaignWorker = onSchedule(
  { schedule: 'every 1 minutes', region: 'us-central1', timeoutSeconds: 540, memory: '512MiB' },
  async () => {
    await ensureDb();
    const processed = await drainDueJobs(8 * 60 * 1000);
    if (processed > 0) logger.info({ processed }, 'Scheduled worker drained campaign jobs');
  },
);
