import OpenAI from 'openai';
import { AIProvider, ReviewParams, ReviewResult } from './provider.interface';
import * as core from '@actions/core';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: apiKey,
        });
    }

    async reviewCode(params: ReviewParams): Promise<ReviewResult> {
        const { diff, instructions, model = 'gpt-4o' } = params;

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
            const response = await this.client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Here is the git diff of the changes:\n\n${diff}` }
                ],
                temperature: 0.2, // Low temperature for more deterministic/analytical results
            });

            const content = response.choices[0]?.message?.content || 'No review generated.';
            
            return {
                review: content
            };

        } catch (error) {
            core.error(`OpenAI API Error: ${error}`);
            throw new Error('Failed to generate review from OpenAI.');
        }
    }
}
