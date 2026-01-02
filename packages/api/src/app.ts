import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { apiKeyRoutes } from './modules/api-keys/api-key.routes.js';
import { reviewRoutes } from './modules/reviews/review.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { customRulesRoutes } from './modules/custom-rules/custom-rules.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss',
        }
      } : undefined,
    },
    trustProxy: true,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: env.NODE_ENV === 'production' 
      ? ['https://dashboard.mik-review.ai'] 
      : true,
    credentials: true,
  });

  // Rate limiting (global)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: undefined, // TODO: Configure Redis for distributed rate limiting
  });

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    };
  });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'Mik Review AI API',
      version: '1.0.0',
      docs: '/docs',
      health: '/health',
    };
  });

  // Register route modules
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(apiKeyRoutes, { prefix: '/api-keys' });
  await app.register(reviewRoutes, { prefix: '/v1/reviews' });
  await app.register(analyticsRoutes, { prefix: '/analytics' });
  await app.register(customRulesRoutes, { prefix: '/custom-rules' });

  return app;
}
