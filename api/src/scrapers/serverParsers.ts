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
 * Checks if a hostname belongs to loopback, private RFC 1918 subnets, or cloud metadata IP
 */
export const isPrivateOrLoopbackHost = (hostname: string): boolean => {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '::1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local')
  ) {
    return true;
  }

  // AWS / Cloud Provider Instance Metadata Service
  if (lower === '169.254.169.254') {
    return true;
  }

  // IPv4 Private Address Ranges (RFC 1918 & Loopback)
  const parts = lower.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 10) return true;  // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local / metadata
    if (parts[0] === 0) return true;   // 0.0.0.0/8
  }

  return false;
};

/**
 * Sanitizes and cleans an embed URL with SSRF protection
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

    // SSRF Hardening: Reject loopback, private networks, and cloud metadata endpoints
    if (isPrivateOrLoopbackHost(parsed.hostname)) {
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

  // Find matching provider from known allowlist
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
      is_active: true, // Known providers are active by default
    };
  }

  // Unknown provider: Quarantine with is_active = false for moderator review
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
    is_active: false, // Unknown providers are quarantined until reviewed by staff
  };
};
