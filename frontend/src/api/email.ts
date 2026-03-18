import api from './axios';

export const emailApi = {
  send: (data: { to: string; subject: string; body: string }) =>
    api.post('/email/send', data).then(r => r.data),

  sendInvoice: (invoiceId: number, data: { to: string; message?: string }) =>
    api.post(`/email/invoice/${invoiceId}`, data).then(r => r.data),

  sendQuotation: (quotationId: number, data: { to: string; message?: string }) =>
    api.post(`/email/quotation/${quotationId}`, data).then(r => r.data),
};
