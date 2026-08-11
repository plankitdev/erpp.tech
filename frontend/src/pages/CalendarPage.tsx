import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents } from '../hooks/useCalendar';
import { formatDate } from '../utils';
import type { CalendarEvent } from '../types';
import {
  ChevronRight, ChevronLeft, CalendarDays, Plus, Clock,
} from 'lucide-react';

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const eventColors: Record<string, { bg: string; text: string; dot: string }> = {
  task: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  meeting: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  team: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sales: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  client: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const navigate = useNavigate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${getDaysInMonth(year, month)}`;

  const { data: events = [], isLoading } = useCalendarEvents(startDate, endDate);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      const start = e.start?.split('T')[0] || e.start?.split(' ')[0];
      const end = e.end?.split('T')[0] || e.end?.split(' ')[0];
      if (start && end && start !== end) {
        // Spread event across all days between start and end
        const d = new Date(start);
        const endD = new Date(end);
        while (d <= endD) {
          const key = d.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push(e);
          d.setDate(d.getDate() + 1);
        }
      } else if (start) {
        if (!map[start]) map[start] = [];
        map[start].push(e);
      }
    });
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];


  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">التقويم</h1>
          <p className="page-subtitle">المهام والاجتماعات</p>
        </div>
        <button onClick={() => navigate('/meetings/create')} className="btn-primary">
          <Plus size={18} />
          اجتماع جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid - 3 cols */}
        <div className="lg:col-span-3 card card-body">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">
                {MONTHS_AR[month]} {year}
              </h2>
              <button onClick={goToday} className="text-xs text-primary-600 hover:text-primary-700 font-medium bg-primary-50 px-3 py-1 rounded-lg">
                اليوم
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <ChevronRight size={18} />
              </button>
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_AR.map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">{day}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 border-t border-r border-gray-100">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
              const dateStr = isCurrentMonth
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                : '';
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayEvents = isCurrentMonth ? (eventsByDate[dateStr] || []) : [];

              return (
                <div
                  key={i}
                  onClick={() => isCurrentMonth && setSelectedDate(dateStr)}
                  className={`min-h-[100px] border-b border-l border-gray-100 p-1.5 cursor-pointer transition-colors ${
                    isCurrentMonth ? 'hover:bg-gray-50' : 'bg-gray-50/50'
                  } ${isSelected ? 'bg-primary-50/50 ring-1 ring-inset ring-primary-200' : ''}`}
                >
                  {isCurrentMonth && (
                    <>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                        isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                      }`}>
                        {dayNum}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => {
                          const color = eventColors[ev.type] || eventColors.task;
                          return (
                            <div key={idx} className={`${color.bg} ${color.text} text-[10px] px-1.5 py-0.5 rounded truncate`}>
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 3} أخرى</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Selected day events */}
        <div className="card card-body">
          <h3 className="font-bold text-gray-900 mb-1">
            {selectedDate ? formatDate(selectedDate) : 'اختر يوم'}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {selectedEvents.length} حدث
          </p>

          {selectedDate ? (
            selectedEvents.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">لا توجد أحداث</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((ev, idx) => {
                  const color = eventColors[ev.type] || eventColors.task;
                  return (
                    <div key={idx} className={`${color.bg} rounded-xl p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${color.dot}`} />
                        <span className={`text-[10px] font-medium ${color.text}`}>
                          {ev.type === 'task' ? 'مهمة' : 'اجتماع'}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold ${color.text}`}>{ev.title}</p>
                      {ev.start && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500">
                          <Clock size={10} />
                          <span>{ev.start.includes('T') ? ev.start.split('T')[1]?.substring(0, 5) : ''}</span>
                          {ev.end && (
                            <>
                              <span>-</span>
                              <span>{ev.end.includes('T') ? ev.end.split('T')[1]?.substring(0, 5) : ''}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-10">
              <CalendarDays size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">انقر على يوم لعرض الأحداث</p>
            </div>
          )}

          {/* Quick legend */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 font-medium mb-2">الأنواع</p>
            <div className="space-y-1.5">
              {[
                { type: 'task', label: 'مهمة' },
                { type: 'meeting', label: 'اجتماع عام' },
                { type: 'team', label: 'اجتماع فريق' },
                { type: 'sales', label: 'اجتماع مبيعات' },
                { type: 'client', label: 'اجتماع عميل' },
              ].map(({ type, label }) => {
                const color = eventColors[type];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
