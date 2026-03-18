import { AlertTriangle } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'حدث خطأ أثناء تحميل البيانات', onRetry }: Props) {
  return (
    <div className="card card-body text-center">
      <AlertTriangle size={40} className="text-red-400 mb-3 mx-auto" />
      <p className="text-gray-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm mx-auto">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
