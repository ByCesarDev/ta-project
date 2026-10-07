import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentEpisodeSources() {
  const { data: animes } = await supabase.from('animes').select('*');
  console.log('Animes in DB:', animes?.map(a => ({ id: a.id, slug: a.slug, name: a.name })));

  if (animes && animes.length > 0) {
    const { data: eps } = await supabase.from('episodes').select('*').eq('anime_id', animes[0].id).eq('episode_number', 1);
    console.log('Episode 1 in DB:', eps);

    if (eps && eps.length > 0) {
      const { data: sources } = await supabase.from('episode_sources').select('*').eq('episode_id', eps[0].id);
      console.log('Sources for Episode 1 count:', sources?.length);
      console.log('Sources for Episode 1:', sources);
    }
  }
}

checkCurrentEpisodeSources();
