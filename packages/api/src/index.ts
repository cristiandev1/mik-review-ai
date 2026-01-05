import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/utils/logger.js';
import { runMigrationsOnStartup } from './config/database.js';
// Import review worker to start processing jobs
import './modules/reviews/review.queue.js';

async function start() {
  try {
    // Run pending migrations before starting the app
    await runMigrationsOnStartup();

    const app = await buildApp();

    const port = parseInt(env.PORT, 10);
    const host = env.HOST;

    await app.listen({ port, host });

    logger.info(`
    ████████████████████████████████████████████████████████
    
    🚀 Mik Review AI API Server is running!
    
    📍 Environment: ${env.NODE_ENV}
    📍 URL: http://${host}:${port}
    📍 Health: http://${host}:${port}/health
    
    ████████████████████████████████████████████████████████
    `);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, closing server gracefully...`);
        await app.close();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

start();
