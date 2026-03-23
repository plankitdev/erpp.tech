import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { contractsApi } from '../api/contracts';
import type { Contract } from '../types';
import { formatCurrency } from '../utils';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from 'react-hot-toast';

const invoiceSchema = z.object({
  contract_id: z.coerce.number().min(1, 'اختر العقد'),
  amount: z.coerce.number().min(0.01, 'المبلغ مطلوب'),
  currency: z.enum(['EGP', 'USD', 'SAR']).default('EGP'),
  due_date: z.string().min(1, 'تاريخ الاستحقاق مطلوب'),
  is_paid: z.boolean().optional().default(false),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editId = id ? parseInt(id) : 0;
  const { data: invoice } = useInvoice(editId);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const [contracts, setContracts] = useState<Contract[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: { currency: 'EGP', is_paid: false },
  });

  useEffect(() => {
    contractsApi.getAll({ per_page: 1000 }).then(res => setContracts(res.data.data));
  }, []);

  useEffect(() => {
    if (invoice) {
      reset({
        contract_id: invoice.contract_id ?? undefined,
        amount: invoice.amount,
        currency: invoice.currency,
        due_date: invoice.due_date,
      } as any);
    }
  }, [invoice, reset]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        toast.success('تم تعديل الفاتورة');
      } else {
        await createMutation.mutateAsync(data);
        toast.success(data.is_paid ? 'تم إضافة الفاتورة وتسجيل الدفع' : 'تم إضافة الفاتورة');
      }
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      <Breadcrumbs items={[{ label: 'الفواتير', href: '/invoices' }, { label: editId ? 'تعديل فاتورة' : 'فاتورة جديدة' }]} />
      <h1 className="page-title mb-6">{editId ? 'تعديل فاتورة' : 'فاتورة جديدة'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card card-body space-y-4">
        <div>
          <label className="input-label">العقد</label>
          <select {...register('contract_id')} className="select">
            <option value="">اختر العقد</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.client?.company_name || c.client?.name} - {formatCurrency(c.value ?? 0, c.currency)}</option>
            ))}
          </select>
          {errors.contract_id && <p className="text-red-500 text-xs mt-1">{errors.contract_id.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">المبلغ</label>
            <input type="number" step="0.01" {...register('amount')} className="input" />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="input-label">العملة</label>
            <select {...register('currency')} className="select">
              <option value="EGP">جنيه مصري</option>
              <option value="USD">دولار</option>
              <option value="SAR">ريال</option>
            </select>
          </div>
        </div>
        <div>
          <label className="input-label">تاريخ الاستحقاق</label>
          <input type="date" {...register('due_date')} className="input" />
          {errors.due_date && <p className="text-red-500 text-xs mt-1">{errors.due_date.message}</p>}
        </div>

        {!editId && (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_paid" {...register('is_paid')} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="is_paid" className="text-sm text-gray-700">تسجيل كمدفوعة بالكامل</label>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
