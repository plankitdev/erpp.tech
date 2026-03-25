import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeeting, useCreateMeeting, useUpdateMeeting } from '../hooks/useMeetings';
import { useUsersList } from '../hooks/useUsers';
import { useAuthStore } from '../store/authStore';
import type { Meeting } from '../types';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  Video, ArrowRight, Clock, MapPin, Link2, Users, FileText,
  CalendarDays, Search, Check, X,
} from 'lucide-react';

const typeOptions = [
  { value: 'team', label: 'فريق العمل', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '👥' },
  { value: 'sales', label: 'مبيعات', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '💼' },
  { value: 'client', label: 'عميل', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🤝' },
  { value: 'other', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📋' },
];

const statusOptions = [
  { value: 'scheduled', label: 'مجدول', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'in_progress', label: 'جاري', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'completed', label: 'مكتمل', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function MeetingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { data: meeting, isLoading: loadingMeeting } = useMeeting(id ? Number(id) : 0);
  const { data: usersListData } = useUsersList();
  const allUsers = usersListData?.data || [];
  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();
  const { user } = useAuthStore();
  const [participantSearch, setParticipantSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    meeting_link: '',
    type: 'team',
    status: 'scheduled',
    notes: '',
    participant_ids: [] as number[],
  });

  useEffect(() => {
    if (meeting && isEdit) {
      setForm({
        title: meeting.title || '',
        description: meeting.description || '',
        start_time: meeting.start_time?.slice(0, 16) || '',
        end_time: meeting.end_time?.slice(0, 16) || '',
        location: meeting.location || '',
        meeting_link: meeting.meeting_link || '',
        type: meeting.type || 'team',
        status: meeting.status || 'scheduled',
        notes: meeting.notes || '',
        participant_ids: meeting.participants?.map((p: any) => p.id) || [],
      });
    }
  }, [meeting, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_time || !form.end_time) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id: Number(id), data: form as Partial<Meeting> });
        toast.success('تم تحديث الاجتماع');
      } else {
        await createMutation.mutateAsync(form as Partial<Meeting>);
        toast.success('تم إنشاء الاجتماع');
      }
      navigate('/meetings');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const toggleParticipant = (userId: number) => {
    setForm(f => ({
      ...f,
      participant_ids: f.participant_ids.includes(userId)
        ? f.participant_ids.filter(id => id !== userId)
        : [...f.participant_ids, userId],
    }));
  };

  const filteredUsers = allUsers.filter((u: any) =>
    !participantSearch || u.name?.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const selectedUsers = allUsers.filter((u: any) => form.participant_ids.includes(u.id));

  if (isEdit && loadingMeeting) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumbs items={[
        { label: 'الاجتماعات', href: '/meetings' },
        { label: isEdit ? 'تعديل الاجتماع' : 'اجتماع جديد' },
      ]} />

      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/meetings')}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
            <ArrowRight size={18} className="text-gray-500" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <Video size={22} />
          </div>
          <div>
            <h1 className="page-title">{isEdit ? 'تعديل الاجتماع' : 'اجتماع جديد'}</h1>
            <p className="text-sm text-gray-400">{isEdit ? 'تحديث بيانات الاجتماع' : 'إنشاء اجتماع جديد وإضافة المشاركين'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card card-body">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary-500" />
            المعلومات الأساسية
          </h3>

          <div className="space-y-4">
            <div>
              <label className="input-label">عنوان الاجتماع <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input !text-base"
                placeholder="مثال: اجتماع مراجعة المشروع الأسبوعي"
                required
              />
            </div>

            <div>
              <label className="input-label">الوصف</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input"
                rows={3}
                placeholder="تفاصيل الاجتماع وأجندة المناقشة..."
              />
            </div>

            {/* Meeting Type - Visual Cards */}
            <div>
              <label className="input-label mb-2">نوع الاجتماع</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      form.type === opt.value
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl block mb-1">{opt.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time Card */}
        <div className="card card-body">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-primary-500" />
            التاريخ والوقت
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                <Clock size={13} className="inline ml-1 text-gray-400" />
                وقت البداية <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="input-label">
                <Clock size={13} className="inline ml-1 text-gray-400" />
                وقت النهاية <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="card card-body">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-primary-500" />
            المكان والرابط
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                <MapPin size={13} className="inline ml-1 text-gray-400" />
                المكان
              </label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="input"
                placeholder="قاعة الاجتماعات / المكتب الرئيسي"
              />
            </div>
            <div>
              <label className="input-label">
                <Link2 size={13} className="inline ml-1 text-gray-400" />
                رابط الاجتماع
              </label>
              <input
                type="url"
                value={form.meeting_link}
                onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                className="input"
                placeholder="https://meet.google.com/..."
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Participants Card */}
        <div className="card card-body">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users size={16} className="text-primary-500" />
            المشاركون
            {form.participant_ids.length > 0 && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                {form.participant_ids.length} محدد
              </span>
            )}
          </h3>

          {/* Selected participants pills */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedUsers.map((u: any) => (
                <span key={u.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium border border-primary-100">
                  <span className="w-5 h-5 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-[9px] font-bold">
                    {u.name?.charAt(0)}
                  </span>
                  {u.name}
                  <button type="button" onClick={() => toggleParticipant(u.id)} className="mr-0.5 hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              className="input !pr-9"
              placeholder="ابحث عن مستخدم..."
            />
          </div>

          {/* Users list */}
          <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 sidebar-scroll">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">لا يوجد مستخدمين</p>
            ) : filteredUsers.map((u: any) => {
              const isSelected = form.participant_ids.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleParticipant(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-right transition-all ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isSelected ? <Check size={14} /> : u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400">{u.email}</p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-primary-600 font-medium">محدد</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status & Notes (for edit) */}
        {isEdit && (
          <div className="card card-body">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              الحالة والملاحظات
            </h3>

            <div className="space-y-4">
              <div>
                <label className="input-label mb-2">حالة الاجتماع</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.status === opt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">📝 محضر / ملاحظات الاجتماع</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input"
                  rows={4}
                  placeholder="اكتب محضر الاجتماع أو ملاحظات بعد الانتهاء..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/meetings')}
            className="btn-secondary"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn-primary px-8"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </span>
            ) : isEdit ? 'تحديث الاجتماع' : 'إنشاء الاجتماع'}
          </button>
        </div>
      </form>
    </div>
  );
}
