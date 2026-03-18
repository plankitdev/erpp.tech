import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi, attendanceApi } from '../api/hr';
import toast from 'react-hot-toast';

// ===== Leave Hooks =====
export function useLeaves(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['leaves', params],
    queryFn: () => leavesApi.getAll(params),
  });
}

export function useLeaveBalance(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['leave-balance', params],
    queryFn: () => leavesApi.balance(params),
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leavesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      toast.success('تم تقديم طلب الإجازة');
    },
    onError: () => toast.error('فشل تقديم الطلب'),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leavesApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      toast.success('تمت الموافقة');
    },
    onError: () => toast.error('فشلت العملية'),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => leavesApi.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('تم الرفض');
    },
    onError: () => toast.error('فشلت العملية'),
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leavesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      toast.success('تم حذف الطلب');
    },
    onError: () => toast.error('فشل الحذف'),
  });
}

// ===== Attendance Hooks =====
export function useAttendance(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceApi.getAll(params),
  });
}

export function useAttendanceToday() {
  return useQuery({
    queryKey: ['attendance-today'],
    queryFn: attendanceApi.today,
  });
}

export function useAttendanceSummary(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['attendance-summary', params],
    queryFn: () => attendanceApi.summary(params),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      toast.success('تم تسجيل الحضور');
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || 'فشل تسجيل الحضور'),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      toast.success('تم تسجيل الانصراف');
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || 'فشل تسجيل الانصراف'),
  });
}
