import { Loader2 } from 'lucide-react';

type Variant = 'spinner' | 'dots' | 'pulse';

interface Props {
  size?: number;
  className?: string;
  variant?: Variant;
  message?: string;
}

export default function LoadingSpinner({ size = 24, className = '', variant = 'spinner', message }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
      {variant === 'spinner' && (
        <Loader2 size={size} className="animate-spin text-primary-600" />
      )}
      {variant === 'dots' && (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
      {variant === 'pulse' && (
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-4 border-primary-100" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
      )}
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
