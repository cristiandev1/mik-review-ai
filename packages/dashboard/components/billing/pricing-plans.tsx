'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { billingApi } from '@/lib/api/billing';
import { Loader2 } from 'lucide-react';

interface PricingPlansProps {
  onCheckout?: () => void;
}

export function PricingPlans({ onCheckout }: PricingPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<'hobby' | 'pro' | null>(null);

  const handleSubscribe = async (plan: 'hobby' | 'pro') => {
    setLoadingPlan(plan);
    try {
      const session = await billingApi.createCheckout({
        plan,
        seats: 1, // Default to 1 seat
      });
      window.location.href = session.url;
    } catch (error) {
      console.error('Checkout failed', error);
      alert('Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Hobby</CardTitle>
          <CardDescription>Perfect for individual developers and small projects.</CardDescription>
          <div className="mt-4 text-3xl font-bold">$5<span className="text-sm font-normal text-muted-foreground">/seat/mo</span></div>
        </CardHeader>
        <CardContent className="flex-1">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 15 PRs / month per seat</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Unlimited Repositories</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Email Support</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Advanced Analytics</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => handleSubscribe('hobby')} disabled={!!loadingPlan}>
            {loadingPlan === 'hobby' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subscribe to Hobby
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col border-primary shadow-sm">
        <CardHeader>
          <CardTitle>Pro</CardTitle>
          <CardDescription>For growing teams needing more power.</CardDescription>
          <div className="mt-4 text-3xl font-bold">$15<span className="text-sm font-normal text-muted-foreground">/seat/mo</span></div>
        </CardHeader>
        <CardContent className="flex-1">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 100 PRs / month per seat</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Unlimited Repositories</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Priority Support</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Advanced Analytics</li>
            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> API Access</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="default" onClick={() => handleSubscribe('pro')} disabled={!!loadingPlan}>
             {loadingPlan === 'pro' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subscribe to Pro
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
