import { Link } from 'react-router-dom';
import { useFinancialSummary } from '../hooks/useClients';
import { formatCurrency } from '../utils';
import { ArrowRight, DollarSign, Download } from 'lucide-react';
import { SkeletonTable } from '../components/Skeletons';
import { exportToCSV } from '../utils/exportCsv';
import type { ClientFinancialSummary } from '../types';

export default function ClientsFinancial() {
  const { data: clients, isLoading, isError, refetch } = useFinancialSummary();

  const totals = (clients || []).reduce(
    (acc, c) => ({
      contract: acc.contract + c.contract_value,
      expenses: acc.expenses + c.total_expenses,
      outstanding: acc.outstanding + c.outstanding,
    }),
    { contract: 0, expenses: 0, outstanding: 0 }
  );

  const handleExport = () => {
    if (!clients?.length) return;
    exportToCSV(
      'clients-financial',
      ['العميل', 'الخدمة', 'قيمة العقد', 'المصروفات', 'الدفعة الشهرية', 'المستحق', 'ملاحظات'],
      clients.map((c: ClientFinancialSummary) => [
        c.name,
        c.service || '',
        String(c.contract_value),
        String(c.total_expenses),
        c.monthly_payment != null ? String(c.monthly_payment) : '',
        String(c.outstanding),
        c.notes || '',
      ])
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/clients" className="action-icon text-gray-400 hover:text-gray-600">
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="page-title">الملخص المالي للعملاء</h1>
            <p className="page-subtitle">{clients?.length || 0} عميل نشط</p>
          </div>
        </div>
        <button onClick={handleExport} disabled={!clients?.length} className="btn-secondary">
          <Download size={16} /> تصدير CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">إجمالي العقود</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.contract)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <DollarSign size={16} className="text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">إجمالي المصروفات</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <DollarSign size={16} className="text-red-500" />
            </div>
            <span className="text-xs text-gray-500">إجمالي المستحق</span>
          </div>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totals.outstanding)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>الخدمة</th>
                <th>قيمة العقد</th>
                <th>المصروفات</th>
                <th>الدفعة الشهرية</th>
                <th>المستحق</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div>
                    <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              ) : !clients?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا يوجد بيانات مالية
                  </td>
                </tr>
              ) : (
                <>
                  {clients.map((c: ClientFinancialSummary) => (
                    <tr key={c.id}>
                      <td className="font-semibold text-gray-900">
                        <Link to={`/clients/${c.slug}`} className="hover:text-primary-600">
                          {c.name}
                        </Link>
                      </td>
                      <td className="text-gray-600">{c.service || '—'}</td>
                      <td className="font-medium">{formatCurrency(c.contract_value)}</td>
                      <td className="text-amber-600">{formatCurrency(c.total_expenses)}</td>
                      <td className="text-blue-600">
                        {c.monthly_payment ? formatCurrency(c.monthly_payment) : '—'}
                      </td>
                      <td className={c.outstanding > 0 ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                        {formatCurrency(c.outstanding)}
                      </td>
                      <td className="text-gray-500 text-xs max-w-[200px] truncate">{c.notes || '—'}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan={2} className="text-gray-700">الإجمالي</td>
                    <td>{formatCurrency(totals.contract)}</td>
                    <td className="text-amber-600">{formatCurrency(totals.expenses)}</td>
                    <td>—</td>
                    <td className="text-red-600">{formatCurrency(totals.outstanding)}</td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
