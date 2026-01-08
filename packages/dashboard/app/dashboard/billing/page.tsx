'use client';

import { CurrentPlan } from '@/components/billing/current-plan';
import { PricingPlans } from '@/components/billing/pricing-plans';
import { UsageOverview } from '@/components/billing/usage-overview';
import { BillingPlan, BillingUsage, billingApi } from '@/lib/api/billing';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: plan, isLoading: isPlanLoading, refetch: refetchPlan } = useQuery<BillingPlan>({
    queryKey: ['billing-plan'],
    queryFn: billingApi.getPlan,
  });

  const { data: usage, isLoading: isUsageLoading, refetch: refetchUsage } = useQuery<BillingUsage>({
    queryKey: ['billing-usage'],
    queryFn: billingApi.getUsage,
  });

  // Check for successful payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setShowSuccessMessage(true);
      // Refetch plan and usage data to reflect the new subscription
      refetchPlan();
      refetchUsage();
      // Remove session_id from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      router.replace(url.pathname);

      // Hide success message after 10 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
    }
  }, [searchParams, refetchPlan, refetchUsage, router]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">Manage your plan, billing details, and view usage.</p>
      </div>

      {showSuccessMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">Payment successful!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Your subscription has been activated. Thank you for subscribing!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <CurrentPlan 
          plan={plan || null} 
          isLoading={isPlanLoading} 
          onManageSubscription={() => setIsUpgradeModalOpen(true)}
        />
        <UsageOverview 
          usage={usage || null} 
          isLoading={isUsageLoading} 
        />
      </div>

      {plan?.plan === 'trial' && (
         <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-col space-y-1.5 p-6 pt-0">
               <h3 className="text-2xl font-semibold leading-none tracking-tight">Upgrade Plan</h3>
               <p className="text-sm text-muted-foreground">Choose a plan that fits your needs.</p>
            </div>
            <div className="p-6 pt-0">
               <PricingPlans />
            </div>
         </div>
      )}

       <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade your plan</DialogTitle>
            <DialogDescription>
              Choose the best plan for your team.
            </DialogDescription>
          </DialogHeader>
          <PricingPlans />
        </DialogContent>
      </Dialog>
    </div>
  );
}
