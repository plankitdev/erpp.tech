import { useState } from 'react';
import { Target, TrendingUp, Clock, Users, DollarSign, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { usePersonalKpi, useTeamKpi } from '../hooks/useKpi';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export default function KpiDashboard() {
  const { user } = useAuthStore();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<'personal' | 'team'>('personal');

  const isManager = user?.role === 'super_admin' || user?.role === 'manager' || user?.role === 'marketing_manager';

  const { data: personal, isLoading: pLoading } = usePersonalKpi(month, year);
  const { data: team, isLoading: tLoading } = useTeamKpi(month, year, isManager);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  const getScoreColor = (rate: number, target: number) => {
    const pct = (rate / target) * 100;
    if (pct >= 90) return 'text-green-600';
    if (pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate: number, target: number) => {
    const pct = (rate / target) * 100;
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Target size={28} /> لوحة الأداء
          </h1>
          <p className="text-gray-500 mt-1">تتبع مؤشرات الأداء الشخصية والفريق</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
          <span className="font-medium text-gray-700 min-w-[140px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
        </div>
      </div>

      {/* Tabs */}
      {isManager && (
        <div className="flex gap-2 border-b border-gray-200">
          <button onClick={() => setTab('personal')} className={`px-4 py-2 font-medium text-sm border-b-2 transition ${tab === 'personal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            أدائي الشخصي
          </button>
          <button onClick={() => setTab('team')} className={`px-4 py-2 font-medium text-sm border-b-2 transition ${tab === 'team' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            أداء الفريق
          </button>
        </div>
      )}

      {tab === 'personal' && personal && !pLoading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tasks Completion */}
            <KpiCard
              icon={<CheckCircle size={20} className="text-blue-500" />}
              title="إنجاز المهام"
              value={`${personal.tasks.completion_rate}%`}
              target={`الهدف: ${personal.tasks.target_rate}%`}
              details={`${personal.tasks.completed} من ${personal.tasks.assigned}`}
              progress={personal.tasks.completion_rate}
              targetValue={personal.tasks.target_rate}
            />

            {/* Overdue */}
            <KpiCard
              icon={<AlertTriangle size={20} className="text-red-500" />}
              title="المهام المتأخرة"
              value={String(personal.tasks.overdue)}
              target="الهدف: 0"
              details="مهمة متأخرة"
              progress={personal.tasks.overdue === 0 ? 100 : Math.max(0, 100 - personal.tasks.overdue * 20)}
              targetValue={100}
            />

            {/* Hours */}
            <KpiCard
              icon={<Clock size={20} className="text-purple-500" />}
              title="ساعات العمل"
              value={`${personal.time.total_hours}h`}
              target={`الهدف: ${personal.time.target_hours}h`}
              details={`معدل يومي: ${personal.time.daily_avg}h`}
              progress={personal.time.total_hours}
              targetValue={personal.time.target_hours}
            />

            {/* Sales or Finance */}
            {personal.sales && (
              <KpiCard
                icon={<TrendingUp size={20} className="text-green-500" />}
                title="معدل التحويل"
                value={`${personal.sales.conversion_rate}%`}
                target={`الهدف: ${personal.sales.target_conversion}%`}
                details={`${personal.sales.leads_converted} من ${personal.sales.leads_created}`}
                progress={personal.sales.conversion_rate}
                targetValue={personal.sales.target_conversion}
              />
            )}
            {personal.finance && !personal.sales && (
              <KpiCard
                icon={<DollarSign size={20} className="text-green-500" />}
                title="معدل التحصيل"
                value={`${personal.finance.collection_rate}%`}
                target={`الهدف: ${personal.finance.target_collection}%`}
                details={`${personal.finance.invoices_paid} فاتورة`}
                progress={personal.finance.collection_rate}
                targetValue={personal.finance.target_collection}
              />
            )}
          </div>

          {/* Details Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {personal.sales && (
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> مؤشرات المبيعات</h3>
                <div className="space-y-3">
                  <StatRow label="عملاء محتملين جدد" value={personal.sales.leads_created} />
                  <StatRow label="تم التحويل" value={personal.sales.leads_converted} />
                  <StatRow label="الإيرادات المحققة" value={`${personal.sales.revenue.toLocaleString()} ج.م`} />
                </div>
              </div>
            )}
            {personal.finance && (
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign size={18} /> مؤشرات مالية</h3>
                <div className="space-y-3">
                  <StatRow label="فواتير مدفوعة" value={personal.finance.invoices_paid} />
                  <StatRow label="فواتير متأخرة" value={personal.finance.invoices_overdue} color="text-red-600" />
                  <StatRow label="إجمالي التحصيل" value={`${personal.finance.total_collected.toLocaleString()} ج.م`} />
                </div>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          {personal.trend.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={18} /> الأداء خلال 6 أشهر</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={personal.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tasks_completed" name="مهام منجزة" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="hours_worked" name="ساعات عمل" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'team' && isManager && team && !tLoading && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users size={18} /> أداء أعضاء الفريق</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-right py-3 px-4">#</th>
                  <th className="text-right py-3 px-4">الموظف</th>
                  <th className="text-right py-3 px-4">المسمى</th>
                  <th className="text-center py-3 px-4">مهام مسندة</th>
                  <th className="text-center py-3 px-4">مهام منجزة</th>
                  <th className="text-center py-3 px-4">نسبة الإنجاز</th>
                  <th className="text-center py-3 px-4">ساعات العمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.map((m, i) => (
                  <tr key={m.user_id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="py-3 px-4 text-gray-500">{m.position}</td>
                    <td className="py-3 px-4 text-center">{m.tasks_assigned}</td>
                    <td className="py-3 px-4 text-center">{m.tasks_completed}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${m.completion_rate >= 80 ? 'bg-green-500' : m.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(m.completion_rate, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium">{m.completion_rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{m.hours_worked}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {team.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={team.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks_completed" name="مهام منجزة" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hours_worked" name="ساعات عمل" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {(pLoading || tLoading) && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, title, value, target, details, progress, targetValue }: {
  icon: React.ReactNode; title: string; value: string; target: string; details: string; progress: number; targetValue: number;
}) {
  const pct = Math.min((progress / targetValue) * 100, 100);
  const barColor = pct >= 90 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>{details}</span>
        <span>{target}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${color || 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
