import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co',
  process.env.SUPABASE_SECRET_KEY!
);

async function testDatabaseStorage() {
  console.log('Testing storage in Supabase...');

  // Let's test checking what tables we can read/write without FK errors
  const { data: genres, error: gErr } = await supabase.from('genres').select('*').limit(1);
  console.log('genres:', gErr ? gErr.message : 'OK');

  const { data: avatars, error: aErr } = await supabase.from('avatars').select('*').limit(1);
  console.log('avatars:', aErr ? aErr.message : 'OK');

  const { data: jobs, error: jErr } = await supabase.from('scrape_jobs').select('*').limit(1);
  console.log('scrape_jobs:', jErr ? jErr.message : 'OK');
}

testDatabaseStorage();
