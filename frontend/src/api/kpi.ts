import api from './axios';
import type { ApiResponse } from '../types';

export interface PersonalKpi {
  tasks: { assigned: number; completed: number; overdue: number; completion_rate: number; target_rate: number };
  time: { total_hours: number; target_hours: number; daily_avg: number };
  sales?: { leads_created: number; leads_converted: number; conversion_rate: number; target_conversion: number; revenue: number };
  finance?: { invoices_paid: number; invoices_overdue: number; total_collected: number; collection_rate: number; target_collection: number };
  trend: { month: string; label: string; tasks_completed: number; tasks_assigned: number; hours_worked: number }[];
}

export interface TeamKpiMember {
  user_id: number;
  name: string;
  role: string;
  position: string;
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate: number;
  hours_worked: number;
}

export const kpiApi = {
  getPersonal: (month?: number, year?: number) =>
    api.get<ApiResponse<PersonalKpi>>('/kpi/personal', { params: { month, year } }).then(r => r.data.data),

  getTeam: (month?: number, year?: number) =>
    api.get<ApiResponse<TeamKpiMember[]>>('/kpi/team', { params: { month, year } }).then(r => r.data.data),
};
