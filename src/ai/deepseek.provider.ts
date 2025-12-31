import OpenAI from 'openai';
import { AIProvider, ReviewParams, ReviewResult } from './provider.interface';
import * as core from '@actions/core';
import { DiffParser } from '../utils/diff.parser';

export class DeepSeekProvider implements AIProvider {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.deepseek.com',
        });
    }

    async reviewCode(params: ReviewParams): Promise<ReviewResult> {
        const { diff, instructions, model = 'deepseek-chat', fileContents } = params;

        // 1. Parse the diff into a numbered format to help the AI identify line numbers correctly.
        const parsedFiles = DiffParser.parse(diff);
        const numberedDiff = DiffParser.formatForAI(parsedFiles);

        const exampleComment = [
            '{',
            '  "file": "path/to/file.ts",',
            '  "lineNumber": "10",',
            '  "comment": "Explanation of the issue.\n\n**On line 10, replace:**\n```typescript\nvar problematicCode = value;\n```\n\n**With:**\n```typescript\nconst fixedCode = value; // Use const for immutable values\n```"',
            '}'
        ].join('\n');

        const systemPrompt = [
            'You are an expert Senior Software Engineer performing a code review.',
            'Your goal is to review the provided code DIFF based strictly on the provided INSTRUCTIONS.',
            '',
            '**CRITICAL - CONTEXT ANALYSIS FIRST:**',
            'Before suggesting ANY change, you MUST:',
            '1. Identify the programming language/framework from file extensions and code patterns',
            '2. Understand the specific syntax, conventions, and best practices for THAT language',
            '3. Recognize the project structure (React, Vue, Python, Go, Java, Ruby, etc.)',
            '4. Apply ONLY rules and patterns that are valid for the detected language/framework',
            '5. When in doubt about language-specific syntax or conventions, DO NOT suggest changes',
            '',
            'Examples of language-specific awareness:',
            '- TypeScript/JavaScript: use const/let, avoid var, type annotations',
            '- Python: PEP 8, type hints, snake_case naming',
            '- Go: exported names start with capital letters, error handling patterns',
            '- Java: CamelCase, proper access modifiers, null safety',
            '- React: hooks rules, component patterns, JSX syntax',
            '- Ruby: snake_case, blocks, symbols',
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
            '4. **CRITICAL - BE CONSERVATIVE AND LANGUAGE-AWARE:**',
            '   - Only suggest changes when you are 100% certain about the language/framework being used',
            '   - Verify your suggestion is syntactically correct for THAT specific language',
            '   - DO NOT mix conventions from different languages (e.g., Python patterns in JavaScript)',
            '   - **WHEN IN DOUBT, DO NOT COMMENT** - better to skip than give wrong advice',
            '   - Validate that your suggestion will compile and run correctly',
            '5. **CRITICAL - CLEAR REPLACEMENT INSTRUCTIONS:** For every issue, provide a CONCRETE suggestion with:',
            '   - Title: "On line X, replace:" followed by the EXACT current problematic code',
            '   - Title: "With:" followed by the corrected code with inline comment',
            '   - Use code blocks for both "replace" and "with" sections',
            '   - Example format:',
            '   ```',
            '   **On line 15, replace:**',
            '   ```language',
            '   var problematic = value;',
            '   ```',
            '   ',
            '   **With:**',
            '   ```language',
            '   const fixed = value; // Use const for immutable values',
            '   ```',
            '   ```',
            '6. **CRITICAL:** Always show the EXACT code that needs to be replaced (copy from the diff), so the user knows precisely what to change.',
            '7. Keep suggestions concise - show only the line(s) that need to change.',
            '8. **Language-Specific Conventions (apply ONLY for the detected language):',
            '   TypeScript/JavaScript: const/let (not var), proper types, class members use private/readonly',
            '   Python: snake_case, PEP 8, type hints',
            '   Go: exported names capitalized, camelCase for private, explicit error handling',
            '   Java: PascalCase classes, camelCase methods, proper access modifiers',
            '   React: hooks rules, component patterns, proper state management',
            '9. Only add comments for specific issues (bugs, security, performance, best practices).',
            '10. If there are no issues, "comments" should be empty and "summary" should be "LGTM".',
            '11. Do not use emojis.'
        ].join('\n');

        // Build the user message with full file contents if available
        let userMessage = '';

        if (fileContents && fileContents.size > 0) {
            userMessage += '## Full File Contents\n\n';
            userMessage += 'Here are the complete files that were modified for better context:\n\n';

            fileContents.forEach((content, filePath) => {
                userMessage += `### File: ${filePath}\n`;
                userMessage += '```\n';
                userMessage += content;
                userMessage += '\n```\n\n';
            });

            userMessage += '---\n\n';
        }

        userMessage += `## Numbered Git Diff\n\nHere is the numbered git diff of the changes:\n\n${numberedDiff}`;

        try {
            const response = await this.client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
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
