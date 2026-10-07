import { EpisodeSourceRow, PlayableStream } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Resolves an EpisodeSource into a playable stream (HLS .m3u8, direct MP4 or fallback iframe)
 */
export async function resolveStreamSource(source: EpisodeSourceRow): Promise<PlayableStream> {
  // 1. If direct_stream_url is already available in DB record
  if (source.direct_stream_url && source.direct_stream_url.trim().length > 0) {
    const direct = source.direct_stream_url.trim();
    const type = direct.includes('.m3u8') ? 'hls' : direct.includes('.mp4') ? 'mp4' : 'hls';
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: source.server_name || source.provider,
      type,
      url: direct,
      direct_url: direct,
      quality: source.quality,
      language: source.language,
    };
  }

  // 2. Direct extension in embed_url
  if (source.embed_url.includes('.m3u8')) {
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: source.server_name || source.provider,
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
      server_name: source.server_name || source.provider,
      type: 'mp4',
      url: source.embed_url,
      direct_url: source.embed_url,
      quality: source.quality,
      language: source.language,
    };
  }

  // 3. Request Backend Resolver from Render / Node API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
  } catch (err) {
    // Backend API offline or timed out, fallback to iframe
  }

  // 4. Default Safe Fallback: embed iframe
  return {
    source_id: source.id,
    provider: source.provider,
    server_name: source.server_name || source.provider,
    type: 'iframe',
    url: source.embed_url,
    direct_url: null,
    quality: source.quality,
    language: source.language,
    is_fallback: true,
  };
}
