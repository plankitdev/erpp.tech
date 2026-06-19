import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { statusLabels } from '../utils';
import { useClickOutside } from '../hooks/useClickOutside';
import {
  LayoutDashboard, Users, FileText, Receipt, UserCog, Wallet, Landmark,
  CheckSquare, Kanban, Handshake, BarChart3, KeyRound, ChevronRight, ChevronLeft,
  LogOut, CreditCard, Settings, Activity, ChevronDown, Building2, User, Shield, FolderKanban, FolderOpen,
  PanelRightOpen, PanelRightClose, Target, UserPlus, Menu, X,
  CalendarDays, ImageIcon, Video, Heart, ClipboardList, Ticket, GanttChartSquare, Mail, Zap, BookOpen, Tag, Monitor, Megaphone, HardDrive,
  Star, Pin, PinOff, Sun, Moon,
  FolderTree, BookOpenCheck, GitBranch, Calculator, Box, Clock, Scale, TrendingUp, LayoutList, MessageSquare,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import Breadcrumbs, { type BreadcrumbItem } from './Breadcrumbs';
import FloatingActionButton from './FloatingActionButton';
import OnboardingTour from './OnboardingTour';
import FloatingChat from './FloatingChat';
import QuickCreateModal from './QuickCreateModal';
import { useQuickTaskStore } from '../store/quickTaskStore';
import AttendanceTimer from './AttendanceTimer';
import OverdueBanner from './OverdueBanner';
import { useAnnouncementUnreadCount } from '../hooks/useAnnouncements';
import { useChatUnreadCount } from '../hooks/useChat';
import { useSidebarBadges } from '../hooks/useDashboard';
import { useThemeStore } from '../store/themeStore';
import { useNotificationStream } from '../hooks/useNotificationStream';

interface MenuItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: string | null;
  roles?: string[];
  dividerBefore?: boolean;
}

interface MenuSection {
  title: string;
  icon: typeof LayoutDashboard;
  items: MenuItem[];
  hubPath?: string;        // if provided, section title becomes a link
  hubPermission?: string | null; // explicit permission for the hub page (defaults to first non-null item permission)
  color?: string;          // accent color class for the section icon
}

interface SidebarTab {
  id: 'team' | 'finance' | 'clients' | 'system';
  label: string;
  icon: typeof LayoutDashboard;
  sectionTitles: string[];
}

// Standalone items — only items with badges or always-visible nav
const standaloneItems: MenuItem[] = [
  { path: '/announcements', label: 'الإعلانات', icon: Megaphone, permission: null },
  { path: '/chat', label: 'المحادثات', icon: MessageSquare, permission: null },
];

