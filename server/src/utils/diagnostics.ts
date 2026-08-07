import { env } from '../config/env.js';
import { isFirebaseEnabled } from '../config/firebase.js';
import { logger } from './logger.js';

function razorpayMode(): 'live' | 'test' | 'disabled' {
  if (!env.RAZORPAY_KEY_ID) return 'disabled';
  return env.RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'test' : 'live';
}

/**
 * One structured line describing exactly how this instance is configured —
 * the first thing to check when debugging "why is X not happening in prod".
 * Booleans and modes only; never secret values.
 */
export function logBootDiagnostics(entrypoint: string): void {
  const mode = razorpayMode();
  logger.info(
    {
      entrypoint,
      nodeEnv: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
      firebase: isFirebaseEnabled,
      voiceProvider: env.VOICE_PROVIDER,
      retellConfigured: Boolean(env.RETELL_API_KEY && env.RETELL_AGENT_ID),
      retellOutboundNumber: Boolean(env.RETELL_FROM_NUMBER),
      email: Boolean(env.RESEND_API_KEY),
      payments: mode,
      paymentsWebhookSecret: Boolean(env.RAZORPAY_WEBHOOK_SECRET),
      interviewLlm: Boolean(env.ANTHROPIC_API_KEY),
      workerInProcess: env.WORKER_IN_PROCESS,
    },
    `Boot: ${entrypoint} (payments=${mode}, voice=${env.VOICE_PROVIDER}, firebase=${isFirebaseEnabled ? 'on' : 'off'})`,
  );
  if (mode === 'live' && env.NODE_ENV !== 'production') {
    logger.warn('Razorpay LIVE keys active outside production — real money can move');
  }
}
