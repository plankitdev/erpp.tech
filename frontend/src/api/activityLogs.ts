import api from './axios';

export const activityLogApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/activity-logs', { params }),
};
