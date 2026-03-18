import { useQuery } from '@tanstack/react-query';
import { activityLogApi } from '../api/activityLogs';

export function useActivityLogs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => activityLogApi.getAll(params).then(r => r.data),
  });
}
