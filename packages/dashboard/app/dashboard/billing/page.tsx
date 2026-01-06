'use client';

import { CurrentPlan } from '@/components/billing/current-plan';
import { PricingPlans } from '@/components/billing/pricing-plans';
import { UsageOverview } from '@/components/billing/usage-overview';
import { BillingPlan, BillingUsage, billingApi } from '@/lib/api/billing';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: plan, isLoading: isPlanLoading } = useQuery<BillingPlan>({
    queryKey: ['billing-plan'],
    queryFn: billingApi.getPlan,
  });

  const { data: usage, isLoading: isUsageLoading } = useQuery<BillingUsage>({
    queryKey: ['billing-usage'],
    queryFn: billingApi.getUsage,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">Manage your plan, billing details, and view usage.</p>
      </div>

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
