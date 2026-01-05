'use client';

import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'One uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      label: 'One number (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      label: 'One special character (!@#$%)',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const metCount = requirements.filter((req) => req.met).length;
  const percentage = (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (metCount <= 2) return 'bg-red-500';
    if (metCount <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (metCount <= 2) return 'Weak';
    if (metCount <= 3) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Password strength</label>
          <span className="text-xs font-medium text-muted-foreground">
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getStrengthColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Requirements:</label>
        <ul className="space-y-1">
          {requirements.map((req) => (
            <li
              key={req.label}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              {req.met ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className={req.met ? 'text-green-600 line-through' : ''}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
