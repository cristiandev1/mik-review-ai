import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp, closeTestApp } from '../helpers/test-app.js';
import { nanoid } from 'nanoid';

// Mock email service
vi.mock('../../src/modules/verification/verification.service.js', () => ({
  VerificationService: vi.fn().mockImplementation(() => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe.skip('Repository Routes Integration Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create a test user and get auth token
    const signupResponse = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: `test-repo-${nanoid(6)}@example.com`,
        password: 'password123',
        name: 'Test User',
      },
    });

    const signupBody = JSON.parse(signupResponse.body);
    authToken = signupBody.token;
    userId = signupBody.user.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /repositories/sync', () => {
    it('should sync a repository successfully', async () => {
      const repoData = {
        githubRepoId: Math.floor(Math.random() * 1000000),
        fullName: `testuser/test-repo-${nanoid(6)}`,
        name: `test-repo-${nanoid(6)}`,
        owner: 'testuser',
        description: 'Test repository',
        isPrivate: false,
        defaultBranch: 'main',
        language: 'TypeScript',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/repositories/sync',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: repoData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Repository synced successfully');
      expect(body.repository).toBeDefined();
      expect(body.repository.fullName).toBe(repoData.fullName);
      expect(body.repository.isEnabled).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/repositories/sync',
        payload: {
          githubRepoId: 123456,
          fullName: 'user/repo',
          name: 'repo',
          owner: 'user',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/repositories/sync',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          // Missing required fields
          fullName: 'user/repo',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /repositories', () => {
    it('should list user repositories', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/repositories',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('repositories');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
      expect(Array.isArray(body.repositories)).toBe(true);
    });

    it('should filter by enabled status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/repositories?isEnabled=true',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.repositories).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/repositories',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /repositories/:id', () => {
    it('should update repository status', async () => {
      // First create a repository
      const repoData = {
        githubRepoId: Math.floor(Math.random() * 1000000),
        fullName: `testuser/test-repo-${nanoid(6)}`,
        name: `test-repo-${nanoid(6)}`,
        owner: 'testuser',
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/repositories/sync',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: repoData,
      });

      const createBody = JSON.parse(createResponse.body);
      const repoId = createBody.repository.id;

      // Update the repository
      const response = await app.inject({
        method: 'PATCH',
        url: `/repositories/${repoId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          isEnabled: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Repository updated successfully');
      expect(body.repository.isEnabled).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/repositories/some-id',
        payload: {
          isEnabled: false,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /repositories/:id', () => {
    it('should delete repository', async () => {
      // First create a repository
      const repoData = {
        githubRepoId: Math.floor(Math.random() * 1000000),
        fullName: `testuser/test-repo-${nanoid(6)}`,
        name: `test-repo-${nanoid(6)}`,
        owner: 'testuser',
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/repositories/sync',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: repoData,
      });

      const createBody = JSON.parse(createResponse.body);
      const repoId = createBody.repository.id;

      // Delete the repository
      const response = await app.inject({
        method: 'DELETE',
        url: `/repositories/${repoId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Repository deleted successfully');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/repositories/some-id',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
