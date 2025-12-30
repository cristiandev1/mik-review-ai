
export interface ReviewParams {
    diff: string;
    instructions: string;
    model?: string;
}

export interface ReviewResult {
    review: string; // The full review text
}

export interface AIProvider {
    reviewCode(params: ReviewParams): Promise<ReviewResult>;
}
