import api from './axios';

export const healthApi = {
  getHealth: () => api.get('/health'),
  getSystemStatus: () => api.get('/system/status'),
};
