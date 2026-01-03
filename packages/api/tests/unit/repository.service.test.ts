import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositoryService } from '../../src/modules/repositories/repository.service.js';
import { createMockRepository, createMockUser } from '../helpers/test-utils.js';

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

import { db } from '../../src/config/database.js';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;
  let mockUser: ReturnType<typeof createMockUser>;

  beforeEach(() => {
    repositoryService = new RepositoryService();
    mockUser = createMockUser();
    vi.clearAllMocks();
  });

  describe('syncRepository', () => {
    it('should create a new repository if it does not exist', async () => {
      const mockRepoData = {
        githubRepoId: 123456,
        fullName: 'user/repo',
        name: 'repo',
        owner: 'user',
        description: 'Test repo',
        isPrivate: false,
        defaultBranch: 'main',
        language: 'TypeScript',
      };

      // Mock: repository does not exist
      (db as any).limit.mockResolvedValue([]);

      // Mock: repository creation
      const mockCreatedRepo = createMockRepository(mockUser.id, mockRepoData);
      (db as any).returning.mockResolvedValue([mockCreatedRepo]);

      const result = await repositoryService.syncRepository(mockUser.id, mockRepoData);

      expect(result).toBeDefined();
      expect(result.fullName).toBe(mockRepoData.fullName);
      expect(result.isEnabled).toBe(true);
    });

    it('should update existing repository if it already exists', async () => {
      const mockRepoData = {
        githubRepoId: 123456,
        fullName: 'user/repo',
        name: 'repo',
        owner: 'user',
        description: 'Updated description',
        isPrivate: false,
        defaultBranch: 'main',
        language: 'TypeScript',
      };

      const existingRepo = createMockRepository(mockUser.id, {
        githubRepoId: mockRepoData.githubRepoId,
      });

      // Mock: repository exists
      (db as any).limit.mockResolvedValue([existingRepo]);

      // Mock: repository update
      const updatedRepo = { ...existingRepo, ...mockRepoData };
      (db as any).returning.mockResolvedValue([updatedRepo]);

      const result = await repositoryService.syncRepository(mockUser.id, mockRepoData);

      expect(result).toBeDefined();
      expect(result.description).toBe('Updated description');
    });
  });

  describe('listUserRepositories', () => {
    it('should return list of repositories for user', async () => {
      const mockRepos = [
        createMockRepository(mockUser.id),
        createMockRepository(mockUser.id),
      ];

      // Mock the main query chain
      const mockMainQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRepos),
      };

      // Only one call to db.select() now (main query)
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockMainQuery),
          }),
        });

      const result = await repositoryService.listUserRepositories(mockUser.id);

      expect(result).toHaveProperty('repositories');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.repositories).toHaveLength(2);
    });

    it('should filter by enabled status', async () => {
      const mockRepos = [createMockRepository(mockUser.id, { isEnabled: true })];

      // Mock the main query chain
      const mockMainQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockRepos),
      };

      // First call to db.select() - default query (unused in this path but created)
      // Second call to db.select() - filtered query (used)
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              offset: vi.fn().mockReturnThis(),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(mockMainQuery),
          }),
        });

      const result = await repositoryService.listUserRepositories(mockUser.id, {
        isEnabled: true,
      });

      expect(result.repositories).toBeDefined();
      expect(result.repositories).toHaveLength(1);
    });
  });

  describe('getRepository', () => {
    it('should return repository if found', async () => {
      const mockRepo = createMockRepository(mockUser.id);

      // Mock: repository exists
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRepo]),
          }),
        }),
      });

      const result = await repositoryService.getRepository(mockRepo.id, mockUser.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockRepo.id);
    });

    it('should return null if repository not found', async () => {
      // Mock: repository not found
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repositoryService.getRepository('non-existent', mockUser.id);

      expect(result).toBeNull();
    });
  });

  describe('updateRepository', () => {
    it('should update repository status', async () => {
      const mockRepo = createMockRepository(mockUser.id);

      // Mock: repository update
      const updatedRepo = { ...mockRepo, isEnabled: false };
      (db as any).returning.mockResolvedValue([updatedRepo]);

      const result = await repositoryService.updateRepository(mockRepo.id, mockUser.id, {
        isEnabled: false,
      });

      expect(result).toBeDefined();
      expect(result.isEnabled).toBe(false);
    });

    it('should throw error if repository not found', async () => {
      // Mock: repository not found
      (db as any).returning.mockResolvedValue([]);

      await expect(
        repositoryService.updateRepository('non-existent', mockUser.id, { isEnabled: false })
      ).rejects.toThrow('Failed to update repository');
    });
  });

  describe('isRepositoryEnabled', () => {
    it('should return true if repository is enabled', async () => {
      const mockRepo = createMockRepository(mockUser.id, { isEnabled: true });

      // Mock: repository exists and is enabled
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRepo]),
          }),
        }),
      });

      const result = await repositoryService.isRepositoryEnabled(mockUser.id, mockRepo.fullName);

      expect(result).toBe(true);
    });

    it('should return false if repository is disabled', async () => {
      // Mock: repository not found or disabled
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repositoryService.isRepositoryEnabled(mockUser.id, 'user/repo');

      expect(result).toBe(false);
    });
  });

  describe('deleteRepository', () => {
    it('should delete repository successfully', async () => {
      const mockRepo = createMockRepository(mockUser.id);

      // Mock successful delete
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await repositoryService.deleteRepository(mockRepo.id, mockUser.id);

      expect(db.delete).toHaveBeenCalled();
    });
  });
});
