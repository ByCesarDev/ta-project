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

async function verifyCounts() {
  const tables = [
    'animes',
    'episodes',
    'episode_sources',
    'anime_genres',
    'user_history',
    'user_episode_status',
    'watch_later',
    'genres',
    'avatars',
    'profiles',
  ];

  console.log('--- DATABASE STATUS ---');
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`${t}: Error (${error.message})`);
    } else {
      console.log(`${t}: ${count} rows`);
    }
  }
}

verifyCounts().catch(console.error);
