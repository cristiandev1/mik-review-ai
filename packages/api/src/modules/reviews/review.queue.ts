import { Queue, Worker, Job } from 'bullmq';
import { queueRedis } from '../../config/redis.js';
import { logger } from '../../shared/utils/logger.js';

export interface ReviewJobData {
  userId: string;
  repository: string;
  pullRequest: number;
  diff: string;
  fileContents: Record<string, string>;
  rules: string;
}

export interface ReviewJobResult {
  summary: string;
  comments: Array<{
    file: string;
    lineNumber: string;
    comment: string;
  }>;
}

// Create the review queue
export const reviewQueue = new Queue<ReviewJobData, ReviewJobResult>('review-processing', {
  connection: queueRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Process review jobs
const reviewWorker = new Worker<ReviewJobData, ReviewJobResult>(
  'review-processing',
  async (job: Job<ReviewJobData, ReviewJobResult>) => {
    logger.info({ jobId: job.id, userId: job.data.userId }, 'Processing review job...');

    try {
      // Update progress
      await job.updateProgress(10);

      // TODO: Implement actual review processing logic
      // 1. Call AI Service
      // 2. Parse results
      // 3. Save to database

      await job.updateProgress(50);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await job.updateProgress(90);

      const result: ReviewJobResult = {
        summary: 'Review completed successfully (placeholder)',
        comments: [],
      };

      await job.updateProgress(100);

      logger.info({ jobId: job.id }, 'Review job completed successfully');

      return result;
    } catch (error) {
      logger.error({ err: error, jobId: job.id }, 'Review job failed');
      throw error;
    }
  },
  {
    connection: queueRedis,
    concurrency: 5, // Process 5 reviews simultaneously
  }
);

// Worker event handlers
reviewWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

reviewWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed');
});

reviewWorker.on('error', (err) => {
  logger.error({ err }, 'Worker error');
});

logger.info('✅ Review worker started');

export { reviewWorker };
