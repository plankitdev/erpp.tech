import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { companiesApi } from '../api/companies';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Key, Upload, Shield, Bell, Palette, User } from 'lucide-react';
import api from '../api/axios';

type SettingsTab = 'company' | 'profile' | 'security';

const tabConfig = [
  { id: 'company' as const, label: 'بيانات الشركة', icon: Building2, roles: ['super_admin', 'manager'] },
  { id: 'profile' as const, label: 'الملف الشخصي', icon: User, roles: [] },
  { id: 'security' as const, label: 'الأمان', icon: Shield, roles: [] },
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
                    <img src={currentLogo} alt="Logo" className="w-16 h-16 rounded-xl object-cover shadow-soft border border-gray-200 group-hover:opacity-80 transition-opacity" />
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
                    <img src={currentIcon} alt="Icon" className="w-12 h-12 rounded-xl object-cover shadow-soft border border-gray-200 group-hover:opacity-80 transition-opacity" />
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
                    className="w-16 h-16 rounded-full object-cover shadow-soft border-2 border-gray-200 group-hover:opacity-80 transition-opacity" />
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
    </div>
  );
}
