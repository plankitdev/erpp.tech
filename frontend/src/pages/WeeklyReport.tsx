import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatDueDate } from '../utils';
import {
  BarChart3, CheckCircle2, AlertTriangle, Plus, TrendingUp,
  User, Calendar, RefreshCw, ChevronDown, ChevronUp, Award,
} from 'lucide-react';
import { useState } from 'react';

interface MemberReport {
  id: number;
  name: string;
  role: string;
  completed_count: number;
  created_count: number;
  overdue_count: number;
  completed_tasks: { id: number; title: string; priority: string }[];
  overdue_tasks: { id: number; title: string; priority: string; due_date: string }[];
}

interface WeeklyData {
  week_start: string;
  week_end: string;
  company_completed: number;
  company_created: number;
  members: MemberReport[];
}

const roleLabels: Record<string, string> = {
  super_admin: 'سوبر أدمن',
  company_admin: 'أدمن',
  manager: 'مدير',
  marketing_manager: 'مدير تسويق',
  employee: 'موظف',
  accountant: 'محاسب',
  hr: 'HR',
  sales: 'مبيعات',
};

const priorityColor: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-emerald-600 bg-emerald-50',
};

export default function WeeklyReport() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<WeeklyData>({
    queryKey: ['weekly-report'],
    queryFn: () => api.get('/account-manager/weekly-report').then(r => r.data?.data),
    staleTime: 300000,
  });

  const toggle = (id: number) => setExpanded(prev => (prev === id ? null : id));

  const totalCompleted = data?.company_completed ?? 0;
  const totalCreated   = data?.company_created ?? 0;
  const topPerformer   = data?.members?.[0];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 size={22} className="text-primary-500" />
            التقرير الأسبوعي
          </h1>
          {data && (
            <p className="page-subtitle flex items-center gap-1.5">
              <Calendar size={13} />
              {data.week_start} — {data.week_end}
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={32} className="animate-spin text-primary-400" />
        </div>
      ) : !data ? null : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
              <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-700">{totalCompleted}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">مهمة أُنجزت هذا الأسبوع</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
              <Plus size={28} className="text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-700">{totalCreated}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">مهمة أُضيفت هذا الأسبوع</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
              <Award size={28} className="text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-amber-700">{topPerformer?.name ?? '—'}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">
                الأكثر إنجازاً ({topPerformer?.completed_count ?? 0} مهام)
              </p>
            </div>
          </div>

          {/* Completion Rate Bar */}
          {totalCreated > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-500" />
                  نسبة الإنجاز الأسبوعي
                </h3>
                <span className="text-2xl font-bold text-primary-600">
                  {Math.round((totalCompleted / totalCreated) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((totalCompleted / totalCreated) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{totalCompleted} مكتملة</span>
                <span>{totalCreated} مجموع</span>
              </div>
            </div>
          )}

          {/* Per-Member Report */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <User size={16} className="text-gray-500" />
              تفاصيل التيم
            </h3>

            {data.members.map((member, idx) => (
              <div key={member.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  onClick={() => toggle(member.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-400">{roleLabels[member.role] ?? member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-600">{member.completed_count}</p>
                      <p className="text-[10px] text-gray-400">أُنجزت</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{member.created_count}</p>
                      <p className="text-[10px] text-gray-400">أُضيفت</p>
                    </div>
                    {member.overdue_count > 0 && (
                      <div className="text-center">
                        <p className="text-xl font-bold text-red-600">{member.overdue_count}</p>
                        <p className="text-[10px] text-gray-400">متأخرة</p>
                      </div>
                    )}
                    {expanded === member.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {expanded === member.id && (
                  <div className="px-5 pb-4 border-t border-gray-100 bg-gray-50/50">
                    {member.completed_tasks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                          <CheckCircle2 size={12} /> المهام المنجزة هذا الأسبوع
                        </p>
                        <div className="space-y-1.5">
                          {member.completed_tasks.map(t => (
                            <Link
                              key={t.id}
                              to={`/tasks/${t.id}`}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                            >
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColor[t.priority] ?? 'text-gray-500'}`}>
                                {t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                              </span>
                              {t.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {member.overdue_tasks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} /> المهام المتأخرة
                        </p>
                        <div className="space-y-1.5">
                          {member.overdue_tasks.map(t => {
                            const d = formatDueDate(t.due_date);
                            return (
                              <Link
                                key={t.id}
                                to={`/tasks/${t.id}`}
                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
                              >
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColor[t.priority] ?? 'text-gray-500'}`}>
                                  {t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                </span>
                                <span className="flex-1 truncate">{t.title}</span>
                                <span className={`text-[10px] ${d.className}`}>{d.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {member.completed_tasks.length === 0 && member.overdue_tasks.length === 0 && (
                      <p className="text-sm text-gray-400 mt-3 text-center">لا يوجد نشاط هذا الأسبوع</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
