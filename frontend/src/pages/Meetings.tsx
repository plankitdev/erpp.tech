import { useState } from 'react';
import { useMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting, useRespondMeeting } from '../hooks/useMeetings';
import { formatDateTime } from '../utils';
import { useAuthStore } from '../store/authStore';
import type { Meeting } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, Video, X, Clock, MapPin, Users, Calendar,
  CheckCircle2, XCircle, Pencil, Trash2, Filter,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Breadcrumbs from '../components/Breadcrumbs';
import { SkeletonTable } from '../components/Skeletons';

const typeLabels: Record<string, string> = {
  team: 'فريق العمل',
  sales: 'مبيعات',
  client: 'عميل',
  other: 'أخرى',
};

const typeColors: Record<string, string> = {
  team: 'bg-blue-100 text-blue-700',
  sales: 'bg-amber-100 text-amber-700',
  client: 'bg-emerald-100 text-emerald-700',
  other: 'bg-gray-100 text-gray-700',
};

const statusLabelsMap: Record<string, string> = {
  scheduled: 'مجدول',
  in_progress: 'جاري',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Meetings() {
  const { user } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const params: Record<string, unknown> = { page };
  if (typeFilter !== 'all') params.type = typeFilter;
  if (statusFilter !== 'all') params.status = statusFilter;

  const { data, isLoading, isError, refetch } = useMeetings(params);
  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();
  const deleteMutation = useDeleteMeeting();
  const respondMutation = useRespondMeeting();

  const meetings = data?.data || [];
  const meta = data?.meta;

  const now = new Date();
  const filtered = meetings.filter((m: Meeting) => {
    const meetingDate = new Date(m.start_time);
    return tab === 'upcoming' ? meetingDate >= now : meetingDate < now;
  });

  const [form, setForm] = useState({
    title: '', description: '', start_time: '', end_time: '',
    location: '', type: 'team' as string, status: 'scheduled' as string,
  });

  const openCreateModal = () => {
    setEditMeeting(null);
    setForm({ title: '', description: '', start_time: '', end_time: '', location: '', type: 'team', status: 'scheduled' });
    setShowModal(true);
  };

  const openEditModal = (m: Meeting) => {
    setEditMeeting(m);
    setForm({
      title: m.title,
      description: m.description || '',
      start_time: m.start_time?.slice(0, 16) || '',
      end_time: m.end_time?.slice(0, 16) || '',
      location: m.location || '',
      type: m.type,
      status: m.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_time || !form.end_time) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    try {
      if (editMeeting) {
        await updateMutation.mutateAsync({ id: editMeeting.id, data: form as Partial<Meeting> });
        toast.success('تم تحديث الاجتماع');
      } else {
        await createMutation.mutateAsync(form as Partial<Meeting>);
        toast.success('تم إنشاء الاجتماع');
      }
      setShowModal(false);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { toast.success('تم حذف الاجتماع'); setDeleteId(null); },
      onError: () => toast.error('حدث خطأ'),
    });
  };

  const handleRespond = (id: number, status: 'accepted' | 'declined') => {
    respondMutation.mutate({ id, status }, {
      onSuccess: () => toast.success(status === 'accepted' ? 'تم قبول الاجتماع' : 'تم رفض الاجتماع'),
      onError: () => toast.error('حدث خطأ'),
    });
  };

  const typeFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'team', label: 'فريق العمل' },
    { value: 'sales', label: 'مبيعات' },
    { value: 'client', label: 'عميل' },
    { value: 'other', label: 'أخرى' },
  ];

  const statusFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'scheduled', label: 'مجدول' },
    { value: 'in_progress', label: 'جاري' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الاجتماعات' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">الاجتماعات</h1>
          <p className="page-subtitle">{meta?.total || meetings.length} اجتماع</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> اجتماع جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'upcoming' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Calendar size={14} className="inline ml-1.5" />
          القادمة
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'past' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Clock size={14} className="inline ml-1.5" />
          السابقة
        </button>
      </div>

      {/* Filters */}
      <div className="card card-body !py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">النوع:</span>
          <div className="filter-bar">
            {typeFilters.map(s => (
              <button key={s.value} onClick={() => { setTypeFilter(s.value); setPage(1); }}
                className={`filter-pill ${typeFilter === s.value ? 'active' : ''}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">الحالة:</span>
          <div className="filter-bar">
            {statusFilters.map(s => (
              <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
                className={`filter-pill ${statusFilter === s.value ? 'active' : ''}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meetings List */}
      {isLoading ? (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="data-table"><tbody><SkeletonTable rows={5} cols={6} /></tbody></table>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <p className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</p>
          <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <Video size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">لا يوجد اجتماعات {tab === 'upcoming' ? 'قادمة' : 'سابقة'}</p>
          <p className="text-gray-400 text-sm mt-1">اضغط "اجتماع جديد" لإنشاء اجتماع</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((meeting: Meeting) => {
            const myParticipation = meeting.participants?.find(p => p.id === user?.id);
            return (
              <div key={meeting.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 text-base">{meeting.title}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[meeting.type]}`}>
                        {typeLabels[meeting.type]}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[meeting.status]}`}>
                        {statusLabelsMap[meeting.status]}
                      </span>
                    </div>

                    {meeting.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{meeting.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {formatDateTime(meeting.start_time)}
                        {meeting.end_time && ` — ${formatDateTime(meeting.end_time)}`}
                      </span>
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {meeting.location}
                        </span>
                      )}
                      {meeting.project && (
                        <span className="flex items-center gap-1 text-primary-500">
                          📁 {meeting.project.name}
                        </span>
                      )}
                      {meeting.participants && meeting.participants.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={13} />
                          {meeting.participants.length} مشارك
                        </span>
                      )}
                    </div>

                    {/* Participants Avatars */}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 mt-3">
                        {meeting.participants.slice(0, 5).map((p: any) => (
                          <div key={p.id} title={`${p.name} (${p.pivot?.status === 'accepted' ? 'قبل' : p.pivot?.status === 'declined' ? 'رفض' : 'بانتظار الرد'})`}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white ${
                              p.pivot?.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              p.pivot?.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                            {p.name?.charAt(0)}
                          </div>
                        ))}
                        {meeting.participants.length > 5 && (
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 ring-2 ring-white">
                            +{meeting.participants.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* RSVP buttons */}
                    {myParticipation && meeting.status === 'scheduled' && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleRespond(meeting.id, 'accepted')}
                          className={`p-1.5 rounded-lg transition-all ${
                            myParticipation.pivot?.status === 'accepted'
                              ? 'bg-green-100 text-green-600'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title="قبول"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => handleRespond(meeting.id, 'declined')}
                          className={`p-1.5 rounded-lg transition-all ${
                            myParticipation.pivot?.status === 'declined'
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="رفض"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    <button onClick={() => openEditModal(meeting)}
                      className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteId(meeting.id)}
                      className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-1.5 p-4">
          {Array.from({ length: meta.last_page }, (_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                  <Video size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editMeeting ? 'تعديل الاجتماع' : 'اجتماع جديد'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {editMeeting ? 'تحديث بيانات الاجتماع' : 'إنشاء اجتماع جديد'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">عنوان الاجتماع *</label>
                  <input type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="form-input" placeholder="أدخل عنوان الاجتماع" required />
                </div>
                <div>
                  <label className="form-label">الوصف</label>
                  <textarea value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="form-input" rows={3} placeholder="وصف الاجتماع (اختياري)" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">وقت البداية *</label>
                    <input type="datetime-local" value={form.start_time}
                      onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">وقت النهاية *</label>
                    <input type="datetime-local" value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="form-input" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">النوع</label>
                    <select value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="form-input">
                      <option value="team">فريق العمل</option>
                      <option value="sales">مبيعات</option>
                      <option value="client">عميل</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">الحالة</label>
                    <select value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="form-input">
                      <option value="scheduled">مجدول</option>
                      <option value="in_progress">جاري</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">المكان</label>
                  <input type="text" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="form-input" placeholder="مثال: قاعة الاجتماعات أو رابط Zoom" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary">
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editMeeting ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الاجتماع"
        message="هل أنت متأكد من حذف هذا الاجتماع؟"
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
