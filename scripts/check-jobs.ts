import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: jobs } = await supabase.from('scrape_jobs').select('*');
  console.log('JOBS IN DB:', JSON.stringify(jobs, null, 2));

  const { data: animes } = await supabase.from('animes').select('id, name, slug');
  console.log('ANIMES IN DB:', animes);

  const { data: episodes } = await supabase.from('episodes').select('id, anime_id, episode_number, status');
  console.log(`EPISODES IN DB (${episodes?.length || 0} total):`, episodes?.slice(0, 5));
}

main();
