import { useState } from 'react';
import { useEmployeeReport } from '../hooks/useProjects';
import { BarChart3, Users, CheckCircle2, Clock, AlertTriangle, Calendar, Loader2 } from 'lucide-react';

export default function EmployeeReports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading, isError, refetch } = useEmployeeReport(month, year);

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">تقارير الموظفين</h1>
          <p className="page-subtitle">أداء الموظفين والمهام المنجزة شهرياً</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="select">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="select">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-xl p-12 border text-center">
          <AlertTriangle size={40} className="text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">حدث خطأ</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">إعادة المحاولة</button>
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي المهام', value: data.summary.total_tasks, icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
              { label: 'مكتملة', value: data.summary.total_completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'قيد التنفيذ', value: data.summary.total_in_progress, icon: Clock, color: 'bg-amber-50 text-amber-600' },
              { label: 'متأخرة', value: data.summary.total_overdue, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
            ].map(card => (
              <div key={card.label} className="stat-card flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-400">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Employees Table */}
          {data.employees.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <Users size={40} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">لا توجد بيانات لهذا الشهر</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="overflow-x-auto">
                <table className="data-table text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-right px-5 py-3.5 font-semibold text-gray-600">الموظف</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">المنصب</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">إجمالي المهام</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">مكتملة</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">قيد التنفيذ</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">متأخرة</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.employees.map(emp => (
                      <tr key={emp.employee_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-bold">
                              {emp.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800">{emp.name}</span>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500">{emp.position || '-'}</td>
                        <td className="text-center px-4 py-3.5 font-semibold text-gray-800">{emp.total_tasks}</td>
                        <td className="text-center px-4 py-3.5">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-medium">{emp.completed_tasks}</span>
                        </td>
                        <td className="text-center px-4 py-3.5">
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-medium">{emp.in_progress_tasks}</span>
                        </td>
                        <td className="text-center px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${emp.overdue_tasks > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>{emp.overdue_tasks}</span>
                        </td>
                        <td className="text-center px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${emp.completion_rate >= 80 ? 'bg-emerald-500' : emp.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${emp.completion_rate}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{emp.completion_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
