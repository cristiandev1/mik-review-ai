'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

interface Repository {
  id: string;
  fullName: string;
}

export default function NewCustomRulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    repository: '',
    content: DEFAULT_RULE_TEMPLATE,
  });

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repositories?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setRepositories(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch repositories', err);
    }
  };

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
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {formData.repository
                      ? repositories.find((repo) => repo.fullName === formData.repository)?.fullName || formData.repository
                      : "Select repository (or leave empty for global)..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search repository..." />
                    <CommandList>
                      <CommandEmpty>No repository found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="global"
                          onSelect={() => {
                            setFormData({ ...formData, repository: "" })
                            setOpenCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.repository === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Global Rule (All Repositories)
                        </CommandItem>
                        {repositories.map((repo) => (
                          <CommandItem
                            key={repo.id}
                            value={repo.fullName}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, repository: currentValue })
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.repository === repo.fullName ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {repo.fullName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Select a synced repository to apply this rule only to that specific repo.
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
