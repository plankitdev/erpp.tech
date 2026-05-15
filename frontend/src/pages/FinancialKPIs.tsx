import { useFinancialKpis } from '../hooks/useFinancial';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Clock,
  ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw,
} from 'lucide-react';
import { SkeletonTable } from '../components/Skeletons';

export default function FinancialKPIs() {
  const { data: kpiData, isLoading, isError, refetch } = useFinancialKpis();

  const kpis = kpiData as any;

  const formatNum = (n: number) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 });
  const formatPct = (n: number) => `${Number(n || 0).toFixed(1)}%`;

  const kpiCards = kpis ? [
    {
      title: 'إجمالي الإيرادات',
      value: formatNum(kpis.total_revenue),
      icon: DollarSign,
      color: 'emerald',
      change: kpis.revenue_change,
      prefix: '',
    },
    {
      title: 'إجمالي المصروفات',
      value: formatNum(kpis.total_expenses),
      icon: TrendingDown,
      color: 'red',
      change: kpis.expenses_change,
      prefix: '',
    },
    {
      title: 'صافي الربح',
      value: formatNum(kpis.net_profit),
      icon: TrendingUp,
      color: kpis.net_profit >= 0 ? 'emerald' : 'red',
      change: kpis.profit_change,
      prefix: '',
    },
    {
      title: 'هامش الربح',
      value: formatPct(kpis.profit_margin),
      icon: Percent,
      color: kpis.profit_margin >= 20 ? 'emerald' : kpis.profit_margin >= 10 ? 'amber' : 'red',
      change: null,
      prefix: '',
    },
    {
      title: 'المستحقات',
      value: formatNum(kpis.total_receivables),
      icon: Clock,
      color: 'blue',
      change: null,
      prefix: '',
    },
    {
      title: 'متوسط أيام التحصيل',
      value: `${Number(kpis.avg_collection_days || 0).toFixed(0)} يوم`,
      icon: Clock,
      color: kpis.avg_collection_days <= 30 ? 'emerald' : kpis.avg_collection_days <= 60 ? 'amber' : 'red',
      change: null,
      prefix: '',
    },
    {
      title: 'رصيد الخزينة',
      value: formatNum(kpis.treasury_balance),
      icon: DollarSign,
      color: 'blue',
      change: null,
      prefix: '',
    },
    {
      title: 'قيمة الأصول الثابتة',
      value: formatNum(kpis.fixed_assets_value),
      icon: BarChart3,
      color: 'violet',
      change: null,
      prefix: '',
    },
  ] : [];

  const colorMap: Record<string, { bg: string; icon: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700', border: 'border-emerald-100' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-700', border: 'border-red-100' },
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700', border: 'border-amber-100' },
    violet: { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600', text: 'text-violet-700', border: 'border-violet-100' },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">مؤشرات الأداء المالي</h1>
          <p className="page-subtitle">لوحة المؤشرات المالية الرئيسية — نظرة شاملة على الصحة المالية</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw size={16} /> تحديث
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card card-body animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card card-body text-center py-16">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-red-400 mb-2">حدث خطأ في تحميل المؤشرات</p>
          <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, idx) => {
              const colors = colorMap[kpi.color] || colorMap.blue;
              const Icon = kpi.icon;
              return (
                <div key={idx} className={`stat-card group border ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{kpi.title}</p>
                      <p className={`text-[1.5rem] font-bold ${colors.text}`}>{kpi.value}</p>
                      {kpi.change !== null && kpi.change !== undefined && (
                        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {kpi.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          <span>{Math.abs(kpi.change).toFixed(1)}% عن العام السابق</span>
                        </div>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl ${colors.icon} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon size={22} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Insights */}
          {kpis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Profitability Gauge */}
              <div className="card card-body">
                <h3 className="text-sm font-bold text-gray-700 mb-4">تحليل الربحية</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>هامش الربح</span>
                      <span className="font-semibold">{formatPct(kpis.profit_margin)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${kpis.profit_margin >= 20 ? 'bg-emerald-500' : kpis.profit_margin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.max(kpis.profit_margin, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 rounded-xl bg-emerald-50">
                      <p className="text-xs text-gray-500 mb-1">الإيرادات</p>
                      <p className="font-bold text-emerald-700">{formatNum(kpis.total_revenue)}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-50">
                      <p className="text-xs text-gray-500 mb-1">المصروفات</p>
                      <p className="font-bold text-red-600">{formatNum(kpis.total_expenses)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liquidity */}
              <div className="card card-body">
                <h3 className="text-sm font-bold text-gray-700 mb-4">مؤشرات السيولة</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50">
                    <span className="text-sm text-gray-600">رصيد الخزينة</span>
                    <span className="font-bold text-blue-700">{formatNum(kpis.treasury_balance)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50">
                    <span className="text-sm text-gray-600">المستحقات المعلقة</span>
                    <span className="font-bold text-orange-700">{formatNum(kpis.total_receivables)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-violet-50">
                    <span className="text-sm text-gray-600">قيمة الأصول الثابتة</span>
                    <span className="font-bold text-violet-700">{formatNum(kpis.fixed_assets_value)}</span>
                  </div>
                  {kpis.avg_collection_days !== undefined && (
                    <div className={`flex justify-between items-center p-3 rounded-xl ${kpis.avg_collection_days <= 30 ? 'bg-emerald-50' : kpis.avg_collection_days <= 60 ? 'bg-amber-50' : 'bg-red-50'}`}>
                      <span className="text-sm text-gray-600">متوسط أيام التحصيل</span>
                      <span className={`font-bold ${kpis.avg_collection_days <= 30 ? 'text-emerald-700' : kpis.avg_collection_days <= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                        {Number(kpis.avg_collection_days).toFixed(0)} يوم
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
