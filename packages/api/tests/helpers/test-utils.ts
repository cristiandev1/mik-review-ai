import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

/**
 * Generate a mock user object
 */
export function createMockUser(overrides: Partial<any> = {}) {
  const defaultUser = {
    id: nanoid(),
    email: `test-${nanoid(6)}@example.com`,
    name: 'Test User',
    passwordHash: bcrypt.hashSync('password123', 10),
    plan: 'free',
    githubId: null,
    githubAccessToken: null,
    avatarUrl: null,
    emailVerified: true,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...defaultUser, ...overrides };
}

/**
 * Generate a mock API key
 */
export function createMockApiKey(userId: string, overrides: Partial<any> = {}) {
  return {
    id: nanoid(),
    userId,
    key: `mik_${nanoid(32)}`,
    name: 'Test API Key',
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock repository
 */
export function createMockRepository(userId: string, overrides: Partial<any> = {}) {
  return {
    id: nanoid(),
    userId,
    githubRepoId: Math.floor(Math.random() * 1000000),
    fullName: `testuser/test-repo-${nanoid(6)}`,
    name: `test-repo-${nanoid(6)}`,
    owner: 'testuser',
    description: 'Test repository',
    isPrivate: false,
    isEnabled: true,
    defaultBranch: 'main',
    language: 'TypeScript',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock review
 */
export function createMockReview(userId: string, overrides: Partial<any> = {}) {
  return {
    id: nanoid(),
    userId,
    repository: 'testuser/test-repo',
    pullRequest: 1,
    status: 'processing',
    summary: null,
    comments: null,
    aiModel: null,
    tokensUsed: null,
    processingTime: null,
    error: null,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

/**
 * Generate a JWT token for testing
 */
export function generateTestToken(userId: string, expiresIn: string = '1h'): string {
  return jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Wait for a specified amount of time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock GitHub API response
 */
export function createMockGitHubRepo(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 1000000),
    full_name: 'testuser/test-repo',
    name: 'test-repo',
    owner: { login: 'testuser' },
    description: 'Test repository',
    private: false,
    default_branch: 'main',
    language: 'TypeScript',
    html_url: 'https://github.com/testuser/test-repo',
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock DeepSeek AI response
 */
export function createMockAIResponse(overrides: Partial<any> = {}) {
  return {
    summary: 'This PR looks good overall.',
    comments: [
      {
        file: 'src/app.ts',
        lineNumber: '42',
        comment: 'Consider adding error handling here.',
      },
    ],
    tokensUsed: 150,
    ...overrides,
  };
}
