import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEmployee } from '../hooks/useEmployees';
import { useUsersList } from '../hooks/useUsers';
import { employeesApi } from '../api/employees';
import Breadcrumbs from '../components/Breadcrumbs';
import FormHeader from '../components/FormHeader';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

const employeeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  position: z.string().min(1, 'المسمى الوظيفي مطلوب'),
  phone: z.string().optional(),
  email: z.string().email('بريد غير صالح').optional().or(z.literal('')),
  national_id: z.string().optional(),
  address: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  base_salary: z.coerce.number().min(1, 'الراتب مطلوب'),
  join_date: z.string().min(1, 'تاريخ التعيين مطلوب'),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  notes: z.string().optional(),
  user_id: z.coerce.number().min(1, 'يجب ربط الموظف بحساب مستخدم'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editId = id ? parseInt(id) : 0;
  const { data: employee, isLoading: loadingEmployee } = useEmployee(editId);
  const { data: usersListData } = useUsersList();
  const users = usersListData?.data || [];
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
  });

  useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name,
        position: employee.position,
        phone: employee.phone || '',
        email: employee.email || '',
        national_id: employee.national_id || '',
        address: employee.address || '',
        bank_name: employee.bank_name || '',
        bank_account: employee.bank_account || '',
        base_salary: employee.base_salary,
        join_date: employee.join_date,
        contract_start: employee.contract_start || '',
        contract_end: employee.contract_end || '',
        notes: employee.notes || '',
        user_id: employee.user?.id || undefined,
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      // Treat user_id = 0 as null (no linking)
      const submitData = { ...data };
      if (editId) {
        if (file) {
          const formData = new FormData();
          formData.append('_method', 'PUT');
          Object.entries(submitData).forEach(([k, v]) => { if (v != null && v !== '') formData.append(k, String(v)); });
          formData.append('contract_file', file);
          await employeesApi.updateWithFile(editId, formData);
        } else {
          const payload: Record<string, unknown> = {};
          Object.entries(submitData).forEach(([k, v]) => { if (v != null && v !== '') payload[k] = v; });
          await employeesApi.update(editId, payload as Partial<import('../types').Employee>);
        }
        toast.success('تم تعديل الموظف');
      } else {
        const formData = new FormData();
        Object.entries(submitData).forEach(([k, v]) => { if (v != null && v !== '') formData.append(k, String(v)); });
        if (file) formData.append('contract_file', file);
        await employeesApi.create(formData as unknown as Partial<import('../types').Employee>);
        toast.success('تم إضافة الموظف');
      }
      // Refresh the employees list/detail so the change shows without a manual reload.
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate('/employees');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  if (editId && loadingEmployee) {
    return (
      <div className="page-container max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto">
      <Breadcrumbs items={[{ label: 'الموارد البشرية' }, { label: 'الموظفين', href: '/employees' }, { label: editId ? 'تعديل موظف' : 'إضافة موظف' }]} />
      <FormHeader icon={UserCog} title={editId ? 'تعديل موظف' : 'إضافة موظف'} subtitle={editId ? 'تحديث بيانات الموظف' : 'إضافة موظف جديد للفريق'} backTo="/employees" gradient="from-blue-600 to-indigo-700" />
      <form onSubmit={handleSubmit(onSubmit)} className="card card-body space-y-4">
        <h2 className="text-sm font-semibold text-primary-600 mb-2">البيانات الأساسية</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="input-label">الاسم *</label>
            <input id="name" type="text" {...register('name')} className="input" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="position" className="input-label">المسمى الوظيفي *</label>
            <input id="position" type="text" {...register('position')} className="input" />
            {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="user_id" className="input-label">حساب المستخدم *</label>
          <select id="user_id" {...register('user_id')} className="select">
            <option value="">— اختر مستخدم —</option>
            {users.map((u) => {
              // Disable users already linked to a *different* employee (one user = one employee).
              const linkedElsewhere = !!u.employee_id && u.employee_id !== editId;
              return (
                <option key={u.id} value={u.id} disabled={linkedElsewhere}>
                  {u.name} ({u.email}){linkedElsewhere ? ' — مرتبط بموظف آخر' : ''}
                </option>
              );
            })}
          </select>
          {errors.user_id && <p className="text-red-500 text-xs mt-1">{errors.user_id.message}</p>}
          <p className="text-xs text-gray-400 mt-1">كل الحسابات ظاهرة — المرتبط بموظف آخر يظهر معطّلاً. يجب إنشاء الحساب من صفحة المستخدمين أولاً.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="input-label">الهاتف</label>
            <input id="phone" type="text" {...register('phone')} className="input" />
          </div>
          <div>
            <label htmlFor="email" className="input-label">البريد الإلكتروني</label>
            <input id="email" type="email" {...register('email')} className="input" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="national_id" className="input-label">رقم الهوية</label>
            <input id="national_id" type="text" {...register('national_id')} className="input" />
          </div>
          <div>
            <label htmlFor="address" className="input-label">العنوان</label>
            <input id="address" type="text" {...register('address')} className="input" />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-primary-600 mt-4 mb-2">البيانات المالية</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="base_salary" className="input-label">الراتب الأساسي *</label>
            <input id="base_salary" type="number" {...register('base_salary')} className="input" />
            {errors.base_salary && <p className="text-red-500 text-xs mt-1">{errors.base_salary.message}</p>}
          </div>
          <div>
            <label htmlFor="join_date" className="input-label">تاريخ التعيين *</label>
            <input id="join_date" type="date" {...register('join_date')} className="input" />
            {errors.join_date && <p className="text-red-500 text-xs mt-1">{errors.join_date.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bank_name" className="input-label">اسم البنك</label>
            <input id="bank_name" type="text" {...register('bank_name')} className="input" />
          </div>
          <div>
            <label htmlFor="bank_account" className="input-label">رقم الحساب البنكي</label>
            <input id="bank_account" type="text" {...register('bank_account')} className="input" />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-primary-600 mt-4 mb-2">بيانات العقد</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contract_start" className="input-label">بداية العقد</label>
            <input id="contract_start" type="date" {...register('contract_start')} className="input" />
          </div>
          <div>
            <label htmlFor="contract_end" className="input-label">نهاية العقد</label>
            <input id="contract_end" type="date" {...register('contract_end')} className="input" />
          </div>
        </div>
        <div>
          <label htmlFor="contract_file" className="input-label">عقد العمل (PDF)</label>
          <input id="contract_file" type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="input" />
        </div>
        <div>
          <label htmlFor="notes" className="input-label">ملاحظات</label>
          <textarea id="notes" {...register('notes')} rows={3} className="input resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => navigate('/employees')} className="btn-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
