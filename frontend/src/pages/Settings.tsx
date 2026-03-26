import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { companiesApi } from '../api/companies';
import { googleDriveApi } from '../api/googleDrive';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Key, Upload, Shield, Bell, Palette, User, Cloud, RefreshCw, Unplug, CheckCircle2, HardDrive, ExternalLink, CloudOff } from 'lucide-react';
import api from '../api/axios';

type SettingsTab = 'company' | 'profile' | 'security' | 'integrations';

const tabConfig = [
  { id: 'company' as const, label: 'بيانات الشركة', icon: Building2, roles: ['super_admin', 'manager'] },
  { id: 'profile' as const, label: 'الملف الشخصي', icon: User, roles: [] },
  { id: 'security' as const, label: 'الأمان', icon: Shield, roles: [] },
  { id: 'integrations' as const, label: 'التكاملات', icon: Cloud, roles: ['super_admin'] },
];

export default function Settings() {
  const { user, fetchUser } = useAuthStore();
  const qc = useQueryClient();
  const companyId = user?.company?.id;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    (user?.role === 'super_admin' || user?.role === 'manager') ? 'company' : 'profile'
  );

  const availableTabs = tabConfig.filter(
    t => t.roles.length === 0 || (user?.role && (t.roles as string[]).includes(user.role))
  );

  // Company data
  const canViewCompany = user?.role === 'super_admin' || user?.role === 'manager';
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesApi.getById(companyId!).then(r => r.data.data),
    enabled: !!companyId && canViewCompany,
  });

  const [companyForm, setCompanyForm] = useState({ name: '', primary_color: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', password: '', password_confirmation: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (company && !initialized) {
    setCompanyForm({ name: company.name, primary_color: company.primary_color || '' });
    setInitialized(true);
  }

  // Update company
  const updateCompany = useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        return companiesApi.updateWithLogo(companyId!, data);
      }
      return companiesApi.update(companyId!, data);
    },
    onSuccess: () => {
      toast.success('تم تحديث بيانات الشركة');
      qc.invalidateQueries({ queryKey: ['company'] });
      fetchUser();
      setLogoFile(null);
      setLogoPreview(null);
      setIconFile(null);
      setIconPreview(null);
    },
    onError: () => toast.error('حدث خطأ'),
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/users/${user?.id}`, data),
    onSuccess: () => {
      toast.success('تم تحديث البيانات');
      fetchUser();
      setProfileForm({ name: '', password: '', password_confirmation: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  // Upload avatar
  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('تم تحديث الصورة الشخصية');
      fetchUser();
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: () => toast.error('حدث خطأ في رفع الصورة'),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
      // Auto-upload
      uploadAvatar.mutate(file);
    }
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

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (logoFile || iconFile) {
      const formData = new FormData();
      formData.append('name', companyForm.name);
      formData.append('primary_color', companyForm.primary_color);
      if (logoFile) formData.append('logo', logoFile);
      if (iconFile) formData.append('icon', iconFile);
      updateCompany.mutate(formData);
    } else {
      updateCompany.mutate(companyForm);
    }
  };

  const currentLogo = logoPreview || company?.logo;
  const currentIcon = iconPreview || company?.icon;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    if (profileForm.name) data.name = profileForm.name;
    if (profileForm.password) {
      data.password = profileForm.password;
      data.password_confirmation = profileForm.password_confirmation;
    }
    if (Object.keys(data).length === 0) return;
    updateProfile.mutate(data);
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعدادات</h1>
          <p className="page-subtitle">إدارة إعدادات الشركة والحساب</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        {availableTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (user?.role === 'super_admin' || user?.role === 'manager') && (
        <div className="card card-body">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Building2 size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">بيانات الشركة</h2>
          </div>
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div>
              <label className="input-label">شعار الشركة</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  {currentLogo ? (
                    <img src={currentLogo} alt="Logo" className="w-16 h-16 rounded-xl object-cover shadow-soft border border-gray-200 group-hover:opacity-80 transition-opacity" onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-50 flex flex-col items-center justify-center group-hover:bg-surface-100 transition-colors border border-gray-200">
                      <Upload size={20} className="text-gray-400" />
                    </div>
                  )}
                </label>
                <div className="text-sm text-gray-500">
                  <p>اضغط لتغيير الشعار</p>
                  <p className="text-xs text-gray-400">PNG, JPG بحد أقصى 2MB</p>
                </div>
              </div>
            </div>
            <div>
              <label className="input-label">أيقونة الشركة (تظهر في السايدبار)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
                  {currentIcon ? (
                    <img src={currentIcon} alt="Icon" className="w-12 h-12 rounded-xl object-cover shadow-soft border border-gray-200 group-hover:opacity-80 transition-opacity" onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-surface-50 flex flex-col items-center justify-center group-hover:bg-surface-100 transition-colors border border-gray-200">
                      <Upload size={16} className="text-gray-400" />
                    </div>
                  )}
                </label>
                <div className="text-sm text-gray-500">
                  <p>أيقونة صغيرة تظهر بجوار اسم الشركة</p>
                  <p className="text-xs text-gray-400">PNG, JPG بحد أقصى 1MB — يفضل مربعة</p>
                </div>
              </div>
            </div>
            <div>
              <label className="input-label">اسم الشركة</label>
              <input type="text" value={companyForm.name}
                onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                className="input" required />
            </div>
            <div>
              <label className="input-label">اللون الأساسي</label>
              <div className="flex items-center gap-3">
                <input type="color" value={companyForm.primary_color || '#6366f1'}
                  onChange={e => setCompanyForm({ ...companyForm, primary_color: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0" />
                <input type="text" value={companyForm.primary_color}
                  onChange={e => setCompanyForm({ ...companyForm, primary_color: e.target.value })}
                  className="input w-32" placeholder="#6366f1" />
              </div>
            </div>
            <button type="submit" disabled={updateCompany.isPending} className="btn-primary disabled:opacity-50">
              {updateCompany.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </form>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card card-body">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <User size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">بيانات حسابي</h2>
          </div>
          <div className="mb-4 p-3 bg-surface-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-4 mb-3">
              <label className="cursor-pointer group relative">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
                {(avatarPreview || user?.avatar) ? (
                  <img src={avatarPreview || user?.avatar || ''} alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover shadow-soft border-2 border-gray-200 group-hover:opacity-80 transition-opacity" onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors border-2 border-gray-200">
                    <span className="text-xl font-bold text-primary-600">{user?.name?.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-sm">
                  <Upload size={12} />
                </div>
              </label>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400">اضغط على الصورة لتغييرها</p>
                {uploadAvatar.isPending && <p className="text-xs text-primary-600">جاري الرفع...</p>}
              </div>
            </div>
            <p className="text-sm text-gray-600">البريد الإلكتروني: <strong className="text-gray-900">{user?.email}</strong></p>
            <p className="text-sm text-gray-600 mt-1">الدور: <strong className="text-gray-900">{user?.role}</strong></p>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="input-label">الاسم</label>
              <input type="text" value={profileForm.name} placeholder={user?.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="input-label">كلمة مرور جديدة</label>
              <input type="password" value={profileForm.password}
                onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                className="input" placeholder="اتركها فارغة إذا لم ترد التغيير" />
            </div>
            {profileForm.password && (
              <div>
                <label className="input-label">تأكيد كلمة المرور</label>
                <input type="password" value={profileForm.password_confirmation}
                  onChange={e => setProfileForm({ ...profileForm, password_confirmation: e.target.value })}
                  className="input" />
              </div>
            )}
            <button type="submit" disabled={updateProfile.isPending} className="btn-primary disabled:opacity-50">
              {updateProfile.isPending ? 'جاري الحفظ...' : 'تحديث البيانات'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card card-body">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Shield size={18} className="text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">الأمان وكلمة المرور</h2>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="input-label">كلمة مرور جديدة</label>
                <input type="password" value={profileForm.password}
                  onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="input" placeholder="أدخل كلمة مرور جديدة" />
              </div>
              {profileForm.password && (
                <div>
                  <label className="input-label">تأكيد كلمة المرور</label>
                  <input type="password" value={profileForm.password_confirmation}
                    onChange={e => setProfileForm({ ...profileForm, password_confirmation: e.target.value })}
                    className="input" />
                </div>
              )}
              <button type="submit" disabled={updateProfile.isPending || !profileForm.password} className="btn-primary disabled:opacity-50">
                {updateProfile.isPending ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </div>
          <div className="card card-body">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Key size={18} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">معلومات الجلسة</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-surface-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600">الحساب: <strong className="text-gray-900">{user?.email}</strong></p>
                <p className="text-sm text-gray-600 mt-1">الصلاحية: <strong className="text-gray-900">{user?.role}</strong></p>
                <p className="text-sm text-gray-600 mt-1">الشركة: <strong className="text-gray-900">{user?.company?.name || '—'}</strong></p>
              </div>
              <p className="text-xs text-gray-400">الجلسة محمية بنظام Sanctum Token Authentication</p>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && user?.role === 'super_admin' && (
        <GoogleDriveSettings />
      )}
    </div>
  );
}

function GoogleDriveSettings() {
  const qc = useQueryClient();

  const { data: driveStatus, isLoading } = useQuery({
    queryKey: ['google-drive-status'],
    queryFn: () => googleDriveApi.status().then(r => r.data.data),
  });

  const { data: fmStats } = useQuery({
    queryKey: ['file-manager-stats'],
    queryFn: () => api.get('/file-manager/stats').then(r => r.data.data),
  });

  const authMut = useMutation({
    mutationFn: () => googleDriveApi.getAuthUrl().then(r => {
      window.open(r.data.data.url, '_blank', 'width=600,height=700');
    }),
  });

  const syncMut = useMutation({
    mutationFn: () => googleDriveApi.sync(),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`تم مزامنة ${d.synced_files} ملف${d.errors > 0 ? ` (${d.errors} خطأ)` : ''}`);
      qc.invalidateQueries({ queryKey: ['google-drive-status'] });
    },
    onError: () => toast.error('فشلت المزامنة'),
  });

  const disconnectMut = useMutation({
    mutationFn: () => googleDriveApi.disconnect(),
    onSuccess: () => {
      toast.success('تم فصل جوجل درايف');
      qc.invalidateQueries({ queryKey: ['google-drive-status'] });
    },
  });

  // Listen for Drive auth popup callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'google-drive-connected') {
        toast.success('تم ربط جوجل درايف بنجاح!');
        qc.invalidateQueries({ queryKey: ['google-drive-status'] });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [qc]);

  const connected = driveStatus?.connected;
  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Google Drive Card */}
      <div className="card card-body">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Cloud size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">جوجل درايف</h2>
            <p className="text-xs text-gray-400">مزامنة ملفات مدير الملفات مع Google Drive</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
          </div>
        ) : connected ? (
          <div className="space-y-4">
            {/* Status */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">متصل بجوجل درايف</span>
              </div>
              {driveStatus?.last_synced_at && (
                <p className="text-sm text-emerald-600">آخر مزامنة: {driveStatus.last_synced_at}</p>
              )}
            </div>

            {/* Stats */}
            {fmStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-surface-50 rounded-xl text-center border border-gray-100">
                  <HardDrive className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{fmStats.total_files}</p>
                  <p className="text-xs text-gray-400">ملف</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl text-center border border-gray-100">
                  <Cloud className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{fmStats.total_folders}</p>
                  <p className="text-xs text-gray-400">مجلد</p>
                </div>
                <div className="p-3 bg-surface-50 rounded-xl text-center border border-gray-100">
                  <HardDrive className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{formatSize(fmStats.total_size)}</p>
                  <p className="text-xs text-gray-400">الحجم</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => syncMut.mutate()}
                disabled={syncMut.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncMut.isPending ? 'animate-spin' : ''}`} />
                {syncMut.isPending ? 'جاري المزامنة...' : 'مزامنة الآن'}
              </button>
              <button
                onClick={() => {
                  if (confirm('هل تريد فصل جوجل درايف؟ لن يتم حذف الملفات من Drive.')) disconnectMut.mutate();
                }}
                disabled={disconnectMut.isPending}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <Unplug className="w-4 h-4" />
                فصل الاتصال
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CloudOff className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-600">غير متصل</span>
              </div>
              <p className="text-sm text-gray-500">
                اربط حساب Google Drive لمزامنة ملفات مدير الملفات تلقائياً كنسخة احتياطية.
              </p>
            </div>
            <button
              onClick={() => authMut.mutate()}
              disabled={authMut.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              {authMut.isPending ? 'جاري الاتصال...' : 'ربط جوجل درايف'}
            </button>
          </div>
        )}
      </div>

      {/* Setup Guide */}
      {!connected && (
        <div className="card card-body">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Key size={18} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">خطوات الإعداد</h2>
          </div>
          <ol className="space-y-3 text-sm text-gray-600" dir="rtl">
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>ادخل على <strong>Google Cloud Console</strong> وأنشئ مشروع جديد أو استخدم مشروع موجود</span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>فعّل <strong>Google Drive API</strong> من APIs & Services → Library</span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>أنشئ <strong>OAuth Client ID</strong> (Web application) مع Redirect URI:<br />
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">https://erpp.tech/google-drive/callback</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span>حط <strong>Client ID</strong> و <strong>Client Secret</strong> في ملف <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">.env</code> على السيرفر</span>
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <span>اضغط <strong>"ربط جوجل درايف"</strong> أعلاه وسجّل بحساب العمل</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
