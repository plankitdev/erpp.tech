import { useState, useRef } from 'react';
import { useMonthlyReport, useYearlyReport, useClientsReport, useSalariesReport, useTreasuryReport, usePartnersReport, useProfitLossReport, useCashFlowReport } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Printer, TrendingUp, TrendingDown, Wallet, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../utils';

const tabs = [
  { id: 'monthly', label: 'التقرير الشهري' },
  { id: 'yearly', label: 'التقرير السنوي' },
  { id: 'profit-loss', label: 'الأرباح والخسائر' },
  { id: 'cash-flow', label: 'التدفق النقدي' },
  { id: 'clients', label: 'تقرير العملاء' },
  { id: 'salaries', label: 'تقرير الرواتب' },
  { id: 'treasury', label: 'الخزينة' },
  { id: 'partners', label: 'تقرير الشركاء' },
] as const;

type TabId = typeof tabs[number]['id'];

interface ReportData {
  summary?: Record<string, string | number>;
  chart_data?: Array<Record<string, unknown>>;
  table_headers?: string[];
  table_data?: Array<Record<string, unknown>>;
}

function useReport(activeTab: TabId, params: Record<string, unknown>): { data: ReportData | undefined; isLoading: boolean } {
  const monthly = useMonthlyReport(activeTab === 'monthly' ? params : undefined);
  const yearly = useYearlyReport(activeTab === 'yearly' ? params : undefined);
  const clients = useClientsReport(activeTab === 'clients' ? params : undefined);
  const salaries = useSalariesReport(activeTab === 'salaries' ? params : undefined);
  const treasury = useTreasuryReport(activeTab === 'treasury' ? params : undefined);
  const partners = usePartnersReport(activeTab === 'partners' ? params : undefined);
  const profitLoss = useProfitLossReport(activeTab === 'profit-loss' ? params : undefined);
  const cashFlow = useCashFlowReport(activeTab === 'cash-flow' ? params : undefined);

  const map: Record<TabId, typeof monthly> = { monthly, yearly, clients, salaries, treasury, partners, 'profit-loss': profitLoss, 'cash-flow': cashFlow };
  const current = map[activeTab];

  return { data: current.data as ReportData | undefined, isLoading: current.isLoading };
}

interface PLData {
  data: {
    monthly: Array<{ month: number; month_name: string; revenue: number; operating_expenses: number; salaries: number; other_expenses: number; total_expenses: number; gross_profit: number; net_profit: number; margin: number }>;
    totals: Record<string, number>;
    expense_breakdown: Record<string, number>;
  };
}

