import { useState, useEffect, useCallback } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetPassword } from '../hooks/useUsers';
import { usersApi } from '../api/users';
import { superAdminApi } from '../api/auth';
import type { Company, User, PermissionsData } from '../types';
import {
  Trash2, KeyRound, Plus, X, Shield, Users as UsersIcon,
  ChevronDown, ChevronUp, Check, RefreshCw, Edit2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';
import { SkeletonTable } from '../components/Skeletons';

const roleLabels: Record<string, string> = {
  super_admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  sales: 'مبيعات',
  employee: 'موظف',
  marketing_manager: 'مدير تسويق',
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  accountant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sales: 'bg-amber-100 text-amber-700 border-amber-200',
  employee: 'bg-gray-100 text-gray-700 border-gray-200',
  marketing_manager: 'bg-pink-100 text-pink-700 border-pink-200',
};

export default function Users() {
  const { data, isLoading, isError, refetch } = useUsers();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; action: () => void }>({ open: false, title: '', message: '', action: () => {} });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resetPasswordMutation = useResetPassword();
  const users = data?.data ?? [];

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionsData, setPermissionsData] = useState<PermissionsData | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const emptyForm = { name: '', email: '', password: '', role: 'employee', company_id: '', permissions: [] as string[] };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    superAdminApi.getCompanies().then((res: any) => setCompanies(res.data.data)).catch(() => {});
    usersApi.getAllPermissions().then(res => setPermissionsData(res.data.data)).catch(() => {});
  }, []);

  const loadDefaults = useCallback(async (role: string) => {
    try {
      const res = await usersApi.getDefaultPermissions(role);
      setForm(f => ({ ...f, permissions: res.data.data }));
    } catch { /* ignore */ }
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowPermissions(false);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      company_id: user.company?.id?.toString() || '',
      permissions: user.permissions || [],
    });
    setShowPermissions(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        permissions: form.permissions.length > 0 ? form.permissions : null,
      };
      if (form.company_id) payload.company_id = parseInt(form.company_id);
      if (form.password) payload.password = form.password;

      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
        toast.success('تم تحديث المستخدم');
      } else {
        if (!form.password) { toast.error('كلمة المرور مطلوبة'); return; }
        payload.password = form.password;
        await createMutation.mutateAsync(payload);
        toast.success('تم إضافة المستخدم');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      open: true,
      title: 'حذف المستخدم',
      message: 'هل أنت متأكد من حذف هذا المستخدم؟',
      action: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          toast.success('تم حذف المستخدم');
        } catch {
          toast.error('حدث خطأ');
        }
        setConfirmDialog(d => ({ ...d, open: false }));
      },
    });
  };

  const handleResetPassword = (id: number, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'إعادة تعيين كلمة المرور',
      message: `هل تريد إعادة تعيين كلمة مرور "${name}"؟`,
      action: async () => {
        try {
          const res = await resetPasswordMutation.mutateAsync(id);
          toast.success(`كلمة المرور الجديدة: ${res.data.new_password}`, { duration: 10000 });
        } catch {
          toast.error('حدث خطأ في إعادة تعيين كلمة المرور');
        }
        setConfirmDialog(d => ({ ...d, open: false }));
      },
    });
  };

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const toggleModule = (modulePerms: string[]) => {
    const allChecked = modulePerms.every(p => form.permissions.includes(p));
    setForm(f => ({
      ...f,
      permissions: allChecked
        ? f.permissions.filter(p => !modulePerms.includes(p))
        : [...new Set([...f.permissions, ...modulePerms])],
    }));
  };

  const filteredUsers = searchQuery.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المستخدمين</h1>
          <p className="page-subtitle">{users.length} مستخدم</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} />
          مستخدم جديد
        </button>
      </div>

      {/* Search */}
      <div className="card card-body">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="بحث بالاسم أو البريد..."
          className="max-w-md"
        />
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">المستخدم</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الدور</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الشركة</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الصلاحيات</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : isError ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center">
                <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">حدث خطأ في تحميل البيانات</p>
                <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
              </td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center">
                <UsersIcon size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">لا يوجد مستخدمين</p>
              </td></tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${roleColors[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.company?.name || '—'}</td>
                <td className="px-6 py-4">
                  <span className="text-xs text-gray-400">
                    {u.role === 'super_admin' ? 'كامل' : `${u.permissions?.length || 0} صلاحية`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50" title="تعديل">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleResetPassword(u.id, u.name)} className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50" title="إعادة تعيين كلمة المرور">
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50" title="حذف">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => { setShowModal(false); setEditingUser(null); }} />
          <div className="modal-content max-w-2xl !max-h-[95vh] sm:!max-h-[90vh]">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                  {editingUser ? <Edit2 size={18} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{editingUser ? 'تعديل مستخدم' : 'مستخدم جديد'}</h2>
                  <p className="text-xs text-gray-400">{editingUser ? `تعديل بيانات ${editingUser.name}` : 'أضف مستخدم وحدد صلاحياته'}</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="modal-body space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">الاسم *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input" required />
                </div>
                <div>
                  <label className="input-label">البريد الإلكتروني *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="input-label">
                    كلمة المرور {editingUser ? '(اتركها فارغة لعدم التغيير)' : '*'}
                  </label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input"
                    required={!editingUser} placeholder={editingUser ? '••••••••' : ''} />
                </div>
                <div>
                  <label className="input-label">الدور *</label>
                  <select value={form.role} onChange={e => { setForm({ ...form, role: e.target.value }); }}
                    className="select">
                    <option value="super_admin">مدير النظام</option>
                    <option value="manager">مدير</option>
                    <option value="marketing_manager">مدير تسويق</option>
                    <option value="accountant">محاسب</option>
                    <option value="sales">مبيعات</option>
                    <option value="employee">موظف</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">الشركة *</label>
                  <select value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}
                    className="select" required>
                    <option value="">اختر الشركة</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Permissions Section */}
              {form.role !== 'super_admin' && permissionsData && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-primary-600" />
                      <span className="font-medium text-gray-700 text-sm">الصلاحيات</span>
                      <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">
                        {form.permissions.length} محددة
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mr-auto sm:mr-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); loadDefaults(form.role); }}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg"
                      >
                        <RefreshCw size={12} />
                        الافتراضي
                      </button>
                      {showPermissions ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {showPermissions && (
                    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto sidebar-scroll">
                      {Object.entries(permissionsData.permissions).map(([module, actions]) => {
                        const moduleLabel = permissionsData.permission_labels[module] || module;
                        const allChecked = actions.every(a => form.permissions.includes(a));
                        const someChecked = actions.some(a => form.permissions.includes(a));

                        return (
                          <div key={module} className="bg-gray-50 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <button
                                type="button"
                                onClick={() => toggleModule(actions)}
                                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                                  allChecked
                                    ? 'bg-primary-600 border-primary-600 text-white'
                                    : someChecked
                                    ? 'bg-primary-200 border-primary-400'
                                    : 'border-gray-300 hover:border-primary-400'
                                }`}
                              >
                                {allChecked && <Check size={12} />}
                                {someChecked && !allChecked && <div className="w-2 h-0.5 bg-primary-600 rounded" />}
                              </button>
                              <span className="font-semibold text-gray-700 text-sm">{moduleLabel}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mr-0 sm:mr-7">
                              {actions.map(action => {
                                const actionKey = action.split('.')[1];
                                const actionLabel = permissionsData.action_labels[actionKey] || actionKey;
                                const checked = form.permissions.includes(action);
                                return (
                                  <label key={action} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                                    checked ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                  }`}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => togglePermission(action)}
                                      className="sr-only"
                                    />
                                    {checked && <Check size={10} className="text-primary-600" />}
                                    {actionLabel}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : (editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingUser(null); }}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="تأكيد"
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />
    </div>
  );
}
