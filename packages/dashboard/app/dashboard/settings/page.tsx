'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Github, ExternalLink } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: 'free' | 'pro' | 'business';
  emailVerified: boolean;
  githubAccessToken: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

interface DashboardStats {
  totalReviews: number;
  reviewsThisMonth: number;
  successRate: number;
  avgProcessingTime: number;
  rateLimit: {
    limit: number;
    used: number;
    remaining: number;
  };
}

const PLAN_LIMITS = {
  free: 10,
  pro: 1000,
  business: 10000,
};

const PLAN_DETAILS = {
  free: {
    price: '$0',
    features: ['10 reviews/month', '1 repository', 'Basic analytics'],
  },
  pro: {
    price: '$99/month',
    features: ['1,000 reviews/month', 'Unlimited repositories', 'Advanced analytics', 'Custom rules'],
  },
  business: {
    price: 'Custom',
    features: ['10,000 reviews/month', 'Unlimited repositories', 'Premium analytics', '50 team members'],
  },
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      setUser(data.data);
      setDisplayName(data.data.name || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setStats(data.data);
      }
    } catch (err) {
      // Stats are optional, don't show error
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSavingName(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.data);
      setEditingName(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? You won\'t be able to sync repositories.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/github`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disconnect GitHub');
      }

      setUser((prev) => prev ? { ...prev, githubAccessToken: null } : null);
      setSuccess('GitHub account disconnected');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold">Failed to load settings</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const reviewsLimit = PLAN_LIMITS[user.plan];
  const reviewsUsed = stats?.reviewsThisMonth || 0;
  const reviewsRemaining = Math.max(0, reviewsLimit - reviewsUsed);
  const usagePercentage = reviewsLimit > 0 ? (reviewsUsed / reviewsLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and plan</p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-green-50 text-green-800 border border-green-200 flex items-start gap-3">
          <Icons.check className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>{success}</div>
        </div>
      )}

      {/* Profile & Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile & Account</CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="gap-2"
                >
                  {savingName && <Icons.spinner className="h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditingName(false);
                    setDisplayName(user.name || '');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                <span>{user.name || 'Not set'}</span>
                <Button onClick={() => setEditingName(true)} variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex items-center justify-between p-3 rounded-md border bg-background">
              <div>
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-muted-foreground">
                  {user.emailVerified ? '✓ Verified' : '○ Not verified'}
                </div>
              </div>
            </div>
          </div>

          {/* Account Created */}
          <div className="space-y-2">
            <Label>Account Created</Label>
            <div className="p-3 rounded-md border bg-background">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* GitHub Connection */}
          <div className="space-y-2">
            <Label>GitHub Connection</Label>
            <div className="flex items-center justify-between p-3 rounded-md border bg-background">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <span>{user.githubAccessToken ? 'Connected' : 'Not connected'}</span>
              </div>
              {user.githubAccessToken && (
                <Button
                  onClick={handleDisconnectGithub}
                  variant="destructive"
                  size="sm"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle>Plan & Usage</CardTitle>
          <CardDescription>Monitor your usage and manage your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="space-y-2">
            <Label>Current Plan</Label>
            <div className="p-3 rounded-md border bg-background">
              <div className="font-medium capitalize">{user.plan} Plan</div>
              <div className="text-sm text-muted-foreground">
                {PLAN_DETAILS[user.plan].price}
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLAN_DETAILS[user.plan].features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Icons.check className="h-4 w-4 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Usage */}
          {stats && (
            <div className="space-y-2">
              <Label>Reviews Usage This Month</Label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {reviewsUsed} of {reviewsLimit} reviews used
                  </span>
                  <span className="text-muted-foreground">{Math.round(usagePercentage)}%</span>
                </div>
                <Progress value={usagePercentage} />
                <p className="text-xs text-muted-foreground">
                  {reviewsRemaining} reviews remaining
                </p>
              </div>
            </div>
          )}

          {/* Upgrade Button */}
          {user.plan === 'free' && (
            <div className="p-3 rounded-md border bg-accent/50">
              <p className="text-sm mb-3">Need more reviews? Upgrade to Pro or Business plan.</p>
              <Button className="w-full" variant="default">
                Upgrade Plan <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
