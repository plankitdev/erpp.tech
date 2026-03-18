import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { clearForcePasswordChange, user } = useAuthStore();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (form.password !== form.password_confirmation) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(form);
      clearForcePasswordChange();
      toast.success('تم تغيير كلمة المرور بنجاح');
      if (user?.role === 'super_admin' && !user.company) {
        navigate('/select-company');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'حدث خطأ في تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-950 p-6 relative overflow-hidden" dir="rtl">
      {/* Background decorations */}
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-400/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/[0.08] backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.12] shadow-2xl">
            <KeyRound size={32} className="text-primary-300" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">تغيير كلمة المرور</h1>
          <p className="text-white/40 mt-2 text-sm">يجب تغيير كلمة المرور قبل المتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="card card-body space-y-5">
          {/* Current Password */}
          <div>
            <label className="input-label">كلمة المرور الحالية</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={form.current_password}
                onChange={e => setForm({ ...form, current_password: e.target.value })}
                className="input pr-11 pl-11"
                required
              />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="input-label">كلمة المرور الجديدة</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input pr-11 pl-11"
                placeholder="8 أحرف على الأقل"
                required
              />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="input-label">تأكيد كلمة المرور الجديدة</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                className="input pr-11 pl-11"
                required
              />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-[15px] shadow-lg shadow-primary-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                جاري التحديث...
              </>
            ) : (
              'تغيير كلمة المرور'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-white/20 mt-10">
          ERPFlex &copy; {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
