import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContracts, useDeleteContract } from '../hooks/useContracts';
import { formatCurrency, formatDate, statusLabels } from '../utils';
import toast from 'react-hot-toast';
import type { Contract } from '../types';
import { Plus, Pencil, Trash2, CreditCard, FileText, Download, AlertTriangle } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import SearchInput from '../components/SearchInput';
import { SkeletonTable } from '../components/Skeletons';

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const params: Record<string, unknown> = { page };
  if (search) params.search = search;
  if (filter !== 'all' && filter !== 'expiring_soon') params.status = filter;

  const { data, isLoading, isError, refetch } = useContracts(params);
  const deleteMutation = useDeleteContract();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { toast.success('تم حذف العقد'); setDeleteId(null); },
      onError: () => toast.error('حدث خطأ'),
    });
  };

  const contracts = data?.data || [];
  const meta = data?.meta;

  const statusFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'active', label: 'نشط' },
    { value: 'expiring_soon', label: '⚠️ ينتهي قريباً' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  // Check if contract expires within 30 days
  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const getDaysUntilExpiry = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filter expiring_soon locally
  const displayContracts = filter === 'expiring_soon'
    ? contracts.filter((c: Contract) => c.status === 'active' && isExpiringSoon(c.end_date))
    : contracts;

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'إدارة العقود' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة العقود</h1>
          <p className="page-subtitle">{meta?.total || contracts.length} عقد</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('contracts', ['الشركة', 'العميل', 'القيمة', 'العملة', 'البداية', 'النهاية', 'نوع الدفع', 'الحالة'], contracts.map((c: Contract) => [c.client?.company_name || '', c.client?.name || '', String(c.value ?? 0), c.currency || 'EGP', c.start_date, c.end_date || '', c.payment_type, c.status]))} disabled={contracts.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير CSV
          </button>
          <Link to="/contracts/create" className="btn-primary">
            <Plus size={16} /> عقد جديد
          </Link>
        </div>
      </div>

      <div className="card card-body !py-4 flex items-center gap-4 flex-wrap">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="بحث بالشركة أو العميل..."
          className="flex-1 min-w-[220px]"
        />
        <div className="filter-bar">
          {statusFilters.map(s => (
            <button key={s.value} onClick={() => { setFilter(s.value); setPage(1); }}
              className={`filter-pill ${filter === s.value ? 'active' : ''}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>الشركة / العميل</th>
                <th>القيمة</th>
                <th>البداية</th>
                <th>النهاية</th>
                <th>نوع الدفع</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div><button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button></td></tr>
              ) : displayContracts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد عقود</p>
                </td></tr>
              ) : displayContracts.map((c: Contract) => (
                <tr key={c.id}>
                  <td className="font-semibold text-gray-900">
                    <div>
                      <span>{c.client?.company_name || c.client?.name}</span>
                      {c.client?.company_name && c.client?.name && (
                        <span className="block text-xs text-gray-400 font-normal">{c.client.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{formatCurrency(c.value ?? 0, c.currency)}</td>
                  <td className="text-gray-500 text-[13px]">{formatDate(c.start_date)}</td>
                  <td className="text-gray-500 text-[13px]">
                    <div className="flex items-center gap-1.5">
                      {formatDate(c.end_date)}
                      {c.status === 'active' && isExpiringSoon(c.end_date) && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                          <AlertTriangle size={10} />
                          {getDaysUntilExpiry(c.end_date)} يوم
                        </span>
                      )}
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{statusLabels.payment_type[c.payment_type]}</span></td>
                  <td>
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {c.payment_type === 'installments' && (
                        <Link to={`/contracts/${c.id}/installments`} className="action-icon text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="الأقساط"><CreditCard size={15} /></Link>
                      )}
                      <Link to={`/contracts/${c.id}/edit`} className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Pencil size={15} /></Link>
                      <button onClick={() => setDeleteId(c.id)} className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-50">
            {Array.from({ length: meta.last_page }, (_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف العقد"
        message="هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
