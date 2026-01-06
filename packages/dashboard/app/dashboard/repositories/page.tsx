'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Icons } from "@/components/icons"
import { SeatManagement } from '@/components/billing/seat-management';

interface GitHubRepository {
  githubRepoId: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
  language: string | null;
  htmlUrl: string;
  updatedAt: string;
}

interface SyncedRepository {
  id: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  isPrivate: boolean;
  isEnabled: boolean;
  allowedUsernames: string[] | null;
  excludedFilePatterns: string[] | null;
  defaultBranch: string;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  seatMode?: 'whitelist' | 'auto-add';
  maxSeats?: number;
}

export default function RepositoriesPage() {
  const [syncedRepos, setSyncedRepos] = useState<SyncedRepository[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [showGithubRepos, setShowGithubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<SyncedRepository | null>(null);
  const [excludedFilePatternsInput, setExcludedFilePatternsInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchSyncedRepositories();
  }, []);

  const fetchSyncedRepositories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repositories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch repositories');
      }

      setSyncedRepos(data.data || []);
    } catch (err: any) {
      setError(err.message);
      setSyncedRepos([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubRepositories = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/github/repositories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub repositories');
      }

      setGithubRepos(data.data || []);
      setShowGithubRepos(true);
    } catch (err: any) {
      setError(err.message);
      setGithubRepos([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const syncRepository = async (repo: GitHubRepository) => {
    setSyncingId(repo.githubRepoId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repositories/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubRepoId: repo.githubRepoId,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner,
          description: repo.description,
          isPrivate: repo.isPrivate,
          defaultBranch: repo.defaultBranch,
          language: repo.language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync repository');
      }

      // Refresh synced repos
      await fetchSyncedRepositories();

      // Remove from GitHub repos list
      setGithubRepos(prev => prev.filter(r => r.githubRepoId !== repo.githubRepoId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const toggleRepository = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repositories/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update repository');
      }

      fetchSyncedRepositories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteRepository = async (id: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repositories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete repository');
      }

      fetchSyncedRepositories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openSettings = (repo: SyncedRepository) => {
    setEditingRepo(repo);
    setExcludedFilePatternsInput(repo.excludedFilePatterns?.join('\n') || '');
    setIsSettingsOpen(true);
  };

  const saveSettings = async () => {
    if (!editingRepo) return;

    setSavingSettings(true);
    setError('');

    try {
      // Parse excluded file patterns: split by newline or comma, trim, and filter empty
      const excludedPatterns = excludedFilePatternsInput
        .split(/[\n,]+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/repositories/${editingRepo.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          excludedFilePatterns: excludedPatterns
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update repository settings');
      }

      // Update local state immediately for instant UI feedback
      setSyncedRepos(syncedRepos.map(repo =>
        repo.id === editingRepo.id
          ? { ...repo, excludedFilePatterns: excludedPatterns }
          : repo
      ));

      setIsSettingsOpen(false);
      // Refetch in background to ensure consistency
      fetchSyncedRepositories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredGithubRepos = (githubRepos || []).filter(repo =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSyncedRepos = (syncedRepos || []).filter(repo =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && !showGithubRepos) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Repositories</h2>
           <p className="text-muted-foreground">Manage which repositories have code review enabled.</p>
        </div>
        <Button onClick={fetchGitHubRepositories} disabled={loading}>
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          <Icons.github className="mr-2 h-4 w-4" />
          Sync from GitHub
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Synced Repositories */}
      <Card>
        <CardHeader>
          <CardTitle>Your Repositories</CardTitle>
          <CardDescription>
            Repositories synced from GitHub. Toggle to enable/disable code reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSyncedRepos.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                       No repositories synced yet. Click &quot;Sync from GitHub&quot; to get started.
                     </TableCell>
                   </TableRow>
                ) : (
                    filteredSyncedRepos.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{repo.fullName}</span>
                            {repo.description && (
                              <span className="text-xs text-muted-foreground">{repo.description}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {repo.language ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {repo.language}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            repo.isPrivate
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {repo.isPrivate ? 'Private' : 'Public'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleRepository(repo.id, repo.isEnabled)}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                              repo.isEnabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900/50'
                            }`}
                          >
                            {repo.isEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2"
                            onClick={() => openSettings(repo)}
                          >
                            <Icons.settings className="h-4 w-4" />
                            <span className="sr-only">Settings</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteRepository(repo.id)}
                          >
                            <Icons.trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Repositories (not synced yet) */}
      {showGithubRepos && (
        <Card>
          <CardHeader>
            <CardTitle>Available GitHub Repositories</CardTitle>
            <CardDescription>
              Repositories from your GitHub account. Click &quot;Sync&quot; to add them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGithubRepos.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                         {searchQuery ? 'No repositories match your search.' : 'All repositories are already synced'}
                       </TableCell>
                     </TableRow>
                  ) : (
                      filteredGithubRepos.map((repo) => (
                        <TableRow key={repo.githubRepoId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{repo.fullName}</span>
                              {repo.description && (
                                <span className="text-xs text-muted-foreground">{repo.description}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {repo.language ? (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {repo.language}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              repo.isPrivate
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {repo.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => syncRepository(repo)}
                              disabled={syncingId === repo.githubRepoId}
                            >
                              {syncingId === repo.githubRepoId && (
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Sync
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Repository Settings</DialogTitle>
            <DialogDescription>
              Configure settings for <span className="font-semibold">{editingRepo?.fullName}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
             {/* Excluded File Patterns Section */}
             <div className="space-y-2">
              <Label htmlFor="excludedPatterns" className="text-sm font-medium">
                Excluded File Patterns
              </Label>
              <p className="text-xs text-muted-foreground">
                Files matching these patterns will be excluded from AI review. This helps save tokens on generated/build files.
                Enter one pattern per line (e.g., .test, .mocks, .freezed, dist/)
              </p>
              <Textarea
                id="excludedPatterns"
                value={excludedFilePatternsInput}
                onChange={(e) => setExcludedFilePatternsInput(e.target.value)}
                placeholder=".test&#10;.spec&#10;.mocks&#10;.freezed&#10;.g.dart&#10;dist/&#10;build/"
                rows={5}
                className="font-mono text-sm"
              />
              {editingRepo?.excludedFilePatterns && editingRepo.excludedFilePatterns.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Currently excluding: {editingRepo.excludedFilePatterns.length} pattern(s)
                </div>
              )}
               <div className="flex justify-end pt-2">
                 <Button onClick={saveSettings} disabled={savingSettings} size="sm">
                   {savingSettings && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                   Save Patterns
                 </Button>
               </div>
            </div>

            <div className="border-t pt-6">
                <SeatManagement 
                    repositoryId={editingRepo?.id || ''} 
                    initialMode={editingRepo?.seatMode || 'auto-add'}
                    initialMaxSeats={editingRepo?.maxSeats || 5}
                />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
