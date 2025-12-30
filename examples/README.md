# Examples

This folder contains ready-to-use templates for different project types.

## Review Rules Templates

Copy the appropriate template to your project root as `.review-rules.md`:

- **`nextjs-review-rules.md`** - For Next.js/React projects
  - Covers React best practices, hooks, Server/Client Components
  - TypeScript strict mode enforcement
  - Security (XSS, secrets)
  - Performance optimizations

- **`nodejs-review-rules.md`** - For Node.js/TypeScript backend projects
  - Async/await patterns
  - Database query optimization
  - Security (SQL injection, CORS, rate limiting)
  - Error handling

- **`python-review-rules.md`** - For Python projects
  - PEP 8 compliance
  - Type hints and docstrings
  - Security (eval/exec, SQL injection)
  - Performance (generators, built-ins)

## Workflow Examples

Copy the appropriate workflow to your project at `.github/workflows/ai-review.yml`:

- **`nextjs-workflow.yml`** - For Next.js projects
- **`python-workflow.yml`** - For Python projects

All workflows use the same structure. Just ensure you:
1. Set the `OPENAI_API_KEY` secret in your repository
2. Have a `.review-rules.md` file in your project root

## Customization

Feel free to mix and match! You can:
- Start with a template and modify it for your team's specific needs
- Combine rules from different templates if you have a polyglot project
- Create entirely custom rules for your unique tech stack

## Quick Setup

1. Choose your review rules template and copy to your project:
   ```bash
   cp examples/nextjs-review-rules.md /path/to/your/project/.review-rules.md
   ```

2. Copy the workflow:
   ```bash
   cp examples/nextjs-workflow.yml /path/to/your/project/.github/workflows/ai-review.yml
   ```

3. Add `OPENAI_API_KEY` to your repository secrets

4. Open a PR and watch the AI review your code!
