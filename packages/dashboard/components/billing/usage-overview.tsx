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
          <div className="flex justify-between text-sm">
            <span className="font-medium">PRs Processed</span>
            <span className="text-muted-foreground">{usage.prsUsed} / {usage.prsLimit === -1 ? 'Unlimited' : usage.prsLimit}</span>
          </div>
          {usage.prsLimit !== -1 && (
            <Progress value={prPercentage} className="h-2" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Tokens Consumed</span>
            <span className="text-muted-foreground">{usage.tokensUsed.toLocaleString()} / {usage.tokensLimit === -1 ? 'Unlimited' : usage.tokensLimit.toLocaleString()}</span>
          </div>
          {usage.tokensLimit !== -1 && (
            <Progress value={tokenPercentage} className="h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
