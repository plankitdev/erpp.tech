import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FormHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  backTo: string;
  /** Tailwind gradient stops, e.g. "from-blue-500 to-indigo-600" */
  gradient?: string;
}

/**
 * Unified header for full-page forms: a back button, a gradient icon badge,
 * and title/subtitle. Keeps every create/edit page visually consistent.
 */
export default function FormHeader({ icon: Icon, title, subtitle, backTo, gradient = 'from-primary-500 to-primary-700' }: FormHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shrink-0"
        aria-label="رجوع"
      >
        <ArrowRight size={18} className="text-gray-500 dark:text-gray-400" />
      </button>
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
