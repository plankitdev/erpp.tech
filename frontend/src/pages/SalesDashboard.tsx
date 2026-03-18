import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSalesDashboard, useSalesReport } from '../hooks/useLeads';
import type { LeadStage } from '../types';
import {
  Target, Users, TrendingUp, AlertTriangle, Calendar,
  BarChart3, ArrowUpCircle, PieChart, FileText, DollarSign,
} from 'lucide-react';

const stageLabels: Record<LeadStage, string> = {
  new: 'جديد', first_contact: 'تواصل أولي', proposal_sent: 'عرض مرسل',
  negotiation: 'تفاوض', contract_signed: 'تم التعاقد',
};

const stageColors: Record<LeadStage, string> = {
  new: 'bg-blue-500', first_contact: 'bg-amber-500', proposal_sent: 'bg-purple-500',
  negotiation: 'bg-orange-500', contract_signed: 'bg-emerald-500',
};

const sourceLabels: Record<string, string> = {
  ad: 'إعلان', referral: 'إحالة', website: 'موقع', social: 'سوشيال', other: 'أخرى',
};

const serviceLabels: Record<string, string> = {
  marketing: 'تسويق', design: 'تصميم', moderation: 'إدارة محتوى', development: 'تطوير', other: 'أخرى',
};

const stages: LeadStage[] = ['new', 'first_contact', 'proposal_sent', 'negotiation', 'contract_signed'];

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const { data, isLoading } = useSalesDashboard();

  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const { data: report, isLoading: reportLoading } = useSalesReport({ month: reportMonth, year: reportYear });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة المبيعات</h1>
          <p className="page-subtitle">نظرة شاملة على أداء فريق المبيعات ومسار العملاء</p>
        </div>
        <Link to="/leads" className="btn-primary">
          <Target size={16} /> عرض العملاء المحتملين
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dashboard' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><BarChart3 size={16} /> نظرة عامة</span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'report' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><FileText size={16} /> تقرير الأداء</span>
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">إجمالي العملاء المحتملين</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.total_leads}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">معدل التحويل</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{data.conversion_rate}%</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">يحتاجون متابعة</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{data.stuck_leads}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">جدد هذا الشهر</p>
                  <p className="text-2xl font-bold text-primary-600 mt-1">{data.new_this_month}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Calendar size={20} className="text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Funnel */}
          <div className="card card-body">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-600" />
              مسار المبيعات (Pipeline)
            </h3>
            <div className="space-y-3">
              {stages.map(stage => {
                const stageData = data.pipeline[stage];
                const count = stageData?.count ?? 0;
                const budget = Number(stageData?.total_budget ?? 0);
                const maxCount = Math.max(...stages.map(s => data.pipeline[s]?.count ?? 0), 1);
                const pct = (count / maxCount) * 100;

                return (
                  <div key={stage} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium text-gray-700 text-left">{stageLabels[stage]}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`${stageColors[stage]} h-full rounded-full transition-all duration-500 flex items-center justify-end px-3`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        <span className="text-white text-xs font-bold">{count}</span>
                      </div>
                    </div>
                    <div className="w-28 text-left text-xs text-gray-500">
                      {budget > 0 ? `${budget.toLocaleString()} ج.م` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* By Source */}
            <div className="card card-body">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <PieChart size={16} className="text-primary-600" />
                حسب المصدر
              </h3>
              <div className="space-y-2">
                {Object.entries(data.by_source || {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{sourceLabels[source] || source}</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">{count}</span>
                  </div>
                ))}
                {Object.keys(data.by_source || {}).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</p>
                )}
              </div>
            </div>

            {/* By Service */}
            <div className="card card-body">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Target size={16} className="text-primary-600" />
                حسب الخدمة
              </h3>
              <div className="space-y-2">
                {Object.entries(data.by_service || {}).map(([service, count]) => (
                  <div key={service} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{serviceLabels[service] || service}</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">{count}</span>
                  </div>
                ))}
                {Object.keys(data.by_service || {}).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</p>
                )}
              </div>
            </div>

            {/* Team Performance */}
            <div className="card card-body">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Users size={16} className="text-primary-600" />
                أداء الفريق
              </h3>
              <div className="space-y-2">
                {(data.team_performance || []).map(member => (
                  <div key={member.user_id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{member.name}</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">{member.total} عميل</span>
                  </div>
                ))}
                {(data.team_performance || []).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ===== REPORT TAB ===== */
        <>
          {/* Month/Year Selector */}
          <div className="card card-body">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">الشهر:</label>
                <select
                  value={reportMonth}
                  onChange={e => setReportMonth(Number(e.target.value))}
                  className="input-field w-auto"
                >
                  {monthNames.map((name, i) => (
                    <option key={i} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">السنة:</label>
                <select
                  value={reportYear}
                  onChange={e => setReportYear(Number(e.target.value))}
                  className="input-field w-auto"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : report ? (
            <>
              {/* Report Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="stat-card">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">عملاء محتملين</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{report.summary.total_leads}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">تم التحويل</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{report.summary.converted_leads}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">معدل التحويل</p>
                  <p className="text-2xl font-bold text-primary-600 mt-1">{report.summary.conversion_rate}%</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">إجمالي العقود</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{Number(report.summary.total_contract_value).toLocaleString('en')} ج.م</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">متوسط العقد</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{Number(report.summary.avg_contract_value).toLocaleString('en')} ج.م</p>
                </div>
              </div>

              {/* Conversion Trend Chart */}
              <div className="card card-body">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary-600" />
                  اتجاه التحويل (آخر 6 أشهر)
                </h3>
                <div className="space-y-3">
                  {report.conversion_trend.map(item => {
                    const maxLeads = Math.max(...report.conversion_trend.map(t => t.total_leads), 1);
                    const totalPct = (item.total_leads / maxLeads) * 100;
                    const convertedPct = (item.converted / maxLeads) * 100;
                    return (
                      <div key={item.month} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-medium text-gray-600 text-left">{item.label}</div>
                        <div className="flex-1 relative">
                          <div className="bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-blue-200 h-full rounded-full absolute top-0 right-0 transition-all duration-500"
                              style={{ width: `${Math.max(totalPct, 3)}%` }}
                            />
                            <div
                              className="bg-emerald-500 h-full rounded-full absolute top-0 right-0 transition-all duration-500"
                              style={{ width: `${Math.max(convertedPct, 0)}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-32 flex items-center gap-2 text-xs">
                          <span className="text-blue-600 font-bold">{item.total_leads}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-emerald-600 font-bold">{item.converted}</span>
                          <span className="text-gray-500">({item.rate}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-blue-200 inline-block" /> إجمالي
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> تم التحويل
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sales Performance Table */}
                <div className="card card-body lg:col-span-2">
                  <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-primary-600" />
                    أداء فريق المبيعات — {monthNames[reportMonth - 1]} {reportYear}
                  </h3>
                  {report.sales_performance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-right py-2 px-3 font-semibold text-gray-600">الموظف</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-600">عملاء محتملين</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-600">تم تحويلهم</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-600">معدل التحويل</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600">إجمالي القيمة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.sales_performance.map(sp => (
                            <tr key={sp.user_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-2.5 px-3 font-medium text-gray-800">{sp.name}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-bold text-xs">{sp.leads_count}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-bold text-xs">{sp.converted_count}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`font-bold text-xs ${sp.conversion_rate >= 50 ? 'text-emerald-600' : sp.conversion_rate >= 25 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {sp.conversion_rate}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-left font-bold text-gray-800">
                                {Number(sp.total_value).toLocaleString('en')} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">لا توجد بيانات أداء لهذا الشهر</p>
                  )}
                </div>

                {/* By Source for Report Month */}
                <div className="card card-body">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <PieChart size={16} className="text-primary-600" />
                    العملاء حسب المصدر — {monthNames[reportMonth - 1]}
                  </h3>
                  {Object.keys(report.by_source || {}).length > 0 ? (
                    <div className="space-y-2">
                      {(() => {
                        const maxSourceCount = Math.max(...Object.values(report.by_source), 1);
                        return Object.entries(report.by_source).map(([source, count]) => (
                          <div key={source}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">{sourceLabels[source] || source}</span>
                              <span className="font-bold text-gray-800">{count}</span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${(Number(count) / maxSourceCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</p>
                  )}
                </div>

                {/* Performance Bar Chart */}
                <div className="card card-body">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-primary-600" />
                    مقارنة أداء المبيعات
                  </h3>
                  {report.sales_performance.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const maxVal = Math.max(...report.sales_performance.map(s => s.leads_count), 1);
                        return report.sales_performance.map(sp => (
                          <div key={sp.user_id}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-700 font-medium">{sp.name}</span>
                              <span className="text-gray-500">{sp.leads_count} عميل</span>
                            </div>
                            <div className="flex gap-1 h-5">
                              <div
                                className="bg-blue-400 rounded-r transition-all duration-500"
                                style={{ width: `${(sp.leads_count / maxVal) * 100}%` }}
                                title={`عملاء محتملين: ${sp.leads_count}`}
                              />
                              <div
                                className="bg-emerald-500 rounded-l transition-all duration-500"
                                style={{ width: `${(sp.converted_count / maxVal) * 100}%` }}
                                title={`تم تحويلهم: ${sp.converted_count}`}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="w-3 h-3 rounded bg-blue-400 inline-block" /> محتملين
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> محوّلين
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
