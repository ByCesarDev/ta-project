import cors, { CorsOptions } from 'cors';
import { env } from '../config/env.js';

const parseAllowedOrigins = (): (string | RegExp)[] => {
  const list = env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  return list;
};

const allowedOrigins = parseAllowedOrigins();

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') {
        return allowed === origin || allowed === '*';
      }
      return false;
    });

    if (isAllowed || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

export const corsMiddleware = cors(corsOptions);
