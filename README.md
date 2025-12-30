# Mik Review AI

An automated code review assistant powered by OpenAI, designed to run as a GitHub Action.

## Features

- **Automated Reviews**: Analyzes PR diffs and provides feedback.
- **Customizable Rules**: Define your own code style and review guidelines in a Markdown file.
- **Model Agnostic**: Configurable model (defaults to `gpt-4o`).

## Usage

Add this action to your workflow file (e.g., `.github/workflows/review.yml`):

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run AI Review
        uses: ./ # Or use your-username/mik-review-ai@main if published
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          rules_file: '.github/CODE_REVIEW_RULES.md' # Optional: path to your rules
          model_name: 'gpt-4o' # Optional
```

## Configuration

Create a file (default: `.review-rules.md`) in your repository to guide the AI:

```markdown
# Code Review Guidelines

- Ensure all functions have type annotations.
- Check for proper error handling in async functions.
- Verify that no secrets are hardcoded.
- Prefer functional programming patterns where possible.
```

## Development

1.  **Install dependencies**: `npm install`
2.  **Build**: `npm run build`
3.  **Test locally**: create a `.env` file with `OPENAI_API_KEY` and `GITHUB_TOKEN`.
