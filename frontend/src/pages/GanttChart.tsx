import { useState, useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import type { Project, Task } from '../types';
import { ChevronLeft, ChevronRight, Layers, ListTodo } from 'lucide-react';

interface GanttItem {
  id: string;
  label: string;
  start: Date;
  end: Date;
  color: string;
  type: 'project' | 'task';
  status: string;
  progress?: number;
}

const statusColors: Record<string, string> = {
  active: '#3b82f6', completed: '#22c55e', on_hold: '#f59e0b', cancelled: '#ef4444',
  todo: '#94a3b8', in_progress: '#3b82f6', review: '#a855f7', done: '#22c55e',
};

export default function GanttChart() {
  const [view, setView] = useState<'projects' | 'tasks'>('projects');
  const [monthOffset, setMonthOffset] = useState(0);

  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: tasksData } = useTasks({ per_page: 200 });

  const projects: Project[] = projectsData?.data || [];
  const tasks: Task[] = tasksData?.data || [];

  const today = new Date();
  const baseDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const totalDays = 90; // Show 3 months
  const startDate = new Date(baseDate);
  const endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + totalDays);

  // Generate month headers
  const months = useMemo(() => {
    const result: { label: string; days: number; offset: number }[] = [];
    let d = new Date(startDate);
    let offset = 0;
    while (d < endDate) {
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const effectiveEnd = monthEnd > endDate ? endDate : monthEnd;
      const days = Math.ceil((effectiveEnd.getTime() - d.getTime()) / 86400000) + 1;
      result.push({
        label: d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
        days,
        offset,
      });
      offset += days;
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return result;
  }, [monthOffset]);

  // Convert data to Gantt items
  const items: GanttItem[] = useMemo(() => {
    if (view === 'projects') {
      return projects
        .filter(p => p.start_date || p.end_date)
        .map(p => ({
          id: `p-${p.id}`,
          label: p.name,
          start: new Date(p.start_date || p.created_at),
          end: new Date(p.end_date || new Date(new Date(p.start_date || p.created_at).getTime() + 30 * 86400000)),
          color: statusColors[p.status] || '#94a3b8',
          type: 'project' as const,
          status: p.status,
          progress: p.progress,
        }));
    } else {
      return tasks
        .filter(t => t.start_date || t.due_date)
        .map(t => ({
          id: `t-${t.id}`,
          label: t.title,
          start: new Date(t.start_date || t.created_at),
          end: new Date(t.due_date || new Date(new Date(t.start_date || t.created_at).getTime() + 7 * 86400000)),
          color: statusColors[t.status] || '#94a3b8',
          type: 'task' as const,
          status: t.status,
        }));
    }
  }, [view, projects, tasks]);

  // Calculate bar position
  const getBarStyle = (item: GanttItem) => {
    const itemStart = Math.max(0, Math.ceil((item.start.getTime() - startDate.getTime()) / 86400000));
    const itemEnd = Math.ceil((item.end.getTime() - startDate.getTime()) / 86400000);
    const duration = Math.max(1, itemEnd - itemStart);
    const left = (itemStart / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - Math.max(0, left), width)}%` };
  };

  const todayOffset = Math.ceil((today.getTime() - startDate.getTime()) / 86400000);
  const todayLeft = (todayOffset / totalDays) * 100;

  const statusLabels: Record<string, string> = {
    active: 'نشط', completed: 'مكتمل', on_hold: 'معلق', cancelled: 'ملغي',
    todo: 'قيد الانتظار', in_progress: 'قيد العمل', review: 'مراجعة', done: 'مكتمل',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مخطط جانت</h1>
          <p className="text-sm text-gray-500 mt-1">عرض الجدول الزمني للمشاريع والمهام</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('projects')} className={`px-3 py-1.5 rounded text-sm ${view === 'projects' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
              <Layers size={14} className="inline ml-1" /> المشاريع
            </button>
            <button onClick={() => setView('tasks')} className={`px-3 py-1.5 rounded text-sm ${view === 'tasks' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
              <ListTodo size={14} className="inline ml-1" /> المهام
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonthOffset(o => o - 1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
            <button onClick={() => setMonthOffset(0)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">اليوم</button>
            <button onClick={() => setMonthOffset(o => o + 1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Layers size={48} className="mx-auto text-gray-300 mb-3" />
            <p>لا توجد {view === 'projects' ? 'مشاريع' : 'مهام'} بتواريخ محددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month Headers */}
              <div className="flex border-b bg-gray-50">
                <div className="w-48 min-w-[192px] border-l px-3 py-2 text-sm font-medium text-gray-600">
                  {view === 'projects' ? 'المشروع' : 'المهمة'}
                </div>
                <div className="flex-1 flex">
                  {months.map((m, i) => (
                    <div key={i} style={{ width: `${(m.days / totalDays) * 100}%` }} className="border-l px-2 py-2 text-xs font-medium text-gray-600 text-center truncate">
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="relative">
                {/* Today line */}
                {todayLeft >= 0 && todayLeft <= 100 && (
                  <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `calc(192px + (100% - 192px) * ${todayLeft / 100})` }}>
                    <div className="absolute -top-0 -right-3 bg-red-500 text-white text-[10px] px-1 rounded">اليوم</div>
                  </div>
                )}

                {items.map(item => {
                  const barStyle = getBarStyle(item);
                  return (
                    <div key={item.id} className="flex items-center border-b hover:bg-gray-50 group h-10">
                      <div className="w-48 min-w-[192px] border-l px-3 text-sm truncate flex items-center gap-2" title={item.label}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        {item.label}
                      </div>
                      <div className="flex-1 relative h-full">
                        <div
                          className="absolute top-1.5 h-5 rounded-full flex items-center px-2 text-[10px] text-white font-medium overflow-hidden transition-all"
                          style={{ ...barStyle, backgroundColor: item.color, minWidth: '4px' }}
                          title={`${item.label} — ${statusLabels[item.status] || item.status}${item.progress !== undefined ? ` (${item.progress}%)` : ''}`}
                        >
                          {parseFloat(barStyle.width) > 8 && (
                            <span className="truncate">{statusLabels[item.status]}{item.progress !== undefined ? ` ${item.progress}%` : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {(view === 'projects'
          ? [['active', 'نشط'], ['completed', 'مكتمل'], ['on_hold', 'معلق'], ['cancelled', 'ملغي']]
          : [['todo', 'قيد الانتظار'], ['in_progress', 'قيد العمل'], ['review', 'مراجعة'], ['done', 'مكتمل']]
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[key] }}></span>
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
