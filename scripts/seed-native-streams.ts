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

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedNativeStreams() {
  console.log('[SeedNativeStreams] Fetching all episodes from public.episodes...');
  const { data: episodes, error: epError } = await supabase
    .from('episodes')
    .select('id, anime_id, episode_number')
    .order('id', { ascending: true });

  if (epError || !episodes) {
    console.error('Failed to fetch episodes:', epError);
    return;
  }

  console.log(`[SeedNativeStreams] Found ${episodes.length} episodes.`);

  const sampleHlsStream = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const sampleMp4Stream = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < episodes.length; i += batchSize) {
    const batch = episodes.slice(i, i + batchSize);
    const sourcesPayload: any[] = [];

    for (const ep of batch) {
      // 1. Native Sub Stream (Priority 1)
      sourcesPayload.push({
        episode_id: ep.id,
        provider: 'totalanime',
        server_name: 'TotalAnime HD (Nativo)',
        embed_url: sampleHlsStream,
        direct_stream_url: sampleHlsStream,
        language: 'sub',
        quality: '1080p',
        priority: 1,
        is_active: true,
        last_verified_at: new Date().toISOString(),
      });

      // 2. Native Dub Stream (Priority 1)
      sourcesPayload.push({
        episode_id: ep.id,
        provider: 'totalanime',
        server_name: 'TotalAnime Latino (Nativo)',
        embed_url: sampleMp4Stream,
        direct_stream_url: sampleMp4Stream,
        language: 'dub',
        quality: '1080p',
        priority: 1,
        is_active: true,
        last_verified_at: new Date().toISOString(),
      });
    }

    const { error: upsertError } = await supabase
      .from('episode_sources')
      .upsert(sourcesPayload, { onConflict: 'episode_id,provider,language,quality' });

    if (upsertError) {
      console.warn(`[SeedNativeStreams] Batch ${i / batchSize + 1} upsert error:`, upsertError.message);
    } else {
      insertedCount += sourcesPayload.length;
      console.log(`[SeedNativeStreams] Processed batch ${i / batchSize + 1} (${insertedCount} sources seeded).`);
    }
  }

  // Update status = 'available' for all episodes
  const { error: statusError } = await supabase
    .from('episodes')
    .update({ status: 'available', updated_at: new Date().toISOString() })
    .neq('id', 0);

  if (statusError) {
    console.warn('[SeedNativeStreams] Error updating episode status:', statusError.message);
  } else {
    console.log('[SeedNativeStreams] Successfully updated all episode statuses to "available".');
  }

  console.log(`[SeedNativeStreams] Complete! Seeded ${insertedCount} native streams.`);
}

seedNativeStreams().catch(console.error);
