// TODO: Remover - Study Aid Module
import { FastifyInstance } from 'fastify';
import { StudyAidController } from './study-aid.controller.js';

export async function studyAidRoutes(app: FastifyInstance) {
  const controller = new StudyAidController();

  app.post(
    '/chat',
    controller.chat.bind(controller)
  );
}
