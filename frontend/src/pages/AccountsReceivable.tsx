import { useState } from 'react';
import { useReceivableAging } from '../hooks/useFinancial';
import { Clock, AlertTriangle, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import { SkeletonTable } from '../components/Skeletons';

export default function AccountsReceivable() {
  const [filters] = useState<Record<string, unknown>>({});
  const { data: agingData, isLoading, isError, refetch } = useReceivableAging(filters);

  const aging = agingData as any;
  const clients = aging?.clients ?? [];
  const totals = aging?.totals ?? { current: 0, days_30: 0, days_60: 0, days_90: 0, over_120: 0, total: 0 };

  const getColor = (amount: number) => {
    if (amount <= 0) return 'text-gray-400';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">أعمار الديون</h1>
          <p className="page-subtitle">تقرير أعمار المديونيات — تحليل المستحقات حسب فترة التأخر</p>
        </div>
        <button
          onClick={() => exportToCSV('receivable-aging', ['العميل', 'جاري', '1-30 يوم', '31-60 يوم', '61-90 يوم', 'أكثر من 120', 'الإجمالي'],
            clients.map((c: any) => [c.name, String(c.current), String(c.days_30), String(c.days_60), String(c.days_90), String(c.over_120), String(c.total)])
          )}
          disabled={clients.length === 0}
          className="btn-secondary"
        >
          <Download size={16} /> تصدير
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'جاري', amount: totals.current, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '1-30 يوم', amount: totals.days_30, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: '31-60 يوم', amount: totals.days_60, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: '61-90 يوم', amount: totals.days_90, color: 'text-red-500', bg: 'bg-red-50' },
          { label: '90+ يوم', amount: totals.over_120, color: 'text-red-700', bg: 'bg-red-100' },
          { label: 'الإجمالي', amount: totals.total, color: 'text-gray-900', bg: 'bg-gray-100' },
        ].map((item, idx) => (
          <div key={idx} className={`rounded-xl ${item.bg} p-4`}>
            <p className="text-[11px] font-medium text-gray-500 mb-1">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>
              {Number(item.amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Aging Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>جاري</th>
                <th>1-30 يوم</th>
                <th>31-60 يوم</th>
                <th>61-90 يوم</th>
                <th>90+ يوم</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={6} cols={7} />
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <p className="text-red-400 mb-2">حدث خطأ</p>
                  <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
                </td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">لا يوجد مديونيات مستحقة</p>
                  <p className="text-xs text-gray-400 mt-1">جميع العملاء ملتزمون بالسداد</p>
                </td></tr>
              ) : clients.map((client: any, idx: number) => (
                <tr key={idx}>
                  <td className="font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {Number(client.over_120 || 0) > 0 && <AlertTriangle size={14} className="text-red-500" />}
                      {client.name}
                    </div>
                  </td>
                  <td className={getColor(client.current)}>{Number(client.current || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className={getColor(client.days_30)}>{Number(client.days_30 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className={getColor(client.days_60)}>{Number(client.days_60 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className={getColor(client.days_90)}>{Number(client.days_90 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className={getColor(client.over_120)}>{Number(client.over_120 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="font-bold text-gray-900">{Number(client.total || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            {clients.length > 0 && (
              <tfoot className="bg-gray-50/80 font-semibold text-[13px]">
                <tr>
                  <td className="px-4 py-3 text-gray-700">الإجمالي</td>
                  <td className="px-4 py-3 text-emerald-600">{Number(totals.current || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-yellow-600">{Number(totals.days_30 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-orange-600">{Number(totals.days_60 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-red-500">{Number(totals.days_90 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-red-700">{Number(totals.over_120 || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-gray-900">{Number(totals.total || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
