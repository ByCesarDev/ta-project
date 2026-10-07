import { EpisodeSourceRow, PlayableStream } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Only providers that strictly cannot be extracted client or server side without special decryptors
const EMBED_NATIVE_PROVIDERS = new Set(['mega', 'doodstream']);

/**
 * Normalizes a URL so that relative API proxy paths are routed through API_BASE_URL
 */
function normalizeStreamUrl(url: string): string {
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

/**
 * Resolves an EpisodeSource into a playable stream (HLS/MP4) or safe fallback
 */
export async function resolveStreamSource(source: EpisodeSourceRow): Promise<PlayableStream> {
  const providerLower = (source.provider || '').toLowerCase();
  const serverName = source.server_name || source.provider;

  // 1. Direct Stream URL already stored in database
  if (source.direct_stream_url && source.direct_stream_url.trim().length > 0) {
    const direct = normalizeStreamUrl(source.direct_stream_url.trim());
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
    const direct = normalizeStreamUrl(source.embed_url.trim());
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: serverName,
      type: 'hls',
      url: direct,
      direct_url: direct,
      quality: source.quality,
      language: source.language,
    };
  }

  if (source.embed_url.includes('.mp4') && !source.embed_url.includes('embed')) {
    const direct = normalizeStreamUrl(source.embed_url.trim());
    return {
      source_id: source.id,
      provider: source.provider,
      server_name: serverName,
      type: 'mp4',
      url: direct,
      direct_url: direct,
      quality: source.quality,
      language: source.language,
    };
  }

  // 3. Instant resolution for iframe-only providers (e.g. Mega)
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

  // 4. Backend Stream Resolution (YourUpload, OK.ru, MP4Upload, StreamWish, FileMoon, Voe)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const resolveEndpoint = source.id
      ? `${API_BASE_URL}/api/v1/stream/sources/${source.id}/resolve`
      : `${API_BASE_URL}/api/v1/stream/resolve`;

    const res = source.id
      ? await fetch(resolveEndpoint, { signal: controller.signal })
      : await fetch(resolveEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(source),
          signal: controller.signal,
        });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data: PlayableStream = await res.json();
      if (data && data.url) {
        return {
          ...data,
          url: normalizeStreamUrl(data.url),
          direct_url: data.direct_url ? normalizeStreamUrl(data.direct_url) : null,
        };
      }
    }
  } catch {
    // Timeout or API offline -> fallback to embed iframe
  }

  // 5. Default Safe Fallback
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
