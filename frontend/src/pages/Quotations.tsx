import { useState } from 'react';
import { useQuotations, useCreateQuotation, useDeleteQuotation, useUpdateQuotation } from '../hooks/useQuotations';
import { useClients } from '../hooks/useClients';
import { formatCurrency, formatDate } from '../utils';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { SkeletonTable } from '../components/Skeletons';
import { Plus, FileText, Trash2, Edit2, Download, Send, X } from 'lucide-react';
import { quotationsApi } from '../api/quotations';
import type { QuotationItem, Quotation } from '../api/quotations';
import type { Currency } from '../types';

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  sent: 'مُرسل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  expired: 'منتهي',
};

const emptyItem: QuotationItem = { description: '', quantity: 1, unit_price: 0 };

export default function Quotations() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading } = useQuotations({ status: statusFilter || undefined });
  const { data: clientsData } = useClients();
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const deleteMutation = useDeleteQuotation();

  const quotations = data?.data ?? [];
  const clients = clientsData?.data ?? [];

  // Form state
  const [form, setForm] = useState({
    client_id: '' as string | number,
    subject: '',
    description: '',
    items: [{ ...emptyItem }] as QuotationItem[],
    discount: 0,
    tax_rate: 0,
    currency: 'EGP' as Currency,
    valid_until: '',
    notes: '',
    terms: '',
  });

  const subtotal = form.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = (subtotal - form.discount) * (form.tax_rate / 100);
  const total = subtotal - form.discount + taxAmount;

  const resetForm = () => {
    setForm({
      client_id: '',
      subject: '',
      description: '',
      items: [{ ...emptyItem }],
      discount: 0,
      tax_rate: 0,
      currency: 'EGP' as Currency,
      valid_until: '',
      notes: '',
      terms: '',
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (q: Quotation) => {
    setForm({
      client_id: q.client?.id || '',
      subject: q.subject,
      description: q.description || '',
      items: q.items.length > 0 ? q.items : [{ ...emptyItem }],
      discount: q.discount,
      tax_rate: q.tax_rate,
      currency: (q.currency || 'EGP') as Currency,
      valid_until: q.valid_until || '',
      notes: q.notes || '',
      terms: q.terms || '',
    });
    setEditingId(q.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.subject || form.items.some(i => !i.description || i.quantity <= 0)) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const payload = {
      ...form,
      client_id: form.client_id || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload as any }, {
        onSuccess: () => { toast.success('تم تحديث عرض السعر'); setShowModal(false); resetForm(); },
        onError: () => toast.error('فشل تحديث عرض السعر'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('تم إنشاء عرض السعر'); setShowModal(false); resetForm(); },
        onError: () => toast.error('فشل إنشاء عرض السعر'),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('هل أنت متأكد من حذف عرض السعر؟')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('تم الحذف'),
      onError: () => toast.error('فشل الحذف'),
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, data: { status } as any }, {
      onSuccess: () => toast.success('تم تحديث الحالة'),
    });
  };

  const handleDownloadPdf = async (id: number, reference: string) => {
    try {
      const response = await quotationsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${reference}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('فشل تحميل PDF');
    }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: keyof QuotationItem, value: string | number) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">عروض الأسعار</h1>
          <p className="text-sm text-gray-500">إدارة عروض الأسعار والمقترحات</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          عرض سعر جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {['', 'draft', 'sent', 'accepted', 'rejected', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? statusLabels[s] : 'الكل'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'الكل', value: quotations.length, color: 'bg-gray-50 text-gray-700' },
          { label: 'مسودة', value: quotations.filter(q => q.status === 'draft').length, color: 'bg-gray-50 text-gray-600' },
          { label: 'مُرسل', value: quotations.filter(q => q.status === 'sent').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'مقبول', value: quotations.filter(q => q.status === 'accepted').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'مرفوض', value: quotations.filter(q => q.status === 'rejected').length, color: 'bg-red-50 text-red-700' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl px-4 py-3 text-center ${stat.color}`}>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3"><div className="skeleton-shimmer h-3 w-14 animate-pulse" /></th>
                <th className="px-4 py-3"><div className="skeleton-shimmer h-3 w-20 animate-pulse" /></th>
                <th className="px-4 py-3"><div className="skeleton-shimmer h-3 w-16 animate-pulse" /></th>
                <th className="px-4 py-3"><div className="skeleton-shimmer h-3 w-14 animate-pulse" /></th>
              </tr></thead>
              <tbody><SkeletonTable rows={5} cols={4} /></tbody>
            </table>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد عروض أسعار</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600">المرجع</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الموضوع</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">العميل</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الإجمالي</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">صالح حتى</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">التاريخ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary-600">{q.reference}</td>
                    <td className="px-4 py-3 font-medium">{q.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{q.client?.name || q.lead?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(q.total, q.currency as Currency)}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} size="sm" /></td>
                    <td className="px-4 py-3 text-gray-500">{q.valid_until ? formatDate(q.valid_until) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(q.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {q.status === 'draft' && (
                          <button onClick={() => handleStatusChange(q.id, 'sent')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="إرسال">
                            <Send size={14} />
                          </button>
                        )}
                        <button onClick={() => openEdit(q)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="تعديل">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDownloadPdf(q.id, q.reference)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="PDF">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editingId ? 'تعديل عرض السعر' : 'عرض سعر جديد'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                  <select
                    value={form.client_id}
                    onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">— اختياري —</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))} className="input">
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="input"
                  placeholder="مثال: عرض سعر تطوير موقع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input"
                  rows={2}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">البنود *</label>
                  <button onClick={addItem} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> إضافة بند
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="input flex-1"
                        placeholder="وصف البند"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="input w-20"
                        placeholder="الكمية"
                        min={0.01}
                        step={0.01}
                      />
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="input w-28"
                        placeholder="سعر الوحدة"
                        min={0}
                      />
                      <span className="text-sm font-semibold text-gray-600 w-24 text-left">
                        {formatCurrency(item.quantity * item.unit_price, form.currency)}
                      </span>
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={e => setForm(f => ({ ...f, discount: parseFloat(e.target.value) || 0 }))}
                    className="input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة %</label>
                  <input
                    type="number"
                    value={form.tax_rate}
                    onChange={e => setForm(f => ({ ...f, tax_rate: parseFloat(e.target.value) || 0 }))}
                    className="input"
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">صالح حتى</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Totals summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal, form.currency)}</span>
                </div>
                {form.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 mb-1">
                    <span>الخصم</span>
                    <span>-{formatCurrency(form.discount, form.currency)}</span>
                  </div>
                )}
                {form.tax_rate > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>الضريبة ({form.tax_rate}%)</span>
                    <span>{formatCurrency(taxAmount, form.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>الإجمالي</span>
                  <span>{formatCurrency(total, form.currency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الشروط والأحكام</label>
                <textarea
                  value={form.terms}
                  onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                  className="input"
                  rows={2}
                  placeholder="الشروط والأحكام الخاصة بالعرض..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">إلغاء</button>
              <button onClick={handleSubmit} className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
