import { vi } from 'vitest';

/**
 * Mock database for unit tests
 */
export const createMockDb = () => {
  const mockData: any = {
    users: [],
    apiKeys: [],
    repositories: [],
    reviews: [],
  };

  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation((table) => ({
      values: vi.fn().mockImplementation((data) => ({
        returning: vi.fn().mockResolvedValue([data]),
      })),
    })),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn(),

    // Helper to set mock return values
    __setMockData: (table: string, data: any[]) => {
      mockData[table] = data;
    },

    __getMockData: (table: string) => {
      return mockData[table];
    },
  };
};

/**
 * Mock Redis client
 */
export const createMockRedis = () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  exists: vi.fn(),
  disconnect: vi.fn(),
});

/**
 * Mock BullMQ Queue
 */
export const createMockQueue = () => ({
  add: vi.fn().mockResolvedValue({ id: 'job-id' }),
  getJob: vi.fn().mockResolvedValue(null),
  close: vi.fn(),
});
