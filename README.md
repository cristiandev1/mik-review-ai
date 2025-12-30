# Mik Review AI

An automated code review assistant powered by OpenAI, designed to run as a GitHub Action on pull requests.

## Features

- **Automated Reviews**: Analyzes PR diffs and provides intelligent feedback
- **Customizable Rules**: Define your own code style and review guidelines in a Markdown file
- **Inline Comments**: Posts comments directly on specific lines of changed code
- **Multi-Language Support**: Works with any programming language (customize rules for your stack)
- **Model Agnostic**: Configurable OpenAI model (defaults to `gpt-4o`)

## Quick Start

### 1. Add the Workflow to Your Project

Create a workflow file in your repository at `.github/workflows/ai-review.yml`:

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
        uses: cristiancastro/mik-review-ai@main  # Or use your fork/username
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          rules_file: '.review-rules.md'  # Optional: defaults to .review-rules.md
          model_name: 'gpt-4o'  # Optional: defaults to gpt-4o
```

### 2. Configure Your OpenAI API Key

1. Go to your repository's **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (get it from [platform.openai.com](https://platform.openai.com/api-keys))
5. Click **Add secret**

The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

### 3. Create Review Rules File

Create a `.review-rules.md` file in the root of **your project** (the one being reviewed):

```markdown
# Code Review Guidelines

You are acting as a Senior Software Engineer. Review the code based on the following guidelines:

## 1. Code Quality
- Ensure no code duplication (DRY principle)
- Check for proper error handling
- Verify naming conventions are consistent

## 2. Security
- No hardcoded secrets or API keys
- Proper input validation and sanitization

## 3. Performance
- Look for inefficient algorithms or unnecessary computations

## Tone
- Be objective and direct
- Use "Critical:", "Improvement:", or "Note:" prefixes
```

**See the `examples/` folder for ready-to-use templates:**
- `examples/nextjs-review-rules.md` - For Next.js/React projects
- `examples/nodejs-review-rules.md` - For Node.js/TypeScript backend
- `examples/python-review-rules.md` - For Python projects

You can copy these directly to your project and customize as needed.

## Configuration Options

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `openai_api_key` | Yes | - | Your OpenAI API key (set as repository secret) |
| `github_token` | Yes | - | GitHub token (use `${{ secrets.GITHUB_TOKEN }}`) |
| `rules_file` | No | `.review-rules.md` | Path to your review rules file |
| `model_name` | No | `gpt-4o` | OpenAI model to use (e.g., `gpt-4o`, `gpt-4o-mini`) |

## How It Works

1. When a PR is opened or updated, the action fetches the diff
2. It reads your custom review rules from `.review-rules.md` in your project
3. Sends the diff + rules to OpenAI for analysis
4. Posts a summary comment on the PR
5. Adds inline comments on specific lines where issues are found

## Examples

### Example 1: Next.js Project

1. Copy `examples/nextjs-review-rules.md` to your Next.js project root as `.review-rules.md`
2. Add the workflow file above to `.github/workflows/ai-review.yml`
3. Add your `OPENAI_API_KEY` to repository secrets
4. Open a PR and watch the AI review your code

### Example 2: Python Project

1. Copy `examples/python-review-rules.md` to your Python project as `.review-rules.md`
2. Follow the same workflow setup
3. The AI will review your Python code following PEP 8 and best practices

### Example 3: Custom Rules

Create your own `.review-rules.md` tailored to your team's standards:

```markdown
# Our Team's Code Review Rules

## Architecture
- All API endpoints must use our ErrorHandler middleware
- Database queries must use our QueryBuilder class

## Testing
- Every new feature requires unit tests
- Integration tests for all API endpoints

## Documentation
- Public functions must have JSDoc comments
```

## Using in Different Projects

This action is designed to be **language-agnostic**. Each project that uses it should:

1. Have its own `.review-rules.md` file (not shared between projects)
2. Configure its own `OPENAI_API_KEY` in repository secrets
3. Customize the rules based on the project's language/framework

**The action reads the review rules from the repository being reviewed, not from this action's repository.**

## Publishing Your Fork

If you fork this action and want to use it:

### Option 1: Use Directly from GitHub

```yaml
- uses: your-username/mik-review-ai@main
```

### Option 2: Publish to GitHub Marketplace

1. Push your changes to GitHub
2. Create a release (tag it as `v1`, `v1.0.0`, etc.)
3. Publish to GitHub Marketplace from the repository page

## Development

### Local Testing

1. Clone this repository
2. Install dependencies: `npm install`
3. Create `.env` file:
   ```
   OPENAI_API_KEY=your-key-here
   GITHUB_TOKEN=your-github-token
   ```
4. Make changes to `src/`
5. Build: `npm run build`
6. Test: Create a PR in this repo to trigger the workflow

### Building

The action uses `@vercel/ncc` to compile everything into a single `dist/index.js` file:

```bash
npm run build
```

Always commit the `dist/` folder after building.

## License

ISC

## Contributing

Pull requests are welcome! Please ensure you:
1. Run `npm run build` before committing
2. Test your changes on a real PR
3. Update documentation if needed

## Support

If you encounter issues:
1. Check that your `OPENAI_API_KEY` is set correctly in repository secrets
2. Verify the `.review-rules.md` file exists in your project root
3. Check the action logs in the GitHub Actions tab

For bugs or feature requests, open an issue on GitHub.
