import OpenAI from 'openai';
import { AIProvider, ReviewParams, ReviewResult } from './provider.interface';
import * as core from '@actions/core';
import { DiffParser } from '../utils/diff.parser';

export class OpenAIProvider implements AIProvider {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({
            apiKey: apiKey,
        });
    }

    async reviewCode(params: ReviewParams): Promise<ReviewResult> {
        const { diff, instructions, model = 'gpt-4o-mini' } = params;

        // 1. Parse the diff into a numbered format to help the AI identify line numbers correctly.
        const parsedFiles = DiffParser.parse(diff);
        const numberedDiff = DiffParser.formatForAI(parsedFiles);

        const exampleComment = [
            '{',
            '  "file": "path/to/file.ts",',
            '  "lineNumber": "10",',
            '  "comment": "Explanation of the issue.\n\n```typescript\n// Suggested Fix\nconst safeValue = ...\n```"',
            '}'
        ].join('\n');

        const systemPrompt = [
            'You are an expert Senior Software Engineer performing a code review.',
            'Your goal is to review the provided code DIFF based strictly on the provided INSTRUCTIONS.',
            '',
            'INSTRUCTIONS:',
            instructions,
            '',
            'OUTPUT FORMAT:',
            'You must respond with a valid JSON object in the following format:',
            '{',
            '  "summary": "A markdown summary of the review.",',
            '  "comments": [',
            exampleComment,
            '  ]',
            '}',
            '',
            'GUIDELINES:',
            '1. **CRITICAL:** Use the line numbers provided in the "Numbered Diff" view. The number at the beginning of the line (e.g., "15 | + code") is the "lineNumber" you must use.',
            '2. "file" must exactly match the file path in the diff header.',
            '3. **CRITICAL:** Only add comments for lines that are marked with "+" (ADDED lines) or are part of the new code block. Do NOT comment on lines marked with "-".',
            '4. **CRITICAL:** For every issue identified, provide a CONCRETE CODE SUGGESTION (a fix) using a markdown code block inside the "comment" field. Do not just describe the error; show how to fix it.',
            '5. Only add comments for specific issues (bugs, security, performance).',
            '6. If there are no issues, "comments" should be empty and "summary" should be "LGTM".',
            '7. Do not use emojis.'
        ].join('\n');

        try {
            const response = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Here is the numbered git diff of the changes:\n\n${numberedDiff}` }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0]?.message?.content || '{}';
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                core.warning('Failed to parse JSON response from OpenAI. Falling back to raw text.');
                return { review: content };
            }

            return {
                review: parsed.summary || 'No summary provided.',
                comments: parsed.comments || []
            };

        } catch (error: any) {
            core.error(`OpenAI API Error: ${error.message}`);
            throw new Error('Failed to generate review from OpenAI.');
        }
    }
}