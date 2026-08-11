import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClient, useCreateClient, useUpdateClient } from '../hooks/useClients';
import { useAuthStore } from '../store/authStore';
import Breadcrumbs from '../components/Breadcrumbs';
import FormHeader from '../components/FormHeader';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  slug: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  company_name: z.string().optional().or(z.literal('')),
  sector: z.string().optional().or(z.literal('')),
  service: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  notes: z.string().optional().or(z.literal('')),
  monthly_payment: z.union([z.string(), z.number()]).optional().transform(v => v === '' || v === undefined ? null : Number(v)),
  payment_day: z.union([z.string(), z.number()]).optional().transform(v => v === '' || v === undefined ? null : Number(v)),
});

type ClientFormData = z.infer<typeof clientSchema>;

const serviceOptions = [
  { value: 'تسويق', label: 'تسويق' },
  { value: 'تصميم', label: 'تصميم' },
  { value: 'مودريشن', label: 'مودريشن' },
  { value: 'تطوير', label: 'تطوير' },
  { value: 'أخرى', label: 'أخرى' },
];

export default function ClientForm() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const editSlug = slug || '';
  const { data: client, isLoading: loadingClient } = useClient(editSlug);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const user = useAuthStore(s => s.user);
  const isEmployee = user?.role === 'employee';

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: { status: 'active' },
  });

  useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        slug: client.slug || '',
        phone: client.phone || '',
        email: client.email || '',
        company_name: client.company_name || '',
        sector: client.sector || '',
        service: client.service || '',
        status: client.status,
        notes: client.notes || '',
        monthly_payment: client.monthly_payment ?? undefined,
        payment_day: client.payment_day ?? undefined,
      } as any);
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editSlug) {
        const result = await updateMutation.mutateAsync({ slug: editSlug, data });
        toast.success('تم تعديل العميل بنجاح');
        navigate(`/clients/${result.data?.slug || editSlug}`);
      } else {
        const result = await createMutation.mutateAsync(data);
        toast.success('تم إضافة العميل بنجاح');
        navigate(`/clients/${result.data?.slug || ''}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  if (editSlug && loadingClient) {
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
      <Breadcrumbs items={[{ label: 'العملاء', href: '/clients' }, { label: editSlug ? 'تعديل عميل' : 'إضافة عميل جديد' }]} />
      <FormHeader icon={UserPlus} title={editSlug ? 'تعديل عميل' : 'إضافة عميل جديد'} subtitle={editSlug ? 'تحديث بيانات العميل' : 'إضافة عميل جديد للنظام'} backTo="/clients" gradient="from-blue-500 to-indigo-600" />
      <form onSubmit={handleSubmit(onSubmit)} className="card card-body space-y-4">
        <div>
          <label htmlFor="name" className="input-label">اسم العميل <span className="text-red-400">*</span></label>
          <input id="name" type="text" {...register('name')} className="input" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        {editSlug && (
          <div>
            <label htmlFor="slug" className="input-label">Slug (رابط العميل)</label>
            <input id="slug" type="text" {...register('slug')} className="input" dir="ltr" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="input-label">رقم الموبايل</label>
            <input id="phone" type="text" {...register('phone')} className="input" />
          </div>
          <div>
            <label htmlFor="email" className="input-label">البريد الإلكتروني</label>
            <input id="email" type="email" dir="ltr" {...register('email')} className="input" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="company_name" className="input-label">اسم الشركة</label>
          <input id="company_name" type="text" {...register('company_name')} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sector" className="input-label">المجال</label>
            <input id="sector" type="text" {...register('sector')} className="input" />
          </div>
          <div>
            <label htmlFor="service" className="input-label">الخدمة</label>
            <select id="service" {...register('service')} className="select">
              <option value="">اختر الخدمة</option>
              {serviceOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {!isEmployee && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="monthly_payment" className="input-label">الدفعة الشهرية</label>
              <input id="monthly_payment" type="number" step="0.01" min="0" {...register('monthly_payment')} className="input" placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="payment_day" className="input-label">يوم الدفع (1-28)</label>
              <input id="payment_day" type="number" min="1" max="28" {...register('payment_day')} className="input" placeholder="1" />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="status" className="input-label">الحالة</label>
          <select id="status" {...register('status')} className="select">
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="lead">عميل محتمل</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="input-label">ملاحظات</label>
          <textarea id="notes" {...register('notes')} className="input resize-none" rows={3}></textarea>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
