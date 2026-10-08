import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

async function createTable() {
  if (!connectionString) {
    console.error('DATABASE_URL is missing in environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Connected to PostgreSQL. Creating public.system_settings table...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow service role full access on system_settings" ON public.system_settings;
    CREATE POLICY "Allow service role full access on system_settings"
      ON public.system_settings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated read on system_settings" ON public.system_settings;
    CREATE POLICY "Allow authenticated read on system_settings"
      ON public.system_settings
      FOR SELECT
      TO authenticated
      USING (true);
  `);

  console.log('Successfully created public.system_settings table with RLS policies!');
  await client.end();
}

createTable().catch(console.error);
