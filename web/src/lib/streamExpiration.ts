/**
 * Utility to inspect streaming URLs and determine expiration status
 * based on standard CDN tokens and signed query parameters (e.g. exp, expires, expiry).
 */

export interface ExpirationCheckResult {
  isExpired: boolean;
  expiresAtMs?: number;
  reason?: string;
}

/**
 * Checks if a stream URL contains an expiration parameter and whether it has expired
 * or is within the safety margin.
 *
 * @param urlStr The stream URL to inspect
 * @param safetyMarginMs Margin before official expiration to consider the URL expired (default: 60s)
 */
export function checkStreamUrlExpiration(
  urlStr: string,
  safetyMarginMs: number = 60_000
): ExpirationCheckResult {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isExpired: false };
  }

  try {
    const parsed = urlStr.startsWith('http://') || urlStr.startsWith('https://')
      ? new URL(urlStr)
      : new URL(urlStr, 'http://localhost');

    const expParams = ['exp', 'expires', 'expiry', 'token_exp', 'expire', 'expires_at'];

    for (const param of expParams) {
      const val = parsed.searchParams.get(param);
      if (val) {
        const num = Number(val);
        if (Number.isFinite(num) && num > 0) {
          const expiresAtMs = num < 1e11 ? num * 1000 : num;
          const isExpired = Date.now() >= expiresAtMs - safetyMarginMs;
          return {
            isExpired,
            expiresAtMs,
            reason: isExpired
              ? `El token '${param}' ha caducado.`
              : undefined,
          };
        }
      }
    }
  } catch {
    // Ignore URL parse errors
  }

  return { isExpired: false };
}
