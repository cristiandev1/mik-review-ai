'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UsageLimitWarningBannerProps {
  used: number;
  limit: number;
  resetDate: string;
  plan: string;
}

export function UsageLimitWarningBanner({
  used,
  limit,
  resetDate,
  plan,
}: UsageLimitWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || limit === -1) {
    return null;
  }

  const percentage = (used / limit) * 100;
  const isAtLimit = used >= limit;
  const isNearLimit = percentage >= 80;

  // Don't show anything if usage is below 80%
  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  const resetDateObj = new Date(resetDate);
  const formattedDate = resetDateObj.toLocaleDateString('pt-BR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (isAtLimit) {
    return (
      <div className="w-full bg-red-50 border-b border-red-200">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                Monthly PR Limit Reached
              </p>
              <p className="text-xs text-red-700 mt-1">
                You have used all {limit} PRs for this month. No more reviews can be processed until {formattedDate}.
              </p>
              {plan === 'trial' && (
                <p className="text-xs text-red-700 mt-2">
                  Upgrade your plan to continue processing code reviews.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {plan === 'trial' && (
              <Link href="/dashboard/billing">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Upgrade Plan
                </Button>
              </Link>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-red-100 rounded"
            >
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Near limit (80-99%)
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              You&apos;re Near Your Monthly Limit
            </p>
            <p className="text-xs text-amber-700 mt-1">
              You have used {used} of {limit} PRs this month ({Math.round(percentage)}%).
              Your limit will reset on {formattedDate}.
            </p>
            {plan === 'trial' && (
              <p className="text-xs text-amber-700 mt-2">
                Consider upgrading your plan to process unlimited reviews.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {plan === 'trial' && (
            <Link href="/dashboard/billing">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                View Plans
              </Button>
            </Link>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-100 rounded"
          >
            <X className="h-4 w-4 text-amber-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
