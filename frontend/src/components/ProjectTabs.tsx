import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Users, ListChecks } from 'lucide-react';

const TABS = [
  { to: '', label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: 'backlog', label: 'الباكلوج', icon: ListChecks },
  { to: 'chat', label: 'شات المشروع', icon: MessageSquare },
  { to: 'client', label: 'العميل والفواتير', icon: Users },
];

/**
 * Jira-style context tab bar shown at the top of every project view.
 * Ties the project's overview, its chat channel, and its client/invoices
 * together under one workspace.
 */
export default function ProjectTabs({ slug }: { slug: string }) {
  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
      {TABS.map(t => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.to}
            to={`/projects/${slug}${t.to ? '/' + t.to : ''}`}
            end={t.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`
            }
          >
            <Icon size={16} />
            {t.label}
          </NavLink>
        );
      })}
    </div>
  );
}
