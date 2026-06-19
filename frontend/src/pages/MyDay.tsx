import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, AlertTriangle, CheckCircle2, X, MessageSquare, ListChecks,
  RefreshCw, Clock, Flag, ChevronLeft, Inbox,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  useFollowUps, useResolveFollowUp, useDismissFollowUp, useGenerateFollowUps,
} from '../api/followUps';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { useChatChannels } from '../hooks/useChat';
import type { Task, ChatChannel } from '../types';
import toast from 'react-hot-toast';

interface FollowUpItem {
  id: number;
  type: string;
  type_label: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  priority_label: string;
  note: string | null;
  due_date: string | null;
  followable_type: string;
  followable_id: number;
  followable?: { id: number; title?: string; status?: string } | null;
  is_overdue: boolean;
}

const PRIORITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

function localToday(): string {
  const d = new Date();
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

function SectionCard({
  title, icon, count, accent, children,
}: { title: string; icon: React.ReactNode; count: number; accent: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>{icon}</span>
        <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm flex-1">{title}</h2>
        <span className="text-xs font-bold text-gray-400">{count}</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-700/50">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-300 gap-1.5">
      <Inbox size={28} />
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}

export default function MyDay() {
  const { user } = useAuthStore();
  const today = localToday();
  const canGenerate = !!user && ['super_admin', 'company_admin', 'manager', 'marketing_manager'].includes(user.role);

  const { data: fuRes, isLoading: fuLoading } = useFollowUps({ assigned_to: user?.id });
  const { data: tasksRes, isLoading: tasksLoading } = useTasks({ assigned_to: user?.id, per_page: 100 });
  const { data: channels = [] } = useChatChannels();

  const resolveFu = useResolveFollowUp();
  const dismissFu = useDismissFollowUp();
  const generateFu = useGenerateFollowUps();
  const updateTask = useUpdateTask();

  const followUps: FollowUpItem[] = (fuRes?.data?.data ?? []) as FollowUpItem[];

  const allTasks: Task[] = (tasksRes?.data ?? []) as Task[];
  const { overdueTasks, todayTasks } = useMemo(() => {
    const overdue: Task[] = [];
    const due: Task[] = [];
    for (const t of allTasks) {
      if (t.status === 'done' || !t.due_date) continue;
      const d = t.due_date.slice(0, 10);
      if (d < today) overdue.push(t);
      else if (d === today) due.push(t);
    }
    return { overdueTasks: overdue, todayTasks: due };
  }, [allTasks, today]);

  const unreadChannels = useMemo(
    () => channels.filter((c) => c.unread_count > 0),
    [channels],
  );
  const totalUnread = unreadChannels.reduce((s, c) => s + c.unread_count, 0);

  const channelName = (c: ChatChannel) =>
    c.type === 'direct' ? c.members.find((m) => m.id !== user?.id)?.name || c.name : c.name;

  const markTaskDone = (t: Task) => {
    updateTask.mutate(
      { id: t.id, data: { status: 'done' } as Partial<Task> },
      { onSuccess: () => toast.success('تم إنجاز المهمة ✅') },
    );
  };

  const totalToFollow = followUps.length + overdueTasks.length + todayTasks.length;

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="text-primary-600" size={24} /> متابعاتي اليوم
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalToFollow > 0 ? `لديك ${totalToFollow} عنصرًا يحتاج متابعة` : 'كل شيء تحت السيطرة 🎉'}
          </p>
        </div>
        {canGenerate && (
          <button
            onClick={() =>
              generateFu.mutate(undefined, {
                onSuccess: () => toast.success('تم تحديث المتابعات'),
              })
            }
            disabled={generateFu.isPending}
            className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={15} className={generateFu.isPending ? 'animate-spin' : ''} /> تحديث المتابعات
          </button>
        )}
      </div>

      {/* Follow-ups */}
      <SectionCard title="متابعاتي" icon={<Flag size={16} className="text-white" />} accent="bg-rose-500" count={followUps.length}>
        {fuLoading && <div className="p-4 text-sm text-gray-400">جاري التحميل...</div>}
        {!fuLoading && followUps.length === 0 && <EmptyRow text="لا توجد متابعات مطلوبة" />}
        {followUps.map((f) => (
          <div key={f.id} className="flex items-start gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_STYLE[f.priority] || PRIORITY_STYLE.low}`}>
                  {f.priority_label}
                </span>
                <span className="text-[11px] text-gray-400">{f.type_label}</span>
                {f.is_overdue && (
                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                    <AlertTriangle size={11} /> متأخرة
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate">
                {f.followable?.title || f.note || 'متابعة'}
              </p>
              {f.note && f.followable?.title && (
                <p className="text-xs text-gray-400 truncate">{f.note}</p>
              )}
              {f.due_date && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock size={11} /> {f.due_date}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => resolveFu.mutate({ id: f.id }, { onSuccess: () => toast.success('تم إنهاء المتابعة') })}
                title="تم"
                className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => dismissFu.mutate({ id: f.id })}
                title="تجاهل"
                className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* My tasks (overdue + today) */}
      <SectionCard
        title="مهامي المتأخرة واليوم"
        icon={<ListChecks size={16} className="text-white" />}
        accent="bg-teal-500"
        count={overdueTasks.length + todayTasks.length}
      >
        {tasksLoading && <div className="p-4 text-sm text-gray-400">جاري التحميل...</div>}
        {!tasksLoading && overdueTasks.length + todayTasks.length === 0 && <EmptyRow text="لا مهام مستحقة اليوم" />}
        {[...overdueTasks, ...todayTasks].map((t) => {
          const overdue = t.due_date ? t.due_date.slice(0, 10) < today : false;
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <Link to={`/tasks/${t.id}`} className="text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-primary-600 truncate block">
                  {t.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] flex items-center gap-1 ${overdue ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                    <Clock size={11} /> {t.due_date?.slice(0, 10)} {overdue && '· متأخرة'}
                  </span>
                  {t.client && <span className="text-[11px] text-gray-400 truncate">· {t.client.name}</span>}
                </div>
              </div>
              <button
                onClick={() => markTaskDone(t)}
                title="إنجاز"
                className="shrink-0 w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center"
              >
                <CheckCircle2 size={16} />
              </button>
            </div>
          );
        })}
      </SectionCard>

      {/* Unread messages */}
      <SectionCard title="رسائل غير مقروءة" icon={<MessageSquare size={16} className="text-white" />} accent="bg-primary-500" count={totalUnread}>
        {unreadChannels.length === 0 && <EmptyRow text="لا رسائل غير مقروءة" />}
        {unreadChannels.map((c) => (
          <Link key={c.id} to="/chat" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{channelName(c)}</p>
              {c.latest_message && <p className="text-xs text-gray-400 truncate">{c.latest_message.body || '📎 مرفق'}</p>}
            </div>
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary-600 text-white text-[11px] font-bold flex items-center justify-center">
              {c.unread_count}
            </span>
            <ChevronLeft size={16} className="text-gray-300 shrink-0" />
          </Link>
        ))}
      </SectionCard>
    </div>
  );
}