const menuSections: MenuSection[] = [
  {
    title: 'إدارة العملاء',
    icon: Users,
    hubPath: '/clients-hub',
    color: 'text-blue-400',
    items: [
      { path: '/clients', label: 'العملاء', icon: Users, permission: 'clients' },
      { path: '/contracts', label: 'العقود', icon: FileText, permission: 'contracts' },
      { path: '/quotations', label: 'عروض الأسعار', icon: ClipboardList, permission: 'sales' },
    ],
  },
  {
    title: 'المبيعات والتسويق',
    icon: Target,
    hubPath: '/sales-hub',
    hubPermission: 'sales',
    color: 'text-orange-400',
    items: [
      { path: '/leads', label: 'العملاء المحتملين', icon: UserPlus, permission: 'sales' },
      { path: '/tickets', label: 'تذاكر الدعم', icon: Ticket, permission: 'clients' },
      { path: '/email', label: 'البريد الإلكتروني', icon: Mail, permission: 'sales' },
    ],
  },
  {
    title: 'المهام والمشاريع',
    icon: CheckSquare,
    hubPath: '/tasks-hub',
    hubPermission: 'tasks',
    color: 'text-teal-400',
    items: [
      { path: '/personal-todos', label: 'مهامي الشخصية', icon: ClipboardList, permission: null },
      { path: '/account-manager', label: 'لوحة مدير الحساب', icon: LayoutList, permission: 'tasks', roles: ['super_admin', 'company_admin', 'manager', 'marketing_manager'] },
      { path: '/weekly-report', label: 'التقرير الأسبوعي', icon: BarChart3, permission: 'tasks', roles: ['super_admin', 'company_admin', 'manager', 'marketing_manager'] },
      { path: '/client-report', label: 'تقرير العميل', icon: Users, permission: 'tasks', roles: ['super_admin', 'company_admin', 'manager', 'marketing_manager'] },
      { path: '/projects', label: 'المشاريع', icon: FolderKanban, permission: 'projects' },
      { path: '/tasks', label: 'المهام', icon: CheckSquare, permission: 'tasks' },
      { path: '/tasks/board', label: 'لوحة كانبان', icon: Kanban, permission: 'tasks' },
      { path: '/calendar', label: 'التقويم', icon: CalendarDays, permission: 'tasks', dividerBefore: true },
      { path: '/meetings', label: 'الاجتماعات', icon: Video, permission: 'tasks' },
      { path: '/gantt', label: 'مخطط جانت', icon: GanttChartSquare, permission: 'projects', dividerBefore: true },
      { path: '/kpi', label: 'لوحة الأداء', icon: Target, permission: null },
    ],
  },
  {
    title: 'الموارد البشرية',
    icon: UserCog,
    hubPath: '/hr-hub',
    color: 'text-violet-400',
    items: [
      { path: '/employees', label: 'الموظفين', icon: UserCog, permission: 'employees' },
      { path: '/salaries', label: 'الرواتب', icon: Wallet, permission: 'salaries' },
      { path: '/leave-attendance', label: 'الإجازات والحضور', icon: CalendarDays, permission: null },
    ],
  },
  {
    title: 'المحاسبة والخزينة',
    icon: Landmark,
    hubPath: '/finance-hub',
    hubPermission: 'treasury',
    color: 'text-emerald-400',
    items: [
      { path: '/invoices', label: 'الفواتير', icon: Receipt, permission: 'invoices' },
      { path: '/treasury', label: 'الخزينة', icon: Wallet, permission: 'treasury' },
      { path: '/expenses', label: 'المصروفات', icon: CreditCard, permission: 'expenses' },
      { path: '/partners', label: 'الشركاء', icon: Handshake, permission: 'treasury' },
      { path: '/chart-of-accounts', label: 'دليل الحسابات', icon: FolderTree, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/journal-entries', label: 'قيود اليومية', icon: BookOpenCheck, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/cost-centers', label: 'مراكز التكلفة', icon: GitBranch, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/budgets', label: 'الموازنات', icon: Calculator, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/bank-accounts', label: 'الحسابات البنكية', icon: Landmark, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/fixed-assets', label: 'الأصول الثابتة', icon: Box, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
    ],
  },
  {
    title: 'التقارير المالية',
    icon: TrendingUp,
    color: 'text-cyan-400',
    items: [
      { path: '/accounts-receivable', label: 'الذمم المدينة', icon: Clock, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/balance-sheet', label: 'الميزانية العمومية', icon: Scale, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { path: '/financial-kpis', label: 'مؤشرات الأداء المالي', icon: TrendingUp, permission: 'treasury', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
    ],
  },
  {
    title: 'التقارير والملفات',
    icon: BarChart3,
    color: 'text-amber-400',
    items: [
      { path: '/reports', label: 'التقارير', icon: BarChart3, permission: 'reports' },
      { path: '/reports/employees', label: 'تقارير الموظفين', icon: Users, permission: 'reports' },
      { path: '/file-manager', label: 'مدير الملفات', icon: HardDrive, permission: null },
      { path: '/media', label: 'مكتبة الوسائط', icon: ImageIcon, permission: 'users', roles: ['super_admin', 'company_admin', 'manager'] },
      { path: '/file-templates', label: 'قوالب الملفات', icon: FolderOpen, permission: 'users', roles: ['super_admin', 'company_admin', 'manager'] },
    ],
  },
  {
    title: 'إدارة النظام',
    icon: Settings,
    color: 'text-rose-400',
    items: [
      { path: '/users', label: 'المستخدمين', icon: KeyRound, permission: 'users', roles: ['super_admin', 'company_admin', 'manager'] },
      { path: '/activity-logs', label: 'سجل النشاطات', icon: Activity, permission: 'activity_logs', roles: ['super_admin', 'company_admin', 'manager'] },
      { path: '/workflows', label: 'الأتمتة', icon: Zap, permission: 'users', roles: ['super_admin', 'company_admin', 'manager'] },
      { path: '/tags', label: 'العلامات', icon: Tag, permission: 'users', roles: ['super_admin', 'company_admin', 'manager'] },
      { path: '/api-docs', label: 'توثيق الواجهة البرمجية', icon: BookOpen, permission: 'users', roles: ['super_admin', 'company_admin', 'manager'] },
      { path: '/system-monitor', label: 'مراقبة النظام', icon: Monitor, permission: 'users', roles: ['super_admin'] },
    ],
  },
];

// Hub pages need to be in allMenuItems for recent/pinned to work
const hubItems: MenuItem[] = menuSections
  .filter(s => s.hubPath)
  .map(s => ({
    path: s.hubPath!,
    label: s.title,
    icon: s.icon,
    // Use explicit hubPermission if set, otherwise derive from first non-null item permission
    // This keeps hub items gated to users who actually have access to that section
    permission: s.hubPermission !== undefined
      ? s.hubPermission
      : (s.items.find(i => i.permission !== null)?.permission ?? null),
  }));

const allMenuItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard, permission: null }, // accessible to all authenticated users
  ...standaloneItems,
  ...hubItems,
  ...menuSections.flatMap(s => s.items),
];

