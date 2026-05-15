import { useState, useEffect, useCallback } from 'react';
import { useAttendanceToday, useCheckIn, useCheckOut } from '../hooks/useHR';
import { Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function AttendanceTimer() {
  const { data: todayData, isLoading } = useAttendanceToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const record = todayData?.data;

  const [elapsed, setElapsed] = useState(0);
  const [notified, setNotified] = useState(false);

  // Calculate elapsed time from check_in
  const getElapsed = useCallback(() => {
    if (!record?.check_in || record?.check_out) return 0;
    // check_in is "HH:mm:ss" and date is "YYYY-MM-DD"
    const dateStr = record.date?.split('T')[0] || new Date().toISOString().split('T')[0];
    const checkInTime = new Date(`${dateStr}T${record.check_in}`).getTime();
    if (isNaN(checkInTime)) return 0;
    return Math.max(0, Date.now() - checkInTime);
  }, [record]);

  useEffect(() => {
    if (!record?.check_in || record?.check_out) {
      setElapsed(0);
      return;
    }
    setElapsed(getElapsed());
    const interval = setInterval(() => setElapsed(getElapsed()), 1000);
    return () => clearInterval(interval);
  }, [record, getElapsed]);

  // 8-hour notification + repeated toast reminder
  useEffect(() => {
    if (elapsed >= EIGHT_HOURS_MS && !notified && record?.check_in && !record?.check_out) {
      setNotified(true);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('تنبيه الدوام', {
          body: 'مر 8 ساعات على تسجيل حضورك! يرجى تسجيل الانصراف الآن.',
          icon: '/icons/icon-192.svg',
        });
      }
      toast('⏰ انتهى وقت الدوام (8 ساعات) — سجّل انصرافك!', {
        duration: 10000,
        icon: '⚠️',
        style: { background: '#FEF3C7', color: '#92400E', fontWeight: 'bold' },
      });
    }
  }, [elapsed, notified, record]);

  // Repeat toast every 15 minutes after 8 hours
  useEffect(() => {
    if (!notified || !record?.check_in || record?.check_out) return;
    const interval = setInterval(() => {
      toast('⏰ لسه ماسجلتش انصراف! الدوام خلص من زمان.', {
        duration: 8000,
        icon: '🔴',
        style: { background: '#FEE2E2', color: '#991B1B', fontWeight: 'bold' },
      });
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [notified, record]);

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (isLoading) return null;

  const isCheckedIn = record?.check_in && !record?.check_out;
  const isDone = record?.check_in && record?.check_out;
  const isOver8h = elapsed >= EIGHT_HOURS_MS;

  return (
    <div className="flex items-center">
      {/* Not checked in yet */}
      {!record?.check_in && (
        <button
          onClick={() => checkIn.mutate()}
          disabled={checkIn.isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-all border border-emerald-200/80 hover:border-emerald-300"
        >
          <LogIn size={14} />
          <span className="hidden sm:inline">تسجيل حضور</span>
        </button>
      )}

      {/* Currently working — timer running */}
      {isCheckedIn && (
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums ${
            isOver8h
              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <Clock size={13} className={isOver8h ? 'text-amber-500' : 'text-emerald-500'} />
            {formatElapsed(elapsed)}
            {isOver8h && <AlertTriangle size={12} className="text-amber-500" />}
          </div>
          <button
            onClick={() => checkOut.mutate()}
            disabled={checkOut.isPending}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-2 rounded-xl transition-all border border-red-200/80 hover:border-red-300"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">انصراف</span>
          </button>
        </div>
      )}

      {/* Done for the day */}
      {isDone && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
          <Clock size={13} />
          <span>{record.hours_worked ? `${Number(record.hours_worked).toFixed(1)} ساعة` : 'تم الانصراف'}</span>
        </div>
      )}
    </div>
  );
}
