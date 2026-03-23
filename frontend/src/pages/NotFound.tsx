import { FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-gray-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">الصفحة غير موجودة</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <div className="flex gap-3">
        <button onClick={() => navigate('/')} className="btn-primary">
          الرئيسية
        </button>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          رجوع
        </button>
      </div>
    </div>
  );
}
