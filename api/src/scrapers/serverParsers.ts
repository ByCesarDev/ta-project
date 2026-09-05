import { ScrapedServer, StreamLanguage } from '../types/index.js';

interface ProviderDefinition {
  provider: string;
  name: string;
  allowedHostnames: string[];
  priority: number;
  quality: string;
}

const KNOWN_PROVIDERS: ProviderDefinition[] = [
  {
    provider: 'mega',
    name: 'Mega',
    allowedHostnames: ['mega.nz', 'mega.io'],
    priority: 10,
    quality: '1080p',
  },
  {
    provider: 'streamwish',
    name: 'StreamWish',
    allowedHostnames: ['streamwish.to', 'streamwish.com', 'wishembed.pro', 'swish.to', 'strwish.com'],
    priority: 20,
    quality: '720p',
  },
  {
    provider: 'filemoon',
    name: 'FileMoon',
    allowedHostnames: ['filemoon.sx', 'filemoon.to', 'filemoon.in'],
    priority: 30,
    quality: '720p',
  },
  {
    provider: 'streamtape',
    name: 'Streamtape',
    allowedHostnames: ['streamtape.com', 'streamtape.net', 'streamtape.to'],
    priority: 40,
    quality: '720p',
  },
  {
    provider: 'mp4upload',
    name: 'Mp4Upload',
    allowedHostnames: ['mp4upload.com'],
    priority: 50,
    quality: '720p',
  },
  {
    provider: 'yourupload',
    name: 'YourUpload',
    allowedHostnames: ['yourupload.com'],
    priority: 60,
    quality: '720p',
  },
  {
    provider: 'okru',
    name: 'Okru',
    allowedHostnames: ['ok.ru', 'odnoklassniki.ru'],
    priority: 70,
    quality: '720p',
  },
  {
    provider: 'doodstream',
    name: 'DoodStream',
    allowedHostnames: ['doodstream.com', 'dood.to', 'dood.watch', 'dood.so', 'dood.ws'],
    priority: 80,
    quality: '720p',
  },
  {
    provider: 'voe',
    name: 'Voe',
    allowedHostnames: ['voe.sx', 'voe-network.net', 'voe.to'],
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
 * Normalizes a raw embed URL into a ScrapedServer structure with strict hostname validation
 */
export const normalizeServer = (
  rawUrl: string,
  hintName?: string,
  language: StreamLanguage = 'sub'
): ScrapedServer | null => {
  const sanitizedUrl = sanitizeEmbedUrl(rawUrl);
  if (!sanitizedUrl) return null;

  let hostname = '';
  try {
    hostname = new URL(sanitizedUrl).hostname.toLowerCase();
  } catch {
    return null;
  }

  // Security: Trust is based EXCLUSIVELY on strict hostname or subdomain match against allowedHostnames.
  // hintName is NEVER used to determine provider trust.
  let matchedProvider: ProviderDefinition | null = null;

  for (const prov of KNOWN_PROVIDERS) {
    const matches = prov.allowedHostnames.some((allowed) => {
      const target = allowed.toLowerCase();
      return hostname === target || hostname.endsWith(`.${target}`);
    });

    if (matches) {
      matchedProvider = prov;
      break;
    }
  }

  if (matchedProvider) {
    return {
      provider: matchedProvider.provider,
      server_name: hintName && hintName.trim().length > 0 ? hintName.trim() : matchedProvider.name,
      embed_url: sanitizedUrl,
      language,
      quality: matchedProvider.quality,
      priority: matchedProvider.priority,
      is_active: true, // Known providers matching allowed hostnames are active
    };
  }

  // Unknown provider: Quarantine with is_active = false for moderator review
  let domain = 'custom';
  try {
    const parts = hostname.replace(/^www\./, '').split('.');
    domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || 'custom';
  } catch {
    // ignore
  }

  // Prevent identity spoofing: an unverified custom provider cannot use a known provider slug
  if (KNOWN_PROVIDERS.some((p) => p.provider === domain.toLowerCase())) {
    domain = `unverified-${domain}`;
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
