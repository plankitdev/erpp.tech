import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClients, useDeleteClient, useBatchDeleteClients } from '../hooks/useClients';
import { useUrlFilters } from '../hooks/useUrlFilters';
import toast from 'react-hot-toast';
import type { Client } from '../types';
import { Plus, Pencil, Trash2, Eye, Download, Users, Building2 } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import SearchInput from '../components/SearchInput';
import { SkeletonTable } from '../components/Skeletons';

export default function Clients() {
  const { getParam, setParam, getPage, setPage } = useUrlFilters({ filter: 'all', sectorFilter: 'all' });
  const search = getParam('search');
  const filter = getParam('filter') || 'all';
  const sectorFilter = getParam('sectorFilter') || 'all';
  const page = getPage();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const params: Record<string, unknown> = { page };
  if (search) params.search = search;
  if (filter !== 'all') params.status = filter;
  if (sectorFilter !== 'all') params.sector = sectorFilter;

  const { data, isLoading, isError, refetch } = useClients(params);
  const deleteMutation = useDeleteClient();
  const batchDeleteMutation = useBatchDeleteClients();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { toast.success('تم حذف العميل'); setDeleteId(null); },
      onError: () => toast.error('حدث خطأ أثناء الحذف'),
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    batchDeleteMutation.mutate(selectedIds, {
      onSuccess: () => { toast.success(`تم حذف ${selectedIds.length} عميل`); setSelectedIds([]); setShowBatchConfirm(false); },
      onError: () => toast.error('حدث خطأ أثناء الحذف'),
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === clients.length) setSelectedIds([]);
    else setSelectedIds(clients.map((c: Client) => c.id));
  };

  const clients = data?.data || [];
  const meta = data?.meta;

  const statusFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
    { value: 'lead', label: 'عميل محتمل' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة العملاء</h1>
          <p className="page-subtitle">{meta?.total || clients.length} عميل مسجل</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('clients', ['الاسم', 'الموبايل', 'الشركة', 'الخدمة', 'الحالة'], clients.map((c: Client) => [c.name, c.phone || '', c.company_name || '', c.service || '', c.status]))} disabled={clients.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير CSV
          </button>
          <Link to="/clients/create" className="btn-primary">
            <Plus size={16} /> إضافة عميل
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-body !py-4 flex items-center gap-4 flex-wrap">
        <SearchInput
          value={search}
          onChange={(v) => setParam('search', v)}
          placeholder="بحث بالاسم أو الموبايل..."
          className="flex-1 min-w-[220px]"
        />
        <div className="filter-bar">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setParam('filter', s.value)}
              className={`filter-pill ${filter === s.value ? 'active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select value={sectorFilter}
          onChange={e => setParam('sectorFilter', e.target.value)}
          className="form-input !py-1.5 !px-3 !text-xs w-40">
          <option value="all">كل القطاعات</option>
          {(() => {
            const sectors = [...new Set(clients.map((c: Client) => c.sector).filter(Boolean))];
            return sectors.map(s => <option key={s} value={s!}>{s}</option>);
          })()}
        </select>
      </div>

      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <div className="card card-body !py-3 flex items-center gap-4 bg-red-50 border-red-200">
          <span className="text-sm text-red-700 font-medium">تم تحديد {selectedIds.length} عميل</span>
          <button onClick={() => setShowBatchConfirm(true)} className="btn-danger text-xs !py-1.5 !px-3 flex items-center gap-1">
            <Trash2 size={14} /> حذف المحدد
          </button>
          <button onClick={() => setSelectedIds([])} className="text-xs text-gray-500 hover:text-gray-700">إلغاء التحديد</button>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"><input type="checkbox" checked={clients.length > 0 && selectedIds.length === clients.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" /></th>
                <th>الاسم</th>
                <th>الموبايل</th>
                <th>الشركة</th>
                <th>القطاع</th>
                <th>الخدمة</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={8} />
              ) : isError ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div><button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button></td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Users size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد عملاء</p>
                </td></tr>
              ) : clients.map((client: Client) => (
                <tr key={client.id} className={selectedIds.includes(client.id) ? 'bg-blue-50/50' : ''}>
                  <td><input type="checkbox" checked={selectedIds.includes(client.id)} onChange={() => toggleSelect(client.id)} className="w-4 h-4 rounded border-gray-300" /></td>
                  <td className="font-semibold text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-1 ring-blue-100">
                        {client.name?.charAt(0)}
                      </div>
                      {client.name}
                    </div>
                  </td>
                  <td className="text-gray-500 font-mono text-[13px]">{client.phone}</td>
                  <td>{client.company_name}</td>
                  <td>
                    {client.sector ? (
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        <Building2 size={10} />
                        {client.sector}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                  <td>{client.service}</td>
                  <td>
                    <StatusBadge status={client.status} size="sm" />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/clients/${client.id}`} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50"><Eye size={15} /></Link>
                      <Link to={`/clients/${client.id}/edit`} className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50"><Pencil size={15} /></Link>
                      <button onClick={() => setDeleteId(client.id)} className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
        title="حذف العميل"
        message="هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={showBatchConfirm}
        title="حذف عملاء متعددين"
        message={`هل أنت متأكد من حذف ${selectedIds.length} عميل؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف الكل"
        onConfirm={handleBatchDelete}
        onCancel={() => setShowBatchConfirm(false)}
      />
    </div>
  );
}
