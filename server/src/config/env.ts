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
    VOICE_PROVIDER: z.enum(['mock', 'vapi', 'retell', 'exotel']).default('mock'),
    ANTHROPIC_API_KEY: z.string().optional().default(''),
    INTERVIEW_MODEL: z.string().default('claude-sonnet-5'),
    // Alternative interview LLM when no Anthropic key is set.
    OPENAI_API_KEY: z.string().optional().default(''),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
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
    // Exotel voice engine (VOICE_PROVIDER=exotel). Places outbound calls via the
    // Connect API to a Call Flow containing the Exotel Voicebot applet; call
    // outcomes arrive on the status webhook. The AI itself is configured in the
    // Exotel Voicebot dashboard (no API), not in the Vorizon wizard.
    EXOTEL_API_KEY: z.string().optional().default(''),
    EXOTEL_API_TOKEN: z.string().optional().default(''),
    EXOTEL_SID: z.string().optional().default(''),
    // API cluster host, e.g. api.exotel.com (Singapore) or api.in.exotel.com (India).
    EXOTEL_SUBDOMAIN: z.string().default('api.exotel.com'),
    // An ExoPhone you own (E.164) used as caller ID for outbound.
    EXOTEL_CALLER_ID: z.string().optional().default(''),
    // The App/Flow URL that runs the Voicebot, from Exotel App Bazaar, e.g.
    // http://my.exotel.com/<sid>/exoml/start_voice/<APP_ID>
    EXOTEL_FLOW_URL: z.string().optional().default(''),
    // Shared secret appended to the status-callback URL and checked on receipt
    // (Exotel does not sign webhooks). Leave blank to accept unauthenticated.
    EXOTEL_WEBHOOK_TOKEN: z.string().optional().default(''),
    // ---- Connector OAuth app credentials (per provider; unset → configured:false) ----
    GOOGLE_CLIENT_ID: z.string().optional().default(''),
    GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
    META_APP_ID: z.string().optional().default(''),
    META_APP_SECRET: z.string().optional().default(''),
    HUBSPOT_CLIENT_ID: z.string().optional().default(''),
    HUBSPOT_CLIENT_SECRET: z.string().optional().default(''),
    SALESFORCE_CLIENT_ID: z.string().optional().default(''),
    SALESFORCE_CLIENT_SECRET: z.string().optional().default(''),
    ZOHO_CLIENT_ID: z.string().optional().default(''),
    ZOHO_CLIENT_SECRET: z.string().optional().default(''),
    TWILIO_CLIENT_ID: z.string().optional().default(''),
    TWILIO_CLIENT_SECRET: z.string().optional().default(''),
    STRIPE_CLIENT_ID: z.string().optional().default(''),
    STRIPE_CLIENT_SECRET: z.string().optional().default(''),
    // Encrypts stored OAuth tokens at rest (AES-256-GCM). Falls back to a key
    // derived from JWT_ACCESS_SECRET when unset; set explicitly in production.
    INTEGRATIONS_ENCRYPTION_KEY: z.string().optional().default(''),
    // Public base URL of THIS API (for OAuth redirect URIs). Defaults to APP_BASE_URL's
    // sibling isn't reliable, so set to the API origin in production.
    API_BASE_URL: z.string().optional().default(''),
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
    if (val.VOICE_PROVIDER === 'exotel') {
      const missing = (
        [
          ['EXOTEL_API_KEY', val.EXOTEL_API_KEY],
          ['EXOTEL_API_TOKEN', val.EXOTEL_API_TOKEN],
          ['EXOTEL_SID', val.EXOTEL_SID],
          ['EXOTEL_CALLER_ID', val.EXOTEL_CALLER_ID],
          ['EXOTEL_FLOW_URL', val.EXOTEL_FLOW_URL],
        ] as const
      ).filter(([, v]) => !v);
      for (const [key] of missing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when VOICE_PROVIDER=exotel`,
          path: [key],
        });
      }
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
