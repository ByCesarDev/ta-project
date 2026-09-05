import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// In production, secrets and URLs must be explicitly provided in the environment
const baseSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: isProduction
    ? z.string({ required_error: 'SUPABASE_URL is mandatory in production' }).url()
    : z.string().url().default('http://127.0.0.1:54321'),
  // Support both modern SUPABASE_SECRET_KEY (sb_secret_...) and legacy SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_SECRET_KEY: isProduction
    ? z.string({ required_error: 'SUPABASE_SECRET_KEY is mandatory in production' }).min(1)
    : z.string().min(1).default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SCRAPER_BASE_URL: z.string().default('https://tioanime.com/'),
  CORS_ORIGINS: isProduction
    ? z.string({ required_error: 'CORS_ORIGINS is mandatory in production' }).min(1)
    : z.string().default('http://localhost:5173,http://localhost:5174,http://localhost:3000,https://totalanime.com,https://admin.totalanime.com'),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(5000),
});

// Normalization: map SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SECRET_KEY if secret key is missing
const rawEnv: Record<string, string | undefined> = {
  ...process.env,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const parsedEnv = baseSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:\n', JSON.stringify(parsedEnv.error.format(), null, 2));
  if (isProduction) {
    console.error('💥 Fatal: Production server cannot start without required environment variables.');
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : baseSchema.parse({
  ...rawEnv,
  // Safe fallbacks only when not in production
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_SECRET_KEY: rawEnv.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
});
