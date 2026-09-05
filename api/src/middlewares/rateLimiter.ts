import rateLimit from 'express-rate-limit';

// Standard rate limiter for general API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for scraping or write endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Rate limit exceeded for heavy operations. Please slow down.',
  },
});
