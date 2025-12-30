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
}
