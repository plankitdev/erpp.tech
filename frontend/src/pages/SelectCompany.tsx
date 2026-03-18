import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { superAdminApi } from '../api/auth';
import { companiesApi } from '../api/companies';
import type { Company } from '../types';
import toast from 'react-hot-toast';
import { Building2, Plus, Users, Calendar, LogOut, X, Upload, ArrowRight, Sparkles } from 'lucide-react';

export default function SelectCompany() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', primary_color: '#2c9f8f' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { user, switchCompany, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      navigate('/');
      return;
    }
    loadCompanies();
  }, [user, navigate]);

  const loadCompanies = async () => {
    try {
      const res = await superAdminApi.getCompanies();
      setCompanies(res.data.data);
    } catch {
      toast.error('حدث خطأ في تحميل الشركات');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (companyId: number) => {
    setSwitching(companyId);
    try {
      await switchCompany(companyId);
      navigate('/');
    } catch {
      toast.error('حدث خطأ أثناء اختيار الشركة');
    } finally {
      setSwitching(null);
    }
  };

  const slugify = (text: string) =>
    text.trim().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').replace(/-+/g, '-');

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: slugify(name) });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('slug', form.slug);
      formData.append('primary_color', form.primary_color);
      if (logoFile) formData.append('logo', logoFile);

      await companiesApi.create(formData);
      toast.success('تم إنشاء الشركة بنجاح');
      setShowCreate(false);
      setForm({ name: '', slug: '', primary_color: '#2563eb' });
      setLogoFile(null);
      setLogoPreview(null);
      await loadCompanies();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'حدث خطأ أثناء إنشاء الشركة';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
          <p className="text-white/50 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 flex flex-col relative overflow-hidden" dir="rtl">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary-400/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-wide block leading-tight">ERPFlex</span>
            <span className="text-white/30 text-xs">لوحة إدارة الشركات</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white/50 hover:text-white transition-all text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5">
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-5xl">
          {/* Welcome */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-300 px-4 py-1.5 rounded-full text-sm mb-4">
              <Sparkles size={14} />
              <span>مرحباً بك، {user?.name}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">اختر الشركة للمتابعة</h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto">يمكنك الدخول لإحدى الشركات المتاحة أو إنشاء شركة جديدة</p>
          </div>

          {/* Empty State */}
          {companies.length === 0 && !showCreate ? (
            <div className="animate-scale-in glass-card p-16 text-center max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-primary-700/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Building2 size={44} className="text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">لا توجد شركات بعد</h2>
              <p className="text-white/40 mb-10 leading-relaxed">قم بإنشاء شركتك الأولى للبدء في استخدام النظام وإدارة أعمالك</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105"
              >
                <Plus size={20} />
                إنشاء شركة جديدة
              </button>
            </div>
          ) : (
            <>
              {/* Companies Count */}
              <div className="flex items-center justify-between mb-6 animate-fade-in stagger-1">
                <p className="text-sm text-white/30">{companies.length} شركة متاحة</p>
              </div>

              {/* Companies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {companies.map((company, idx) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company.id)}
                    disabled={switching !== null}
                    className={`animate-fade-in-up stagger-${Math.min(idx + 1, 8)} group glass-card stat-shimmer p-6 text-right disabled:opacity-50 relative`}
                  >
                    {/* Active dot */}
                    <div className="absolute top-4 left-4 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />

                    <div className="flex items-start gap-4 mb-5">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all" />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all"
                          style={{ background: `linear-gradient(135deg, ${company.primary_color || '#2c9f8f'}, ${company.primary_color || '#2c9f8f'}cc)` }}
                        >
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate mb-1">{company.name}</h3>
                        <p className="text-white/30 text-sm font-mono">{company.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-white/35 text-xs">
                          <Users size={13} />
                          <span>{company.users_count || 0} مستخدم</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/35 text-xs">
                          <Calendar size={13} />
                          <span>{company.created_at}</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={16} className="text-primary-400" />
                      </div>
                    </div>

                    {switching === company.id && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/20 border-t-white"></div>
                      </div>
                    )}
                  </button>
                ))}

                {/* Create Company Card */}
                <button
                  onClick={() => setShowCreate(true)}
                  className={`animate-fade-in-up stagger-${Math.min(companies.length + 1, 8)} group bg-white/[0.03] backdrop-blur-lg border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-primary-500/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[220px]`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-700/10 flex items-center justify-center mb-4 group-hover:from-primary-500/20 group-hover:to-primary-700/20 transition-all group-hover:scale-110">
                    <Plus size={28} className="text-primary-400" />
                  </div>
                  <span className="text-white/50 font-medium group-hover:text-white/70 transition-colors">إنشاء شركة جديدة</span>
                  <span className="text-white/20 text-xs mt-1">أضف شركة لإدارتها</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4">
        <p className="text-white/15 text-xs">ERPFlex &copy; {new Date().getFullYear()}</p>
      </div>

      {/* Create Company Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowCreate(false)} />
          <div className="modal-content max-w-md" dir="rtl">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-gray-800">إنشاء شركة جديدة</h2>
                <p className="text-sm text-gray-400 mt-0.5">أدخل بيانات الشركة</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                <X size={16} />
              </button>
            </div>
            <form id="create-company-form" onSubmit={handleCreate} className="modal-body space-y-5">
              {/* Logo Upload */}
              <div className="flex flex-col items-center">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-2xl object-cover shadow-lg group-hover:opacity-80 transition-opacity ring-4 ring-gray-100" />
                      <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <Upload size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center group-hover:from-gray-100 group-hover:to-gray-200 transition-all border-2 border-dashed border-gray-200 group-hover:border-primary-300">
                      <Upload size={24} className="text-gray-300 group-hover:text-primary-400 transition-colors" />
                      <span className="text-xs text-gray-300 mt-1.5 group-hover:text-primary-400 transition-colors">رفع الشعار</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الشركة *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="مثال: شركة النور"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المعرف (Slug)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-left bg-gray-50/50 focus:bg-white font-mono text-sm"
                  dir="ltr"
                  placeholder="company-name"
                  required
                />
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اللون الأساسي</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => setForm({ ...form, primary_color: e.target.value })}
                    className="w-11 h-11 rounded-xl cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={e => setForm({ ...form, primary_color: e.target.value })}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl w-32 text-left bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-mono text-sm"
                    dir="ltr"
                  />
                  <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: form.primary_color }} />
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button
                type="submit"
                form="create-company-form"
                disabled={creating}
                className="btn-primary flex-1"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    جاري الإنشاء...
                  </span>
                ) : 'إنشاء الشركة'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
