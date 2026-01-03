import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp, closeTestApp } from '../helpers/test-app.js';
import { nanoid } from 'nanoid';

// Mock email service to avoid sending real emails
vi.mock('../../src/modules/verification/verification.service.js', () => ({
  VerificationService: vi.fn().mockImplementation(() => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe.skip('Auth Routes Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /auth/signup', () => {
    it('should create a new user successfully', async () => {
      const signupData = {
        email: `test-${nanoid(6)}@example.com`,
        password: 'password123',
        name: 'Test User',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: signupData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('apiKey');
      expect(body.user.email).toBe(signupData.email);
      expect(body.apiKey).toMatch(/^mik_/);
    });

    it('should return 400 for invalid email', async () => {
      const signupData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: signupData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      const email = `test-${nanoid(6)}@example.com`;
      const signupData = {
        email,
        password: 'password123',
        name: 'Test User',
      };

      // First signup
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: signupData,
      });

      // Second signup with same email
      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: signupData,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // First create a user
      const email = `test-${nanoid(6)}@example.com`;
      const password = 'password123';

      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email,
          password,
          name: 'Test User',
        },
      });

      // Then login
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email,
          password,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.user.email).toBe(email);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
