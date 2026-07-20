import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEV_ACCESS_DEFAULT = 'dev-access-secret-change-me';
const DEV_REFRESH_DEFAULT = 'dev-refresh-secret-change-me';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/vorizon'),
    JWT_ACCESS_SECRET: z.string().min(8).default(DEV_ACCESS_DEFAULT),
    JWT_REFRESH_SECRET: z.string().min(8).default(DEV_REFRESH_DEFAULT),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL: z.string().default('7d'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_UPLOAD_MB: z.coerce.number().default(15),
    VOICE_PROVIDER: z.enum(['mock', 'vapi']).default('mock'),
    ANTHROPIC_API_KEY: z.string().optional().default(''),
    INTERVIEW_MODEL: z.string().default('claude-sonnet-5'),
    RATE_USD_PER_MINUTE: z.coerce.number().default(0.1),
    RATE_LIMIT_MAX: z.coerce.number().default(300),
    // Optional: enables Redis-backed rate limiting + durable BullMQ campaign queue.
    REDIS_URL: z.string().optional().default(''),
    // When Redis is enabled, run the campaign worker inside the API process.
    // Set false to run dedicated workers (`npm run worker`) for horizontal scale.
    WORKER_IN_PROCESS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
  })
  .superRefine((val, ctx) => {
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
