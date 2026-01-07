import OpenAI from 'openai';
import { logger } from '../../../shared/utils/logger.js';
import { env } from '../../../config/env.js';
import type { AIProvider, AIReviewParams, AIReviewResult, AIChatParams, AIChatResult } from '../ai.interface.js';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || env.OPENAI_API_KEY;
    
    if (!key) {
      throw new Error('OpenAI API Key is missing. Please configure OPENAI_API_KEY.');
    }

    this.client = new OpenAI({
      apiKey: key.trim(),
      // No baseURL needed for standard OpenAI
    });
  }

  async generateReview(params: AIReviewParams): Promise<AIReviewResult> {
    // Note: This method is for Code Reviews and is currently unused if AIService uses DeepSeek for reviews.
    // The prompt below is for code review, NOT for the study aid.
    const { diff, fileContents, rules, model = 'gpt-4o-mini' } = params;

    const exampleComment = [
      '{',
      '  "file": "path/to/file.ts",',
      '  "lineNumber": "10",',
      '  "comment": "Explanation of the issue...\n\n```suggestion\nconst fixed = value;\n```"',
      '}'
    ].join('\n');

    const systemPrompt = [
      'You are an expert Senior Software Engineer performing a code review.',
      'Output strictly in JSON format as follows:',
      '{',
      '  "summary": "Review summary",',
      '  "comments": [',
      exampleComment,
      '  ]',
      '}',
      'Follow these rules:',
      rules || 'Apply general best practices.',
      'Only comment on changed lines (prefixed with + in diff).'
    ].join('\n');

    let userMessage = '';
    if (Object.keys(fileContents).length > 0) {
      userMessage += '## Full File Contents\n\n';
      Object.entries(fileContents).forEach(([filePath, content]) => {
        userMessage += `### File: ${filePath}\n\
\
${content}\n\
\
`;
      });
    }
    userMessage += `## Git Diff\n\n${diff}`;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const tokensUsed = response.usage?.total_tokens || 0;

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        logger.warn('Failed to parse JSON response from OpenAI');
        return { summary: content, comments: [], tokensUsed };
      }

      return {
        summary: parsed.summary || 'No summary.',
        comments: parsed.comments || [],
        tokensUsed
      };
    } catch (error: any) {
      logger.error(error, 'OpenAI API error');
      throw new Error(`Failed to generate review from OpenAI: ${error.message}`);
    }
  }

  async generateChat(params: AIChatParams): Promise<AIChatResult> {
    const { messages, model = 'gpt-4o-mini', temperature = 0.7 } = params;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messages as any,
        temperature,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed
      };
    } catch (error: any) {
      logger.error(error, 'OpenAI API error in chat');
      throw new Error(`Failed to generate chat from OpenAI: ${error.message}`);
    }
  }
}
