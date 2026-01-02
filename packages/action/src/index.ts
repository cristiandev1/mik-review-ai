import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
    try {
        // 1. Get Inputs
        const mikApiKey = core.getInput('mik_api_key') || process.env.MIK_REVIEW_API_KEY;
        const githubToken = core.getInput('github_token') || process.env.GITHUB_TOKEN;
        const apiUrl = core.getInput('api_url') || 'https://api.mikreview.com';

        if (!mikApiKey) {
            throw new Error('MIK_REVIEW_API_KEY is required.');
        }

        // 2. Get Context
        const context = github.context;
        const pr = context.payload.pull_request;

        if (!pr) {
            core.info('This action only runs on pull_request events. Skipping.');
            return;
        }

        const { owner, repo } = context.repo;
        const prNumber = pr.number;
        const installationId = context.payload.installation?.id; // Needed if we use GitHub App in the future

        core.info(`Triggering Mik Review AI for ${owner}/${repo} PR #${prNumber}`);

        // 3. Construct Payload
        const payload = {
            repository: `${owner}/${repo}`,
            prNumber: prNumber,
            // If we are using a GitHub App installation, pass the ID.
            // If we are using the Action's GITHUB_TOKEN, we might need to pass it
            // depending on the API strategy. For now, let's pass installationId if available.
            installationId: installationId ? Number(installationId) : undefined,
            // We can also pass the commit SHA to be precise
            commitSha: pr.head.sha
        };

        // 4. Call API
        core.info(`Posting to ${apiUrl}/v1/reviews...`);
        
        const response = await fetch(`${apiUrl}/v1/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': mikApiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        core.info('Review successfully triggered!');
        core.info(`Review ID: ${data.reviewId}`);
        core.info(`Status: ${data.status}`);
        
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unexpected error occurred.');
        }
    }
}

run();
