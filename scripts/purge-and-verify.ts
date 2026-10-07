import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SECRET_KEY is missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeCorruptedSources() {
  console.log('Purging episode_sources and resetting jobs...');

  // 1. Delete all episode_sources
  const { error: delErr } = await supabase.from('episode_sources').delete().neq('id', 0);
  if (delErr) {
    console.error('Error deleting episode_sources:', delErr.message);
  } else {
    console.log('Successfully deleted all rows from episode_sources');
  }

  // 2. Reset episodes status to 'pending'
  const { error: epErr } = await supabase.from('episodes').update({ status: 'pending' }).neq('id', 0);
  if (epErr) {
    console.error('Error updating episodes status:', epErr.message);
  } else {
    console.log('Reset all episodes to pending');
  }

  // 3. Reset scrape_jobs
  const { error: jobErr } = await supabase.from('scrape_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (jobErr) {
    console.error('Error clearing scrape_jobs:', jobErr.message);
  } else {
    console.log('Cleared scrape_jobs table');
  }
}

purgeCorruptedSources().catch(console.error);
