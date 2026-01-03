import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../src/modules/ai/ai.service.js';
import { createMockAIResponse } from '../helpers/test-utils.js';

// Mock the DeepSeek provider
vi.mock('../../src/modules/ai/providers/deepseek.provider.js', () => ({
  DeepSeekProvider: vi.fn().mockImplementation(() => ({
    generateReview: vi.fn(),
  })),
}));

import { DeepSeekProvider } from '../../src/modules/ai/providers/deepseek.provider.js';

describe('AIService', () => {
  let aiService: AIService;
  let mockProviderInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIService('test-api-key');

    // Get the mocked provider instance
    mockProviderInstance = (DeepSeekProvider as any).mock.results[0].value;
  });

  describe('constructor', () => {
    it('should initialize with DeepSeek provider', () => {
      expect(DeepSeekProvider).toHaveBeenCalledWith('test-api-key');
    });

    it('should initialize without API key', () => {
      vi.clearAllMocks();
      new AIService();
      expect(DeepSeekProvider).toHaveBeenCalledWith(undefined);
    });
  });

  describe('generateReview', () => {
    it('should generate review successfully', async () => {
      const mockResponse = createMockAIResponse();
      const reviewParams = {
        diff: 'some diff content',
        files: [{ path: 'src/app.ts', content: 'const x = 1;' }],
        repository: 'user/repo',
        prNumber: 1,
        customRules: null,
      };

      mockProviderInstance.generateReview.mockResolvedValue(mockResponse);

      const result = await aiService.generateReview(reviewParams);

      expect(result).toEqual(mockResponse);
      expect(mockProviderInstance.generateReview).toHaveBeenCalledWith(reviewParams);
    });

    it('should pass through provider errors', async () => {
      const reviewParams = {
        diff: 'some diff content',
        files: [],
        repository: 'user/repo',
        prNumber: 1,
        customRules: null,
      };

      const error = new Error('AI API Error');
      mockProviderInstance.generateReview.mockRejectedValue(error);

      await expect(aiService.generateReview(reviewParams)).rejects.toThrow('AI API Error');
    });

    it('should handle custom rules', async () => {
      const mockResponse = createMockAIResponse();
      const customRules = 'Always check for null safety';
      const reviewParams = {
        diff: 'some diff content',
        files: [],
        repository: 'user/repo',
        prNumber: 1,
        customRules,
      };

      mockProviderInstance.generateReview.mockResolvedValue(mockResponse);

      await aiService.generateReview(reviewParams);

      expect(mockProviderInstance.generateReview).toHaveBeenCalledWith(
        expect.objectContaining({ customRules })
      );
    });
  });
});
