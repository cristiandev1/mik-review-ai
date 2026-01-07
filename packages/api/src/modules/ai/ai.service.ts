// TODO: Remover - Study Aid Module
import { DeepSeekProvider } from './providers/deepseek.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import type { AIProvider, AIReviewParams, AIReviewResult, AIChatParams, AIChatResult } from './ai.interface.js';

export class AIService {
  private reviewProvider: AIProvider;
  private chatProvider: AIProvider;

  constructor(apiKey?: string) {
    // DeepSeek for Code Reviews
    this.reviewProvider = new DeepSeekProvider(apiKey);
    // OpenAI for Study Aid Chat
    this.chatProvider = new OpenAIProvider();
  }

  async generateReview(params: AIReviewParams): Promise<AIReviewResult> {
    return this.reviewProvider.generateReview(params);
  }

  // TODO: Remover - Study Aid Service Wrapper
  async generateChat(params: AIChatParams): Promise<AIChatResult> {
    return this.chatProvider.generateChat(params);
  }
}
