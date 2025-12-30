import * as github from '@actions/github';
import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

export class GitHubService {
    private octokit: ReturnType<typeof github.getOctokit>;
    private context = github.context;

    constructor(token: string) {
        this.octokit = github.getOctokit(token);
    }

    async getPRDiff(): Promise<string> {
        const pull_request = this.context.payload.pull_request;

        if (!pull_request) {
            throw new Error('No pull request context found.');
        }

        const { owner, repo } = this.context.repo;
        const pull_number = pull_request.number;

        try {
            const response = await this.octokit.rest.pulls.get({
                owner,
                repo,
                pull_number,
                mediaType: {
                    format: 'diff'
                }
            });

            // The response.data will be the diff string when using mediaType format: 'diff'
            // However, octokit types might infer it as the object, so we cast to unknown then string or handle appropriately.
            return response.data as unknown as string;

        } catch (error) {
            core.error(`Failed to fetch PR diff: ${error}`);
            throw error;
        }
    }

    async postComment(body: string): Promise<void> {
        const pull_request = this.context.payload.pull_request;

        if (!pull_request) {
            throw new Error('No pull request context found.');
        }

        const { owner, repo } = this.context.repo;
        const issue_number = pull_request.number;

        try {
            await this.octokit.rest.issues.createComment({
                owner,
                repo,
                issue_number,
                body,
            });
            core.info(`Comment posted on PR #${issue_number}`);
        } catch (error) {
            core.error(`Failed to post comment: ${error}`);
            throw error;
        }
    }

    async postReview(summary: string, comments: Array<{ file: string; lineNumber: string; comment: string }>): Promise<void> {
        const pull_request = this.context.payload.pull_request;

        if (!pull_request) {
            throw new Error('No pull request context found.');
        }

        const { owner, repo } = this.context.repo;
        const pull_number = pull_request.number;

        // Filter out invalid comments (e.g. missing line number)
        const validComments = comments
            .filter(c => c.file && c.lineNumber && !isNaN(parseInt(c.lineNumber)))
            .map(c => ({
                path: c.file,
                line: parseInt(c.lineNumber),
                side: 'RIGHT',
                body: c.comment,
            }));

        try {
            if (validComments.length > 0) {
                await this.octokit.rest.pulls.createReview({
                    owner,
                    repo,
                    pull_number,
                    body: summary,
                    event: 'COMMENT',
                    comments: validComments
                });
                core.info(`Review posted on PR #${pull_number} with ${validComments.length} inline comments.`);
            } else {
                // If no inline comments are valid/present, just post the summary as a general comment
                await this.postComment(summary);
            }
        } catch (error) {
            core.error(`Failed to post review: ${error}`);
            // Fallback: post everything as a general comment if review fails (e.g., bad line numbers)
            await this.postComment(`${summary}\n\n**Note:** Failed to post inline comments. Here are the details:\n${JSON.stringify(comments, null, 2)}`);
        }
    }
}
