import type { FastifyRequest, FastifyReply } from 'fastify';
import { CustomRulesService } from './custom-rules.service.js';
import {
  createCustomRuleSchema,
  updateCustomRuleSchema,
  listCustomRulesSchema,
  type CreateCustomRuleInput,
  type UpdateCustomRuleInput,
} from './custom-rules.schemas.js';

const customRulesService = new CustomRulesService();

export class CustomRulesController {
  /**
   * Create a new custom rule
   * POST /custom-rules
   */
  async create(
    request: FastifyRequest<{ Body: CreateCustomRuleInput }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.id;
      const input = createCustomRuleSchema.parse(request.body);

      const rule = await customRulesService.createRule(userId, input);

      return reply.status(201).send({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get a custom rule by ID
   * GET /custom-rules/:id
   */
  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.id;
      const ruleId = request.params.id;

      const rule = await customRulesService.getRule(userId, ruleId);

      return reply.status(200).send({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Custom rule not found' ? 404 : 400;
      return reply.status(statusCode).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * List custom rules
   * GET /custom-rules
   */
  async list(
    request: FastifyRequest<{
      Querystring: {
        repository?: string;
        isActive?: string;
        limit?: string;
        offset?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.id;

      // Parse query params
      const input = listCustomRulesSchema.parse({
        repository: request.query.repository,
        isActive: request.query.isActive === 'true' ? true : request.query.isActive === 'false' ? false : undefined,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
        offset: request.query.offset ? parseInt(request.query.offset, 10) : undefined,
      });

      const rules = await customRulesService.listRules(userId, input);

      return reply.status(200).send({
        success: true,
        data: rules,
        meta: {
          limit: input.limit,
          offset: input.offset,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Update a custom rule
   * PUT /custom-rules/:id
   */
  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateCustomRuleInput }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.id;
      const ruleId = request.params.id;
      const input = updateCustomRuleSchema.parse(request.body);

      const updatedRule = await customRulesService.updateRule(userId, ruleId, input);

      return reply.status(200).send({
        success: true,
        data: updatedRule,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Custom rule not found' ? 404 : 400;
      return reply.status(statusCode).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Delete a custom rule
   * DELETE /custom-rules/:id
   */
  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.id;
      const ruleId = request.params.id;

      await customRulesService.deleteRule(userId, ruleId);

      return reply.status(200).send({
        success: true,
        message: 'Custom rule deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Custom rule not found' ? 404 : 400;
      return reply.status(statusCode).send({
        success: false,
        error: error.message,
      });
    }
  }
}
