import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkJobs() {
  const { data: jobs } = await supabase.from('scrape_jobs').select('*');
  console.log('Current Jobs:', jobs);

  const { data: animes } = await supabase.from('animes').select('id, name, slug');
  console.log('Current Animes count:', animes?.length, animes);

  const { data: eps } = await supabase.from('episodes').select('id, episode_number').eq('anime_id', 84);
  console.log('Episodes in DB for anime 84 (The Seven Deadly Sins):', eps?.length);
}

checkJobs().catch(console.error);
