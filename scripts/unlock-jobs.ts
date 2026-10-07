import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function unlockJobs() {
  const { data, error } = await supabase
    .from('scrape_jobs')
    .update({
      status: 'pending',
      locked_at: null,
      locked_by: null,
      heartbeat_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .select();

  if (error) {
    console.error('Error unlocking jobs:', error.message);
  } else {
    console.log(`Unlocked ${data?.length || 0} stuck jobs:`, data?.map((j) => j.id));
  }
}

unlockJobs();
