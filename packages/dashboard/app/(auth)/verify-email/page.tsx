'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { FormError } from '@/components/auth/form-error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendEmail = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend email');
      }

      setError('');
      setStatus('success');
      // Show temporary success message
      setTimeout(() => {
        setStatus('error');
        setError('Verification email sent! Check your inbox.');
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {status === 'loading' && (
        <div className="text-center space-y-4">
          <Icons.spinner className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Verifying email</h1>
            <p className="text-sm text-muted-foreground">Please wait while we verify your email address...</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center space-y-4">
          <Icons.check className="h-12 w-12 text-green-600 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Email verified!</h1>
            <p className="text-sm text-muted-foreground">Your email has been successfully verified. Redirecting to dashboard...</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Verification failed</h1>
            <p className="text-sm text-muted-foreground">The verification link may have expired or is invalid.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Request a new verification email:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resendLoading}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                />
                <Button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                >
                  {resendLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Resend
                </Button>
              </div>
            </div>

            <Link href="/login" className="flex items-center justify-center h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors w-full text-sm font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col space-y-6 text-center">
          <Icons.spinner className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Loading...</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
