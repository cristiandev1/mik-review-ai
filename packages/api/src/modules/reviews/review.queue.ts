import { Queue, Worker } from 'bullmq';
import { queueRedis } from '../../config/redis.js';
import { logger } from '../../shared/utils/logger.js';

export interface ReviewJobData {
  reviewId: string;
  userId: string;
  repository: string;
  pullRequest: number;
  githubToken?: string;
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

// Import worker processor (separate file for cleaner code)
import { processReviewJob } from './review.worker.js';

// Process review jobs
const reviewWorker = new Worker<ReviewJobData, ReviewJobResult>(
  'review-processing',
  processReviewJob,
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
