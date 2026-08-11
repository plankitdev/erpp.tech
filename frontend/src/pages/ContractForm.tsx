import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useContract, useCreateContract, useUpdateContract } from '../hooks/useContracts';
import { clientsApi } from '../api/clients';
import type { Client } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import FormHeader from '../components/FormHeader';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const contractSchema = z.object({
  client_id: z.coerce.number().min(1, 'اختر العميل'),
  value: z.coerce.number().min(0.01, 'القيمة مطلوبة'),
  currency: z.enum(['EGP', 'USD', 'SAR']).default('EGP'),
  start_date: z.string().min(1, 'تاريخ البداية مطلوب'),
  end_date: z.string().optional().or(z.literal('')),
  payment_type: z.enum(['monthly', 'installments', 'one_time']).default('monthly'),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
});

type ContractFormData = z.infer<typeof contractSchema>;

export default function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editId = id ? parseInt(id) : 0;
  const { data: contract, isLoading: loadingContract } = useContract(editId);
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const [clients, setClients] = useState<Client[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: { currency: 'EGP', payment_type: 'monthly', status: 'active' },
  });

  useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    clientsApi.getAll({ per_page: 1000 }).then(res => setClients(res.data.data));
  }, []);

  useEffect(() => {
    if (contract) {
      reset({
        client_id: contract.client_id,
        value: contract.value,
        currency: contract.currency,
        start_date: contract.start_date,
        end_date: contract.end_date || '',
        payment_type: contract.payment_type,
        status: contract.status,
      });
    }
  }, [contract, reset]);

  const onSubmit = async (data: ContractFormData) => {
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        toast.success('تم تعديل العقد بنجاح');
      } else {
        await createMutation.mutateAsync({ clientId: data.client_id, data });
        toast.success('تم إضافة العقد بنجاح');
      }
      navigate('/contracts');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  if (editId && loadingContract) {
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
      <Breadcrumbs items={[{ label: 'العقود', href: '/contracts' }, { label: editId ? 'تعديل عقد' : 'عقد جديد' }]} />
      <FormHeader icon={FileText} title={editId ? 'تعديل عقد' : 'عقد جديد'} subtitle={editId ? 'تحديث بيانات العقد' : 'إنشاء عقد جديد لعميل'} backTo="/contracts" gradient="from-amber-500 to-orange-600" />
      <form onSubmit={handleSubmit(onSubmit)} className="card card-body space-y-4">
        <div>
          <label className="input-label">الشركة / العميل <span className="text-red-400">*</span></label>
          <select {...register('client_id')} className="select">
            <option value="">اختر الشركة</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}{c.company_name ? ` (${c.name})` : ''}</option>)}
          </select>
          {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">القيمة <span className="text-red-400">*</span></label>
            <input type="number" step="0.01" {...register('value')} className="input" />
            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
          </div>
          <div>
            <label className="input-label">العملة</label>
            <select {...register('currency')} className="select">
              <option value="EGP">جنيه مصري</option>
              <option value="USD">دولار أمريكي</option>
              <option value="SAR">ريال سعودي</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">تاريخ البداية <span className="text-red-400">*</span></label>
            <input type="date" {...register('start_date')} className="input" />
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className="input-label">تاريخ النهاية</label>
            <input type="date" {...register('end_date')} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">نوع الدفع</label>
            <select {...register('payment_type')} className="select">
              <option value="monthly">شهري</option>
              <option value="installments">أقساط</option>
              <option value="one_time">دفعة واحدة</option>
            </select>
          </div>
          <div>
            <label className="input-label">الحالة</label>
            <select {...register('status')} className="select">
              <option value="active">ساري</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => navigate('/contracts')} className="btn-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
