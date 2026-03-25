import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useCallback, useEffect } from 'react';
import { statusLabels } from '../utils';
import { useClickOutside } from '../hooks/useClickOutside';
import {
  LayoutDashboard, Users, FileText, Receipt, UserCog, Wallet, Landmark,
  CheckSquare, Kanban, Handshake, BarChart3, KeyRound, ChevronRight, ChevronLeft,
  LogOut, CreditCard, Settings, Activity, ChevronDown, Building2, User, Shield, FolderKanban, FolderOpen,
  PanelRightOpen, PanelRightClose, Search, Target, UserPlus, Menu, X,
  CalendarDays, ImageIcon, Video, Heart, Timer, ClipboardList, Ticket, GanttChartSquare, Mail, Zap, BookOpen, MessageSquare, Tag, Monitor, Megaphone, HardDrive,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import Breadcrumbs, { type BreadcrumbItem } from './Breadcrumbs';
import GlobalSearch from './GlobalSearch';
import FloatingActionButton from './FloatingActionButton';
import OnboardingTour from './OnboardingTour';
import { useAnnouncementUnreadCount } from '../hooks/useAnnouncements';
import { useChatUnreadCount } from '../hooks/useChat';
import { useSidebarBadges } from '../hooks/useDashboard';

interface MenuItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: string | null;
}

interface MenuSection {
  title: string;
  icon: typeof LayoutDashboard;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'التحديثات',
    icon: Megaphone,
    items: [
      { path: '/announcements', label: 'التحديثات والإعلانات', icon: Megaphone, permission: null },
    ],
  },
  {
    title: 'العملاء والمبيعات',
    icon: Users,
    items: [
      { path: '/clients-hub', label: 'نظرة عامة', icon: LayoutDashboard, permission: 'clients' },
      { path: '/clients', label: 'العملاء', icon: Users, permission: 'clients' },
      { path: '/contracts', label: 'العقود', icon: FileText, permission: 'contracts' },
      { path: '/invoices', label: 'الفواتير', icon: Receipt, permission: 'invoices' },
      { path: '/sales-hub', label: 'المبيعات', icon: Target, permission: 'sales' },
      { path: '/sales', label: 'تحليلات المبيعات', icon: BarChart3, permission: 'sales' },
      { path: '/leads', label: 'العملاء المحتملين', icon: UserPlus, permission: 'sales' },
      { path: '/quotations', label: 'عروض الأسعار', icon: ClipboardList, permission: 'sales' },
      { path: '/tickets', label: 'تذاكر الدعم', icon: Ticket, permission: 'clients' },
      { path: '/email', label: 'البريد الإلكتروني', icon: Mail, permission: 'sales' },
    ],
  },
  {
    title: 'المهام والمشاريع',
    icon: CheckSquare,
    items: [
      { path: '/tasks-hub', label: 'نظرة عامة', icon: LayoutDashboard, permission: 'tasks' },
      { path: '/projects', label: 'المشاريع', icon: FolderKanban, permission: 'tasks' },
      { path: '/tasks', label: 'المهام', icon: CheckSquare, permission: 'tasks' },
      { path: '/tasks/board', label: 'لوحة Kanban', icon: Kanban, permission: 'tasks' },
      { path: '/calendar', label: 'التقويم', icon: CalendarDays, permission: 'tasks' },
      { path: '/meetings', label: 'الاجتماعات', icon: Video, permission: 'tasks' },
      { path: '/chat', label: 'المحادثات', icon: MessageSquare, permission: null },
      { path: '/kpi', label: 'لوحة الأداء', icon: Target, permission: null },
    ],
  },
  {
    title: 'المالية',
    icon: Landmark,
    items: [
      { path: '/finance-hub', label: 'نظرة عامة', icon: LayoutDashboard, permission: 'treasury' },
      { path: '/treasury', label: 'الخزينة', icon: Landmark, permission: 'treasury' },
      { path: '/expenses', label: 'المصروفات', icon: CreditCard, permission: 'expenses' },
      { path: '/partners', label: 'الشركاء', icon: Handshake, permission: 'partners' },
    ],
  },
  {
    title: 'الموارد البشرية',
    icon: UserCog,
    items: [
      { path: '/hr-hub', label: 'نظرة عامة', icon: LayoutDashboard, permission: 'employees' },
      { path: '/employees', label: 'الموظفين', icon: UserCog, permission: 'employees' },
      { path: '/salaries', label: 'الرواتب', icon: Wallet, permission: 'salaries' },
      { path: '/leave-attendance', label: 'الإجازات والحضور', icon: CalendarDays, permission: 'employees' },
    ],
  },
  {
    title: 'النظام',
    icon: Settings,
    items: [
      { path: '/reports', label: 'التقارير', icon: BarChart3, permission: 'reports' },
      { path: '/reports/employees', label: 'تقارير الموظفين', icon: Users, permission: 'reports' },
      { path: '/users', label: 'المستخدمين', icon: KeyRound, permission: 'users' },
      { path: '/activity-logs', label: 'سجل النشاطات', icon: Activity, permission: 'activity_logs' },
      { path: '/file-manager', label: 'مدير الملفات', icon: HardDrive, permission: 'settings' },
      { path: '/media', label: 'مكتبة الملفات', icon: ImageIcon, permission: 'settings' },
      { path: '/file-templates', label: 'قوالب الملفات', icon: FolderOpen, permission: 'settings' },
      { path: '/settings', label: 'الإعدادات', icon: Settings, permission: 'settings' },
      { path: '/workflows', label: 'أتمتة العمليات', icon: Zap, permission: 'settings' },
      { path: '/tags', label: 'العلامات', icon: Tag, permission: 'settings' },
      { path: '/api-docs', label: 'توثيق الـ API', icon: BookOpen, permission: 'settings' },
      { path: '/system-monitor', label: 'مراقبة النظام', icon: Monitor, permission: 'settings' },
    ],
  },
];

const allMenuItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard, permission: 'dashboard' },
  ...menuSections.flatMap(s => s.items),
];

export default function Layout() {
  const { user, logout, hasPermission } = useAuthStore();
  const location = useLocation();
  const { data: announcementUnread = 0 } = useAnnouncementUnreadCount();
  const { data: chatUnread = 0 } = useChatUnreadCount();
  const { data: badges } = useSidebarBadges();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);

  // Ctrl+K global shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useClickOutside(profileRef, useCallback(() => setProfileOpen(false), []));

  const filteredSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.permission) return true;
        return hasPermission(item.permission);
      }),
    }))
    .filter(section => section.items.length > 0);

  // Auto-collapse: only the section containing the active page stays open
  const isSectionOpen = (title: string, items: MenuItem[]) => {
    if (collapsedSections[title] !== undefined) return !collapsedSections[title];
    return items.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
  };

  const toggleSection = (title: string) => {
    const section = filteredSections.find(s => s.title === title);
    const currentlyOpen = isSectionOpen(title, section?.items || []);
    setCollapsedSections(prev => ({ ...prev, [title]: currentlyOpen }));
  };

  const currentPage = allMenuItems.find(m => m.path === location.pathname);
  const currentSection = menuSections.find(s => s.items.some(i => i.path === location.pathname));

  // Reset manual collapse state on navigation so auto-collapse takes over
  useEffect(() => {
    setCollapsedSections({});
  }, [location.pathname]);
  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [];
  if (currentSection && currentPage && currentPage.path !== '/') {
    breadcrumbs.push({ label: currentSection.title });
    breadcrumbs.push({ label: currentPage.label });
  } else if (location.pathname === '/sales') {
    breadcrumbs.push({ label: 'العملاء والمبيعات' });
    breadcrumbs.push({ label: 'تحليلات المبيعات' });
  } else {
    breadcrumbs.push({ label: 'لوحة التحكم' });
  }

  const roleColors: Record<string, string> = {
    super_admin: 'from-primary-500 to-primary-700',
    manager: 'from-blue-500 to-cyan-600',
    accountant: 'from-emerald-500 to-teal-600',
    sales: 'from-orange-500 to-amber-600',
    employee: 'from-gray-500 to-slate-600',
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="relative px-5 py-5">
        <div className="flex items-center gap-3">
          {user?.company?.icon ? (
            <img src={user.company.icon} alt="" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary-500/20 flex-shrink-0 ring-1 ring-white/10" />
          ) : user?.company?.logo ? (
            <img src={user.company.logo} alt="" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary-500/20 flex-shrink-0 ring-1 ring-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0 ring-1 ring-white/10">
              <span className="text-white font-bold text-lg">E</span>
            </div>
          )}
          {sidebarOpen && (
            <div className="animate-fade-in min-w-0">
              <h1 className="font-bold text-[15px] text-white tracking-wide truncate">{user?.company?.name || 'ERPFlex'}</h1>
              {user?.company && user.company.name !== 'ERPFlex' && (
                <p className="text-[10px] text-primary-400/70 font-medium tracking-wider">ERPFlex</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-l from-transparent via-white/[0.07] to-transparent" />

      {/* Quick search (when sidebar open) */}
      {sidebarOpen && (
        <div className="px-4 py-3" data-tour="search">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-500 text-xs cursor-pointer hover:bg-white/[0.07] transition-colors"
          >
            <Search size={13} className="text-slate-500" />
            <span>بحث سريع...</span>
            <kbd className="mr-auto text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded font-inter text-slate-500">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 sidebar-scroll" data-tour="sidebar">
        {/* Dashboard - standalone link */}
        <div className="mb-1">
          {sidebarOpen ? (
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              data-tour="dashboard"
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                location.pathname === '/'
                  ? 'bg-primary-500/10 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {location.pathname === '/' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-primary-400 shadow-[0_0_8px_rgba(44,159,143,0.4)]" />
              )}
              <LayoutDashboard size={18} strokeWidth={location.pathname === '/' ? 2.2 : 1.7} className={location.pathname === '/' ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="truncate">لوحة التحكم</span>
            </Link>
          ) : (
            <Link
              to="/"
              title="لوحة التحكم"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/' ? 'bg-primary-500/10 text-primary-400' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`}
            >
              <LayoutDashboard size={18} />
            </Link>
          )}
        </div>

        <div className="mx-2 mb-2 h-px bg-white/[0.05]" />

        {filteredSections.map((section) => {
          const isOpen = isSectionOpen(section.title, section.items);
          const hasActive = section.items.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
          const SectionIcon = section.icon;

          return (
            <div key={section.title} className="mb-0.5">
              {sidebarOpen ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-[0.08em] transition-all duration-200 ${
                    hasActive ? 'text-primary-400' : 'text-slate-500/80 hover:text-slate-400'
                  }`}
                >
                  <SectionIcon size={13} className={hasActive ? 'text-primary-400' : 'text-slate-600'} />
                  <span className="flex-1 text-right">{section.title}</span>
                  <ChevronDown size={11} className={`transition-transform duration-200 ${!isOpen ? '-rotate-90' : ''}`} />
                </button>
              ) : (
                <div className="flex justify-center py-2">
                  <div className={`w-5 h-[2px] rounded-full transition-colors ${hasActive ? 'bg-primary-400' : 'bg-slate-700/50'}`} />
                </div>
              )}

              {!isOpen && sidebarOpen && hasActive && (
                <div className="mr-3 mb-1">
                  {section.items.filter(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/')).map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-primary-400 font-medium"
                      >
                        <Icon size={14} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {isOpen && (
                <div className={`space-y-0.5 ${sidebarOpen ? 'mr-0.5' : ''}`}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        title={!sidebarOpen ? item.label : undefined}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-500/10 text-white shadow-sm'
                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                        } ${!sidebarOpen ? 'justify-center' : ''}`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-primary-400 shadow-[0_0_8px_rgba(44,159,143,0.4)]" />
                        )}
                        <div className={`flex-shrink-0 transition-all duration-200 ${
                          isActive 
                            ? 'text-primary-400' 
                            : 'text-slate-500 group-hover:text-slate-300'
                        }`}>
                          <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
                        </div>
                        {sidebarOpen && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {item.path === '/announcements' && announcementUnread > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-auto">
                            {announcementUnread > 99 ? '99+' : announcementUnread}
                          </span>
                        )}
                        {item.path === '/chat' && chatUnread > 0 && (
                          <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-auto">
                            {chatUnread > 99 ? '99+' : chatUnread}
                          </span>
                        )}
                        {item.path === '/tasks' && (badges?.new_tasks ?? 0) > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-auto">
                            {badges!.new_tasks > 99 ? '99+' : badges!.new_tasks}
                          </span>
                        )}
                        {item.path === '/projects' && (badges?.new_projects ?? 0) > 0 && (
                          <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-auto">
                            {badges!.new_projects > 99 ? '99+' : badges!.new_projects}
                          </span>
                        )}
                        {item.path === '/meetings' && (badges?.upcoming_meetings ?? 0) > 0 && (
                          <span className="bg-purple-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-auto">
                            {badges!.upcoming_meetings > 99 ? '99+' : badges!.upcoming_meetings}
                          </span>
                        )}
                        {/* Hover glow on active */}
                        {isActive && sidebarOpen && (
                          <div className="absolute inset-0 rounded-xl bg-primary-500/5 pointer-events-none" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-l from-transparent via-white/[0.07] to-transparent" />

      {/* User section */}
      <div className="relative p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-200">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-lg object-cover shadow-md flex-shrink-0" />
            ) : (
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${roleColors[user?.role || 'employee']} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500">{user?.role ? statusLabels.role[user.role] : ''}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-600 hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
              title="تصغير القائمة"
            >
              <PanelRightOpen size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-full flex justify-center py-2.5 text-slate-600 hover:text-slate-300 transition-colors"
            title="توسيع القائمة"
          >
            <PanelRightClose size={15} />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-surface-50">
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
        ${sidebarOpen ? 'w-[272px]' : 'w-[72px]'}
        bg-gradient-to-b from-secondary-800 via-secondary-900 to-secondary-950
        text-white transition-all duration-300 ease-in-out flex-col relative z-10
      `}>
        {/* Decorative gradients */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-primary-600/[0.04] rounded-full blur-3xl pointer-events-none" />
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 lg:hidden
        w-[280px] bg-gradient-to-b from-secondary-800 via-secondary-900 to-secondary-950
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
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
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

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 hover:bg-gray-50 px-2.5 py-1.5 rounded-xl transition-all border border-transparent hover:border-gray-200/80"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover shadow-sm ring-2 ring-white" />
                ) : (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleColors[user?.role || 'employee']} flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white`}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 leading-tight">{user?.role ? statusLabels.role[user.role] : ''}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 hidden sm:block ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-50 animate-scale-in origin-top-left overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-l from-primary-50/50 to-transparent">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Shield size={12} className="text-primary-500" />
                      <span className="text-xs text-primary-600 font-semibold">{user?.role ? statusLabels.role[user.role] : ''}</span>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      الملف الشخصي
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <Settings size={16} className="text-gray-400" />
                      الإعدادات
                    </Link>
                    <div className="mx-2 my-1 h-px bg-gray-100" />
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile FAB */}
      <div data-tour="fab">
      <FloatingActionButton />
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
}
