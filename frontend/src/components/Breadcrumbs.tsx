import { Link } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="breadcrumb">
      <Link
        to="/"
        className="text-gray-400 hover:text-primary-600 transition-colors p-1 rounded-lg hover:bg-primary-50"
      >
        <LayoutDashboard size={16} />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronLeft size={14} className="text-gray-300" />
            {isLast || !item.href ? (
              <span className={isLast ? 'font-semibold text-gray-800 text-sm' : 'text-gray-400 text-xs'}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-gray-400 text-xs hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
