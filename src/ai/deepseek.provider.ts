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
            '',
            '═══════════════════════════════════════════════════════════════════════════════',
            '🎯 PRIMARY OBJECTIVE - FOLLOW THESE PROJECT-SPECIFIC REVIEW RULES:',
            '═══════════════════════════════════════════════════════════════════════════════',
            '',
            instructions || 'No specific rules provided. Apply general best practices.',
            '',
            '═══════════════════════════════════════════════════════════════════════════════',
            '🚨 CRITICAL CODE ISSUES - ALWAYS DETECT THESE PROBLEMS:',
            '═══════════════════════════════════════════════════════════════════════════════',
            '',
            '**Security Vulnerabilities (HIGH PRIORITY):**',
            '- SQL Injection, XSS, Command Injection, Path Traversal attacks',
            '- Hardcoded credentials, API keys, secrets, tokens in code',
            '- Insecure cryptography (MD5, SHA1), weak passwords, hardcoded salts',
            '- Authentication/Authorization bypasses or missing checks',
            '- Unsafe deserialization, eval() or exec() usage',
            '- CORS misconfiguration, exposed sensitive endpoints',
            '- Missing input validation and sanitization',
            '',
            '**Logic Errors & Bugs:**',
            '- Null/undefined reference errors, missing null checks',
            '- Off-by-one errors, array index out of bounds',
            '- Infinite loops, missing break/return conditions',
            '- Race conditions, deadlocks, improper synchronization',
            '- Incorrect error handling (swallowed exceptions, ignored errors)',
            '- Division by zero, buffer overflows',
            '- Wrong comparison operators (= instead of ==, == instead of ===)',
            '- Missing return statements, unreachable code',
            '',
            '**Performance Issues:**',
            '- N+1 database queries, missing indexes',
            '- Memory leaks, unbounded arrays/collections',
            '- Inefficient algorithms (nested loops O(n²) when O(n) possible)',
            '- Unnecessary API calls inside loops',
            '- Missing caching for expensive operations',
            '- Synchronous operations blocking async flow',
            '- Large objects in state/props causing re-renders',
            '',
            '**Bad Practices & Code Smells:**',
            '- Dead code, unreachable code, unused imports/variables',
            '- Code duplication, violation of DRY principle',
            '- Magic numbers/strings without named constants',
            '- Poor naming (single letters, unclear purpose, misleading names)',
            '- Functions/methods doing too many things (violation of SRP)',
            '- Deep nesting (> 3 levels), complex conditionals',
            '- Missing error boundaries, unhandled promise rejections',
            '- Console.log statements in production code',
            '- TODO/FIXME comments indicating incomplete work',
            '',
            '**Language-Specific Detection:**',
            'Auto-detect the programming language and check for:',
            '',
            '- **TypeScript/JavaScript:**',
            '  • var usage (use const/let)',
            '  • Missing type annotations, use of "any" type',
            '  • Unhandled promises, missing await',
            '  • Mutating props/state directly',
            '  • Missing dependencies in useEffect/useCallback',
            '',
            '- **Python:**',
            '  • Mutable default arguments in functions',
            '  • Missing type hints',
            '  • Bare except clauses',
            '  • Not using context managers (with statement)',
            '',
            '- **Go:**',
            '  • Unchecked errors (ignoring error returns)',
            '  • Goroutine leaks, missing context cancellation',
            '  • Not using defer for cleanup',
            '',
            '- **Java:**',
            '  • Resource leaks (unclosed streams, connections)',
            '  • Null pointer risks',
            '  • String concatenation in loops',
            '',
            '- **React:**',
            '  • Missing key prop in lists',
            '  • Improper state updates (mutation)',
            '  • Hooks called conditionally',
            '  • Missing cleanup in useEffect',
            '',
            '═══════════════════════════════════════════════════════════════════════════════',
            '📋 OUTPUT FORMAT:',
            '═══════════════════════════════════════════════════════════════════════════════',
            '',
            'Respond with a valid JSON object:',
            '{',
            '  "summary": "Markdown summary of the review",',
            '  "comments": [',
            exampleComment,
            '  ]',
            '}',
            '',
            '═══════════════════════════════════════════════════════════════════════════════',
            '⚙️ TECHNICAL GUIDELINES:',
            '═══════════════════════════════════════════════════════════════════════════════',
            '',
            '1. **Line Numbers:** Use ONLY the numbers shown in "Numbered Diff" (e.g., "15 | + code" → lineNumber: "15")',
            '2. **File Paths:** Must exactly match the path in diff header',
            '3. **Only Comment on Added Lines:** Comment ONLY on lines with "+" prefix (new code)',
            '4. **Provide Exact Replacements:**',
            '   Format: **On line X, replace:** ```code block``` **With:** ```fixed code```',
            '   Always show the EXACT current code to be replaced',
            '5. **Language Awareness:** Verify your suggestion is syntactically correct for the detected language',
            '6. **Conservative Approach:** When uncertain, DO NOT comment. Better to skip than give wrong advice',
            '7. **No Issues:** If everything is good, return empty comments array and summary: "LGTM"',
            '8. **No Emojis:** Do not use emojis in output',
            ''
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
