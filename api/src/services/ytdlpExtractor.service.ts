import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { sanitizeEmbedUrl, isPrivateOrLoopbackHost } from '../scrapers/serverParsers.js';

const execFileAsync = promisify(execFile);

export interface YtDlpExtractionResult {
  success: boolean;
  url?: string;
  type?: 'hls' | 'mp4';
  direct_url?: string;
  headers?: Record<string, string>;
  dead?: boolean;
  reason?: string;
}

export class YtDlpExtractorService {
  private pythonPath: string | null = null;
  private isYtDlpDirect: boolean = false;

  constructor() {
    this.detectExecutable();
  }

  /**
   * Detects the best available python or yt-dlp executable on the system.
   */
  private detectExecutable(): void {
    // 1. Check explicit environment variables
    if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
      this.pythonPath = process.env.YTDLP_PATH;
      this.isYtDlpDirect = true;
      return;
    }

    if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
      this.pythonPath = process.env.PYTHON_PATH;
      this.isYtDlpDirect = false;
      return;
    }

    // 2. Windows-specific known paths
    const knownWindowsPaths = [
      'C:\\Users\\Usuario\\AppData\\Local\\Python\\bin\\python.exe',
      'C:\\Users\\Usuario\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
      'C:\\Users\\Usuario\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
      'C:\\Users\\Usuario\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
    ];

    for (const p of knownWindowsPaths) {
      if (fs.existsSync(p)) {
        this.pythonPath = p;
        this.isYtDlpDirect = false;
        return;
      }
    }

    // 3. System PATH fallback
    this.pythonPath = 'python';
    this.isYtDlpDirect = false;
  }

  /**
   * Extracts direct stream URL using yt-dlp sidecar.
   */
  public async extract(targetUrl: string, timeoutMs: number = 9000): Promise<YtDlpExtractionResult> {
    const sanitized = sanitizeEmbedUrl(targetUrl);
    if (!sanitized) {
      return { success: false, reason: 'Invalid or insecure target URL' };
    }

    try {
      const parsed = new URL(sanitized);
      if (isPrivateOrLoopbackHost(parsed.hostname)) {
        return { success: false, reason: 'Target host is forbidden by SSRF policy' };
      }
    } catch {
      return { success: false, reason: 'Target URL is malformed' };
    }

    const execPath = this.pythonPath || 'python';
    
    // Attempt standard extraction first, with --force-generic-extractor fallback
    const baseArgs = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--socket-timeout', '6',
      '--no-check-certificates',
      '--simulate',
    ];

    let stdout = '';

    // First attempt: standard yt-dlp extractor
    try {
      const runArgs = this.isYtDlpDirect
        ? [...baseArgs, sanitized]
        : ['-m', 'yt_dlp', ...baseArgs, sanitized];

      const res = await execFileAsync(execPath, runArgs, {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
      stdout = res.stdout;
    } catch (err: any) {
      const stderr = err?.stderr || '';
      // If blocked by Piracy notice or extractor error, retry with --force-generic-extractor
      if (stderr.includes('[Piracy]') || stderr.includes('Unsupported URL') || !stdout) {
        try {
          const fallbackArgs = this.isYtDlpDirect
            ? ['--force-generic-extractor', ...baseArgs, sanitized]
            : ['-m', 'yt_dlp', '--force-generic-extractor', ...baseArgs, sanitized];

          const fallbackRes = await execFileAsync(execPath, fallbackArgs, {
            timeout: timeoutMs,
            maxBuffer: 10 * 1024 * 1024,
          });
          stdout = fallbackRes.stdout;
        } catch (fallbackErr: any) {
          return {
            success: false,
            reason: fallbackErr?.message || 'yt-dlp extraction failed',
          };
        }
      } else {
        return {
          success: false,
          reason: err?.message || 'yt-dlp execution failed',
        };
      }
    }

    if (!stdout || !stdout.trim()) {
      return { success: false, reason: 'yt-dlp returned empty output' };
    }

    try {
      const data = JSON.parse(stdout.trim());
      return this.parseYtDlpOutput(data, sanitized);
    } catch {
      return { success: false, reason: 'Failed to parse yt-dlp JSON output' };
    }
  }

  /**
   * Parses yt-dlp JSON dump to extract playable video URL and headers.
   */
  private parseYtDlpOutput(data: any, originalUrl: string): YtDlpExtractionResult {
    if (!data) {
      return { success: false, reason: 'No metadata returned' };
    }

    // Check for common deletion markers
    const title = (data.title || '').toLowerCase();
    const directUrl = data.url || '';
    if (
      directUrl.includes('novideo.mp4') ||
      title.includes('file not found') ||
      title.includes('deleted') ||
      data.id === 'novideo'
    ) {
      return {
        success: false,
        dead: true,
        reason: 'El archivo de video fue eliminado de los servidores de origen.',
      };
    }

    // Find best format URL
    let streamUrl: string = directUrl;
    let formatProtocol = (data.protocol || '').toLowerCase();
    let ext = (data.ext || '').toLowerCase();

    // If root url is empty, inspect formats array
    if (!streamUrl && Array.isArray(data.formats) && data.formats.length > 0) {
      // Prioritize HLS / m3u8 or highest resolution MP4
      const hlsFormat = data.formats.find(
        (f: any) =>
          f.url?.includes('.m3u8') ||
          f.protocol?.includes('m3u8') ||
          f.format_id?.includes('hls')
      );

      if (hlsFormat && hlsFormat.url) {
        streamUrl = hlsFormat.url;
        formatProtocol = 'm3u8';
      } else {
        // Pick best video format
        const validFormats = data.formats.filter((f: any) => f.url && f.vcodec !== 'none');
        const chosen = validFormats.length > 0 ? validFormats[validFormats.length - 1] : data.formats[data.formats.length - 1];
        if (chosen && chosen.url) {
          streamUrl = chosen.url;
          formatProtocol = chosen.protocol || '';
          ext = chosen.ext || ext;
        }
      }
    }

    if (!streamUrl) {
      return { success: false, reason: 'No direct stream URL found in metadata' };
    }

    // Determine type: hls vs mp4
    const isHls =
      streamUrl.includes('.m3u8') ||
      formatProtocol.includes('m3u8') ||
      formatProtocol.includes('hls');
    const type: 'hls' | 'mp4' = isHls ? 'hls' : 'mp4';

    // Check if anti-hotlink headers are required
    const httpHeaders: Record<string, string> = data.http_headers || {};
    const referer = httpHeaders['Referer'] || httpHeaders['referer'] || originalUrl;
    
    // For MP4 or providers with anti-hotlink, route through proxy
    const needsProxy =
      type === 'mp4' ||
      Boolean(httpHeaders['Referer']) ||
      Boolean(httpHeaders['Cookie']);

    let finalPlayableUrl = streamUrl;
    if (needsProxy && !streamUrl.startsWith('/api/v1/stream/proxy')) {
      finalPlayableUrl = `/api/v1/stream/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(referer)}`;
    }

    return {
      success: true,
      url: finalPlayableUrl,
      direct_url: streamUrl,
      type,
      headers: httpHeaders,
    };
  }
}

export const ytdlpExtractorService = new YtDlpExtractorService();
