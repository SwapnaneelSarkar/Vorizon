import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDb(uri: string = env.MONGODB_URI): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info({ uri: uri.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

let connecting: Promise<void> | null = null;

/**
 * Serverless-safe connect: reuses the live connection across warm invocations
 * and dedupes concurrent cold-start connects. Used by the Cloud Functions
 * entrypoint; the long-running server keeps using connectDb() at boot.
 */
export async function ensureDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  connecting ??= connectDb().finally(() => {
    connecting = null;
  });
  await connecting;
}
