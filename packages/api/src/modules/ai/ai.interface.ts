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

export interface AIProvider {
  generateReview(params: AIReviewParams): Promise<AIReviewResult>;
}
