import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/vorizon'),
  JWT_ACCESS_SECRET: z.string().min(8).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(8).default('dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(15),
  VOICE_PROVIDER: z.enum(['mock', 'vapi']).default('mock'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  INTERVIEW_MODEL: z.string().default('claude-sonnet-5'),
  RATE_USD_PER_MINUTE: z.coerce.number().default(0.1),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
