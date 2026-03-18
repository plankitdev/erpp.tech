import { useState } from 'react';
import {
  useLeaves, useLeaveBalance, useCreateLeave, useApproveLeave, useRejectLeave, useDeleteLeave,
  useAttendanceToday, useAttendanceSummary, useCheckIn, useCheckOut,
} from '../hooks/useHR';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils';
import type { LeaveRequest, AttendanceSummary } from '../api/hr';
import {
  Plus, X, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  LogIn, LogOut, Briefcase, Coffee, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const leaveTypeLabels: Record<string, string> = { annual: 'سنوية', sick: 'مرضية', personal: 'شخصية', unpaid: 'بدون راتب', other: 'أخرى' };
const leaveStatusLabels: Record<string, string> = { pending: 'في الانتظار', approved: 'موافق عليها', rejected: 'مرفوضة' };
const leaveStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};
const attendanceStatusLabels: Record<string, string> = { present: 'حاضر', absent: 'غائب', late: 'متأخر', half_day: 'نصف يوم', leave: 'إجازة' };

export default function LeaveAttendance() {
  const { user } = useAuthStore();
  const isManager = user && ['super_admin', 'manager'].includes(user.role);
  const [tab, setTab] = useState<'leave' | 'attendance'>('leave');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'annual', start_date: '', end_date: '', reason: '' });

  const { data: leavesData, isLoading: leavesLoading } = useLeaves();
  const { data: balanceData } = useLeaveBalance();
  const { data: todayData } = useAttendanceToday();
  const { data: summaryData } = useAttendanceSummary();
  const createLeave = useCreateLeave();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const deleteLeave = useDeleteLeave();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const leaves: LeaveRequest[] = leavesData?.data || [];
  const balance = balanceData?.data;
  const todayRecord = todayData?.data;
  const summary: AttendanceSummary | null = summaryData?.data || null;

  const handleCreateLeave = () => {
    if (!leaveForm.start_date || !leaveForm.end_date) {
      toast.error('يرجى تحديد تواريخ الإجازة');
      return;
    }
    createLeave.mutate(leaveForm, {
      onSuccess: () => {
        setShowLeaveModal(false);
        setLeaveForm({ type: 'annual', start_date: '', end_date: '', reason: '' });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإجازات والحضور</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة طلبات الإجازات وتسجيل الحضور والانصراف</p>
        </div>
        <div className="flex gap-2">
          {tab === 'leave' && (
            <button onClick={() => setShowLeaveModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> طلب إجازة
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('leave')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'leave' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          <Calendar size={16} className="inline ml-1" /> الإجازات
        </button>
        <button onClick={() => setTab('attendance')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'attendance' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
          <Clock size={16} className="inline ml-1" /> الحضور والانصراف
        </button>
      </div>

      {tab === 'leave' ? (
        <>
          {/* Leave Balance */}
          {balance && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 font-medium">الرصيد المتبقي (سنوية)</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{balance.annual_balance} يوم</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-600 font-medium">سنوية مستخدمة</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{balance.by_type?.annual || 0}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-sm text-yellow-600 font-medium">مرضية</p>
                <p className="text-2xl font-bold text-yellow-800 mt-1">{balance.by_type?.sick || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-purple-600 font-medium">شخصية</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">{balance.by_type?.personal || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 font-medium">إجمالي المستخدم</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{balance.total_used}</p>
              </div>
            </div>
          )}

          {/* Leave Requests Table */}
          {leavesLoading ? (
            <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">لا توجد طلبات إجازة</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">الموظف</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">النوع</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">من</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">إلى</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">الأيام</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">السبب</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaves.map((l: LeaveRequest) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{l.user.name}</td>
                      <td className="px-4 py-3">{leaveTypeLabels[l.type]}</td>
                      <td className="px-4 py-3">{formatDate(l.start_date)}</td>
                      <td className="px-4 py-3">{formatDate(l.end_date)}</td>
                      <td className="px-4 py-3 font-semibold">{l.days}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{l.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${leaveStatusColors[l.status]}`}>
                          {leaveStatusLabels[l.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isManager && l.status === 'pending' && (
                            <>
                              <button onClick={() => approveLeave.mutate(l.id)} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="موافقة">
                                <CheckCircle2 size={15} />
                              </button>
                              <button onClick={() => rejectLeave.mutate({ id: l.id })} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="رفض">
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          {l.status === 'pending' && (l.user.id === user?.id || isManager) && (
                            <button onClick={() => { if (confirm('هل أنت متأكد؟')) deleteLeave.mutate(l.id); }} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="حذف">
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
        </>
      ) : (
        <>
          {/* Attendance: Today's Check-in/out */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock size={20} /> حضور اليوم</h3>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-sm text-gray-500">الحضور:</span>
                <span className="font-semibold mr-2">{todayRecord?.check_in || '—'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">الانصراف:</span>
                <span className="font-semibold mr-2">{todayRecord?.check_out || '—'}</span>
              </div>
              {todayRecord?.hours_worked && (
                <div>
                  <span className="text-sm text-gray-500">الساعات:</span>
                  <span className="font-semibold mr-2">{todayRecord.hours_worked} ساعة</span>
                </div>
              )}
              <div className="flex gap-2 mr-auto">
                {!todayRecord?.check_in && (
                  <button onClick={() => checkIn.mutate()} disabled={checkIn.isPending} className="btn-primary flex items-center gap-2 text-sm">
                    <LogIn size={16} /> تسجيل حضور
                  </button>
                )}
                {todayRecord?.check_in && !todayRecord?.check_out && (
                  <button onClick={() => checkOut.mutate()} disabled={checkOut.isPending} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <LogOut size={16} /> تسجيل انصراف
                  </button>
                )}
                {todayRecord?.check_out && (
                  <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle2 size={16} /> تم تسجيل اليوم</span>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'أيام حضور', value: summary.present, icon: CheckCircle2, color: 'bg-green-50 text-green-700' },
                { label: 'تأخير', value: summary.late, icon: AlertCircle, color: 'bg-yellow-50 text-yellow-700' },
                { label: 'غياب', value: summary.absent, icon: XCircle, color: 'bg-red-50 text-red-700' },
                { label: 'إجمالي الساعات', value: `${summary.total_hours}h`, icon: Clock, color: 'bg-blue-50 text-blue-700' },
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
          )}

          {/* Attendance Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <Briefcase size={18} />
              <span>يتم احتساب التأخير تلقائياً بعد الساعة 10:00 صباحاً</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-sm mt-2">
              <Coffee size={18} />
              <span>نصف يوم: أقل من 4 ساعات عمل</span>
            </div>
          </div>
        </>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">طلب إجازة</h2>
              <button onClick={() => setShowLeaveModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإجازة</label>
                <select value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))} className="input w-full">
                  <option value="annual">سنوية</option>
                  <option value="sick">مرضية</option>
                  <option value="personal">شخصية</option>
                  <option value="unpaid">بدون راتب</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من *</label>
                  <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى *</label>
                  <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                <textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} className="input w-full" placeholder="سبب الإجازة (اختياري)" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowLeaveModal(false)} className="btn-secondary">إلغاء</button>
              <button onClick={handleCreateLeave} disabled={createLeave.isPending} className="btn-primary">
                {createLeave.isPending ? 'جاري الإرسال...' : 'تقديم الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
