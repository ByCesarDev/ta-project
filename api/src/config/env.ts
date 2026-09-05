import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('https://kifhkrbvxzdubfoglvvk.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('dummy_service_role_key_for_testing'),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SCRAPER_BASE_URL: z.string().default('https://tioanime.com/'),
  CORS_ORIGINS: z.string().default('https://totalanime.com,https://admin.totalanime.com,http://localhost:5173,http://localhost:5174,http://localhost:3000'),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(5000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
