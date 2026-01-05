'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailVerificationBannerProps {
  emailVerified?: boolean;
  email?: string;
}

export function EmailVerificationBanner({
  emailVerified = true,
  email = '',
}: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show if email is verified or already dismissed
  if (emailVerified || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        alert('Verification email sent! Check your inbox.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      alert('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-200">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Please verify your email address
            </p>
            <p className="text-xs text-yellow-700">
              Verification email sent to {email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResendEmail}
            disabled={loading}
            className="text-yellow-700 hover:bg-yellow-100"
          >
            {loading ? 'Sending...' : 'Resend'}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-yellow-100 rounded"
          >
            <X className="h-4 w-4 text-yellow-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
