'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface Repository {
  id: string;
  fullName: string;
}

export default function EditCustomRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    repository: '',
    content: '',
    isActive: true,
  });

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

  const fetchRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-rules/${ruleId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch custom rule');
      }

      setFormData({
        name: data.data.name,
        repository: data.data.repository || '',
        content: data.data.content,
        isActive: data.data.isActive,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
    if (ruleId) {
      fetchRule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId]);

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
        isActive: formData.isActive,
      };

      // Only include repository if provided
      if (formData.repository.trim()) {
        payload.repository = formData.repository.trim();
      } else {
        payload.repository = null; // Explicitly set to null for global if empty
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update custom rule');
      }

      router.push('/dashboard/custom-rules');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold tracking-tight">Edit Custom Rule</h2>
          <p className="text-muted-foreground">Update your code review rule.</p>
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
            Update your custom rule settings. Leave repository empty for a global rule.
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (use this rule for reviews)
              </Label>
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
                Update Rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
