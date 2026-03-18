import { useQuery } from '@tanstack/react-query';
import { dashboardApi, reportsApi } from '../api/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getData().then(r => r.data.data),
  });
}

export function useMonthlyReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'monthly', params],
    queryFn: () => reportsApi.monthly(params).then(r => r.data),
  });
}

export function useYearlyReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'yearly', params],
    queryFn: () => reportsApi.yearly(params).then(r => r.data),
  });
}

export function useClientsReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'clients', params],
    queryFn: () => reportsApi.clients(params).then(r => r.data),
  });
}

export function useSalariesReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'salaries', params],
    queryFn: () => reportsApi.salaries(params).then(r => r.data),
  });
}

export function useTreasuryReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'treasury', params],
    queryFn: () => reportsApi.treasury(params).then(r => r.data),
  });
}

export function usePartnersReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'partners', params],
    queryFn: () => reportsApi.partners(params).then(r => r.data),
  });
}
