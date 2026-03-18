import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
}

export default function PageLoader({ message = 'جاري التحميل...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
      </div>
      <p className="text-sm text-gray-500 animate-pulse">{message}</p>
    </div>
  );
}
