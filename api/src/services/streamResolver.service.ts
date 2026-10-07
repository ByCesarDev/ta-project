import axios from 'axios';
import { sanitizeEmbedUrl, isPrivateOrLoopbackHost } from '../scrapers/serverParsers.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

export interface PlayableSource {
  source_id?: number;
  provider: string;
  server_name: string;
  type: 'hls' | 'mp4' | 'iframe';
  url: string;
  direct_url?: string | null;
  quality?: string;
  language?: string;
  headers?: Record<string, string>;
  is_fallback?: boolean;
}

/**
 * Unpacks P.A.C.K.E.R. obfuscated JavaScript code commonly found in video streaming hosts
 */
function unpackJS(packed: string): string {
  try {
    const match = packed.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*\}\('(.*)',\s*(\d+),\s*(\d+),\s*'([^']*)'\.split\('\|'\)/);
    if (!match) return '';

    let [, p, aStr, , kStr] = match;
    const a = parseInt(aStr, 10);
    const k = kStr.split('|');

    const decode = (d: number): string => {
      return d < a ? (d > 35 ? String.fromCharCode(d + 29) : d.toString(36)) : decode(Math.floor(d / a)) + (d % a > 35 ? String.fromCharCode((d % a) + 29) : (d % a).toString(36));
    };

    let count = k.length;
    while (count--) {
      if (k[count]) {
        p = p.replace(new RegExp('\\b' + decode(count) + '\\b', 'g'), k[count]);
      }
    }
    return p;
  } catch {
    return '';
  }
}

export class StreamResolverService {
  private readonly httpClient = axios.create({
    timeout: 6000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  /**
   * Resolves an episode source into a playable direct stream (HLS/MP4) or safe iframe fallback.
   */
  public async resolveSource(source: {
    id?: number;
    provider: string;
    server_name?: string;
    embed_url: string;
    direct_stream_url?: string | null;
    quality?: string;
    language?: string;
  }): Promise<PlayableSource> {
    const provider = source.provider.toLowerCase();
    const serverName = source.server_name || source.provider;
    const embedUrl = source.embed_url;

    // 1. Direct Stream URL already stored in Database
    if (source.direct_stream_url && source.direct_stream_url.trim().length > 0) {
      const direct = source.direct_stream_url.trim();
      const type = direct.includes('.m3u8') ? 'hls' : direct.includes('.mp4') ? 'mp4' : 'hls';
      return {
        source_id: source.id,
        provider,
        server_name: serverName,
        type,
        url: direct,
        direct_url: direct,
        quality: source.quality,
        language: source.language,
      };
    }

    // 2. Direct HLS or MP4 in embed_url
    if (embedUrl.includes('.m3u8')) {
      return {
        source_id: source.id,
        provider,
        server_name: serverName,
        type: 'hls',
        url: embedUrl,
        direct_url: embedUrl,
        quality: source.quality,
        language: source.language,
      };
    }

    if (embedUrl.includes('.mp4') && !embedUrl.includes('embed')) {
      return {
        source_id: source.id,
        provider,
        server_name: serverName,
        type: 'mp4',
        url: embedUrl,
        direct_url: embedUrl,
        quality: source.quality,
        language: source.language,
      };
    }

    // 3. Provider-Specific Extraction
    try {
      const resolved = await this.extractFromHost(embedUrl, provider);
      if (resolved) {
        // Asynchronously cache resolved direct_stream_url in database if source.id is present
        if (source.id) {
          void Promise.resolve(
            supabaseAdmin
              .from('episode_sources')
              .update({
                direct_stream_url: resolved.url,
                last_verified_at: new Date().toISOString(),
              })
              .eq('id', source.id)
          ).catch(() => {});
        }

        return {
          source_id: source.id,
          provider,
          server_name: serverName,
          type: resolved.type,
          url: resolved.url,
          direct_url: resolved.url,
          quality: source.quality,
          language: source.language,
        };
      }
    } catch (err) {
      // Extraction failed or timed out, gracefully fallback to iframe
    }

    // 4. Default Safe Fallback: iframe mode
    return {
      source_id: source.id,
      provider,
      server_name: serverName,
      type: 'iframe',
      url: embedUrl,
      direct_url: null,
      quality: source.quality,
      language: source.language,
      is_fallback: true,
    };
  }

  /**
   * Attempts live extraction of .m3u8 / .mp4 links from known streaming hosts
   */
  private async extractFromHost(embedUrl: string, provider: string): Promise<{ url: string; type: 'hls' | 'mp4' } | null> {
    const sanitized = sanitizeEmbedUrl(embedUrl);
    if (!sanitized) return null;

    let parsedHost = '';
    try {
      parsedHost = new URL(sanitized).hostname;
      if (isPrivateOrLoopbackHost(parsedHost)) return null;
    } catch {
      return null;
    }

    const { data: html } = await this.httpClient.get(sanitized, {
      headers: {
        Referer: sanitized,
      },
    });

    if (typeof html !== 'string') return null;

    // A. Check for unpacked direct .m3u8
    const m3u8Match = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*|\/hls\/[^"'\s<>]+\.m3u8/i);
    if (m3u8Match) {
      let url = m3u8Match[0];
      if (url.startsWith('/')) {
        url = new URL(url, sanitized).toString();
      }
      return { url, type: 'hls' };
    }

    // B. Check for packed JS unpacking (StreamWish, FileMoon, Voe)
    if (html.includes('eval(function(p,a,c,k,e,')) {
      const unpacked = unpackJS(html);
      if (unpacked) {
        const unpackedM3u8 = unpacked.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
        if (unpackedM3u8) {
          return { url: unpackedM3u8[0], type: 'hls' };
        }
      }
    }

    // C. Voe extraction (hls m3u8 stream)
    if (provider.includes('voe') || parsedHost.includes('voe')) {
      const voeMatch = html.match(/'hls':\s*'([^']+)'/) || html.match(/"hls":\s*"([^"]+)"/);
      if (voeMatch && voeMatch[1]) {
        return { url: voeMatch[1], type: 'hls' };
      }
    }

    return null;
  }
}

export const streamResolverService = new StreamResolverService();
