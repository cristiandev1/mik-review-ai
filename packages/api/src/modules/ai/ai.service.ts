import { DeepSeekProvider } from './providers/deepseek.provider.js';
import type { AIProvider, AIReviewParams, AIReviewResult } from './ai.interface.js';

export class AIService {
  private provider: AIProvider;

  constructor(providerType: 'deepseek' | 'openai' | 'claude' = 'deepseek', apiKey?: string) {
    switch (providerType) {
      case 'deepseek':
        this.provider = new DeepSeekProvider(apiKey);
        break;
      // TODO: Add OpenAI and Claude providers
      default:
        this.provider = new DeepSeekProvider(apiKey);
    }
  }

  async generateReview(params: AIReviewParams): Promise<AIReviewResult> {
    return this.provider.generateReview(params);
  }
}
