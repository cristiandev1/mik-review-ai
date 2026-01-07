// TODO: Remover - Study Aid Module
import { FastifyReply, FastifyRequest } from 'fastify';
import { StudyAidService } from './study-aid.service.js';
import { studyAidChatSchema } from './study-aid.schemas.js';

export class StudyAidController {
  private service: StudyAidService;

  constructor() {
    this.service = new StudyAidService();
  }

  async chat(request: FastifyRequest, reply: FastifyReply) {
    const body = studyAidChatSchema.parse(request.body);
    const result = await this.service.chat(body);
    return reply.send(result);
  }
}
