import { Octokit } from '@octokit/rest';
import { logger } from '../../shared/utils/logger.js';

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getPRData(owner: string, repo: string, pullNumber: number) {
    try {
      // Get PR details
      const { data: pr } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      // Get PR diff
      const { data: diff } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: { format: 'diff' },
      });

      // Get list of files changed
      const { data: files } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return {
        pr,
        diff: diff as unknown as string,
        files,
      };
    } catch (error: any) {
      logger.error(error, 'Failed to fetch PR data from GitHub');
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref: string) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ('content' in data && typeof data.content === 'string') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      throw new Error('File content not found');
    } catch (error: any) {
      logger.warn({ path, ref }, 'Failed to fetch file content');
      return null; // Return null instead of throwing for missing files
    }
  }

  async getMultipleFileContents(
    owner: string,
    repo: string,
    paths: string[],
    ref: string
  ): Promise<Record<string, string>> {
    const contents: Record<string, string> = {};

    await Promise.all(
      paths.map(async (path) => {
        const content = await this.getFileContent(owner, repo, path, ref);
        if (content) {
          contents[path] = content;
        }
      })
    );

    return contents;
  }
}
