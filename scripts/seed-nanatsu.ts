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

async function seedNanatsu() {
  console.log('='.repeat(60));
  console.log(' SEEDING NANATSU NO TAIZAI (THE SEVEN DEADLY SINS T1)');
  console.log('='.repeat(60));

  // 1. Insert Anime
  const animeData = {
    name: 'The Seven Deadly Sins',
    slug: 'the-seven-deadly-sins',
    title_romaji: 'Nanatsu no Taizai',
    title_english: 'The Seven Deadly Sins',
    title_native: '七つの大罪',
    description:
      'Los Siete Pecados Capitales, un grupo de caballeros rebeldes que fueron acusados de derrocar al Reino de Liones, se dispersaron. La princesa Elizabeth busca a su líder, Meliodas, para salvar a su reino de los Caballeros Sagrados.',
    cover_image:
      'https://img.dramasfree.com/cover/20260519/1779169510206_61d19f69160d6c8c17a820f89998597fThe Seven Deadly Sins.webp',
    banner_image:
      'https://img.dramasfree.com/cover/20260519/1779169517099_626ed4ee5e119d231d936d00b62555dbThe Seven Deadly Sins.webp',
    status: 'FINISHED',
    format: 'TV',
    episodes: 24,
    season_year: 2014,
  };

  const { data: anime, error: animeErr } = await supabase
    .from('animes')
    .upsert(animeData, { onConflict: 'slug' })
    .select()
    .single();

  if (animeErr || !anime) {
    console.error('Failed to create anime:', animeErr);
    return;
  }

  console.log(`✓ Anime created/updated: ${anime.name} (ID: ${anime.id})`);

  // 2. Insert 24 Episodes
  const episodesPayload = [];
  for (let i = 1; i <= 24; i++) {
    episodesPayload.push({
      anime_id: anime.id,
      episode_number: i,
      title: `Episodio ${i}`,
      status: 'available',
    });
  }

  const { data: episodes, error: epErr } = await supabase
    .from('episodes')
    .upsert(episodesPayload, { onConflict: 'anime_id,episode_number' })
    .select();

  if (epErr || !episodes) {
    console.error('Failed to create episodes:', epErr);
    return;
  }

  console.log(`✓ Created ${episodes.length} episodes.`);

  // 3. Insert both SUB and DUB sources for all episodes
  const sourcesPayload: any[] = [];

  for (const ep of episodes) {
    // A. Subtitulado (Original Japonés) - Direct HLS
    sourcesPayload.push({
      episode_id: ep.id,
      provider: 'dramasfree',
      server_name: 'DramasFree HD (Sub Japonés)',
      embed_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      direct_stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      language: 'sub',
      quality: '1080p',
      priority: 1,
      is_active: true,
      last_verified_at: new Date().toISOString(),
    });

    // B. Doblaje Español Latino - Direct HLS
    sourcesPayload.push({
      episode_id: ep.id,
      provider: 'dramasfree',
      server_name: 'DramasFree HD (Doblaje Latino)',
      embed_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      direct_stream_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      language: 'dub',
      quality: '1080p',
      priority: 1,
      is_active: true,
      last_verified_at: new Date().toISOString(),
    });
  }

  const { error: srcErr } = await supabase
    .from('episode_sources')
    .upsert(sourcesPayload, { onConflict: 'episode_id,provider,language,quality' });

  if (srcErr) {
    console.error('Failed to seed episode sources:', srcErr);
  } else {
    console.log(`✓ Seeded ${sourcesPayload.length} native dual-audio sources (Sub & Dub).`);
  }

  console.log('='.repeat(60));
  console.log(' NANATSU NO TAIZAI SEEDED SUCCESSFULLY!');
  console.log(' URL: http://localhost:5173/watch/the-seven-deadly-sins/1');
  console.log('='.repeat(60));
}

seedNanatsu().catch(console.error);
