import { useState } from 'react';
import { useTickets, useTicket, useCreateTicket, useUpdateTicket, useDeleteTicket, useTicketReply } from '../hooks/useTickets';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { useUsersList } from '../hooks/useUsers';
import { useAuthStore } from '../store/authStore';
import { formatDate, formatDateTime } from '../utils';
import type { Ticket, TicketReply } from '../api/tickets';
import {
  Plus, Search, Ticket as TicketIcon, X, Send, Eye, Edit3, Trash2,
  AlertCircle, Clock, CheckCircle2, XCircle, Pause, MessageSquare, User,
} from 'lucide-react';
import toast from 'react-hot-toast';

const priorityLabels: Record<string, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = { open: 'مفتوحة', in_progress: 'قيد العمل', waiting: 'انتظار', resolved: 'تم الحل', closed: 'مغلقة' };
const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  waiting: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};
const statusIcons: Record<string, typeof AlertCircle> = {
  open: AlertCircle, in_progress: Clock, waiting: Pause, resolved: CheckCircle2, closed: XCircle,
};
const categoryLabels: Record<string, string> = { bug: 'خطأ', feature: 'ميزة جديدة', support: 'دعم', inquiry: 'استفسار', other: 'أخرى' };

export default function Tickets() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'manager';
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);

  const emptyForm = { subject: '', description: '', priority: 'medium', category: 'support', client_id: '' as string | number, project_id: '' as string | number, assigned_to: '' as string | number };
  const [form, setForm] = useState(emptyForm);

  const params: Record<string, string | number> = {};
  if (statusFilter) params.status = statusFilter;
  if (search) params.search = search;

  const { data: ticketsData, isLoading } = useTickets(params);
  const { data: detailData } = useTicket(showDetail || 0);
  const { data: clientsData } = useClients(isAdmin ? { per_page: 200 } : { per_page: 0 });
  const { data: projectsData } = useProjects(isAdmin ? { per_page: 200 } : { per_page: 0 });
  const { data: usersListData } = useUsersList();
  const usersData = usersListData;
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const ticketReply = useTicketReply();

  const tickets: Ticket[] = ticketsData?.data || [];
  const detail: Ticket | null = detailData?.data || null;
  const clients = clientsData?.data || [];
  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openEdit = (t: Ticket) => {
    setForm({
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      category: t.category,
      client_id: t.client?.id || '',
      project_id: t.project?.id || '',
      assigned_to: t.assignee?.id || '',
    });
    setEditingId(t.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.subject || !form.description) {
      toast.error('يرجى ملء الموضوع والوصف');
      return;
    }
    const payload = {
      ...form,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      assigned_to: form.assigned_to || null,
    } as Partial<Ticket>;
    if (editingId) {
      updateTicket.mutate({ id: editingId, data: payload }, { onSuccess: () => { setShowModal(false); resetForm(); } });
    } else {
      createTicket.mutate(payload, { onSuccess: () => { setShowModal(false); resetForm(); } });
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    updateTicket.mutate({ id, data: { status } });
  };

  const handleReply = () => {
    if (!replyText.trim() || !showDetail) return;
    ticketReply.mutate(
      { ticketId: showDetail, data: { body: replyText, is_internal: replyInternal } },
      { onSuccess: () => { setReplyText(''); setReplyInternal(false); } }
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const Icon = statusIcons[status] || AlertCircle;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || ''}`}>
        <Icon size={12} /> {statusLabels[status] || status}
      </span>
    );
  };

  const PriorityBadge = ({ priority }: { priority: string }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority] || ''}`}>
      {priorityLabels[priority] || priority}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isAdmin ? 'تذاكر الدعم' : 'الدعم الفني'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isAdmin ? 'إدارة تذاكر الدعم وتتبع حالتها' : 'أرسل مشكلتك وسنساعدك في حلها'}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {isAdmin ? 'تذكرة جديدة' : 'إرسال مشكلة'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'الكل', value: stats.total, color: 'bg-gray-50 text-gray-700', icon: TicketIcon },
          { label: 'مفتوحة', value: stats.open, color: 'bg-blue-50 text-blue-700', icon: AlertCircle },
          { label: 'قيد العمل', value: stats.in_progress, color: 'bg-yellow-50 text-yellow-700', icon: Clock },
          { label: 'تم الحل', value: stats.resolved, color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{s.label}</span>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="بحث بالمرجع أو الموضوع..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pr-10 w-full"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto flex-wrap">
          {[{ v: '', l: 'الكل' }, { v: 'open', l: 'مفتوحة' }, { v: 'in_progress', l: 'قيد العمل' }, { v: 'waiting', l: 'انتظار' }, { v: 'resolved', l: 'تم الحل' }, { v: 'closed', l: 'مغلقة' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${statusFilter === f.v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <TicketIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">لا توجد تذاكر</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">المرجع</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الموضوع</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 hidden sm:table-cell">التصنيف</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الأولوية</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                {isAdmin && <th className="px-4 py-3 text-right font-medium text-gray-600 hidden lg:table-cell">العميل</th>}
                {isAdmin && <th className="px-4 py-3 text-right font-medium text-gray-600 hidden lg:table-cell">المسؤول</th>}
                <th className="px-4 py-3 text-right font-medium text-gray-600 hidden md:table-cell">الردود</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 hidden md:table-cell">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-primary-600">{t.reference}</td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{categoryLabels[t.category] || t.category}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  {isAdmin && <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{t.client?.name || '—'}</td>}
                  {isAdmin && <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{t.assignee?.name || '—'}</td>}
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1"><MessageSquare size={14} /> {t.replies_count || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowDetail(t.id)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="عرض">
                        <Eye size={15} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" title="تعديل">
                          <Edit3 size={15} />
                        </button>
                      )}
                      {isAdmin && t.status !== 'closed' && t.status !== 'resolved' && (
                        <button onClick={() => handleStatusChange(t.id, 'resolved')} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="تم الحل">
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => { if (confirm('هل أنت متأكد؟')) deleteTicket.mutate(t.id); }} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="حذف">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingId ? 'تعديل التذكرة' : 'تذكرة جديدة'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع *</label>
                <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف *</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input w-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input w-full">
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input w-full">
                    <option value="bug">خطأ</option>
                    <option value="feature">ميزة جديدة</option>
                    <option value="support">دعم</option>
                    <option value="inquiry">استفسار</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>
              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                    <select value={form.client_id as string} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="input w-full">
                      <option value="">— بدون —</option>
                      {clients.map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
                    <select value={form.project_id as string} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="input w-full">
                      <option value="">— بدون —</option>
                      {projects.map((p: { id: number; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المسؤول</label>
                  <select value={form.assigned_to as string} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="input w-full">
                    <option value="">— غير محدد —</option>
                    {users.map((u: { id: number; name: string }) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">إلغاء</button>
              <button onClick={handleSubmit} disabled={createTicket.isPending || updateTicket.isPending} className="btn-primary">
                {createTicket.isPending || updateTicket.isPending ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail/Replies Modal */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-primary-600">{detail.reference}</span>
                <StatusBadge status={detail.status} />
                <PriorityBadge priority={detail.priority} />
              </div>
              <button onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>

            <h3 className="text-lg font-bold mb-2">{detail.subject}</h3>
            <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">{detail.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
              <div><span className="text-gray-500">التصنيف:</span> <span className="font-medium">{categoryLabels[detail.category]}</span></div>
              <div><span className="text-gray-500">العميل:</span> <span className="font-medium">{detail.client?.name || '—'}</span></div>
              <div><span className="text-gray-500">المشروع:</span> <span className="font-medium">{detail.project?.name || '—'}</span></div>
              <div><span className="text-gray-500">المسؤول:</span> <span className="font-medium">{detail.assignee?.name || '—'}</span></div>
              <div><span className="text-gray-500">أنشأها:</span> <span className="font-medium">{detail.creator?.name}</span></div>
              <div><span className="text-gray-500">التاريخ:</span> <span className="font-medium">{formatDate(detail.created_at)}</span></div>
              {detail.resolved_at && <div><span className="text-gray-500">تم الحل:</span> <span className="font-medium">{formatDate(detail.resolved_at)}</span></div>}
            </div>

            {/* Status Actions */}
            {isAdmin && detail.status !== 'closed' && (() => {
              const s = detail.status;
              return (
              <div className="flex gap-2 mb-6">
                {s !== 'in_progress' && s !== 'resolved' && (
                  <button onClick={() => handleStatusChange(detail.id, 'in_progress')} className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg">
                    بدء العمل
                  </button>
                )}
                {s !== 'resolved' && (
                  <button onClick={() => handleStatusChange(detail.id, 'resolved')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg">
                    تم الحل
                  </button>
                )}
                <button onClick={() => handleStatusChange(detail.id, 'closed')} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg">
                  إغلاق
                </button>
              </div>
              );
            })()}

            {/* Replies */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2"><MessageSquare size={16} /> الردود ({detail.replies?.length || 0})</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                {(!detail.replies || detail.replies.length === 0) ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد ردود بعد</p>
                ) : (
                  detail.replies.map((r: TicketReply) => (
                    <div key={r.id} className={`p-3 rounded-lg ${r.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm font-medium">{r.user.name}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(r.created_at)}</span>
                        {r.is_internal && <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">ملاحظة داخلية</span>}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              {detail.status !== 'closed' && (
                <div className="border-t pt-3">
                  <textarea
                    rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..." className="input w-full mb-2"
                  />
                  <div className="flex items-center justify-between">
                    {isAdmin ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={replyInternal} onChange={e => setReplyInternal(e.target.checked)} className="rounded" />
                        ملاحظة داخلية (لن تظهر للعميل)
                      </label>
                    ) : <div />}
                    <button onClick={handleReply} disabled={!replyText.trim() || ticketReply.isPending} className="btn-primary flex items-center gap-2 text-sm">
                      <Send size={14} /> إرسال الرد
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
