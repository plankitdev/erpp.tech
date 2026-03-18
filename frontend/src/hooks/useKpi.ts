import { useQuery } from '@tanstack/react-query';
import { kpiApi } from '../api/kpi';

export function usePersonalKpi(month?: number, year?: number) {
  return useQuery({ queryKey: ['kpi-personal', month, year], queryFn: () => kpiApi.getPersonal(month, year) });
}

export function useTeamKpi(month?: number, year?: number) {
  return useQuery({ queryKey: ['kpi-team', month, year], queryFn: () => kpiApi.getTeam(month, year) });
}