function ProfitLossView({ data, currency }: { data: PLData['data']; currency: string }) {
  const t = data.totals;
  const fmt = (v: number) => formatCurrency(v, currency as any);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الإيرادات', value: t.total_revenue, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'إجمالي المصروفات', value: t.total_expenses, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'صافي الربح', value: t.net_profit, icon: DollarSign, color: t.net_profit >= 0 ? 'text-green-600' : 'text-red-600', bg: t.net_profit >= 0 ? 'bg-green-50' : 'bg-red-50' },
          { label: 'هامش الربح', value: t.margin, icon: Wallet, color: 'text-primary-600', bg: 'bg-primary-50', suffix: '%' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={18} className={s.color} />
                </div>
                <span className="text-sm text-gray-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.suffix ? `${s.value}${s.suffix}` : fmt(s.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="card card-body">
        <h3 className="font-bold text-gray-900 mb-4">الإيرادات مقابل المصروفات</h3>
        <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month_name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Bar dataKey="revenue" fill="#10b981" name="الإيرادات" radius={[4, 4, 0, 0]} />
            <Bar dataKey="total_expenses" fill="#ef4444" name="المصروفات" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net_profit" fill="#6366f1" name="صافي الربح" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Table */}
      <div className="card card-body overflow-x-auto">
        <h3 className="font-bold text-gray-900 mb-4">قائمة الدخل التفصيلية</h3>
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th>الشهر</th>
              <th>الإيرادات</th>
              <th>مصروفات تشغيلية</th>
              <th>الرواتب</th>
              <th>مصروفات أخرى</th>
              <th>إجمالي المصروفات</th>
              <th>صافي الربح</th>
              <th>الهامش</th>
            </tr>
          </thead>
          <tbody>
            {data.monthly.map(m => (
              <tr key={m.month}>
                <td className="font-medium">{m.month_name}</td>
                <td className="text-green-600">{fmt(m.revenue)}</td>
                <td className="text-red-500">{fmt(m.operating_expenses)}</td>
                <td className="text-amber-600">{fmt(m.salaries)}</td>
                <td className="text-gray-500">{fmt(m.other_expenses)}</td>
                <td className="text-red-600 font-medium">{fmt(m.total_expenses)}</td>
                <td className={`font-bold ${m.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(m.net_profit)}</td>
                <td className={m.margin >= 0 ? 'text-green-600' : 'text-red-600'}>{m.margin}%</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td>الإجمالي</td>
              <td className="text-green-600">{fmt(t.total_revenue)}</td>
              <td className="text-red-500">{fmt(t.total_operating_expenses)}</td>
              <td className="text-amber-600">{fmt(t.total_salaries)}</td>
              <td className="text-gray-500">{fmt(t.total_other_expenses)}</td>
              <td className="text-red-600">{fmt(t.total_expenses)}</td>
              <td className={t.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(t.net_profit)}</td>
              <td className={t.margin >= 0 ? 'text-green-600' : 'text-red-600'}>{t.margin}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expense Breakdown */}
      {data.expense_breakdown && Object.keys(data.expense_breakdown).length > 0 && (
        <div className="card card-body">
          <h3 className="font-bold text-gray-900 mb-4">توزيع المصروفات حسب الفئة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.expense_breakdown).map(([cat, amt]) => (
              <div key={cat} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-sm text-gray-500">{cat}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{fmt(amt as number)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CFData {
  data: {
    monthly: Array<{ month: number; month_name: string; cash_in: number; invoice_payments: number; other_income: number; cash_out: number; salary_payments: number; operating_expenses: number; other_expenses: number; net_flow: number; cumulative_balance: number }>;
    totals: { total_cash_in: number; total_cash_out: number; net_cash_flow: number; current_balance: number };
  };
}

function CashFlowView({ data, currency }: { data: CFData['data']; currency: string }) {
  const t = data.totals;
  const fmt = (v: number) => formatCurrency(v, currency as any);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي التدفق الداخل', value: t.total_cash_in, icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'إجمالي التدفق الخارج', value: t.total_cash_out, icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'صافي التدفق النقدي', value: t.net_cash_flow, icon: TrendingUp, color: t.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600', bg: t.net_cash_flow >= 0 ? 'bg-green-50' : 'bg-red-50' },
          { label: 'الرصيد الحالي', value: t.current_balance, icon: Wallet, color: 'text-primary-600', bg: 'bg-primary-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={18} className={s.color} />
                </div>
                <span className="text-sm text-gray-500">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{fmt(s.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Cash Flow Chart */}
      <div className="card card-body">
        <h3 className="font-bold text-gray-900 mb-4">التدفق النقدي التراكمي</h3>
        <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
          <AreaChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month_name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Area type="monotone" dataKey="cash_in" stroke="#10b981" fill="#10b98130" name="تدفق داخل" />
            <Area type="monotone" dataKey="cash_out" stroke="#ef4444" fill="#ef444430" name="تدفق خارج" />
            <Line type="monotone" dataKey="cumulative_balance" stroke="#6366f1" strokeWidth={2} name="الرصيد التراكمي" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Table */}
      <div className="card card-body overflow-x-auto">
        <h3 className="font-bold text-gray-900 mb-4">تفاصيل التدفق النقدي الشهري</h3>
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th>الشهر</th>
              <th>تدفق داخل</th>
              <th>فواتير محصلة</th>
              <th>دخل آخر</th>
              <th>تدفق خارج</th>
              <th>رواتب</th>
              <th>مصروفات</th>
              <th>صافي التدفق</th>
              <th>الرصيد التراكمي</th>
            </tr>
          </thead>
          <tbody>
            {data.monthly.map(m => (
              <tr key={m.month}>
                <td className="font-medium">{m.month_name}</td>
                <td className="text-green-600">{fmt(m.cash_in)}</td>
                <td className="text-green-500 text-xs">{fmt(m.invoice_payments)}</td>
                <td className="text-green-400 text-xs">{fmt(m.other_income)}</td>
                <td className="text-red-600">{fmt(m.cash_out)}</td>
                <td className="text-amber-600 text-xs">{fmt(m.salary_payments)}</td>
                <td className="text-red-400 text-xs">{fmt(m.operating_expenses)}</td>
                <td className={`font-bold ${m.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(m.net_flow)}</td>
                <td className={`font-medium ${m.cumulative_balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>{fmt(m.cumulative_balance)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td>الإجمالي</td>
              <td className="text-green-600">{fmt(t.total_cash_in)}</td>
              <td colSpan={2}></td>
              <td className="text-red-600">{fmt(t.total_cash_out)}</td>
              <td colSpan={2}></td>
              <td className={t.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(t.net_cash_flow)}</td>
              <td className="text-primary-600">{fmt(t.current_balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabId>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [currency, setCurrency] = useState('EGP');

  const params = { year, month, currency };
  const { data: reportData, isLoading } = useReport(activeTab, params);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const tabLabel = tabs.find(t => t.id === activeTab)?.label || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${tabLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; direction: rtl; color: #1f2937; }
        h1 { font-size: 22px; margin-bottom: 6px; }
        .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
        .summary-card .label { font-size: 12px; color: #6b7280; }
        .summary-card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f9fafb; padding: 10px 14px; text-align: right; font-size: 12px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
        tr:hover { background: #f9fafb; }
        @media print { body { padding: 15px; } }
      </style></head><body>
      <h1>${tabLabel}</h1>
      <p class="subtitle">${activeTab === 'monthly' || activeTab === 'salaries' ? `شهر ${month} / ${year}` : `السنة ${year}`} - ${new Date().toLocaleDateString('ar-EG')}</p>
      ${printRef.current.innerHTML}
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">التقارير</h1>
          <p className="page-subtitle">تحليل مالي شامل</p>
        </div>
        {reportData && (
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} />
            طباعة / تصدير PDF
          </button>
        )}
      </div>

      <div className="tab-bar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card card-body !py-3 flex items-center gap-3 flex-wrap">
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="select max-w-[110px]">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {(['monthly', 'salaries'] as const).includes(activeTab as any) && (
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="select max-w-[130px]">
            {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>شهر {i + 1}</option>)}
          </select>
        )}
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="select max-w-[160px]">
          <option value="EGP">جنيه مصري (EGP)</option>
          <option value="USD">دولار (USD)</option>
          <option value="SAR">ريال (SAR)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6" ref={printRef}>
          {/* P&L Custom View */}
          {activeTab === 'profit-loss' && reportData && (
            <ProfitLossView data={reportData as any} currency={currency} />
          )}

          {/* Cash Flow Custom View */}
          {activeTab === 'cash-flow' && reportData && (
            <CashFlowView data={reportData as any} currency={currency} />
          )}

          {/* Generic Views */}
          {!['profit-loss', 'cash-flow'].includes(activeTab) && reportData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="stat-card">
                  <p className="text-sm font-medium text-gray-500">{key}</p>
                  <p className="text-[1.65rem] font-bold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
              ))}
            </div>
          )}

          {!['profit-loss', 'cash-flow'].includes(activeTab) && reportData?.chart_data && (
            <div className="card card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسم البياني</h3>
              <ResponsiveContainer width="100%" height={400} minWidth={0} minHeight={0}>
                {activeTab === 'yearly' ? (
                  <LineChart data={reportData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" name="إيرادات" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="مصروفات" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" name="صافي ربح" />
                  </LineChart>
                ) : (
                  <BarChart data={reportData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {!['profit-loss', 'cash-flow'].includes(activeTab) && reportData?.table_data && (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {reportData.table_headers?.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.table_data.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>
                            {typeof val === 'number' ? val.toLocaleString() : String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
