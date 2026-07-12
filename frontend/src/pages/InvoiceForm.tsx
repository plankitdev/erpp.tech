import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { contractsApi } from '../api/contracts';
import type { Contract } from '../types';
import { formatCurrency } from '../utils';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from 'react-hot-toast';

const itemSchema = z.object({
  description: z.string().min(1, 'الوصف مطلوب'),
  quantity: z.coerce.number().min(0, 'كمية غير صالحة'),
  unit_price: z.coerce.number().min(0, 'سعر غير صالح'),
});

const invoiceSchema = z.object({
  contract_id: z.coerce.number().min(1, 'اختر العقد'),
  amount: z.coerce.number().min(0).optional(),
  items: z.array(itemSchema).optional().default([]),
  currency: z.enum(['EGP', 'USD', 'SAR']).default('EGP'),
  status: z.enum(['draft', 'sent', 'pending']).default('pending'),
  due_date: z.string().min(1, 'تاريخ الاستحقاق مطلوب'),
  is_paid: z.boolean().optional().default(false),
}).refine(
  d => (d.items && d.items.length > 0) || (typeof d.amount === 'number' && d.amount > 0),
  { message: 'أدخل المبلغ أو أضف بند واحد على الأقل', path: ['amount'] }
);

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editId = id ? parseInt(id) : 0;
  const { data: invoice } = useInvoice(editId);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const [contracts, setContracts] = useState<Contract[]>([]);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: { currency: 'EGP', status: 'pending', is_paid: false, items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' }) || [];
  const watchedCurrency = (useWatch({ control, name: 'currency' }) || 'EGP') as Contract['currency'];
  const hasItems = fields.length > 0;
  const itemsTotal = watchedItems.reduce(
    (sum: number, it: any) => sum + (Number(it?.quantity) || 0) * (Number(it?.unit_price) || 0), 0
  );

  useEffect(() => {
    contractsApi.getAll({ per_page: 1000 }).then(res => setContracts(res.data.data));
  }, []);

  useEffect(() => {
    if (invoice) {
      reset({
        contract_id: invoice.contract_id ?? undefined,
        amount: invoice.amount,
        items: invoice.items?.map(it => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })) ?? [],
        currency: invoice.currency,
        status: (['draft', 'sent', 'pending'].includes(invoice.status) ? invoice.status : 'pending') as any,
        due_date: invoice.due_date,
      } as any);
    }
  }, [invoice, reset]);

  const onSubmit = async (data: InvoiceFormData) => {
    const payload: any = {
      contract_id: data.contract_id,
      currency: data.currency,
      due_date: data.due_date,
    };
    if (data.items && data.items.length > 0) {
      payload.items = data.items;
    } else {
      payload.amount = data.amount;
    }
    if (!editId) {
      payload.status = data.status;
      payload.is_paid = data.is_paid;
    }

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        toast.success('تم تعديل الفاتورة');
      } else {
        await createMutation.mutateAsync(payload);
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

        {/* Line items (optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="input-label mb-0">بنود الفاتورة (اختياري)</label>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة بند
            </button>
          </div>
          {hasItems && (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-lg p-2">
                  <div className="col-span-12 sm:col-span-6">
                    <input placeholder="الوصف" {...register(`items.${index}.description`)} className="input" />
                    {errors.items?.[index]?.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input type="number" step="0.01" placeholder="كمية" {...register(`items.${index}.quantity`)} className="input" />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <input type="number" step="0.01" placeholder="سعر الوحدة" {...register(`items.${index}.unit_price`)} className="input" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-center pt-2">
                    <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700" title="حذف البند">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-12 text-xs text-gray-500">
                    إجمالي البند: {formatCurrency((Number(watchedItems[index]?.quantity) || 0) * (Number(watchedItems[index]?.unit_price) || 0), watchedCurrency)}
                  </div>
                </div>
              ))}
              <div className="text-sm font-semibold text-left pt-1">
                إجمالي البنود: {formatCurrency(itemsTotal, watchedCurrency)}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">المبلغ {hasItems && <span className="text-xs text-gray-400">(محسوب من البنود)</span>}</label>
            {hasItems ? (
              <input type="number" value={itemsTotal.toFixed(2)} readOnly className="input bg-gray-50 cursor-not-allowed" />
            ) : (
              <>
                <input type="number" step="0.01" {...register('amount')} className="input" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </>
            )}
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
          <>
            <div>
              <label className="input-label">الحالة</label>
              <select {...register('status')} className="select">
                <option value="pending">معلقة</option>
                <option value="draft">مسودة</option>
                <option value="sent">مُرسلة</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_paid" {...register('is_paid')} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="is_paid" className="text-sm text-gray-700">تسجيل كمدفوعة بالكامل</label>
            </div>
          </>
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
