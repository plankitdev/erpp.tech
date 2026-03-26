import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEmployee } from '../hooks/useEmployees';
import { useUsersList } from '../hooks/useUsers';
import { employeesApi } from '../api/employees';
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
  user_id: z.coerce.number().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editId = id ? parseInt(id) : 0;
  const { data: employee } = useEmployee(editId);
  const currentUserId = employee?.user?.id;
  const { data: usersListData } = useUsersList(currentUserId ? { include_user_id: currentUserId } : undefined);
  const users = usersListData?.data || [];
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
  });

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
      const submitData = { ...data, user_id: data.user_id || null };
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
      navigate('/employees');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      <h1 className="page-title mb-6">{editId ? 'تعديل موظف' : 'إضافة موظف'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card card-body space-y-4">
        <h2 className="text-sm font-semibold text-primary-600 mb-2">البيانات الأساسية</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">الاسم *</label>
            <input type="text" {...register('name')} className="input" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="input-label">المسمى الوظيفي *</label>
            <input type="text" {...register('position')} className="input" />
            {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
          </div>
        </div>
        <div>
          <label className="input-label">ربط بحساب مستخدم</label>
          <select {...register('user_id')} className="input">
            <option value="">بدون ربط</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">الهاتف</label>
            <input type="text" {...register('phone')} className="input" />
          </div>
          <div>
            <label className="input-label">البريد الإلكتروني</label>
            <input type="email" {...register('email')} className="input" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">رقم الهوية</label>
            <input type="text" {...register('national_id')} className="input" />
          </div>
          <div>
            <label className="input-label">العنوان</label>
            <input type="text" {...register('address')} className="input" />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-primary-600 mt-4 mb-2">البيانات المالية</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">الراتب الأساسي *</label>
            <input type="number" {...register('base_salary')} className="input" />
            {errors.base_salary && <p className="text-red-500 text-xs mt-1">{errors.base_salary.message}</p>}
          </div>
          <div>
            <label className="input-label">تاريخ التعيين *</label>
            <input type="date" {...register('join_date')} className="input" />
            {errors.join_date && <p className="text-red-500 text-xs mt-1">{errors.join_date.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">اسم البنك</label>
            <input type="text" {...register('bank_name')} className="input" />
          </div>
          <div>
            <label className="input-label">رقم الحساب البنكي</label>
            <input type="text" {...register('bank_account')} className="input" />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-primary-600 mt-4 mb-2">بيانات العقد</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">بداية العقد</label>
            <input type="date" {...register('contract_start')} className="input" />
          </div>
          <div>
            <label className="input-label">نهاية العقد</label>
            <input type="date" {...register('contract_end')} className="input" />
          </div>
        </div>
        <div>
          <label className="input-label">عقد العمل (PDF)</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="input" />
        </div>
        <div>
          <label className="input-label">ملاحظات</label>
          <textarea {...register('notes')} rows={3} className="input resize-none" />
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
