
export interface ReviewParams {
    diff: string;
    instructions: string;
    model?: string;
    fileContents?: Map<string, string>; // Map of file path to full file content
}

export interface ReviewComment {
    file: string;
    lineNumber: string; // The line number in the new file
    comment: string;
}

export interface ReviewResult {
    review: string; // The full review text (summary)
    comments?: ReviewComment[]; // Structured comments for inline review
}

export interface AIProvider {
    reviewCode(params: ReviewParams): Promise<ReviewResult>;
}
