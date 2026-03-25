import { useState } from 'react';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { formatDate } from '../utils';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { SkeletonTable } from '../components/Skeletons';

interface LogEntry {
  id: number;
  action: string;
  model_type: string;
  model_id: number | null;
  changes: { old?: Record<string, unknown>; new?: Record<string, unknown> } | Record<string, unknown> | null;
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
  Lead: 'عميل محتمل',
  Ticket: 'تذكرة',
  Project: 'مشروع',
  Task: 'مهمة',
  Meeting: 'اجتماع',
  Quotation: 'عرض سعر',
  SalaryPayment: 'راتب',
  Partner: 'شريك',
  PartnerPayment: 'دفعة شريك',
  TreasuryTransaction: 'حركة خزينة',
  Installment: 'قسط',
  LeaveRequest: 'طلب إجازة',
  AttendanceRecord: 'حضور',
  Announcement: 'إعلان',
  WorkflowRule: 'قاعدة عمل',
  InvoicePayment: 'دفعة فاتورة',
  TimeEntry: 'وقت عمل',
  ManagedFile: 'ملف',
  User: 'مستخدم',
};

function ChangesDisplay({ changes }: { changes: LogEntry['changes'] }) {
  const [open, setOpen] = useState(false);
  if (!changes) return <span className="text-gray-400">—</span>;

  const hasOldNew = changes && 'old' in changes && 'new' in changes;

  if (hasOldNew) {
    const oldValues = (changes as { old: Record<string, unknown> }).old || {};
    const newValues = (changes as { new: Record<string, unknown> }).new || {};
    const fields = Object.keys(newValues);
    if (fields.length === 0) return <span className="text-gray-400">—</span>;

    const preview = fields.slice(0, 2).map(f => modelLabels[f] || f).join('، ');

    return (
      <div className="max-w-xs">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs">
          <span>{preview}{fields.length > 2 ? ` (+${fields.length - 2})` : ''}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {open && (
          <div className="mt-2 space-y-1 text-xs bg-gray-50 rounded-lg p-2">
            {fields.map(field => (
              <div key={field} className="flex flex-col">
                <span className="font-medium text-gray-700">{field}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 line-through">{String(oldValues[field] ?? '—')}</span>
                  <span className="text-gray-400">←</span>
                  <span className="text-green-600">{String(newValues[field] ?? '—')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Legacy format (flat object)
  const keys = Object.keys(changes);
  if (keys.length === 0) return <span className="text-gray-400">—</span>;
  return <span className="text-gray-500 text-xs">{keys.join('، ')}</span>;
}

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

      <div className="card card-body flex flex-wrap gap-4 mb-6">
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
        <input
          type="date"
          value={(filters.date_from as string) || ''}
          onChange={e => setFilters({ ...filters, date_from: e.target.value || undefined, page: 1 })}
          className="input max-w-[180px]"
          placeholder="من تاريخ"
        />
        <input
          type="date"
          value={(filters.date_to as string) || ''}
          onChange={e => setFilters({ ...filters, date_to: e.target.value || undefined, page: 1 })}
          className="input max-w-[180px]"
          placeholder="إلى تاريخ"
        />
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
                  <td className="px-6 py-4 text-sm">
                    <ChangesDisplay changes={log.changes} />
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
