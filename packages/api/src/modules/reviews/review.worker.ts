import type { Job } from 'bullmq';
import { db } from '../../config/database.js';
import { reviews } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { GitHubService } from '../github/github.service.js';
import { AIService } from '../ai/ai.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { CustomRulesService } from '../custom-rules/custom-rules.service.js';
import { logger } from '../../shared/utils/logger.js';
import type { ReviewJobData, ReviewJobResult } from './review.queue.js';

export async function processReviewJob(
  job: Job<ReviewJobData, ReviewJobResult>
): Promise<ReviewJobResult> {
  const startTime = Date.now();
  const { reviewId, userId, repository, pullRequest, githubToken } = job.data;

  logger.info({ reviewId, repository, pullRequest }, 'Processing review job...');

  try {
    // Update progress: Starting
    await job.updateProgress(10);

    // Parse repository (owner/repo)
    const [owner, repo] = repository.split('/');

    // Initialize services
    const githubService = new GitHubService(githubToken);
    const aiService = new AIService();
    const analyticsService = new AnalyticsService();
    const customRulesService = new CustomRulesService();

    // Step 1: Fetch PR data from GitHub
    logger.info({ reviewId }, 'Fetching PR data from GitHub...');
    await job.updateProgress(20);

    const prData = await githubService.getPRData(owner, repo, pullRequest);

    // Step 2: Get full file contents
    logger.info({ reviewId }, 'Fetching file contents...');
    await job.updateProgress(40);

    const filePaths = prData.files.map((f) => f.filename);
    const fileContents = await githubService.getMultipleFileContents(
      owner,
      repo,
      filePaths,
      prData.pr.head.sha
    );

    // Step 3: Load review rules (try custom rules first, fallback to default)
    logger.info({ reviewId, userId, repository }, 'Loading review rules...');

    let reviewRules: string;
    const customRule = await customRulesService.getRuleForRepository(userId, repository);

    if (customRule) {
      reviewRules = customRule;
      logger.info({ reviewId, repository }, 'Using custom review rules');
    } else {
      // Fallback to default rules
      reviewRules = `
# Code Review Guidelines

You are acting as a Senior Software Engineer. Review the code based on the following guidelines.
Focus on code quality, performance, security, and maintainability.

## Focus Areas
- **Security**: No hardcoded secrets, proper input validation
- **Performance**: Efficient algorithms, no N+1 queries
- **Code Quality**: DRY principle, SOLID principles, proper error handling
- **Best Practices**: Follow language-specific conventions
      `.trim();
      logger.info({ reviewId, repository }, 'Using default review rules');
    }

    // Step 4: Generate AI review
    logger.info({ reviewId }, 'Generating AI review...');
    await job.updateProgress(60);

    const result = await aiService.generateReview({
      diff: prData.diff,
      fileContents,
      rules: reviewRules,
    });

    const processingTime = Date.now() - startTime;
    const tokensUsed = result.tokensUsed || 0;

    // Step 5: Save results to database
    logger.info({ reviewId }, 'Saving review results...');
    await job.updateProgress(80);

    await db
      .update(reviews)
      .set({
        status: 'completed',
        summary: result.summary,
        comments: result.comments,
        aiModel: 'deepseek-chat',
        tokensUsed,
        processingTime,
        completedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId));

    // Step 6: Post review comments to GitHub PR
    logger.info({ reviewId }, 'Posting review comments to GitHub...');
    await job.updateProgress(90);

    try {
      await githubService.postReviewComments(
        owner,
        repo,
        pullRequest,
        result.summary,
        result.comments
      );
      logger.info({ reviewId }, 'Successfully posted review to GitHub PR');
    } catch (error: any) {
      // Log error but don't fail the entire job
      // The review is already saved in our database
      logger.error(
        { err: error, reviewId },
        'Failed to post review to GitHub, but review was saved successfully'
      );

      // Optionally, update the review to indicate posting failed
      await db
        .update(reviews)
        .set({
          error: `Review completed but failed to post to GitHub: ${error.message}`,
        })
        .where(eq(reviews.id, reviewId));
    }

    // Step 7: Track analytics
    try {
      await analyticsService.trackReview(
        userId,
        repository,
        tokensUsed,
        processingTime
      );
      logger.info({ reviewId, userId }, 'Analytics tracked successfully');
    } catch (analyticsError: any) {
      // Log error but don't fail the entire job
      logger.error(
        { err: analyticsError, reviewId, userId },
        'Failed to track analytics, but review was completed successfully'
      );
    }

    await job.updateProgress(100);

    logger.info({ reviewId }, 'Review job completed successfully');

    return {
      ...result,
      processingTime,
      tokensUsed
    };
  } catch (error: any) {
    logger.error({ err: error, reviewId }, 'Review job failed');

    // Save error to database
    await db
      .update(reviews)
      .set({
        status: 'failed',
        error: error.message,
      })
      .where(eq(reviews.id, reviewId));

    throw error;
  }
}
