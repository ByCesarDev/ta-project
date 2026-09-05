import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { corsMiddleware } from './middlewares/cors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Security and middleware setup
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(corsMiddleware);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check endpoint (Used by Render health checks & uptime monitors)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '2.4.1',
  });
});

// Root API information
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'TotalAnime API & Scraper Microservice',
    version: '2.4.1',
    status: 'online',
    endpoints: {
      health: '/health',
      stream: '/api/v1/stream/:animeSlug/:episodeNumber',
      jobs: '/api/v1/jobs',
      anilist: '/api/v1/anilist',
    },
    documentation: 'https://totalanime.com/docs',
  });
});

// Mount API v1 Routes
app.use('/api/v1', apiRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource does not exist.',
  });
});

// Central Error Handler
app.use(errorHandler);

// Start Server if not imported as module in test runner
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 TotalAnime API running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📡 Health Check: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed. Process exiting.');
      process.exit(0);
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
      console.error('⚠️ Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
