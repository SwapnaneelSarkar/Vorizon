import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore as adminFirestore, type Firestore } from 'firebase-admin/firestore';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Whether Firebase-backed features are enabled: shared rate limiting, the
 * durable campaign queue, and raw upload storage. Off → in-memory fallbacks.
 * On Cloud Functions/Cloud Run the runtime injects FIREBASE_CONFIG/GCLOUD_PROJECT
 * (our own FIREBASE_* vars are reserved there and can't be set), so those count
 * as enablement signals too.
 */
export const isFirebaseEnabled = Boolean(
  env.FIREBASE_SERVICE_ACCOUNT ||
    env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_CONFIG ||
    process.env.GCLOUD_PROJECT,
);

let app: App | null = null;
let db: Firestore | null = null;

function credentials() {
  const sa = env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) return applicationDefault();
  // Inline JSON or a path to a service-account key file.
  const json = sa.trimStart().startsWith('{') ? sa : readFileSync(sa, 'utf8');
  return cert(JSON.parse(json));
}

/** Shared Firestore handle. Null when Firebase is off. */
export function getDb(): Firestore | null {
  if (!isFirebaseEnabled) return null;
  if (!db) {
    app =
      getApps()[0] ??
      initializeApp({
        credential: credentials(),
        ...(env.FIREBASE_PROJECT_ID ? { projectId: env.FIREBASE_PROJECT_ID } : {}),
      });
    db = adminFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
    logger.info('Firestore connected');
  }
  return db;
}

export async function closeFirebase(): Promise<void> {
  await db?.terminate().catch(() => undefined);
  db = null;
  app = null;
}
