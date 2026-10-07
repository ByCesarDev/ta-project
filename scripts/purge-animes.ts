import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SECRET_KEY is required in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function purgeAnimesAndSources() {
  console.log('='.repeat(60));
  console.log(' TOTALANIME - PURGE ANIMES, EPISODES & SOURCES');
  console.log('='.repeat(60));

  const tablesToPurge = [
    { name: 'episode_sources', column: 'id' },
    { name: 'user_episode_status', column: 'id' },
    { name: 'user_history', column: 'id' },
    { name: 'watch_later', column: 'id' },
    { name: 'comments', column: 'id' },
    { name: 'anime_genres', column: 'anime_id' },
    { name: 'scrape_jobs', column: 'id' },
    { name: 'episodes', column: 'id' },
    { name: 'animes', column: 'id' },
  ];

  for (const { name, column } of tablesToPurge) {
    try {
      // Count first
      const { count, error: countError } = await supabase
        .from(name)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`- [${name}]: table might not exist or error (${countError.message}). Skipping.`);
        continue;
      }

      console.log(`- [${name}]: Found ${count ?? 0} records. Deleting...`);

      if (count && count > 0) {
        const { error: deleteError } = await supabase
          .from(name)
          .delete()
          .not(column, 'is', null);

        if (deleteError) {
          console.error(`  ❌ Error deleting from ${name}:`, deleteError.message);
        } else {
          console.log(`  ✓ Successfully purged ${name}.`);
        }
      } else {
        console.log(`  ✓ Table ${name} is already empty.`);
      }
    } catch (err: any) {
      console.error(`  ❌ Unexpected error purging ${name}:`, err.message);
    }
  }

  console.log('='.repeat(60));
  console.log(' PURGE COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
}

purgeAnimesAndSources().catch(console.error);
