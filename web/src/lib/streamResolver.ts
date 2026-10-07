import { EpisodeSourceRow, PlayableStream } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Providers that are natively rendered via embed player with 0ms startup delay
const EMBED_NATIVE_PROVIDERS = new Set(['mega', 'okru', 'yourupload', 'doodstream']);

/**
 * Resolves an EpisodeSource into a playable stream instantly with 0ms unnecessary delay
 */
export async function resolveStreamSource(source: EpisodeSourceRow): Promise<PlayableStream> {
  const providerLower = (source.provider || '').toLowerCase();
  const serverName = source.server_name || source.provider;

  // 1. Direct Stream URL already stored in database
  if (source.direct_stream_url && source.direct_stream_url.trim().length > 0) {
    const direct = source.direct_stream_url.trim();
    const type = direct.includes('.m3u8') ? 'hls' : direct.includes('.mp4') ? 'mp4' : 'hls';
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: serverName,
      type,
      url: direct,
      direct_url: direct,
      quality: source.quality,
      language: source.language,
    };
  }

  // 2. Direct HLS or MP4 file in embed_url
  if (source.embed_url.includes('.m3u8')) {
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: serverName,
      type: 'hls',
      url: source.embed_url,
      direct_url: source.embed_url,
      quality: source.quality,
      language: source.language,
    };
  }

  if (source.embed_url.includes('.mp4') && !source.embed_url.includes('embed')) {
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: serverName,
      type: 'mp4',
      url: source.embed_url,
      direct_url: source.embed_url,
      quality: source.quality,
      language: source.language,
    };
  }

  // 3. Instant 0ms resolution for embed-native providers
  if (EMBED_NATIVE_PROVIDERS.has(providerLower)) {
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: serverName,
      type: 'iframe',
      url: source.embed_url,
      direct_url: null,
      quality: source.quality,
      language: source.language,
      is_fallback: false,
    };
  }

  // 4. Fast Backend Stream Resolution for dynamic HLS hosts (StreamWish, FileMoon, Voe)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(`${API_BASE_URL}/api/v1/stream/sources/${source.id}/resolve`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: PlayableStream = await res.json();
      if (data && data.url) {
        return data;
      }
    }
  } catch {
    // Timeout or API offline -> instantaneous fallback
  }

  // 5. Default Safe Instant Fallback
  return {
    source_id: source.id,
    provider: source.provider,
    server_name: serverName,
    type: 'iframe',
    url: source.embed_url,
    direct_url: null,
    quality: source.quality,
    language: source.language,
    is_fallback: true,
  };
}
