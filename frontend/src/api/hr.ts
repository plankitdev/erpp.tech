import api from './axios';

export interface LeaveRequest {
  id: number;
  user: { id: number; name: string };
  approver?: { id: number; name: string } | null;
  type: 'annual' | 'sick' | 'personal' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  user: { id: number; name: string };
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  notes: string | null;
}

export interface LeaveBalance {
  year: number;
  total_used: number;
  by_type: Record<string, number>;
  annual_balance: number;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  late: number;
  absent: number;
  half_day: number;
  leave: number;
  total_hours: number;
  avg_hours: number;
}

export const leavesApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/leaves', { params }).then(r => r.data),
  create: (data: { type: string; start_date: string; end_date: string; reason?: string }) =>
    api.post('/leaves', data).then(r => r.data),
  approve: (id: number) =>
    api.post(`/leaves/${id}/approve`).then(r => r.data),
  reject: (id: number, rejection_reason?: string) =>
    api.post(`/leaves/${id}/reject`, { rejection_reason }).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/leaves/${id}`).then(r => r.data),
  balance: (params?: Record<string, string | number>) =>
    api.get('/leaves/balance', { params }).then(r => r.data),
};

export const attendanceApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/attendance', { params }).then(r => r.data),
  checkIn: () =>
    api.post('/attendance/check-in').then(r => r.data),
  checkOut: () =>
    api.post('/attendance/check-out').then(r => r.data),
  today: () =>
    api.get('/attendance/today').then(r => r.data),
  store: (data: Partial<AttendanceRecord> & { user_id: number; date: string; status: string }) =>
    api.post('/attendance', data).then(r => r.data),
  summary: (params?: Record<string, string | number>) =>
    api.get('/attendance/summary', { params }).then(r => r.data),
};