const superAdminTabs: SidebarTab[] = [
  {
    id: 'team',
    label: 'التيم',
    icon: UserCog,
    sectionTitles: ['المهام والمشاريع', 'الموارد البشرية', 'التقارير والملفات'],
  },
  {
    id: 'finance',
    label: 'الحسابات',
    icon: Landmark,
    sectionTitles: ['المحاسبة والخزينة', 'التقارير المالية'],
  },
  {
    id: 'clients',
    label: 'العملاء',
    icon: Users,
    sectionTitles: ['إدارة العملاء', 'المبيعات والتسويق'],
  },
  {
    id: 'system',
    label: 'الإدارة',
    icon: Settings,
    sectionTitles: ['إدارة النظام'],
  },
];

// Role-based section ordering — each role sees their most relevant sections first
const roleSectionOrder: Record<string, string[]> = {
  super_admin: ['المهام والمشاريع', 'إدارة العملاء', 'المحاسبة والخزينة', 'المبيعات والتسويق', 'الموارد البشرية', 'التقارير المالية', 'التقارير والملفات', 'إدارة النظام'],
  company_admin: ['المهام والمشاريع', 'إدارة العملاء', 'المحاسبة والخزينة', 'المبيعات والتسويق', 'الموارد البشرية', 'التقارير المالية', 'التقارير والملفات', 'إدارة النظام'],
  manager: ['المهام والمشاريع', 'إدارة العملاء', 'المبيعات والتسويق', 'الموارد البشرية', 'المحاسبة والخزينة', 'التقارير المالية', 'التقارير والملفات', 'إدارة النظام'],
  marketing_manager: ['المهام والمشاريع', 'إدارة العملاء', 'المبيعات والتسويق', 'التقارير والملفات', 'المحاسبة والخزينة', 'الموارد البشرية', 'التقارير المالية', 'إدارة النظام'],
  accountant: ['المحاسبة والخزينة', 'التقارير المالية', 'المهام والمشاريع', 'إدارة العملاء', 'التقارير والملفات', 'المبيعات والتسويق', 'الموارد البشرية', 'إدارة النظام'],
  sales: ['إدارة العملاء', 'المبيعات والتسويق', 'المهام والمشاريع', 'المحاسبة والخزينة', 'التقارير والملفات', 'التقارير المالية', 'الموارد البشرية', 'إدارة النظام'],
  employee: ['المهام والمشاريع', 'إدارة العملاء', 'الموارد البشرية', 'التقارير والملفات', 'المبيعات والتسويق', 'المحاسبة والخزينة', 'التقارير المالية', 'إدارة النظام'],
};

