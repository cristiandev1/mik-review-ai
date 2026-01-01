import type { FastifyRequest, FastifyReply } from 'fastify';
import { ApiKeyService } from '../modules/api-keys/api-key.service.js';

const apiKeyService = new ApiKeyService();

export async function apiKeyMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      return reply.code(401).send({
        success: false,
        error: 'Missing API key. Provide it in the X-API-Key header.',
      });
    }

    const keyData = await apiKeyService.validateApiKey(apiKey);

    // Attach user data to request
    (request as any).user = {
      id: keyData.userId,
      email: keyData.userEmail,
      name: keyData.userName,
      plan: keyData.userPlan,
    };
    (request as any).keyId = keyData.keyId;
  } catch (error: any) {
    return reply.code(401).send({
      success: false,
      error: 'Invalid or inactive API key',
    });
  }
}
