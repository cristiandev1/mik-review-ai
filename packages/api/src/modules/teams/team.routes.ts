import { FastifyInstance } from 'fastify';
import { teamController } from './team.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function teamRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.post('/', teamController.create.bind(teamController));
  app.get('/', teamController.list.bind(teamController));
  app.get('/:id', teamController.get.bind(teamController));
  app.put('/:id', teamController.update.bind(teamController));
  app.delete('/:id', teamController.delete.bind(teamController));

  // Members
  app.get('/:id/members', teamController.listMembers.bind(teamController));
  app.post('/:id/members', teamController.addMember.bind(teamController));
  app.delete('/:id/members/:userId', teamController.removeMember.bind(teamController));
  app.put('/:id/members/:userId/role', teamController.updateMemberRole.bind(teamController));
}
