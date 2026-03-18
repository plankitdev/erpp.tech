import { useMutation } from '@tanstack/react-query';
import { emailApi } from '../api/email';
import toast from 'react-hot-toast';

export function useSendEmail() {
  return useMutation({
    mutationFn: emailApi.send,
    onSuccess: () => toast.success('تم إرسال البريد الإلكتروني'),
    onError: () => toast.error('فشل إرسال البريد الإلكتروني'),
  });
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data: { to: string; message?: string } }) =>
      emailApi.sendInvoice(invoiceId, data),
    onSuccess: () => toast.success('تم إرسال الفاتورة بالبريد'),
    onError: () => toast.error('فشل إرسال الفاتورة'),
  });
}

export function useSendQuotationEmail() {
  return useMutation({
    mutationFn: ({ quotationId, data }: { quotationId: number; data: { to: string; message?: string } }) =>
      emailApi.sendQuotation(quotationId, data),
    onSuccess: () => toast.success('تم إرسال عرض السعر بالبريد'),
    onError: () => toast.error('فشل إرسال عرض السعر'),
  });
}
