'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { UsageLimitWarningBanner } from "@/components/usage-limit-warning-banner"

interface DashboardStats {
  totalReviews: number;
  reviewsThisMonth: number;
  successRate: number;
  avgProcessingTime: number;
  rateLimit: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: string;
  };
  recentReviews: Array<{
    id: string;
    repository: string;
    pullRequest: number;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex h-[50vh] w-full items-center justify-center">
            <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your code review activity and usage.
        </p>
      </div>

      <UsageLimitWarningBanner
        used={stats.rateLimit.used}
        limit={stats.rateLimit.limit}
        resetDate={stats.rateLimit.resetAt}
        plan="free"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reviews
            </CardTitle>
            <Icons.gitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime reviews processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
            <Icons.analytics className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Reviews processed this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Icons.spinner className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average successful reviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Time
            </CardTitle>
            <Icons.settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
             {stats.recentReviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet.</p>
             ) : (
                 <div className="space-y-4">
                    {stats.recentReviews.map((review) => (
                        <div key={review.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{review.repository}</p>
                                <p className="text-sm text-muted-foreground">PR #{review.pullRequest}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    review.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    review.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    {review.status}
                                </span>
                                <Link href={`/dashboard/reviews/${review.id}`}>
                                  <Button variant="ghost" size="sm">View Details</Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                 </div>
             )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trial Usage</CardTitle>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                stats.rateLimit.used >= stats.rateLimit.limit
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : (stats.rateLimit.used / stats.rateLimit.limit) >= 0.8
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {stats.rateLimit.used >= stats.rateLimit.limit ? 'Limit Reached' :
                 (stats.rateLimit.used / stats.rateLimit.limit) >= 0.8 ? 'Near Limit' :
                 'Available'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Free Reviews (Total)</span>
                    <span className="font-medium">{stats.rateLimit.used} / {stats.rateLimit.limit}</span>
                </div>
                 <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                        className={`h-full rounded-full transition-all ${
                          stats.rateLimit.used >= stats.rateLimit.limit ? 'bg-red-500' :
                          (stats.rateLimit.used / stats.rateLimit.limit) >= 0.8 ? 'bg-amber-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${Math.min((stats.rateLimit.used / stats.rateLimit.limit) * 100, 100)}%` }}
                    />
                 </div>
                 <p className="text-xs text-muted-foreground">
                    You have {stats.rateLimit.limit} free code reviews included with your trial.
                 </p>
                 {stats.rateLimit.used >= stats.rateLimit.limit && (
                   <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-xs text-red-700 dark:text-red-400">
                     You&apos;ve used all your free trial reviews. Upgrade your plan to continue processing code reviews.
                   </div>
                 )}
                 {(stats.rateLimit.used / stats.rateLimit.limit) >= 0.8 && stats.rateLimit.used < stats.rateLimit.limit && (
                   <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-700 dark:text-amber-400">
                     You&apos;ve used {stats.rateLimit.used} of {stats.rateLimit.limit} free reviews. Upgrade to unlock unlimited reviews.
                   </div>
                 )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}