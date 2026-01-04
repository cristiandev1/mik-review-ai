'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Icons } from "@/components/icons"

const DEFAULT_RULE_TEMPLATE = `# Code Review Guidelines

You are acting as a Senior Software Engineer. Review the code based on the following guidelines.
Focus on code quality, performance, security, and maintainability.

## Focus Areas
- **Security**: No hardcoded secrets, proper input validation
- **Performance**: Efficient algorithms, no N+1 queries
- **Code Quality**: DRY principle, SOLID principles, proper error handling
- **Best Practices**: Follow language-specific conventions

## Review Format
Provide actionable feedback with:
1. Clear description of the issue
2. Why it matters
3. Suggested improvement
`;

export default function NewCustomRulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    repository: '',
    content: DEFAULT_RULE_TEMPLATE,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Prepare payload
      const payload: any = {
        name: formData.name,
        content: formData.content,
      };

      // Only include repository if provided
      if (formData.repository.trim()) {
        payload.repository = formData.repository.trim();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create custom rule');
      }

      router.push('/dashboard/custom-rules');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <Icons.gitBranch className="mr-2 h-4 w-4 rotate-180" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Custom Rule</h2>
          <p className="text-muted-foreground">Define a new code review rule.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rule Details</CardTitle>
          <CardDescription>
            Create a custom rule that will be used during code reviews. Leave repository empty for a global rule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Security Review Rules"
                required
              />
              <p className="text-sm text-muted-foreground">
                A descriptive name for this rule set
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="repository">Repository (Optional)</Label>
              <Input
                id="repository"
                value={formData.repository}
                onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                placeholder="e.g. owner/repo-name"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty for a global rule, or specify a repository (format: owner/repo)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Rule Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your custom review rules in markdown format..."
                required
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Define your custom review guidelines in markdown format. This will be used by the AI to review code.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
