import { describe, it, expect } from 'vitest';
import { FileFilterService } from '../../src/modules/reviews/file-filter.service';

describe('FileFilterService', () => {
  const service = new FileFilterService();

  it('should return all files if no patterns are provided', () => {
    const files = [
      { filename: 'src/app.ts' },
      { filename: 'src/utils.ts' },
    ];
    const result = service.filterFiles(files, null);
    expect(result).toHaveLength(2);
    expect(result).toEqual(files);
  });

  it('should return all files if patterns array is empty', () => {
    const files = [
      { filename: 'src/app.ts' },
      { filename: 'src/utils.ts' },
    ];
    const result = service.filterFiles(files, []);
    expect(result).toHaveLength(2);
    expect(result).toEqual(files);
  });

  it('should filter out files matching a single pattern', () => {
    const files = [
      { filename: 'src/app.ts' },
      { filename: 'src/app.test.ts' },
    ];
    const patterns = ['.test'];
    const result = service.filterFiles(files, patterns);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('src/app.ts');
  });

  it('should filter out files matching multiple patterns', () => {
    const files = [
      { filename: 'src/app.ts' },
      { filename: 'src/app.test.ts' },
      { filename: 'src/mocks/data.ts' },
    ];
    const patterns = ['.test', 'mocks/'];
    const result = service.filterFiles(files, patterns);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('src/app.ts');
  });

  it('should be case sensitive', () => {
    const files = [
      { filename: 'src/app.ts' },
      { filename: 'src/APP.TEST.ts' },
    ];
    const patterns = ['.test'];
    const result = service.filterFiles(files, patterns);
    expect(result).toHaveLength(2);
  });

  it('should handle partial matches', () => {
    const files = [
      { filename: 'src/user-service.ts' },
      { filename: 'src/user.service.ts' },
    ];
    const patterns = ['user-'];
    const result = service.filterFiles(files, patterns);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('src/user.service.ts');
  });

  it('should handle no matches', () => {
    const files = [
      { filename: 'src/app.ts' },
      { filename: 'src/utils.ts' },
    ];
    const patterns = ['.spec'];
    const result = service.filterFiles(files, patterns);
    expect(result).toHaveLength(2);
  });
});
