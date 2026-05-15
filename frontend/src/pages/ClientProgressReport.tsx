import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { clientsApi } from '../api/clients';
import type { Client } from '../types';
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle, RefreshCw,
  TrendingUp, Users, ChevronRight, BarChart3,
} from 'lucide-react';

interface ProjectReport {
  id: number;
  name: string;
  slug: string;
  status: string;
  progress: number;
  total_tasks: number;
  done_tasks: number;
  overdue: number;
  end_date: string | null;
}

interface ByStatus {
  todo: number;
  in_progress: number;
  review: number;
  done: number;
}

interface ClientReport {
  client: { id: number; name: string };
  projects: ProjectReport[];
  by_status: ByStatus;
  total: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = {
  active: 'نشط', completed: 'مكتمل', on_hold: 'معلق', cancelled: 'ملغى',
};

export default function ClientProgressReport() {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const { data: clientsData } = useQuery<Client[]>({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.getAll({ per_page: 200 }).then(r => r.data.data),
  });
  const clients = clientsData ?? [];

  const { data: report, isLoading, refetch } = useQuery<ClientReport>({
    queryKey: ['client-report', selectedClientId],
    queryFn: () => api.get(`/account-manager/client-report/${selectedClientId}`).then(r => r.data?.data),
    enabled: !!selectedClientId,
  });

  const doneRate = report ? Math.round((report.by_status.done / Math.max(report.total, 1)) * 100) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={22} className="text-primary-500" />
            تقرير العميل
          </h1>
          <p className="page-subtitle">نظرة شاملة على مشاريع ومهام العميل</p>
        </div>
      </div>

      {/* Client Picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">اختر العميل</label>
        <select
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
          className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        >
          <option value="">— اختر —</option>
          {clients.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <RefreshCw size={28} className="animate-spin text-primary-400" />
        </div>
      )}

      {/* Report */}
      {report && !isLoading && (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'جديد', value: report.by_status.todo, color: 'bg-gray-50 border-gray-200 text-gray-700' },
              { label: 'جاري', value: report.by_status.in_progress, color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'مراجعة', value: report.by_status.review, color: 'bg-purple-50 border-purple-200 text-purple-700' },
              { label: 'مكتمل', value: report.by_status.done, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ].map(s => (
              <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-500" />
                نسبة الإنجاز الكلية
              </h3>
              <span className="text-2xl font-bold text-primary-600">{doneRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${doneRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{report.by_status.done} مكتملة من {report.total} مهمة إجمالي</p>
          </div>

          {/* Projects */}
          <div>
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FolderKanban size={16} className="text-gray-500" />
              المشاريع ({report.projects.length})
            </h3>

            {report.projects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                لا توجد مشاريع لهذا العميل
              </div>
            ) : (
              <div className="space-y-3">
                {report.projects.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FolderKanban size={16} className="text-primary-400" />
                        <Link
                          to={`/projects/${p.slug}`}
                          className="font-semibold text-gray-800 hover:text-primary-600 transition-colors flex items-center gap-1"
                        >
                          {p.name}
                          <ChevronRight size={14} className="text-gray-400" />
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {statusLabels[p.status] ?? p.status}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-primary-600">{p.progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${
                          p.progress >= 80 ? 'bg-emerald-500' : p.progress >= 40 ? 'bg-blue-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>

                    {/* Task Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <BarChart3 size={13} />
                        {p.total_tasks} مهمة
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={13} />
                        {p.done_tasks} مكتملة
                      </span>
                      {p.overdue > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle size={13} />
                          {p.overdue} متأخرة
                        </span>
                      )}
                      {p.end_date && (
                        <span className="flex items-center gap-1 text-gray-400 mr-auto">
                          <Clock size={13} />
                          {p.end_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => refetch()} className="btn-secondary text-sm">
              <RefreshCw size={14} /> تحديث
            </button>
          </div>
        </>
      )}

      {!selectedClientId && !isLoading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">اختر عميلاً لعرض التقرير</p>
        </div>
      )}
    </div>
  );
}
