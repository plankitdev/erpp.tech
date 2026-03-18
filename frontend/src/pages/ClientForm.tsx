import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClient, useCreateClient, useUpdateClient } from '../hooks/useClients';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  phone: z.string().optional().or(z.literal('')),
  company_name: z.string().optional().or(z.literal('')),
  sector: z.string().optional().or(z.literal('')),
  service: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  notes: z.string().optional().or(z.literal('')),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editId = id ? parseInt(id) : 0;
  const { data: client } = useClient(editId);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: { status: 'active' },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        phone: client.phone || '',
        company_name: client.company_name || '',
        sector: client.sector || '',
        service: client.service || '',
        status: client.status,
        notes: client.notes || '',
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientForm) => {
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        toast.success('تم تعديل العميل بنجاح');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('تم إضافة العميل بنجاح');
      }
      navigate('/clients');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      <h1 className="page-title mb-6">{editId ? 'تعديل عميل' : 'إضافة عميل جديد'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card card-body space-y-4">
        <div>
          <label className="input-label">اسم العميل</label>
          <input type="text" {...register('name')} className="input" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">رقم الموبايل</label>
            <input type="text" {...register('phone')} className="input" />
          </div>
          <div>
            <label className="input-label">اسم الشركة</label>
            <input type="text" {...register('company_name')} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">المجال</label>
            <input type="text" {...register('sector')} className="input" />
          </div>
          <div>
            <label className="input-label">الخدمة</label>
            <input type="text" {...register('service')} className="input" />
          </div>
        </div>
        <div>
          <label className="input-label">الحالة</label>
          <select {...register('status')} className="select">
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="lead">عميل محتمل</option>
          </select>
        </div>
        <div>
          <label className="input-label">ملاحظات</label>
          <textarea {...register('notes')} className="input resize-none" rows={3}></textarea>
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
