import { FastifyRequest, FastifyReply } from 'fastify';
import { teamService } from './team.service.js';
import { createTeamSchema, updateTeamSchema, addMemberSchema, updateMemberRoleSchema } from './team.schemas.js';

export class TeamController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createTeamSchema.parse(request.body);
    const userId = (request as any).userId;
    
    const team = await teamService.createTeam(userId, input);
    return reply.status(201).send(team);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const teams = await teamService.listUserTeams(userId);
    return reply.send(teams);
  }

  async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).userId;
    const { id } = request.params;
    
    const team = await teamService.getTeamById(id, userId);
    return reply.send(team);
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const input = updateTeamSchema.parse(request.body);
    const userId = (request as any).userId;
    const { id } = request.params;

    const team = await teamService.updateTeam(id, userId, input);
    return reply.send(team);
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).userId;
    const { id } = request.params;

    await teamService.deleteTeam(id, userId);
    return reply.status(204).send();
  }

  // Members
  async listMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).userId;
    const { id } = request.params;

    const members = await teamService.listMembers(id, userId);
    return reply.send(members);
  }

  async addMember(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const input = addMemberSchema.parse(request.body);
    const userId = (request as any).userId;
    const { id } = request.params;

    const result = await teamService.addMember(id, userId, input);
    return reply.status(201).send(result);
  }

  async removeMember(request: FastifyRequest<{ Params: { id: string, userId: string } }>, reply: FastifyReply) {
    const requesterId = (request as any).userId;
    const { id, userId: memberIdToRemove } = request.params;

    await teamService.removeMember(id, requesterId, memberIdToRemove);
    return reply.status(204).send();
  }

  async updateMemberRole(request: FastifyRequest<{ Params: { id: string, userId: string } }>, reply: FastifyReply) {
    const input = updateMemberRoleSchema.parse(request.body);
    const requesterId = (request as any).userId;
    const { id, userId: memberIdToUpdate } = request.params;

    await teamService.updateMemberRole(id, requesterId, memberIdToUpdate, input);
    return reply.status(204).send();
  }
}

export const teamController = new TeamController();
