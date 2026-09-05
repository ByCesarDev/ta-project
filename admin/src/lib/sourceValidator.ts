/**
 * TotalAnime 2.0 - Admin Episode Source Validation & Hardening
 * Replicates serverParsers.ts SSRF checks and provider allowlist.
 */

export interface KnownProvider {
  provider: string;
  name: string;
  allowedHostnames: string[];
  priority: number;
  quality: string;
}

export const KNOWN_PROVIDERS: KnownProvider[] = [
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

  // Cloud Instance Metadata Service (AWS / GCP / Azure)
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

  // Block dangerous schemes
  const lower = cleaned.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null;
  }

  try {
    const parsed = new URL(cleaned);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    if (isPrivateOrLoopbackHost(parsed.hostname)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
};

export interface ValidatedSource {
  isValid: boolean;
  sanitizedUrl: string | null;
  hostname: string;
  isKnownProvider: boolean;
  matchedProvider: KnownProvider | null;
  suggestedProvider: string;
  isQuarantined: boolean;
  errorMessage?: string;
}

/**
 * Validates an embed URL and determines provider trust & quarantine status
 */
export const validateSource = (rawUrl: string): ValidatedSource => {
  const sanitized = sanitizeEmbedUrl(rawUrl);

  if (!sanitized) {
    return {
      isValid: false,
      sanitizedUrl: null,
      hostname: '',
      isKnownProvider: false,
      matchedProvider: null,
      suggestedProvider: 'custom',
      isQuarantined: true,
      errorMessage: 'URL inválida o rechazada por directiva de seguridad SSRF (no se permiten dominios privados ni esquemas inseguros).',
    };
  }

  let hostname = '';
  try {
    hostname = new URL(sanitized).hostname.toLowerCase();
  } catch {
    return {
      isValid: false,
      sanitizedUrl: null,
      hostname: '',
      isKnownProvider: false,
      matchedProvider: null,
      suggestedProvider: 'custom',
      isQuarantined: true,
      errorMessage: 'No se pudo parsear el hostname de la URL.',
    };
  }

  let matched: KnownProvider | null = null;
  for (const prov of KNOWN_PROVIDERS) {
    const matches = prov.allowedHostnames.some((allowed) => {
      const target = allowed.toLowerCase();
      return hostname === target || hostname.endsWith(`.${target}`);
    });

    if (matches) {
      matched = prov;
      break;
    }
  }

  if (matched) {
    return {
      isValid: true,
      sanitizedUrl: sanitized,
      hostname,
      isKnownProvider: true,
      matchedProvider: matched,
      suggestedProvider: matched.provider,
      isQuarantined: false,
    };
  }

  // Unknown host: Quarantined by default
  let domain = 'custom';
  try {
    const parts = hostname.replace(/^www\./, '').split('.');
    domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || 'custom';
  } catch {
    // fallback
  }

  if (KNOWN_PROVIDERS.some((p) => p.provider === domain.toLowerCase())) {
    domain = `unverified-${domain}`;
  }

  return {
    isValid: true,
    sanitizedUrl: sanitized,
    hostname,
    isKnownProvider: false,
    matchedProvider: null,
    suggestedProvider: domain.toLowerCase(),
    isQuarantined: true, // Unknown host starts quarantined
  };
};
