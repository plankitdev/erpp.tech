import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, UserPlus, FileText, CheckSquare, Target } from 'lucide-react';

const actions = [
  { label: 'عميل جديد', icon: UserPlus, to: '/clients', color: 'bg-blue-500' },
  { label: 'فاتورة جديدة', icon: FileText, to: '/invoices', color: 'bg-amber-500' },
  { label: 'مهمة جديدة', icon: CheckSquare, to: '/tasks', color: 'bg-violet-500' },
  { label: 'عميل محتمل', icon: Target, to: '/leads', color: 'bg-orange-500' },
];

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 lg:hidden">
      {/* Menu Items */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="absolute bottom-16 left-0 space-y-2 animate-fade-in-up">
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  to={action.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 whitespace-nowrap"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-xs font-bold text-white bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                    {action.label}
                  </span>
                  <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-xl flex items-center justify-center transition-all duration-300 ${
          open ? 'rotate-45 bg-gray-700 hover:bg-gray-800' : ''
        }`}
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
