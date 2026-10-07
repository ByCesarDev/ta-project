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

    // 3. Provider-Specific Extraction with Stream Proxy Support
    try {
      const resolved = await this.extractFromHost(embedUrl, provider);
      if (resolved) {
        // Asynchronously cache resolved direct_stream_url in database if source.id is present and not a local proxy route
        if (source.id && !resolved.url.startsWith('/api/v1/stream/proxy')) {
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
    } catch {
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
      parsedHost = new URL(sanitized).hostname.toLowerCase();
      if (isPrivateOrLoopbackHost(parsedHost)) return null;
    } catch {
      return null;
    }

    // A. YourUpload extraction (proxying raw MP4 with origin Referer)
    if (provider.includes('yourupload') || parsedHost.includes('yourupload')) {
      try {
        const { data: html } = await this.httpClient.get(sanitized, {
          headers: { Referer: 'https://www.yourupload.com/' },
        });

        if (typeof html === 'string') {
          const match =
            html.match(/file:\s*['"]([^'"]+\.mp4[^'"]*)['"]/i) ||
            html.match(/<meta property="og:video" content="([^"]+)"/i);
          if (match && match[1]) {
            let directMp4 = match[1].trim();
            if (directMp4.startsWith('/')) directMp4 = new URL(directMp4, sanitized).toString();
            // Reject dead/placeholder novideo.mp4
            if (!directMp4.includes('novideo.mp4')) {
              // Wrap in Stream Proxy to bypass 403 hotlink & CORS blocks
              const proxyUrl = `/api/v1/stream/proxy?url=${encodeURIComponent(directMp4)}&referer=${encodeURIComponent('https://www.yourupload.com/')}`;
              return { url: proxyUrl, type: 'mp4' };
            }
          }
        }
      } catch {
        return null;
      }
    }

    // B. OK.ru (Odnoklassniki) extraction
    if (provider.includes('okru') || parsedHost.includes('ok.ru') || parsedHost.includes('odnoklassniki')) {
      try {
        const { data: html } = await this.httpClient.get(sanitized, {
          headers: { Referer: sanitized },
        });

        if (typeof html === 'string') {
          // OKVideo data-options metadata contains JSON with video URLs
          const optionsMatch =
            html.match(/data-options="([^"]+)"/i) ||
            html.match(/data-module="OKVideo"[\s\S]*?data-options="([^"]+)"/i);
          if (optionsMatch && optionsMatch[1]) {
            const decodedJson = optionsMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            const parsed = JSON.parse(decodedJson);
            const videos = parsed?.flashvars?.metadata
              ? JSON.parse(parsed.flashvars.metadata)?.videos
              : null;
            if (Array.isArray(videos) && videos.length > 0) {
              const chosen = videos[videos.length - 1];
              if (chosen?.url) {
                const proxyUrl = `/api/v1/stream/proxy?url=${encodeURIComponent(chosen.url)}&referer=${encodeURIComponent('https://ok.ru/')}`;
                return { url: proxyUrl, type: 'mp4' };
              }
            }
          }
        }
      } catch {
        return null;
      }
    }

    // C. MP4Upload extraction
    if (provider.includes('mp4upload') || parsedHost.includes('mp4upload')) {
      try {
        const { data: html } = await this.httpClient.get(sanitized, {
          headers: { Referer: 'https://www.mp4upload.com/' },
        });

        if (typeof html === 'string') {
          const match =
            html.match(/player\.src\(\s*['"]([^'"]+\.mp4[^'"]*)['"]/i) ||
            html.match(/src:\s*['"]([^'"]+\.mp4[^'"]*)['"]/i);
          if (match && match[1]) {
            const proxyUrl = `/api/v1/stream/proxy?url=${encodeURIComponent(match[1])}&referer=${encodeURIComponent('https://www.mp4upload.com/')}`;
            return { url: proxyUrl, type: 'mp4' };
          }
        }
      } catch {
        return null;
      }
    }

    // D. Voe extraction (handling redirect if needed)
    if (provider.includes('voe') || parsedHost.includes('voe')) {
      try {
        let currentUrl = sanitized;
        let { data: voeHtml } = await this.httpClient.get(currentUrl, {
          headers: { Referer: sanitized },
        });

        if (typeof voeHtml === 'string') {
          // Follow JS redirect: window.location.href = 'https://...'
          const redirectMatch = voeHtml.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
          if (redirectMatch && redirectMatch[1]) {
            currentUrl = redirectMatch[1];
            const redirectedRes = await this.httpClient.get(currentUrl, {
              headers: { Referer: sanitized },
            });
            voeHtml = redirectedRes.data;
          }

          if (typeof voeHtml === 'string') {
            const hlsMatch =
              voeHtml.match(/'hls':\s*'([^']+)'/) ||
              voeHtml.match(/"hls":\s*"([^"]+)"/) ||
              voeHtml.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/);
            if (hlsMatch) {
              const hlsUrl = hlsMatch[1] || hlsMatch[0];
              return { url: hlsUrl, type: 'hls' };
            }

            const mp4Match =
              voeHtml.match(/var\s+source\s*=\s*['"]([^'"]+\.mp4[^'"]*)['"]/) ||
              voeHtml.match(/'mp4':\s*'([^']+)'/) ||
              voeHtml.match(/"mp4":\s*"([^"]+)"/);
            if (mp4Match && mp4Match[1]) {
              return { url: mp4Match[1], type: 'mp4' };
            }
          }
        }
      } catch {
        // Fallback to general scraper
      }
    }

    // General HTML fetch for packed HLS/M3U8 streams (StreamWish, FileMoon, etc.)
    try {
      const { data: html } = await this.httpClient.get(sanitized, {
        headers: { Referer: sanitized },
      });

      if (typeof html !== 'string') return null;

      // Unpacked direct .m3u8
      const m3u8Match = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*|\/hls\/[^"'\s<>]+\.m3u8/i);
      if (m3u8Match) {
        let url = m3u8Match[0];
        if (url.startsWith('/')) url = new URL(url, sanitized).toString();
        return { url, type: 'hls' };
      }

      // Packed JS unpacking
      if (html.includes('eval(function(p,a,c,k,e,')) {
        const unpacked = unpackJS(html);
        if (unpacked) {
          const unpackedM3u8 = unpacked.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
          if (unpackedM3u8) {
            return { url: unpackedM3u8[0], type: 'hls' };
          }
        }
      }
    } catch {
      return null;
    }

    return null;
  }
}

export const streamResolverService = new StreamResolverService();
