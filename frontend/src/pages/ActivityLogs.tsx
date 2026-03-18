import { useState } from 'react';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { formatDate } from '../utils';
import { Activity } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { SkeletonTable } from '../components/Skeletons';

interface LogEntry {
  id: number;
  action: string;
  model_type: string;
  model_id: number | null;
  changes: Record<string, unknown> | null;
  user: { id: number; name: string } | null;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  created: 'إنشاء',
  updated: 'تعديل',
  deleted: 'حذف',
};

const modelLabels: Record<string, string> = {
  Client: 'عميل',
  Contract: 'عقد',
  Invoice: 'فاتورة',
  Employee: 'موظف',
  Expense: 'مصروف',
};

export default function ActivityLogs() {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1 });
  const { data, isLoading } = useActivityLogs(filters);
  const logs: LogEntry[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-primary-600" />
          <h1 className="page-title">سجل النشاطات</h1>
        </div>
      </div>

      <div className="card card-body flex gap-4 mb-6">
        <select
          value={(filters.model_type as string) || ''}
          onChange={e => setFilters({ ...filters, model_type: e.target.value || undefined, page: 1 })}
          className="select max-w-[200px]"
        >
          <option value="">كل الأنواع</option>
          {Object.entries(modelLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={(filters.action as string) || ''}
          onChange={e => setFilters({ ...filters, action: e.target.value || undefined, page: 1 })}
          className="select max-w-[200px]"
        >
          <option value="">كل الإجراءات</option>
          {Object.entries(actionLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">رقم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التغييرات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <SkeletonTable rows={5} cols={6} />
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">لا يوجد سجلات</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{formatDate(log.created_at)}</td>
                  <td className="px-6 py-4 text-sm">{log.user?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.action} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-sm">{modelLabels[log.model_type] || log.model_type}</td>
                  <td className="px-6 py-4 text-sm">#{log.model_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.changes ? Object.keys(log.changes).join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            {Array.from({ length: meta.last_page }, (_, i) => (
              <button key={i + 1} onClick={() => setFilters({ ...filters, page: i + 1 })}
                className={`px-3 py-1 rounded-lg text-sm ${filters.page === i + 1 ? 'btn-primary' : 'bg-surface-100 text-gray-700 hover:bg-surface-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
