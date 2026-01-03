import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

/**
 * Creates a test instance of the Fastify app
 */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();

  // Don't listen on a port during tests
  await app.ready();

  return app;
}

/**
 * Closes the test app
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
}
