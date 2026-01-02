import type { FastifyRequest, FastifyReply } from 'fastify';
import { GitHubOAuthService } from './github-oauth.service.js';
import { z } from 'zod';

const githubOAuthService = new GitHubOAuthService();

const callbackSchema = z.object({
  code: z.string(),
});

export class GitHubOAuthController {
  async callback(request: FastifyRequest, reply: FastifyReply) {
    const { code } = callbackSchema.parse(request.body);
    const result = await githubOAuthService.loginWithCode(code);

    return reply.code(200).send({
      success: true,
      data: result,
    });
  }
}
