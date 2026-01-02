import { db } from '../../config/database.js';
import { customRules } from '../../database/schema.js';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { logger } from '../../shared/utils/logger.js';
import type {
  CreateCustomRuleInput,
  UpdateCustomRuleInput,
  ListCustomRulesInput,
} from './custom-rules.schemas.js';

export class CustomRulesService {
  /**
   * Create a new custom rule
   */
  async createRule(userId: string, input: CreateCustomRuleInput) {
    const ruleId = nanoid();

    // If teamId is provided, validate that user is part of the team
    if (input.teamId) {
      // TODO: Validate team membership when teams module is implemented
      logger.info({ userId, teamId: input.teamId }, 'Creating team custom rule');
    }

    const [rule] = await db
      .insert(customRules)
      .values({
        id: ruleId,
        userId: input.teamId ? null : userId, // If team rule, userId is null
        teamId: input.teamId || null,
        name: input.name,
        content: input.content,
        repository: input.repository || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info({ ruleId, userId, repository: input.repository }, 'Custom rule created');

    return rule;
  }

  /**
   * Get a custom rule by ID
   */
  async getRule(userId: string, ruleId: string) {
    const [rule] = await db
      .select()
      .from(customRules)
      .where(
        and(
          eq(customRules.id, ruleId),
          eq(customRules.userId, userId) // Only return rules owned by user
        )
      )
      .limit(1);

    if (!rule) {
      throw new Error('Custom rule not found');
    }

    return rule;
  }

  /**
   * List custom rules for a user
   */
  async listRules(userId: string, input: ListCustomRulesInput) {
    const conditions = [eq(customRules.userId, userId)];

    // Filter by repository if provided
    if (input.repository) {
      conditions.push(eq(customRules.repository, input.repository));
    }

    // Filter by active status if provided
    if (input.isActive !== undefined) {
      conditions.push(eq(customRules.isActive, input.isActive));
    }

    const rules = await db
      .select()
      .from(customRules)
      .where(and(...conditions))
      .orderBy(desc(customRules.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return rules;
  }

  /**
   * Update a custom rule
   */
  async updateRule(userId: string, ruleId: string, input: UpdateCustomRuleInput) {
    // First verify ownership
    await this.getRule(userId, ruleId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.repository !== undefined) updateData.repository = input.repository;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [updatedRule] = await db
      .update(customRules)
      .set(updateData)
      .where(eq(customRules.id, ruleId))
      .returning();

    logger.info({ ruleId, userId }, 'Custom rule updated');

    return updatedRule;
  }

  /**
   * Delete a custom rule
   */
  async deleteRule(userId: string, ruleId: string) {
    // First verify ownership
    await this.getRule(userId, ruleId);

    await db.delete(customRules).where(eq(customRules.id, ruleId));

    logger.info({ ruleId, userId }, 'Custom rule deleted');
  }

  /**
   * Get the most specific custom rule for a repository
   * Priority: repository-specific > global
   */
  async getRuleForRepository(userId: string, repository: string): Promise<string | null> {
    // First, try to find a repository-specific rule
    const [repoRule] = await db
      .select()
      .from(customRules)
      .where(
        and(
          eq(customRules.userId, userId),
          eq(customRules.repository, repository),
          eq(customRules.isActive, true)
        )
      )
      .orderBy(desc(customRules.createdAt))
      .limit(1);

    if (repoRule) {
      logger.info({ userId, repository, ruleId: repoRule.id }, 'Using repository-specific custom rule');
      return repoRule.content;
    }

    // If no repo-specific rule, try to find a global rule (repository = null)
    const [globalRule] = await db
      .select()
      .from(customRules)
      .where(
        and(
          eq(customRules.userId, userId),
          isNull(customRules.repository),
          eq(customRules.isActive, true)
        )
      )
      .orderBy(desc(customRules.createdAt))
      .limit(1);

    if (globalRule) {
      logger.info({ userId, repository, ruleId: globalRule.id }, 'Using global custom rule');
      return globalRule.content;
    }

    logger.info({ userId, repository }, 'No custom rules found, will use default');
    return null;
  }
}
