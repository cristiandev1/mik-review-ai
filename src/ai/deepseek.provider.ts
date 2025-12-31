import OpenAI from 'openai';
import { AIProvider, ReviewParams, ReviewResult } from './provider.interface';
import * as core from '@actions/core';
import { DiffParser } from '../utils/diff.parser';

export class DeepSeekProvider implements AIProvider {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: "sk-123142342.2345234523",
            baseURL: 'https://api.deepseek.com',
        });
    }

    var modelName =  'deepseek-chat';

    async reviewCode(params: ReviewParams): Promise<ReviewResult> {
        const { diff, instructions, model = modelName } = params;

        // 1. Parse the diff into a numbered format to help the AI identify line numbers correctly.
        const parsedFiles = DiffParser.parse(diff);
        const numberedDiff = DiffParser.formatForAI(parsedFiles);

        const exampleComment = [
            '{',
            '  "file": "path/to/file.ts",',
            '  "lineNumber": "10",',
            '  "comment": "Explanation of the issue.\n\n**Suggested Fix:**\n```typescript\n// Before (current code with context):\nfunction example() {\n  var problematicCode = value; // Line 10\n  return result;\n}\n\n// After (suggested fix):\nfunction example() {\n  const fixedCode = value; // Line 10 - Use const instead of var\n  return result;\n}\n```"',
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
            '4. **CRITICAL - CONTEXTUALIZED SUGGESTIONS:** For every issue identified, you MUST provide a CONCRETE CODE SUGGESTION showing:',
            '   - A "Before" section with the current problematic code INCLUDING surrounding context (2-5 lines before/after)',
            '   - An "After" section with the fixed code in the EXACT same context',
            '   - Clear indication of EXACTLY where in the code structure to place the fix (inside which function, class, block, etc.)',
            '   - Example format:',
            '   ```language',
            '   // Before (current code):',
            '   function example() {',
            '     const x = 1;',
            '     var problematic = value; // <- Issue here at line X',
            '     return x;',
            '   }',
            '   ',
            '   // After (suggested fix):',
            '   function example() {',
            '     const x = 1;',
            '     const fixed = value; // <- Fixed: use const instead of var',
            '     return x;',
            '   }',
            '   ```',
            '5. **DO NOT** provide isolated code snippets without context. Always show where the code belongs in the file structure.',
            '6. Only add comments for specific issues (bugs, security, performance, best practices).',
            '7. If there are no issues, "comments" should be empty and "summary" should be "LGTM".',
            '8. Do not use emojis.'
        ].join('\n');

        try {
            const response = await this.client.chat.completions.create({
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
                core.warning('Failed to parse JSON response from DeepSeek. Falling back to raw text.');
                return { review: content };
            }

            return {
                review: parsed.summary || 'No summary provided.',
                comments: parsed.comments || []
            };

        } catch (error: any) {
            core.error(`DeepSeek API Error: ${error.message}`);
            throw new Error('Failed to generate review from DeepSeek.');
        }
    }
}
