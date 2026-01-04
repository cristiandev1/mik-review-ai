import { logger } from '../../../shared/utils/logger.js';
import { env } from '../../../config/env.js';
import type { AIProvider, AIReviewParams, AIReviewResult } from '../ai.interface.js';

export class DeepSeekProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.DEEPSEEK_API_KEY || '';
    this.baseURL = 'https://api.deepseek.com/chat/completions';
  }

  async generateReview(params: AIReviewParams): Promise<AIReviewResult> {
    const { diff, fileContents, rules, model = 'deepseek-chat' } = params;

    if (!this.apiKey) {
      throw new Error('DeepSeek API Key is missing. Please configure DEEPSEEK_API_KEY.');
    }

    const exampleComment = [
      '{',
      '  "file": "path/to/file.ts",',
      '  "lineNumber": "10",',
      '  "comment": "Explanation of the issue.\\n\\n**On line 10, replace:**\\n```typescript\\nvar problematicCode = value;\\n```\\n\\n**With:**\\n```typescript\\nconst fixedCode = value; // Use const for immutable values\\n```"',
      '}'
    ].join('\\n');

    const systemPrompt = [
      'You are an expert Senior Software Engineer performing a code review.',
      '',
      '═══════════════════════════════════════════════════════════════════════════════',
      '🎯 PRIMARY OBJECTIVE - FOLLOW THESE PROJECT-SPECIFIC REVIEW RULES:',
      '═══════════════════════════════════════════════════════════════════════════════',
      '',
      rules || 'No specific rules provided. Apply general best practices.',
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
      '',
      '**Logic Errors & Bugs:**',
      '- Null/undefined reference errors, missing null checks',
      '- Off-by-one errors, array index out of bounds',
      '- Infinite loops, missing break/return conditions',
      '- Incorrect error handling (swallowed exceptions, ignored errors)',
      '',
      '**Performance Issues:**',
      '- N+1 database queries, missing indexes',
      '- Memory leaks, unbounded arrays/collections',
      '- Inefficient algorithms (nested loops O(n²) when O(n) possible)',
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
      '1. **Line Numbers:** Use ONLY the numbers shown in "Numbered Diff"',
      '2. **File Paths:** Must exactly match the path in diff header',
      '3. **Only Comment on Added Lines:** Comment ONLY on lines with "+" prefix (new code)',
      '4. **Provide Exact Replacements:** Show EXACT current code and fixed version',
      '5. **No Issues:** If everything is good, return empty comments array and summary: "LGTM"',
      '6. **No Emojis:** Do not use emojis in output',
      ''
    ].join('\\n');

    // Build user message with full file contents
    let userMessage = '';

    if (Object.keys(fileContents).length > 0) {
      userMessage += '## Full File Contents\\n\\n';
      userMessage += 'Here are the complete files that were modified for better context:\\n\\n';

      Object.entries(fileContents).forEach(([filePath, content]) => {
        userMessage += `### File: ${filePath}\\n`;
        userMessage += '```\\n';
        userMessage += content;
        userMessage += '\\n```\\n\\n';
      });

      userMessage += '---\\n\\n';
    }

    userMessage += `## Git Diff\\n\\nHere is the diff of the changes:\\n\\n${diff}`;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content || '{}';
      const tokensUsed = data.usage?.total_tokens || 0;

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        logger.warn('Failed to parse JSON response from DeepSeek');
        return {
          summary: content,
          comments: [],
          tokensUsed
        };
      }

      return {
        summary: parsed.summary || 'No summary provided.',
        comments: parsed.comments || [],
        tokensUsed
      };
    } catch (error: any) {
      logger.error(error, 'DeepSeek API error');
      throw new Error(`Failed to generate review from DeepSeek: ${error.message}`);
    }
  }
}
