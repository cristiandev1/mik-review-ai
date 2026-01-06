import { db } from '../../config/database.js';
import { repositories, repositorySeats, subscriptions } from '../../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';

export class SeatManagementService {
  /**
   * Assign a seat in auto-add mode
   */
  async assignSeat(repositoryId: string, developerGithubUsername: string) {
    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      await db.insert(repositorySeats).values({
        id: crypto.randomUUID().toString(),
        repositoryId,
        developerGithubUsername,
        billingMonth: currentMonth,
        isActive: true,
      });

      logger.info(`Seat assigned`, { repositoryId, developerGithubUsername, currentMonth });
    } catch (error) {
      logger.error('Error assigning seat', { error, repositoryId, developerGithubUsername });
      throw new AppError('Failed to assign seat', 500);
    }
  }

  /**
   * Remove a seat (mark as inactive)
   */
  async removeSeat(repositoryId: string, developerGithubUsername: string) {
    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      await db
        .update(repositorySeats)
        .set({ isActive: false })
        .where(
          and(
            eq(repositorySeats.repositoryId, repositoryId),
            eq(repositorySeats.developerGithubUsername, developerGithubUsername),
            eq(repositorySeats.billingMonth, currentMonth)
          )
        );

      logger.info(`Seat removed`, { repositoryId, developerGithubUsername, currentMonth });
    } catch (error) {
      logger.error('Error removing seat', { error, repositoryId, developerGithubUsername });
      throw new AppError('Failed to remove seat', 500);
    }
  }

  /**
   * Add developer to whitelist
   */
  async addToWhitelist(repositoryId: string, developerGithubUsername: string) {
    try {
      const repo = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);

      if (!repo.length) {
        throw new AppError('Repository not found', 404);
      }

      const whitelist = (repo[0].whitelistedDevelopers || []) as string[];

      if (whitelist.includes(developerGithubUsername)) {
        throw new AppError('Developer already in whitelist', 400);
      }

      whitelist.push(developerGithubUsername);

      await db
        .update(repositories)
        .set({ whitelistedDevelopers: whitelist })
        .where(eq(repositories.id, repositoryId));

      logger.info(`Developer added to whitelist`, { repositoryId, developerGithubUsername });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding to whitelist', { error, repositoryId, developerGithubUsername });
      throw new AppError('Failed to add developer to whitelist', 500);
    }
  }

  /**
   * Remove developer from whitelist
   */
  async removeFromWhitelist(repositoryId: string, developerGithubUsername: string) {
    try {
      const repo = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);

      if (!repo.length) {
        throw new AppError('Repository not found', 404);
      }

      const whitelist = ((repo[0].whitelistedDevelopers || []) as string[]).filter(
        (dev) => dev !== developerGithubUsername
      );

      await db
        .update(repositories)
        .set({ whitelistedDevelopers: whitelist })
        .where(eq(repositories.id, repositoryId));

      logger.info(`Developer removed from whitelist`, { repositoryId, developerGithubUsername });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error removing from whitelist', { error, repositoryId, developerGithubUsername });
      throw new AppError('Failed to remove developer from whitelist', 500);
    }
  }

  /**
   * Get available seats for a repository
   */
  async getAvailableSeats(repositoryId: string): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      const repo = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);

      if (!repo.length) {
        throw new AppError('Repository not found', 404);
      }

      const usedSeats = await db
        .select()
        .from(repositorySeats)
        .where(
          and(
            eq(repositorySeats.repositoryId, repositoryId),
            eq(repositorySeats.billingMonth, currentMonth),
            eq(repositorySeats.isActive, true)
          )
        );

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, repo[0].userId))
        .limit(1);

      const totalSeats = subscription.length > 0 ? subscription[0].seatsPurchased || 1 : 1;
      const availableSeats = Math.max(0, totalSeats - usedSeats.length);

      return availableSeats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting available seats', { error, repositoryId });
      throw new AppError('Failed to get available seats', 500);
    }
  }

  /**
   * Reset monthly seats (called at billing cycle)
   */
  async resetMonthlySeats(repositoryId: string) {
    const previousMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    try {
      await db
        .update(repositorySeats)
        .set({ isActive: false })
        .where(
          and(
            eq(repositorySeats.repositoryId, repositoryId),
            eq(repositorySeats.billingMonth, previousMonth)
          )
        );

      logger.info(`Monthly seats reset`, { repositoryId, month: previousMonth });
    } catch (error) {
      logger.error('Error resetting monthly seats', { error, repositoryId });
      throw new AppError('Failed to reset monthly seats', 500);
    }
  }

  /**
   * Get seat information for a repository
   */
  async getRepositorySeatInfo(repositoryId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      const repo = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);

      if (!repo.length) {
        throw new AppError('Repository not found', 404);
      }

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, repo[0].userId))
        .limit(1);

      const activeSeats = await db
        .select()
        .from(repositorySeats)
        .where(
          and(
            eq(repositorySeats.repositoryId, repositoryId),
            eq(repositorySeats.billingMonth, currentMonth),
            eq(repositorySeats.isActive, true)
          )
        );

      const totalSeats = subscription.length > 0 ? subscription[0].seatsPurchased || 1 : 1;
      const availableSeats = Math.max(0, totalSeats - activeSeats.length);

      return {
        repositoryId,
        seatMode: repo[0].seatMode || 'auto-add',
        totalSeats,
        usedSeats: activeSeats.length,
        availableSeats,
        developers: activeSeats.map((seat) => seat.developerGithubUsername),
        whitelist: repo[0].whitelistedDevelopers || [],
        currentMonth,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting repository seat info', { error, repositoryId });
      throw new AppError('Failed to get repository seat info', 500);
    }
  }
}

export const seatManagementService = new SeatManagementService();
