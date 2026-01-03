import { db } from '../../config/database.js';
import { teams, teamMembers, users } from '../../database/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { CreateTeamInput, UpdateTeamInput, AddMemberInput, UpdateMemberRoleInput } from './team.schemas.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';

export class TeamService {
  async createTeam(userId: string, input: CreateTeamInput) {
    const teamId = nanoid();

    try {
      // Create team and add owner in a transaction-like manner
      // Drizzle doesn't have easy nested inserts, so we do it sequentially.
      // Ideally should be a transaction.
      
      const [team] = await db
        .insert(teams)
        .values({
          id: teamId,
          name: input.name,
          ownerId: userId,
          plan: 'free',
        })
        .returning();

      // Add creator as owner in team_members
      await db.insert(teamMembers).values({
        id: nanoid(),
        teamId: team.id,
        userId: userId,
        role: 'owner',
      });

      logger.info({ teamId: team.id, userId }, 'Team created');
      return team;
    } catch (error) {
      logger.error(error, 'Failed to create team');
      throw new Error('Failed to create team');
    }
  }

  async listUserTeams(userId: string) {
    // Join teams and teamMembers to find teams where user is a member
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        role: teamMembers.role,
        ownerId: teams.ownerId,
        plan: teams.plan,
        createdAt: teams.createdAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));

    return userTeams;
  }

  async getTeamById(teamId: string, userId: string) {
    // Check if user is a member
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);

    if (!membership) {
      throw new NotFoundError('Team not found or you are not a member');
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw new NotFoundError('Team not found');

    return { ...team, currentUserRole: membership.role };
  }

  async updateTeam(teamId: string, userId: string, input: UpdateTeamInput) {
    await this.ensureAdminOrOwner(teamId, userId);

    const [updated] = await db
      .update(teams)
      .set({
        name: input.name,
      })
      .where(eq(teams.id, teamId))
      .returning();

    return updated;
  }

  async deleteTeam(teamId: string, userId: string) {
    await this.ensureOwner(teamId, userId);

    await db.delete(teams).where(eq(teams.id, teamId));
    logger.info({ teamId, userId }, 'Team deleted');
  }

  // --- Members Management ---

  async listMembers(teamId: string, userId: string) {
    await this.ensureMember(teamId, userId);

    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    return members;
  }

  async addMember(teamId: string, requesterId: string, input: AddMemberInput) {
    await this.ensureAdminOrOwner(teamId, requesterId);

    // Find user by email
    const [userToAdd] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!userToAdd) {
      throw new NotFoundError('User with this email not found');
    }

    // Check if already member
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userToAdd.id)))
      .limit(1);

    if (existingMember) {
      throw new ConflictError('User is already a member of this team');
    }

    // Add member
    await db.insert(teamMembers).values({
      id: nanoid(),
      teamId,
      userId: userToAdd.id,
      role: input.role,
    });

    logger.info({ teamId, addedUserId: userToAdd.id }, 'Member added to team');
    return { success: true };
  }

  async removeMember(teamId: string, requesterId: string, memberIdToRemove: string) {
    const requesterRole = await this.getMemberRole(teamId, requesterId);

    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      // Allow user to leave team
      if (requesterId !== memberIdToRemove) {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    // Determine role of member to remove
    const memberRole = await this.getMemberRole(teamId, memberIdToRemove);
    if (!memberRole) throw new NotFoundError('Member not found');

    // Admin cannot remove Owner. Admin cannot remove other Admin? (Simplified: Admin can remove members, Owner can remove anyone)
    if (requesterRole === 'admin' && (memberRole === 'owner' || memberRole === 'admin')) {
        if (requesterId !== memberIdToRemove) { // Admin can leave
             throw new ForbiddenError('Admins cannot remove other admins or owners');
        }
    }
    
    // Cannot remove the last owner
    if (memberRole === 'owner') {
        const ownersCount = await this.countOwners(teamId);
        if (ownersCount <= 1) {
             throw new BadRequestError('Cannot remove the last owner of the team');
        }
    }

    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, memberIdToRemove)));

    logger.info({ teamId, removedUserId: memberIdToRemove }, 'Member removed from team');
  }

  async updateMemberRole(teamId: string, requesterId: string, memberIdToUpdate: string, input: UpdateMemberRoleInput) {
    await this.ensureOwner(teamId, requesterId); // Only owner can change roles for now

    if (input.role === 'owner') {
        // If promoting to owner, it's fine.
    }

    await db
      .update(teamMembers)
      .set({ role: input.role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, memberIdToUpdate)));
    
    logger.info({ teamId, updatedUserId: memberIdToUpdate, newRole: input.role }, 'Member role updated');
  }

  // --- Helpers ---

  private async getMemberRole(teamId: string, userId: string): Promise<string | null> {
    const [member] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);
    return member?.role || null;
  }

  private async ensureMember(teamId: string, userId: string) {
    const role = await this.getMemberRole(teamId, userId);
    if (!role) throw new ForbiddenError('You are not a member of this team');
  }

  private async ensureAdminOrOwner(teamId: string, userId: string) {
    const role = await this.getMemberRole(teamId, userId);
    if (role !== 'admin' && role !== 'owner') {
      throw new ForbiddenError('Requires Admin or Owner permissions');
    }
  }

  private async ensureOwner(teamId: string, userId: string) {
    const role = await this.getMemberRole(teamId, userId);
    if (role !== 'owner') {
      throw new ForbiddenError('Requires Owner permissions');
    }
  }

  private async countOwners(teamId: string): Promise<number> {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, 'owner')));
      return Number(result[0]?.count || 0);
  }
}

export const teamService = new TeamService();
