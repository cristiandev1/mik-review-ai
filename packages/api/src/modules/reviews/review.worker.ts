import type { Job } from 'bullmq';
import { db } from '../../config/database.js';
import { reviews } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { GitHubService } from '../github/github.service.js';
import { AIService } from '../ai/ai.service.js';
import { logger } from '../../shared/utils/logger.js';
import type { ReviewJobData, ReviewJobResult } from './review.queue.js';

export async function processReviewJob(
  job: Job<ReviewJobData, ReviewJobResult>
): Promise<ReviewJobResult> {
  const { reviewId, repository, pullRequest, githubToken } = job.data;

  logger.info({ reviewId, repository, pullRequest }, 'Processing review job...');

  try {
    // Update progress: Starting
    await job.updateProgress(10);

    // Parse repository (owner/repo)
    const [owner, repo] = repository.split('/');

    // Initialize services
    const githubService = new GitHubService(githubToken);
    const aiService = new AIService('deepseek');

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

    // Step 3: Load review rules (default for now, can be customized per user later)
    const defaultRules = `
# Code Review Guidelines

You are acting as a Senior Software Engineer. Review the code based on the following guidelines.
Focus on code quality, performance, security, and maintainability.

## Focus Areas
- **Security**: No hardcoded secrets, proper input validation
- **Performance**: Efficient algorithms, no N+1 queries
- **Code Quality**: DRY principle, SOLID principles, proper error handling
- **Best Practices**: Follow language-specific conventions
    `.trim();

    // Step 4: Generate AI review
    logger.info({ reviewId }, 'Generating AI review...');
    await job.updateProgress(60);

    const result = await aiService.generateReview({
      diff: prData.diff,
      fileContents,
      rules: defaultRules,
    });

    // Step 5: Save results to database
    logger.info({ reviewId }, 'Saving review results...');
    await job.updateProgress(90);

    await db
      .update(reviews)
      .set({
        status: 'completed',
        summary: result.summary,
        comments: result.comments,
        aiModel: 'deepseek-chat',
        completedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId));

    await job.updateProgress(100);

    logger.info({ reviewId }, 'Review job completed successfully');

    return result;
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
