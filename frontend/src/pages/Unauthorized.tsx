import { ShieldOff, Home, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-soft rotate-3 hover:rotate-0 transition-transform duration-500">
          <span className="text-5xl">🔐</span>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
          <ShieldOff className="w-4 h-4 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">أووبس! المنطقة دي مش ليك 😅</h1>
      <p className="text-gray-500 text-base mb-2 max-w-sm">
        يبدو إنك حاولت تدخل مكان مش مسموحلك فيه
      </p>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        لو حاسس إن ده غلط، كلّم المسؤول وهو يظبطهالك 👌
      </p>

      <div className="flex gap-3">
        <button onClick={() => navigate('/')} className="btn-primary gap-2">
          <Home className="w-4 h-4" />
          خدني للرئيسية
        </button>
        <button onClick={() => navigate(-1)} className="btn-secondary gap-2">
          <ArrowRight className="w-4 h-4" />
          ارجع لورا
        </button>
      </div>
    </div>
  );
}
