import { Home, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shadow-soft -rotate-3 hover:rotate-0 transition-transform duration-500">
          <span className="text-5xl">🗺️</span>
        </div>
        <div className="absolute -bottom-1 -left-1 font-inter text-xs font-bold bg-gray-800 text-white px-2.5 py-1 rounded-lg shadow-lg">
          404
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">تهت يا صاحبي! 🧭</h1>
      <p className="text-gray-500 text-base mb-2 max-w-sm">
        الصفحة اللي بتدور عليها مش هنا.. يمكن اتنقلت أو اتمسحت
      </p>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        مفيش مشكلة، ممكن ترجع للرئيسية وتبدأ من أول وجديد 🚀
      </p>

      <div className="flex gap-3">
        <button onClick={() => navigate('/')} className="btn-primary gap-2">
          <Home className="w-4 h-4" />
          الصفحة الرئيسية
        </button>
        <button onClick={() => navigate(-1)} className="btn-secondary gap-2">
          <ArrowRight className="w-4 h-4" />
          ارجع لورا
        </button>
      </div>
    </div>
  );
}
