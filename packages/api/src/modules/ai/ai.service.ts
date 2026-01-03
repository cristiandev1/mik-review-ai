import { DeepSeekProvider } from './providers/deepseek.provider.js';
import type { AIProvider, AIReviewParams, AIReviewResult } from './ai.interface.js';

export class AIService {
  private provider: AIProvider;

  constructor(apiKey?: string) {
    // Only DeepSeek is supported
    this.provider = new DeepSeekProvider(apiKey);
  }

  async generateReview(params: AIReviewParams): Promise<AIReviewResult> {
    return this.provider.generateReview(params);
  }
}
