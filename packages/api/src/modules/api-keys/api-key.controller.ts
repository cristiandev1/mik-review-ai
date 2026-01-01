import type { FastifyRequest, FastifyReply } from 'fastify';
import { ApiKeyService } from './api-key.service.js';
import { createApiKeySchema } from './api-key.schemas.js';

const apiKeyService = new ApiKeyService();

export class ApiKeyController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const input = createApiKeySchema.parse(request.body);
      const apiKey = await apiKeyService.create(userId, input);

      return reply.code(201).send({
        success: true,
        data: apiKey,
        message: 'API key created successfully. Save it securely, it will not be shown again.',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to create API key',
      });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const keys = await apiKeyService.list(userId);

      return reply.code(200).send({
        success: true,
        data: keys,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to list API keys',
      });
    }
  }

  async revoke(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).userId;
      const { id } = request.params as { id: string };

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      await apiKeyService.revoke(userId, id);

      return reply.code(200).send({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(404).send({
        success: false,
        error: error.message || 'Failed to revoke API key',
      });
    }
  }
}
