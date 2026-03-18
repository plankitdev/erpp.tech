import api from './axios';
import type { ApiResponse, CalendarEvent } from '../types';

export const calendarApi = {
  getEvents: (params: { start_date: string; end_date: string }) =>
    api.get<ApiResponse<CalendarEvent[]>>('/calendar', { params }),
};
