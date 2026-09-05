import { ScrapedServer, StreamLanguage } from '../types/index.js';

interface ProviderDefinition {
  provider: string;
  name: string;
  patterns: (string | RegExp)[];
  priority: number;
  quality: string;
}

const KNOWN_PROVIDERS: ProviderDefinition[] = [
  {
    provider: 'mega',
    name: 'Mega',
    patterns: ['mega.nz', 'mega.io'],
    priority: 10,
    quality: '1080p',
  },
  {
    provider: 'streamwish',
    name: 'StreamWish',
    patterns: ['streamwish', 'wishembed', 'streamwish.to', 'streamwish.com', 'swish'],
    priority: 20,
    quality: '720p',
  },
  {
    provider: 'filemoon',
    name: 'FileMoon',
    patterns: ['filemoon', 'filemoon.sx', 'filemoon.to'],
    priority: 30,
    quality: '720p',
  },
  {
    provider: 'streamtape',
    name: 'Streamtape',
    patterns: ['streamtape.com', 'streamtape.net', 'streamtape'],
    priority: 40,
    quality: '720p',
  },
  {
    provider: 'mp4upload',
    name: 'Mp4Upload',
    patterns: ['mp4upload.com', 'mp4upload'],
    priority: 50,
    quality: '720p',
  },
  {
    provider: 'yourupload',
    name: 'YourUpload',
    patterns: ['yourupload.com', 'yourupload'],
    priority: 60,
    quality: '720p',
  },
  {
    provider: 'okru',
    name: 'Okru',
    patterns: ['ok.ru', 'odnoklassniki'],
    priority: 70,
    quality: '720p',
  },
  {
    provider: 'doodstream',
    name: 'DoodStream',
    patterns: ['doodstream', 'dood.to', 'dood.watch', 'dood.so', 'dood.ws'],
    priority: 80,
    quality: '720p',
  },
  {
    provider: 'voe',
    name: 'Voe',
    patterns: ['voe.sx', 'voe-network', 'voe.to'],
    priority: 90,
    quality: '720p',
  },
];

/**
 * Sanitizes and cleans an embed URL
 */
export const sanitizeEmbedUrl = (rawUrl: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let cleaned = rawUrl.trim();

  // If protocol-relative, prepend https:
  if (cleaned.startsWith('//')) {
    cleaned = `https:${cleaned}`;
  }

  // Handle leading javascript: or invalid schemes
  if (cleaned.toLowerCase().startsWith('javascript:') || cleaned.toLowerCase().startsWith('data:')) {
    return null;
  }

  try {
    const parsed = new URL(cleaned);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};

/**
 * Normalizes a raw embed URL into a ScrapedServer structure
 */
export const normalizeServer = (
  rawUrl: string,
  hintName?: string,
  language: StreamLanguage = 'sub'
): ScrapedServer | null => {
  const sanitizedUrl = sanitizeEmbedUrl(rawUrl);
  if (!sanitizedUrl) return null;

  const lowerUrl = sanitizedUrl.toLowerCase();
  const lowerHint = (hintName || '').toLowerCase();

  // Find matching provider
  let matchedProvider: ProviderDefinition | null = null;

  for (const prov of KNOWN_PROVIDERS) {
    const matchesPattern = prov.patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return lowerUrl.includes(pattern.toLowerCase()) || lowerHint.includes(pattern.toLowerCase());
      }
      return pattern.test(lowerUrl) || pattern.test(lowerHint);
    });

    if (matchesPattern) {
      matchedProvider = prov;
      break;
    }
  }

  if (matchedProvider) {
    return {
      provider: matchedProvider.provider,
      server_name: matchedProvider.name,
      embed_url: sanitizedUrl,
      language,
      quality: matchedProvider.quality,
      priority: matchedProvider.priority,
    };
  }

  // Fallback for custom or unknown provider
  let domain = 'custom';
  try {
    const host = new URL(sanitizedUrl).hostname;
    domain = host.replace(/^www\./, '').split('.')[0] || 'custom';
  } catch {
    // ignore
  }

  const fallbackName = hintName && hintName.trim().length > 0 ? hintName.trim() : domain.toUpperCase();

  return {
    provider: domain.toLowerCase(),
    server_name: fallbackName,
    embed_url: sanitizedUrl,
    language,
    quality: '720p',
    priority: 100,
  };
};
