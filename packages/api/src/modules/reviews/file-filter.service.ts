/**
 * File Filter Service
 * Filters out files based on excluded patterns
 */
export class FileFilterService {
  /**
   * Filters out files based on excluded patterns
   * @param files - Array of file objects with filename property
   * @param excludedPatterns - Array of patterns to match against filename
   * @returns Filtered array of files
   */
  filterFiles(
    files: Array<{ filename: string }>,
    excludedPatterns: string[] | null | undefined
  ): Array<{ filename: string }> {
    if (!excludedPatterns || excludedPatterns.length === 0) {
      return files;
    }

    return files.filter((file) => {
      // Check if filename contains any of the excluded patterns
      const shouldExclude = excludedPatterns.some((pattern) =>
        file.filename.includes(pattern)
      );
      return !shouldExclude;
    });
  }
}

export const fileFilterService = new FileFilterService();
