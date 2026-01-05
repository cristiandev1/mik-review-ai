'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { FormError } from '@/components/auth/form-error';
import { FormSuccess } from '@/components/auth/form-success';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setApiError('No reset token provided');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setApiError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to reset password');
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="flex flex-col space-y-6">
        <FormError message={apiError} />
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground">
            The reset link may have expired. Please request a new one.
          </p>
        </div>

        <Link href="/forgot-password" className="flex items-center justify-center h-10 px-4 py-2 rounded-md border border-input bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full text-sm font-medium">
          Request New Link
        </Link>

        <Link href="/login" className="flex items-center justify-center h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors w-full text-sm font-medium">
          Back to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="text-center space-y-2">
          <Icons.check className="h-12 w-12 text-green-600 mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight">Password reset!</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your account
        </p>
      </div>

      <div className="grid gap-6">
        <FormError message={apiError} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3">
            {/* Password Field */}
            <PasswordInput
              label="New Password"
              value={password}
              onChange={() => {}}
              placeholder="Create a strong password"
              error={errors.password?.message}
              required
            />
            {password && <PasswordStrength password={password} />}

            {/* Confirm Password Field */}
            <PasswordInput
              label="Confirm Password"
              value={watch('confirmPassword')}
              onChange={() => {}}
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              required
            />

            <Button disabled={loading} className="w-full">
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>

        <Link href="/login" className="flex items-center justify-center h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors w-full text-sm font-medium">
          Back to Login
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
