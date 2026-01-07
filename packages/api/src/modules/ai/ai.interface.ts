export interface AIReviewParams {
  diff: string;
  fileContents: Record<string, string>;
  rules: string;
  model?: string;
}

export interface AIReviewResult {
  summary: string;
  comments: Array<{
    file: string;
    lineNumber: string;
    comment: string;
  }>;
  tokensUsed?: number;
}

// TODO: Remover - Study Aid Interface Start
export interface AIChatParams {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
}

export interface AIChatResult {
  content: string;
  tokensUsed?: number;
}
// TODO: Remover - Study Aid Interface End

export interface AIProvider {
  generateReview(params: AIReviewParams): Promise<AIReviewResult>;
  // TODO: Remover - Study Aid Method
  generateChat(params: AIChatParams): Promise<AIChatResult>;
}
