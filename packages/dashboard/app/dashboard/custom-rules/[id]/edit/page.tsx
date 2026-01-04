'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function EditCustomRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    repository: '',
    content: '',
    isActive: true,
  });

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
