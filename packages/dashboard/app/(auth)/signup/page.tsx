'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { FormError } from '@/components/auth/form-error';
import { FormSuccess } from '@/components/auth/form-success';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
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

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setApiError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Signup failed');
      }

      // Store token and user
      localStorage.setItem('token', responseData.data.token);
      localStorage.setItem('user', JSON.stringify(responseData.data.user));
      localStorage.setItem('apiKey', responseData.data.apiKey);

      setSuccess(true);
      setShowSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setApiError('GitHub Client ID not configured');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'user:email repo';

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="flex flex-col space-y-2">
          <Icons.check className="h-12 w-12 text-green-600 mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight">Account created!</h1>
          <p className="text-sm text-muted-foreground">
            Verification email sent to your inbox
          </p>
        </div>
        <div className="space-y-3 text-left">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Next steps:</p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Check your email for a verification link</li>
              <li>Click the link to verify your email address</li>
              <li>Once verified, you&apos;ll have full access to the platform</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to get started
        </p>
      </div>

      <div className="grid gap-6">
        <FormError message={apiError} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                disabled={loading}
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={loading}
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <PasswordInput
              label="Password"
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

            <Button disabled={loading || success} className="w-full">
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" disabled={loading || success} onClick={handleGithubLogin}>
          <Icons.github className="mr-2 h-4 w-4" />
          GitHub
        </Button>

        <p className="px-4 text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
          Sign in
        </Link>
      </p>
    </>
  );
}