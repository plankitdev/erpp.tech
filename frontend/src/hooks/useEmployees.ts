import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi, salariesApi } from '../api/employees';
import type { Employee, SalaryPayment } from '../types';

// ========== Employees ==========
export function useEmployees(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeesApi.getAll(params).then(r => r.data),
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeesApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employee>) => employeesApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      employeesApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeesApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

// ========== Salaries ==========
export function useSalaries(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['salaries', params],
    queryFn: () => salariesApi.getAll(params).then(r => r.data),
  });
}

export function useCreateSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SalaryPayment>) => salariesApi.create(data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaries'] });
      qc.invalidateQueries({ queryKey: ['treasury'] });
    },
  });
}

export function useUpdateSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SalaryPayment> }) =>
      salariesApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salaries'] }),
  });
}
