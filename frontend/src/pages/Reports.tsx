import { useState, useRef } from 'react';
import { useMonthlyReport, useYearlyReport, useClientsReport, useSalariesReport, useTreasuryReport, usePartnersReport } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Printer } from 'lucide-react';

const tabs = [
  { id: 'monthly', label: 'التقرير الشهري' },
  { id: 'yearly', label: 'التقرير السنوي' },
  { id: 'clients', label: 'تقرير العملاء' },
  { id: 'salaries', label: 'تقرير الرواتب' },
  { id: 'treasury', label: 'التدفق النقدي' },
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

  const map: Record<TabId, typeof monthly> = { monthly, yearly, clients, salaries, treasury, partners };
  const current = map[activeTab];

  return { data: current.data as ReportData | undefined, isLoading: current.isLoading };
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
          {reportData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="stat-card">
                  <p className="text-sm font-medium text-gray-500">{key}</p>
                  <p className="text-[1.65rem] font-bold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
              ))}
            </div>
          )}

          {reportData?.chart_data && (
            <div className="card card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الرسم البياني</h3>
              <ResponsiveContainer width="100%" height={400}>
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

          {reportData?.table_data && (
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
