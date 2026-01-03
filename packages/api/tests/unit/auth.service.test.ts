import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../src/shared/errors/app-error.js';
import { createMockUser } from '../helpers/test-utils.js';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock('../../src/modules/verification/verification.service.js', () => ({
  VerificationService: vi.fn().mockImplementation(() => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { db } from '../../src/config/database.js';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const mockUser = createMockUser();
      const signupInput = {
        email: mockUser.email,
        password: 'password123',
        name: mockUser.name,
      };

      // Mock: user does not exist
      (db.limit as any).mockResolvedValue([]);

      // Mock: user creation
      const mockCreatedUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        plan: 'free',
        emailVerified: false,
      };

      (db.returning as any).mockResolvedValue([mockCreatedUser]);

      const result = await authService.signup(signupInput);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('apiKey');
      expect(result.user.email).toBe(signupInput.email);
      expect(result.apiKey).toMatch(/^mik_/);
    });

    it('should throw ConflictError if user already exists', async () => {
      const existingUser = createMockUser();
      const signupInput = {
        email: existingUser.email,
        password: 'password123',
        name: 'New User',
      };

      // Mock: user already exists
      (db.limit as any).mockResolvedValue([existingUser]);

      await expect(authService.signup(signupInput)).rejects.toThrow(ConflictError);
    });

    it('should hash the password before storing', async () => {
      const signupInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Mock: user does not exist
      (db.limit as any).mockResolvedValue([]);

      // Mock: user creation
      (db.returning as any).mockResolvedValue([createMockUser()]);

      const hashSpy = vi.spyOn(bcrypt, 'hash');

      await authService.signup(signupInput);

      expect(hashSpy).toHaveBeenCalledWith(signupInput.password, 10);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = createMockUser();
      const password = 'password123';

      // Hash the password for comparison
      mockUser.passwordHash = await bcrypt.hash(password, 10);

      const loginInput = {
        email: mockUser.email,
        password,
      };

      // Mock: user exists
      (db.limit as any).mockResolvedValue([mockUser]);

      const result = await authService.login(loginInput);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedError if user does not exist', async () => {
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Mock: user not found
      (db.limit as any).mockResolvedValue([]);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      const mockUser = createMockUser();
      mockUser.passwordHash = await bcrypt.hash('correctPassword', 10);

      const loginInput = {
        email: mockUser.email,
        password: 'wrongPassword',
      };

      // Mock: user exists
      (db.limit as any).mockResolvedValue([mockUser]);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = createMockUser();

      // Mock: user exists
      (db.limit as any).mockResolvedValue([mockUser]);

      const result = await authService.getUserById(mockUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundError if user not found', async () => {
      // Mock: user not found
      (db.limit as any).mockResolvedValue([]);

      await expect(authService.getUserById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const userId = 'test-user-id';
      const token = authService['generateToken'](userId);

      const result = authService.verifyToken(token);

      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('iat'); // JWT issued at
      expect(result).toHaveProperty('exp'); // JWT expiration
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => authService.verifyToken(invalidToken)).toThrow(UnauthorizedError);
    });
  });
});
