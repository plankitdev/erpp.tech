import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const user = await login(data.email, data.password);
      const { forcePasswordChange: needsChange } = useAuthStore.getState();
      if (needsChange) {
        toast('يجب تغيير كلمة المرور أولاً', { icon: '🔑' });
        navigate('/change-password');
        return;
      }
      toast.success(`مرحباً ${user.name}!`);
      if (user.role === 'super_admin' && !user.company) {
        navigate('/select-company');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = error.response?.data?.message;
      if (error.response?.status === 401) {
        toast.error(msg || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.response?.status === 403) {
        toast.error(msg || 'هذا الحساب معطل، تواصل مع الإدارة');
      } else if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          Object.values(validationErrors).flat().forEach((e) => toast.error(e));
        } else {
          toast.error(msg || 'بيانات غير صحيحة');
        }
      } else if (!error.response) {
        toast.error('لا يمكن الاتصال بالسيرفر، تحقق من اتصال الإنترنت');
      } else {
        toast.error(msg || 'حدث خطأ غير متوقع، حاول مرة أخرى');
      }
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Right Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-950 relative overflow-hidden">
        {/* Animated decorative elements */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-primary-400/8 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-primary-300/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-white">
          <div className="w-20 h-20 bg-white/[0.08] backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/[0.12] shadow-2xl">
            <ShieldCheck size={40} strokeWidth={1.5} className="text-primary-300" />
          </div>
          <h1 className="text-5xl font-bold mb-3 tracking-tight">ERPFlex</h1>
          <p className="text-lg text-primary-300/80 mb-14 text-center leading-relaxed">
            نظام إدارة الأعمال المتكامل
          </p>

          <div className="space-y-5 text-primary-200/70 w-full max-w-sm">
            {[
              'إدارة العملاء والعقود والفواتير',
              'تتبع الخزينة والمصروفات والرواتب',
              'توزيع أرباح الشركاء تلقائياً',
              'تقارير شاملة ولوحة تحكم متقدمة',
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-white/[0.08] group-hover:bg-primary-500/20 transition-colors">
                  <Sparkles size={14} className="text-primary-400" />
                </div>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left Side — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-surface-50 p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-500/20">
              <ShieldCheck size={28} className="text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ERPFlex</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h2>
            <p className="text-gray-400 mt-2 text-sm">أدخل بيانات حسابك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="input-label">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className={errors.email ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`input pr-11 ${
                    errors.email ? 'border-red-300 bg-red-50/50 focus:ring-red-500/10 focus:border-red-400' : ''
                  }`}
                  placeholder="example@erpflex.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="input-label">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className={errors.password ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`input pr-11 pl-11 ${
                    errors.password ? 'border-red-300 bg-red-50/50 focus:ring-red-500/10 focus:border-red-400' : ''
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-[15px] shadow-lg shadow-primary-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            نسيت كلمة المرور؟ تواصل مع مدير النظام
          </p>

          <p className="text-center text-[11px] text-gray-400 mt-10">
            ERPFlex &copy; {new Date().getFullYear()} — جميع الحقوق محفوظة
          </p>

          <p className="text-center text-[11px] text-gray-400 mt-3">
            صنع بحب 💙 في مصر بواسطة{' '}
            <a
              href="https://plankit.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              PlanKit
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
