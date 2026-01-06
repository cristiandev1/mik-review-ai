import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { redis } from './config/redis.js';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { apiKeyRoutes } from './modules/api-keys/api-key.routes.js';
import { reviewRoutes } from './modules/reviews/review.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { customRulesRoutes } from './modules/custom-rules/custom-rules.routes.js';
import { verificationRoutes } from './modules/verification/verification.routes.js';
import { rateLimitRoutes } from './modules/rate-limit/rate-limit.routes.js';
import { repositoryRoutes } from './modules/repositories/repository.routes.js';
import { teamRoutes } from './modules/teams/team.routes.js';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { globalErrorHandler } from './shared/errors/error-handler.js';

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
    origin: [
      'https://mik-review-ai-dashboard.vercel.app',
      'https://dashboard.mik-review.ai',
      /\.vercel\.app$/ // Permite subdomínios da vercel para deploy de preview
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  });

  // Rate limiting (global)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis,
    keyGenerator: (request) => {
      // Use user ID if authenticated, otherwise fallback to IP
      const user = (request as any).user;
      return user ? `rl:user:${user.id}` : request.ip;
    },
    errorResponseBuilder: (_request, context) => {
      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${context.after}.`,
        code: 'TOO_MANY_REQUESTS',
        expiresAt: new Date(Date.now() + context.ttl).toISOString(),
      };
    },
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
  await app.register(verificationRoutes, { prefix: '/auth' });
  await app.register(apiKeyRoutes, { prefix: '/api-keys' });
  await app.register(reviewRoutes, { prefix: '/v1/reviews' });
  await app.register(analyticsRoutes, { prefix: '/analytics' });
  await app.register(customRulesRoutes, { prefix: '/custom-rules' });
  await app.register(rateLimitRoutes, { prefix: '/rate-limit' });
  await app.register(teamRoutes, { prefix: '/teams' });
  await app.register(repositoryRoutes);
  await app.register(webhooksRoutes);
  await app.register(billingRoutes);

  // Global Error Handler
  app.setErrorHandler(globalErrorHandler);

  return app;
}
