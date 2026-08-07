import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEV_ACCESS_DEFAULT = 'dev-access-secret-change-me';
const DEV_REFRESH_DEFAULT = 'dev-refresh-secret-change-me';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Runtime log verbosity — change without a code deploy (e.g. debug to chase an issue).
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
    // Serverless runtimes may set PORT to a unix socket path; fall back cleanly
    // (the value is only used by the long-running server's app.listen).
    PORT: z.coerce.number().catch(4000).default(4000),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/vorizon'),
    JWT_ACCESS_SECRET: z.string().min(8).default(DEV_ACCESS_DEFAULT),
    JWT_REFRESH_SECRET: z.string().min(8).default(DEV_REFRESH_DEFAULT),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL: z.string().default('7d'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_UPLOAD_MB: z.coerce.number().default(15),
    VOICE_PROVIDER: z.enum(['mock', 'vapi', 'retell']).default('mock'),
    ANTHROPIC_API_KEY: z.string().optional().default(''),
    INTERVIEW_MODEL: z.string().default('claude-sonnet-5'),
    RATE_USD_PER_MINUTE: z.coerce.number().default(0.1),
    // Public base URL of the web app (used in email links).
    APP_BASE_URL: z.string().default('http://localhost:5173'),
    // Resend transactional email. Unset → emails are skipped (logged, never throw).
    RESEND_API_KEY: z.string().optional().default(''),
    // Must be a Resend-verified sender. Free accounts can use onboarding@resend.dev.
    EMAIL_FROM: z.string().default('Vorizon <onboarding@resend.dev>'),
    // Where replies go (e.g. the business inbox) — may be any address.
    EMAIL_REPLY_TO: z.string().optional().default(''),
    // Razorpay payments. Both unset → payment endpoints return 503.
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),
    // Secret configured on the Razorpay webhook (Dashboard → Webhooks).
    RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
    // Retell AI voice engine (VOICE_PROVIDER=retell).
    RETELL_API_KEY: z.string().optional().default(''),
    RETELL_AGENT_ID: z.string().optional().default(''),
    // E.164 number owned in Retell used as outbound caller ID.
    RETELL_FROM_NUMBER: z.string().optional().default(''),
    // Reject unsigned/invalid Retell webhooks. Disable only if signature scheme mismatches.
    RETELL_VERIFY_WEBHOOK: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    RATE_LIMIT_MAX: z.coerce.number().default(300),
    // Optional: enables Firestore-backed rate limiting, durable campaign queue,
    // and raw upload storage. Service account as inline JSON or a key-file path
    // (GOOGLE_APPLICATION_CREDENTIALS also works).
    FIREBASE_PROJECT_ID: z.string().optional().default(''),
    FIREBASE_SERVICE_ACCOUNT: z.string().optional().default(''),
    // When Firebase is enabled, run the campaign worker inside the API process.
    // Set false to run dedicated workers (`npm run worker`) for horizontal scale.
    WORKER_IN_PROCESS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
  })
  .superRefine((val, ctx) => {
    // Paired/dependent config — misconfiguration fails fast at boot in any env.
    if (val.RAZORPAY_KEY_ID && !val.RAZORPAY_KEY_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'RAZORPAY_KEY_SECRET is required when RAZORPAY_KEY_ID is set',
        path: ['RAZORPAY_KEY_SECRET'],
      });
    }
    if (val.VOICE_PROVIDER === 'retell' && !val.RETELL_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'RETELL_API_KEY is required when VOICE_PROVIDER=retell',
        path: ['RETELL_API_KEY'],
      });
    }
    // In production, refuse to boot with weak or default secrets.
    if (val.NODE_ENV !== 'production') return;
    const secrets = [
      { key: 'JWT_ACCESS_SECRET', v: val.JWT_ACCESS_SECRET },
      { key: 'JWT_REFRESH_SECRET', v: val.JWT_REFRESH_SECRET },
    ];
    for (const s of secrets) {
      const isDefault = s.v === DEV_ACCESS_DEFAULT || s.v === DEV_REFRESH_DEFAULT;
      if (isDefault || s.v.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${s.key} must be a strong secret (>= 32 chars, not the dev default) in production`,
          path: [s.key],
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
