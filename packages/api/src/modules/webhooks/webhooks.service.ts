import crypto from 'crypto';
import { db } from '../../config/database.js';
import { repositories, users } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { ReviewService } from '../reviews/review.service.js';
import { logger } from '../../shared/utils/logger.js';

export class WebhooksService {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async handleGitHubEvent(event: string, payload: any) {
    if (event === 'pull_request') {
      const action = payload.action;
      if (action === 'opened' || action === 'synchronize') {
        await this.handlePullRequest(payload);
      }
    }
  }

  private async handlePullRequest(payload: any) {
    const { repository, pull_request } = payload;
    const fullName = repository.full_name;
    const prNumber = pull_request.number;
    const githubRepoId = repository.id;

    logger.info({ fullName, prNumber, action: payload.action }, 'Processing PR webhook');

    // Find the repository in our DB
    const repos = await db
      .select({
        id: repositories.id,
        userId: repositories.userId,
        isEnabled: repositories.isEnabled,
      })
      .from(repositories)
      .where(eq(repositories.githubRepoId, githubRepoId));

    if (repos.length === 0) {
      logger.info({ githubRepoId }, 'Repository not found in DB, skipping');
      return;
    }

    // Find the first enabled repository mapping
    const repo = repos.find(r => r.isEnabled);

    if (!repo) {
       logger.info({ githubRepoId }, 'Repository found but not enabled, skipping');
       return;
    }

    // Get the user to get the token
    const [user] = await db
      .select({ githubAccessToken: users.githubAccessToken })
      .from(users)
      .where(eq(users.id, repo.userId))
      .limit(1);

    if (!user || !user.githubAccessToken) {
      logger.warn({ userId: repo.userId }, 'User associated with repo has no GitHub token');
      return;
    }

    // Trigger Review
    try {
      await this.reviewService.createReview(repo.userId, {
        repository: fullName,
        pullRequest: prNumber,
        githubToken: user.githubAccessToken
      });
      logger.info({ reviewFor: fullName, pr: prNumber }, 'Review triggered via webhook');
    } catch (error) {
       logger.error({ err: error, fullName, prNumber }, 'Failed to trigger review from webhook');
    }
  }
}

export const webhooksService = new WebhooksService();
