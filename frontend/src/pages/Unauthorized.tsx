import { ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">غير مصرح لك</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        ليس لديك صلاحية للوصول إلى هذه الصفحة. تواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
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
