import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Backend server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Story process limit: ${env.MAX_STORY_CHARS} chars, Upload limit: ${env.MAX_UPLOAD_MB} MB`);
  logger.info(`Active TTS provider: ${env.TTS_PROVIDER}, Claude model: ${env.CLAUDE_MODEL}`);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s if dangling connections
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