const SIDEBAR_PINNED_KEY = 'erpflex_sidebar_pinned';
const SIDEBAR_RECENT_KEY = 'erpflex_sidebar_recent';
const SIDEBAR_USAGE_KEY = 'erpflex_sidebar_usage';

function readStoredPaths(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function readStoredUsageMap(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIDEBAR_USAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const normalized: Record<string, number> = {};
    Object.entries(parsed).forEach(([path, count]) => {
      if (typeof path === 'string' && typeof count === 'number' && Number.isFinite(count) && count > 0) {
        normalized[path] = count;
      }
    });
    return normalized;
  } catch {
    return {};
  }
}

export default function Layout() {
  const { user, logout, hasPermission } = useAuthStore();
  const location = useLocation();
  const { data: announcementUnread = 0 } = useAnnouncementUnreadCount();
  const { data: chatUnread = 0 } = useChatUnreadCount();
  const quickTask = useQuickTaskStore();
  const { data: badges } = useSidebarBadges();
  const sidebarBadges = (badges || {}) as Record<string, number>;
  const { theme, setTheme } = useThemeStore();

  // Real-time notification stream (SSE) — falls back to 60s polling in NotificationBell
  const isAuthenticated = !!useAuthStore.getState().token;
  useNotificationStream(isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [pinnedPaths, setPinnedPaths] = useState<string[]>([]);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab['id']>('team');
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPinnedPaths(readStoredPaths(SIDEBAR_PINNED_KEY));
    setRecentPaths(readStoredPaths(SIDEBAR_RECENT_KEY));
    setUsageCounts(readStoredUsageMap());
  }, []);

  useClickOutside(profileRef, useCallback(() => setProfileOpen(false), []));

  const filteredSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.roles && item.roles.length > 0 && !item.roles.includes(user?.role || '')) return false;
        if (!item.permission) return true;
        return hasPermission(item.permission);
      }),
    }))
    .filter(section => section.items.length > 0);

  const isSuperAdmin = user?.role === 'super_admin';

  // Apply role-based ordering
  const orderedSections = (() => {
    const order = roleSectionOrder[user?.role || 'employee'] || roleSectionOrder.employee;
    return [...filteredSections].sort((a, b) => {
      const aIdx = order.indexOf(a.title);
      const bIdx = order.indexOf(b.title);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  })();

  const visibleSections = isSuperAdmin
    ? orderedSections.filter(section => {
        const activeTab = superAdminTabs.find(tab => tab.id === activeSidebarTab);
        return activeTab ? activeTab.sectionTitles.includes(section.title) : true;
      })
    : orderedSections;

  const accessibleMenuItems = allMenuItems.filter(item => {
    if (item.roles && item.roles.length > 0 && !item.roles.includes(user?.role || '')) return false;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const pinnedItems = pinnedPaths
    .map(path => accessibleMenuItems.find(i => i.path === path))
    .filter(Boolean)
    .slice(0, 6) as typeof allMenuItems;

  const recentItems = recentPaths
    .map(path => accessibleMenuItems.find(i => i.path === path))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)
    .filter(i => !pinnedPaths.includes(i.path))
    .slice(0, 6);

  const togglePin = (path: string) => {
    setPinnedPaths(prev => {
      const next = prev.includes(path)
        ? prev.filter(p => p !== path)
        : [path, ...prev].slice(0, 8);
      localStorage.setItem(SIDEBAR_PINNED_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Auto-collapse: only the section containing the active page stays open
  const isSectionOpen = (title: string, items: MenuItem[]) => {
    if (collapsedSections[title] !== undefined) return !collapsedSections[title];
    return items.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
  };

  const toggleSection = (title: string) => {
    const section = visibleSections.find(s => s.title === title);
    const currentlyOpen = isSectionOpen(title, section?.items || []);
    if (currentlyOpen) {
      setCollapsedSections(prev => ({ ...prev, [title]: true }));
    } else {
      // Accordion: close all others, open only this one
      const newState: Record<string, boolean> = {};
      visibleSections.forEach(s => { newState[s.title] = s.title !== title; });
      setCollapsedSections(newState);
    }
  };

  const isPathActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const currentPage = allMenuItems.find(m => m.path === location.pathname);
  const currentSection = menuSections.find(s => s.items.some(i => i.path === location.pathname));

  useEffect(() => {
    if (!isSuperAdmin || !currentSection) return;
    const matchingTab = superAdminTabs.find(tab => tab.sectionTitles.includes(currentSection.title));
    if (matchingTab && matchingTab.id !== activeSidebarTab) {
      setActiveSidebarTab(matchingTab.id);
    }
  }, [isSuperAdmin, currentSection?.title, activeSidebarTab]);

  // Reset manual collapse state on navigation so auto-collapse takes over
  useEffect(() => {
    setCollapsedSections({});
  }, [location.pathname]);

  useEffect(() => {
    const current = accessibleMenuItems.find(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
    if (!current) return;

    setRecentPaths(prev => {
      const next = [current.path, ...prev.filter(p => p !== current.path)].slice(0, 10);
      localStorage.setItem(SIDEBAR_RECENT_KEY, JSON.stringify(next));
      return next;
    });

    setUsageCounts(prev => {
      const next = { ...prev, [current.path]: (prev[current.path] || 0) + 1 };
      localStorage.setItem(SIDEBAR_USAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [location.pathname]);
  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [];
  if (currentSection && currentPage && currentPage.path !== '/') {
    breadcrumbs.push({ label: currentSection.title });
    breadcrumbs.push({ label: currentPage.label });
  } else if (location.pathname === '/sales') {
    breadcrumbs.push({ label: 'المبيعات والتسويق' });
    breadcrumbs.push({ label: 'تحليلات المبيعات' });
  } else {
    breadcrumbs.push({ label: 'لوحة التحكم' });
  }

  const roleColors: Record<string, string> = {
    super_admin: 'from-primary-500 to-primary-700',
    company_admin: 'from-indigo-500 to-indigo-700',
    manager: 'from-blue-500 to-cyan-600',
    accountant: 'from-emerald-500 to-teal-600',
    sales: 'from-orange-500 to-amber-600',
    employee: 'from-gray-500 to-slate-600',
    marketing_manager: 'from-pink-500 to-rose-600',
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="relative px-4 py-5">
        <div className="flex items-center gap-3">
          {user?.company?.icon ? (
            <img src={user.company.icon} alt="" className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-primary-500/30 flex-shrink-0 ring-2 ring-white/10" onError={e => (e.currentTarget.style.display = 'none')} />
          ) : user?.company?.logo ? (
            <img src={user.company.logo} alt="" className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-primary-500/30 flex-shrink-0 ring-2 ring-white/10" onError={e => (e.currentTarget.style.display = 'none')} />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-teal-600 flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0 ring-2 ring-white/10">
              <span className="text-white font-black text-lg">E</span>
            </div>
          )}
          {sidebarOpen && (
            <div className="animate-fade-in min-w-0">
              <h1 className="font-extrabold text-[16px] text-white tracking-wide truncate">{user?.company?.name || 'ERPFlex'}</h1>
              {user?.company && user.company.name !== 'ERPFlex' && (
                <p className="text-[10px] text-primary-300/60 font-semibold tracking-widest uppercase">ERPFlex</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-l from-transparent via-primary-400/20 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-3 sidebar-scroll" data-tour="sidebar">

        {/* ── Top row: Dashboard only ── */}
        <div className="mb-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            data-tour="dashboard"
            title="لوحة التحكم"
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 flex-1 ${
              location.pathname === '/'
                ? 'bg-white/[0.08] text-slate-100'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            } ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {location.pathname === '/' && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-l-full bg-primary-300/80" />
            )}
            <LayoutDashboard size={17} className={location.pathname === '/' ? 'text-primary-300 flex-shrink-0' : 'text-slate-600 group-hover:text-slate-200 flex-shrink-0'} />
            {sidebarOpen && <span className="truncate">لوحة التحكم</span>}
          </Link>
        </div>

        {/* ── Pinned ── */}
        {sidebarOpen && pinnedItems.length > 0 && (
          <div className="mb-1">
            <div className="px-2 py-1 flex items-center gap-1.5 text-[10.5px] text-slate-500 font-semibold">
              <Star size={10} className="text-amber-300" />
              المفضلة
            </div>
            <div className="space-y-0.5">
              {pinnedItems.slice(0, 5).map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={`pin-${item.path}`}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      isActive ? 'bg-white/[0.07] text-slate-100' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-primary-300 flex-shrink-0' : 'text-slate-600 group-hover:text-slate-300 flex-shrink-0'} />
                    <span className="truncate flex-1">{item.label}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(item.path); }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-amber-300 hover:text-slate-400 transition-all"
                      title="إزالة من المفضلة"
                    >
                      <PinOff size={11} />
                    </button>
                  </Link>
                );
              })}
            </div>
            <div className="mx-2 mt-1 h-px bg-white/[0.03]" />
          </div>
        )}
        {/* ── Standalone: Announcements ── */}
        <div className="flex gap-1 mb-1">
          {standaloneItems.filter(item => !item.permission || hasPermission(item.permission)).map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const badge = item.path === '/announcements' ? announcementUnread : item.path === '/chat' ? chatUnread : 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                title={item.label}
                className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all flex-1 ${
                  isActive ? 'bg-white/[0.08] text-slate-100' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-l-full bg-primary-300/80" />}
                <Icon size={17} className={isActive ? 'text-primary-300 flex-shrink-0' : 'text-slate-600 group-hover:text-slate-300 flex-shrink-0'} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {badge > 0 && (
                  <span className={`${item.path === '/announcements' ? 'bg-rose-500/90' : 'bg-sky-500/90'} text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 ${sidebarOpen ? 'mr-auto' : 'absolute top-1 left-1'}`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div className="mx-2 mb-2 mt-1 h-px bg-white/[0.04]" />

        {isSuperAdmin && sidebarOpen && (
          <div className="mb-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            <div className="grid grid-cols-2 gap-1">
              {superAdminTabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActiveTab = tab.id === activeSidebarTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSidebarTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all ${
                      isActiveTab
                        ? 'bg-primary-500/20 text-primary-200 border border-primary-400/30'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <TabIcon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sections ── */}
        <div className="space-y-1">
          {visibleSections.map((section) => {
            const isOpen = isSectionOpen(section.title, section.items);
            const hasActive = section.items.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
            const SectionIcon = section.icon;
            const accentColor = section.color || 'text-slate-400';

            // Badge count for section header — sum all badges for items in this section
            let sectionBadge = 0;
            section.items.forEach(i => {
              if (i.path === '/tasks') sectionBadge += (sidebarBadges.new_tasks ?? 0);
              if (i.path === '/projects') sectionBadge += (sidebarBadges.new_projects ?? 0);
              if (i.path === '/meetings') sectionBadge += (sidebarBadges.upcoming_meetings ?? 0);
              if (i.path === '/invoices') sectionBadge += (sidebarBadges.overdue_invoices ?? 0);
              if (i.path === '/leads') sectionBadge += (sidebarBadges.new_leads ?? 0);
              if (i.path === '/salaries') sectionBadge += (sidebarBadges.pending_salaries ?? 0);
              if (i.path === '/tickets') sectionBadge += (sidebarBadges.open_tickets ?? 0);
            });

            return (
              <div key={section.title}>
                {/* Section header */}
                {sidebarOpen ? (
                  <div className="relative">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-200 ${
                        hasActive
                          ? 'text-white bg-white/[0.04]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        hasActive ? 'bg-gradient-to-br from-primary-500/30 to-teal-500/20 shadow-sm shadow-primary-500/10' : 'bg-white/[0.04]'
                      }`}>
                        <SectionIcon size={14} className={hasActive ? accentColor : 'text-slate-500'} />
                      </div>
                      <span className="flex-1 text-right">{section.title}</span>
                      {sectionBadge > 0 && (
                        <span className="bg-primary-500/20 text-primary-300 text-[9px] font-bold rounded-full px-1.5 py-0.5 border border-primary-400/20 animate-pulse">
                          {sectionBadge}
                        </span>
                      )}
                      <ChevronDown size={13} className={`transition-transform duration-300 text-slate-500 ${!isOpen ? '-rotate-90' : ''}`} />
                    </button>
                  </div>
                ) : (
                  // Collapsed sidebar: icon pill
                  <div className="flex justify-center py-1.5">
                    <div
                      onClick={() => toggleSection(section.title)}
                      title={section.title}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        hasActive ? 'bg-gradient-to-br from-primary-500/20 to-teal-500/10 shadow-sm' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <SectionIcon size={16} className={hasActive ? accentColor : 'text-slate-500'} />
                    </div>
                  </div>
                )}

                {isOpen && (
                  <div className="space-y-0.5 mt-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isPathActive(item.path) && item.path !== '/';

                      const itemBadge =
                        item.path === '/tasks' ? (sidebarBadges.new_tasks ?? 0)
                        : item.path === '/projects' ? (sidebarBadges.new_projects ?? 0)
                        : item.path === '/meetings' ? (sidebarBadges.upcoming_meetings ?? 0)
                        : item.path === '/invoices' ? (sidebarBadges.overdue_invoices ?? 0)
                        : item.path === '/leads' ? (sidebarBadges.new_leads ?? 0)
                        : item.path === '/salaries' ? (sidebarBadges.pending_salaries ?? 0)
                        : item.path === '/tickets' ? (sidebarBadges.open_tickets ?? 0)
                        : 0;

                      const badgeColor =
                        item.path === '/invoices' ? 'bg-rose-500/90'
                        : item.path === '/salaries' ? 'bg-amber-500/90'
                        : item.path === '/leads' ? 'bg-sky-500/90'
                        : item.path === '/tickets' ? 'bg-orange-500/90'
                        : item.path === '/projects' ? 'bg-emerald-500/90'
                        : item.path === '/meetings' ? 'bg-violet-500/90'
                        : 'bg-rose-500/90';

                      return (
                        <Fragment key={item.path}>
                        {item.dividerBefore && sidebarOpen && (
                          <div className="mx-4 my-1.5 h-px bg-white/[0.04]" />
                        )}
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          title={!sidebarOpen ? item.label : undefined}
                          className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-l from-primary-500/[0.12] to-transparent text-white'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                          } ${!sidebarOpen ? 'justify-center' : ''}`}
                        >
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-gradient-to-b from-primary-300 to-teal-400 shadow-sm shadow-primary-400/50" />
                          )}
                          <Icon
                            size={16}
                            className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary-300' : 'text-slate-600 group-hover:text-slate-300'}`}
                          />
                          {sidebarOpen && (
                            <>
                              <span className="truncate flex-1">{item.label}</span>
                              {itemBadge > 0 ? (
                                <span className={`${badgeColor} text-white text-[9px] font-semibold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1`}>
                                  {itemBadge > 99 ? '99+' : itemBadge}
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(item.path); }}
                                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-amber-300 transition-all flex-shrink-0"
                                  title={pinnedPaths.includes(item.path) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                                >
                                  {pinnedPaths.includes(item.path) ? <PinOff size={12} /> : <Pin size={12} />}
                                </button>
                              )}
                            </>
                          )}
                        </Link>
                        </Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-l from-transparent via-white/[0.05] to-transparent" />

      {/* User section */}
      <div className="relative p-3">
        {sidebarOpen ? (
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] overflow-hidden backdrop-blur-sm">
            {/* User info row */}
            <div className="flex items-center gap-3 px-3.5 py-3.5">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0 ring-2 ring-white/10" onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[user?.role || 'employee']} flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 ring-2 ring-white/10`}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <p className="text-[10px] text-slate-400 font-medium">{user?.role ? (statusLabels.role as Record<string, string>)[user.role] : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-200 transition-all p-1.5 rounded-lg hover:bg-white/[0.06]"
                title="تصغير القائمة"
              >
                <PanelRightOpen size={15} />
              </button>
            </div>
            {/* Quick actions row */}
            <div className="flex border-t border-white/[0.05]">
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] text-[11px] font-semibold transition-all"
              >
                <Settings size={13} />
                <span>الإعدادات</span>
              </Link>
              <div className="w-px bg-white/[0.05]" />
              <button
                onClick={() => logout()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-slate-500 hover:text-rose-300 hover:bg-rose-500/[0.06] text-[11px] font-semibold transition-all"
                title="تسجيل الخروج"
              >
                <LogOut size={13} />
                <span>خروج</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] transition-all"
              title="توسيع القائمة"
            >
              <PanelRightClose size={15} />
            </button>
            <Link
              to="/settings"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] transition-all"
              title="الإعدادات"
            >
              <Settings size={15} />
            </Link>
            <button
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-300 hover:bg-rose-500/[0.08] transition-all"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          ref={mobileOverlayRef}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className={`
        hidden lg:flex
        ${sidebarOpen ? 'w-[280px]' : 'w-[76px]'}
        bg-gradient-to-b from-[#0f172a] via-[#0e1525] to-[#0a1018]
        border-l border-white/[0.06]
        text-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex-col relative z-10
        shadow-2xl shadow-black/20
      `}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 lg:hidden
        w-[280px] bg-gradient-to-b from-[#111c2e] via-[#0f1827] to-[#0c1422]
        text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Mobile close button */}
        <div className="absolute left-0 top-4 -translate-x-12">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbs} />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Attendance Timer */}
            <AttendanceTimer />

            {/* Switch Company */}
            {user?.role === 'super_admin' && (
              <Link
                to="/select-company"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 px-3 py-2 rounded-xl transition-all border border-gray-200/80 hover:border-primary-200"
              >
                <Building2 size={14} />
                <span className="hidden sm:inline">تغيير الشركة</span>
              </Link>
            )}

            {/* Notifications */}
            <div data-tour="notifications">
            <NotificationBell />
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all"
              title={theme === 'dark' ? 'وضع النهار' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 hover:bg-gray-50 px-2.5 py-1.5 rounded-xl transition-all border border-transparent hover:border-gray-200/80"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover shadow-sm ring-2 ring-white" onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleColors[user?.role || 'employee']} flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white`}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 leading-tight">{user?.role ? (statusLabels.role as Record<string, string>)[user.role] : ''}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-700/80 z-50 animate-scale-in origin-top-left overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-l from-primary-50/50 dark:from-primary-900/20 to-transparent">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Shield size={12} className="text-primary-500" />
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{user?.role ? (statusLabels.role as Record<string, string>)[user.role] : ''}</span>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      الملف الشخصي
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                    >
                      <Settings size={16} className="text-gray-400" />
                      الإعدادات
                    </Link>
                    <div className="mx-2 my-1 h-px bg-gray-100 dark:bg-slate-700" />
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut size={16} />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto dark:bg-slate-900">
          <OverdueBanner />
          <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />

          {/* Footer */}
          <footer className="mt-12 pb-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <span>صنع بـ</span>
              <Heart size={11} className="text-red-400 fill-red-400 animate-pulse" />
              <span>في مصر بواسطة</span>
              <a
                href="https://plankit.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                PlanKit
              </a>
            </div>
          </footer>
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <div data-tour="fab">
      <FloatingActionButton />
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Floating Messenger-style chat + quick-task button */}
      <FloatingChat unreadCount={chatUnread} />

      {/* Quick task modal (opened from the floating button or from a chat message) */}
      <QuickCreateModal
        open={quickTask.open}
        onClose={quickTask.close}
        initialTitle={quickTask.initialTitle}
        initialAssignedTo={quickTask.initialAssignedTo}
      />
    </div>
  );
}
