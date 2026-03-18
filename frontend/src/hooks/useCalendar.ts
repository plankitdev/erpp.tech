import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar';

export function useCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => calendarApi.getEvents({ start_date: startDate, end_date: endDate }).then(r => r.data.data),
    enabled: !!startDate && !!endDate,
  });
}
