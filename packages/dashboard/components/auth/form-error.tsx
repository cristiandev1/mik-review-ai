import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="p-4 rounded-md bg-red-50 border border-red-200 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-800">{message}</p>
    </div>
  );
}
