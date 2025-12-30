import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, ReviewParams, ReviewResult } from './provider.interface';
import * as core from '@actions/core';

export class GeminiProvider implements AIProvider {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async reviewCode(params: ReviewParams): Promise<ReviewResult> {
        const { diff, instructions, model = 'gemini-1.5-flash' } = params;

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
            const errorMessage = error.message || error.toString() || '';
            const isRateLimit = errorMessage.includes('429') || errorMessage.includes('Quota exceeded');
            const isDailyQuota = errorMessage.includes('limit: 0') || errorMessage.includes('billing details');

            if (isRateLimit && retries > 0) {
                if (isDailyQuota) {
                    core.error('❌ Gemini Daily Quota Exhausted: You have reached the daily limit for this model or your project is restricted. Retrying will not help.');
                    throw error;
                }

                let waitTime = initialDelay;
                const retryMatch = errorMessage.match(/retry in ([0-9.]+)s/);
                
                if (retryMatch && retryMatch[1]) {
                    const seconds = parseFloat(retryMatch[1]);
                    waitTime = Math.ceil(seconds * 1000) + 2000; // 2s buffer
                    core.info(`⏳ Rate limit detected. API requested wait: ${seconds}s. Waiting ${waitTime/1000}s before retry...`);
                } else {
                    core.warning(`⚠️ Rate limit hit. Retrying in ${waitTime / 1000}s... (${retries} attempts left)`);
                }

                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.generateWithRetry(model, prompt, retries - 1, initialDelay * 2);
            }
            throw error;
        }
    }
}
