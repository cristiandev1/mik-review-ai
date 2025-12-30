import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, ReviewParams, ReviewResult } from './provider.interface';
import * as core from '@actions/core';

export class GeminiProvider implements AIProvider {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async reviewCode(params: ReviewParams): Promise<ReviewResult> {
        const { diff, instructions, model = 'gemini-2.0-flash' } = params;

        const systemPrompt = `
You are an expert Senior Software Engineer performing a code review.
Your goal is to review the provided code DIFF based strictly on the provided INSTRUCTIONS.

INSTRUCTIONS:
${instructions}

GUIDELINES:
1. Focus on bugs, security vulnerabilities, performance issues, and adherence to the provided instructions.
2. Be objective, direct, and constructive.
3. DO NOT use emojis in your response.
4. If the code is good and meets the requirements, simply say "LGTM" or provide positive feedback concisely.
5. Format your response in Markdown.
`;

        try {
            const genModel = this.genAI.getGenerativeModel({ model: model });
            
            const prompt = `${systemPrompt}\n\nHere is the git diff of the changes:\n\n${diff}`;

            const result = await genModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                review: text
            };

        } catch (error) {
            core.error(`Gemini API Error: ${error}`);
            throw new Error('Failed to generate review from Gemini.');
        }
    }
}
