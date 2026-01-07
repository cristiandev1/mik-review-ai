'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BillingPlan, billingApi } from '@/lib/api/billing';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CurrentPlanProps {
  plan: BillingPlan | null;
  isLoading: boolean;
  onManageSubscription?: () => void;
}

export function CurrentPlan({ plan, isLoading, onManageSubscription }: CurrentPlanProps) {
  const [isCanceling, setIsCanceling] = useState(false);
  // const { toast } = useToast();

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.')) return;
    
    setIsCanceling(true);
    try {
      await billingApi.cancelSubscription();
      window.location.reload(); // Simple reload to refresh state
    } catch (error) {
      console.error('Failed to cancel', error);
      alert('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
           <div className="h-6 bg-muted animate-pulse rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
           <div className="h-20 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) return null;

  const isTrial = plan.plan === 'trial';
  const isActive = plan.status === 'active' || plan.status === 'trialing';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
            plan.plan === 'pro' ? 'bg-primary text-primary-foreground' : 
            plan.plan === 'hobby' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {plan.plan}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{plan.status ? plan.status.replace('_', ' ') : 'Unknown'}</p>
          </div>
          {plan.currentPeriodEnd && (
            <div>
              <p className="text-muted-foreground">{plan.status && plan.status === 'canceled' ? 'Ends on' : 'Renews on'}</p>
              <p className="font-medium">{new Date(plan.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
          )}
          {!isTrial && (
            <div>
              <p className="text-muted-foreground">Seats Purchased</p>
              <p className="font-medium">{plan.seatsPurchased}</p>
            </div>
          )}
          {!isTrial && (
            <div>
              <p className="text-muted-foreground">Seats Used</p>
              <p className="font-medium">{plan.seatsUsed}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        {isTrial ? (
            <Button className="w-full" onClick={onManageSubscription}>Upgrade Plan</Button>
        ) : (
            <>
                <Button variant="outline" onClick={handleCancel} disabled={isCanceling || plan.status === 'canceled'}>
                  {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancel Subscription
                </Button>
                {/* Stripe Customer Portal Link could go here if available */}
                {plan.updatePaymentUrl && (
                  <Button variant="secondary" onClick={() => window.open(plan.updatePaymentUrl, '_blank', 'noopener,noreferrer')}>
                    Manage Payment
                  </Button>
                )}
            </>
        )}
      </CardFooter>
    </Card>
  );
}
