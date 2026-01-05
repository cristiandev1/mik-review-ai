import { CheckCircle } from 'lucide-react';

interface FormSuccessProps {
  message: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div className="p-4 rounded-md bg-green-50 border border-green-200 flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-green-800">{message}</p>
    </div>
  );
}
