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

            const result = await this.generateWithRetry(genModel, prompt);
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

    private async generateWithRetry(model: any, prompt: string, retries = 5, initialDelay = 4000): Promise<any> {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            if (retries > 0 && (error.message.includes('429') || error.message.includes('Quota exceeded'))) {
                let waitTime = initialDelay;
                
                // Try to extract the requested wait time from the error message
                // Example match: "Please retry in 45.176511119s."
                const retryMatch = error.message.match(/retry in ([0-9.]+)s/);
                if (retryMatch && retryMatch[1]) {
                    const seconds = parseFloat(retryMatch[1]);
                    // Add a small buffer of 1 second to be safe
                    waitTime = Math.ceil(seconds * 1000) + 1000;
                    core.info(`Rate limit detected. API requested wait: ${seconds}s. Waiting ${waitTime/1000}s...`);
                } else {
                    core.warning(`Rate limit hit. Retrying in ${waitTime / 1000} seconds... (${retries} attempts left)`);
                }

                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // If we found a specific time, we use the initialDelay for the next loop (or we could keep using backoff)
                // For exponential backoff on generic errors:
                const nextDelay = retryMatch ? initialDelay : initialDelay * 2;
                
                return this.generateWithRetry(model, prompt, retries - 1, nextDelay);
            }
            throw error;
        }
    }
}
