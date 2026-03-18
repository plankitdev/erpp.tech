import api from './axios';
import type { ApiResponse, PaginatedResponse, Employee, SalaryPayment } from '../types';

export const employeesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Employee>>('/employees', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Employee>>(`/employees/${id}`),

  create: (data: Partial<Employee>) =>
    api.post<ApiResponse<Employee>>('/employees', data),

  update: (id: number, data: Partial<Employee>) =>
    api.put<ApiResponse<Employee>>(`/employees/${id}`, data),

  updateWithFile: (id: number, data: FormData) =>
    api.post<ApiResponse<Employee>>(`/employees/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/employees/${id}`),

  uploadFile: (employeeId: number, file: File, type?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (type) fd.append('type', type);
    return api.post(`/employees/${employeeId}/files`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteFile: (employeeId: number, fileId: number) =>
    api.delete(`/employees/${employeeId}/files/${fileId}`),
};

export const salariesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<SalaryPayment>>('/salary-payments', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<SalaryPayment>>(`/salary-payments/${id}`),

  create: (data: Partial<SalaryPayment>) =>
    api.post<ApiResponse<SalaryPayment>>('/salary-payments', data),

  update: (id: number, data: Partial<SalaryPayment>) =>
    api.put<ApiResponse<SalaryPayment>>(`/salary-payments/${id}`, data),
};
