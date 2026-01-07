'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BillingUsage } from '@/lib/api/billing';

interface UsageOverviewProps {
  usage: BillingUsage | null;
  isLoading: boolean;
}

export function UsageOverview({ usage, isLoading }: UsageOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
           <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const prPercentage = Math.min(100, (usage.prsUsed / usage.prsLimit) * 100);
  const tokenPercentage = Math.min(100, (usage.tokensUsed / usage.tokensLimit) * 100);

  const prLimitReached = usage.prsLimit !== -1 && usage.prsUsed >= usage.prsLimit;
  const prNearLimit = usage.prsLimit !== -1 && prPercentage >= 80;
  const tokenLimitReached = usage.tokensLimit !== -1 && usage.tokensUsed >= usage.tokensLimit;
  const tokenNearLimit = usage.tokensLimit !== -1 && tokenPercentage >= 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Usage</CardTitle>
        <CardDescription>
          Usage for {usage.billingMonth}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">PRs Processed</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${prLimitReached ? 'text-red-600 font-semibold' : prNearLimit ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                {usage.prsUsed} / {usage.prsLimit === -1 ? 'Unlimited' : usage.prsLimit}
              </span>
              {prLimitReached && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Limit Reached
                </span>
              )}
              {prNearLimit && !prLimitReached && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Near Limit
                </span>
              )}
            </div>
          </div>
          {usage.prsLimit !== -1 && (
            <Progress
              value={prPercentage}
              className="h-2"
              style={{
                backgroundColor: prLimitReached ? 'rgb(239, 68, 68)' : prNearLimit ? 'rgb(245, 158, 11)' : 'rgb(59, 130, 246)'
              }}
            />
          )}
          {prLimitReached && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-xs text-red-700 dark:text-red-400">
              You&apos;ve reached your PR limit for this month. Upgrade your plan to process more reviews.
            </div>
          )}
          {prNearLimit && !prLimitReached && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-700 dark:text-amber-400">
              You&apos;re using {Math.round(prPercentage)}% of your monthly PR limit.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Tokens Consumed</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${tokenLimitReached ? 'text-red-600 font-semibold' : tokenNearLimit ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                {usage.tokensUsed.toLocaleString()} / {usage.tokensLimit === -1 ? 'Unlimited' : usage.tokensLimit.toLocaleString()}
              </span>
              {tokenLimitReached && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Limit Reached
                </span>
              )}
              {tokenNearLimit && !tokenLimitReached && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Near Limit
                </span>
              )}
            </div>
          </div>
          {usage.tokensLimit !== -1 && (
            <Progress
              value={tokenPercentage}
              className="h-2"
              style={{
                backgroundColor: tokenLimitReached ? 'rgb(239, 68, 68)' : tokenNearLimit ? 'rgb(245, 158, 11)' : 'rgb(59, 130, 246)'
              }}
            />
          )}
          {tokenLimitReached && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-xs text-red-700 dark:text-red-400">
              You&apos;ve reached your token limit for this month. Upgrade your plan to continue processing reviews.
            </div>
          )}
          {tokenNearLimit && !tokenLimitReached && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-700 dark:text-amber-400">
              You&apos;re using {Math.round(tokenPercentage)}% of your monthly token limit.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
