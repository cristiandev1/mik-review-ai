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

  /**
   * List repositories for the authenticated user
   */
  async listUserRepositories(page: number = 1, perPage: number = 30) {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        page,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      });

      return data.map((repo) => ({
        githubRepoId: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        language: repo.language,
        htmlUrl: repo.html_url,
        updatedAt: repo.updated_at,
      }));
    } catch (error: any) {
      logger.error(error, 'Failed to list user repositories from GitHub');
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  /**
   * Post a review with comments to a GitHub Pull Request
   */
  async postReviewComments(
    owner: string,
    repo: string,
    pullNumber: number,
    summary: string,
    comments: Array<{
      file: string;
      lineNumber: string;
      comment: string;
    }>
  ): Promise<void> {
    try {
      // Convert lineNumber string to number
      const reviewComments = comments
        .map((c) => {
          const line = parseInt(c.lineNumber, 10);
          if (isNaN(line) || line <= 0) {
            logger.warn({ file: c.file, lineNumber: c.lineNumber }, 'Invalid line number, skipping comment');
            return null;
          }
          return {
            path: c.file,
            line: line,
            side: 'RIGHT' as const, // Comment on the new version of the file
            body: c.comment,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      if (reviewComments.length === 0 && !summary) {
        logger.info('No comments or summary to post, skipping review creation');
        return;
      }

      // Create review with comments
      await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        body: summary || 'AI Code Review completed',
        event: 'COMMENT', // COMMENT, APPROVE, or REQUEST_CHANGES
        comments: reviewComments,
      });

      logger.info(
        { owner, repo, pullNumber, commentsCount: reviewComments.length },
        'Successfully posted review to GitHub PR'
      );
    } catch (error: any) {
      logger.error(
        { err: error, owner, repo, pullNumber },
        'Failed to post review comments to GitHub'
      );

      // Re-throw with more context
      throw new Error(`Failed to post GitHub review: ${error.message}`);
    }
  }

  /**
   * Create a webhook for a repository
   */
  async createWebhook(owner: string, repo: string, webhookUrl: string, secret: string) {
    try {
      const { data } = await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret,
        },
        events: ['pull_request'],
        active: true,
      });

      logger.info({ owner, repo, webhookId: data.id }, 'Webhook created');
      return data.id;
    } catch (error: any) {
      logger.error({ err: error, owner, repo }, 'Failed to create webhook');
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(owner: string, repo: string, hookId: number) {
    try {
      await this.octokit.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookId,
      });
      logger.info({ owner, repo, hookId }, 'Webhook deleted');
    } catch (error: any) {
      logger.error({ err: error, owner, repo, hookId }, 'Failed to delete webhook');
      // Don't throw if it's already gone (404)
      if (error.status !== 404) {
        throw new Error(`Failed to delete webhook: ${error.message}`);
      }
    }
  }
}
