import api from './axios';

export const installmentApi = {
  getByContract: (contractId: number) =>
    api.get(`/contracts/${contractId}/installments`),

  generate: (contractId: number) =>
    api.post(`/contracts/${contractId}/installments/generate`),

  markPaid: (installmentId: number, data?: { paid_date?: string; notes?: string }) =>
    api.post(`/installments/${installmentId}/pay`, data || {}),
};
