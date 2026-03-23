import { Link } from 'react-router-dom';
import { useSalesDashboard } from '../hooks/useLeads';
import { useLeads } from '../hooks/useLeads';
import { formatCurrency } from '../utils';
import { calculateLeadScore, getScoreColor } from '../utils/leadScoring';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Target, Users, TrendingUp, AlertTriangle, ArrowUpRight,
  Plus, UserPlus, BarChart3, Sparkles, Flame, Sun, Snowflake, Eye,
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import type { Lead, LeadStage } from '../types';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#f97316', '#10b981', '#ef4444'];

const stageLabels: Record<LeadStage, string> = {
  new: 'جديد', first_contact: 'تواصل أولي', proposal_sent: 'عرض مرسل',
  negotiation: 'تفاوض', contract_signed: 'تم التعاقد', lost: 'خسارة',
};

const stageColors: Record<LeadStage, string> = {
  new: '#3b82f6', first_contact: '#f59e0b', proposal_sent: '#8b5cf6',
  negotiation: '#f97316', contract_signed: '#10b981', lost: '#ef4444',
};

const tempIcons: Record<string, typeof Flame> = { hot: Flame, warm: Sun, cold: Snowflake };
const tempColors: Record<string, string> = { hot: 'text-red-500', warm: 'text-amber-500', cold: 'text-blue-400' };

export default function SalesHub() {
  const { data: dashData, isLoading } = useSalesDashboard();
  const { data: leadsData } = useLeads({ per_page: 1000 });

  const leads: Lead[] = leadsData?.data || [];
  const data = dashData as Record<string, any> | undefined;

  // Pipeline data for chart
  const pipelineChart = data ? (['new', 'first_contact', 'proposal_sent', 'negotiation', 'contract_signed'] as LeadStage[])
    .map(stage => ({
      name: stageLabels[stage],
      value: data.pipeline?.[stage]?.count || 0,
      color: stageColors[stage],
    })).filter(s => s.value > 0) : [];

  // Top scored leads
  const scoredLeads = leads
    .filter(l => l.stage !== 'contract_signed' && l.stage !== 'lost')
    .map(l => ({ ...l, score: calculateLeadScore(l) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Leads needing follow-up (no activity in 7+ days)
  const needsFollowUp = leads.filter(l => {
    if (l.stage === 'contract_signed' || l.stage === 'lost') return false;
    if (!l.last_followup_date) return true;
    const days = Math.floor((Date.now() - new Date(l.last_followup_date).getTime()) / (1000 * 60 * 60 * 24));
    return days > 7;
  }).slice(0, 5);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="h-32 bg-gradient-to-l from-orange-100 to-orange-50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'إجمالي العملاء المحتملين', value: data?.total_leads || 0, icon: Users, bg: 'bg-blue-500', link: '/leads' },
    { label: 'معدل التحويل', value: `${data?.conversion_rate || 0}%`, icon: TrendingUp, bg: 'bg-emerald-500', link: '/sales' },
    { label: 'يحتاجون متابعة', value: data?.stuck_leads || 0, icon: AlertTriangle, bg: 'bg-amber-500', link: '/leads' },
    { label: 'جدد هذا الشهر', value: data?.new_this_month || 0, icon: UserPlus, bg: 'bg-violet-500', link: '/leads' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'المبيعات' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-orange-500 via-orange-600 to-amber-700 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-orange-200" />
              <span className="text-orange-100 text-sm font-medium">نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">المبيعات</h1>
            <p className="text-orange-100/80 text-sm">إدارة العملاء المحتملين ومتابعة مسار المبيعات</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/leads" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Target size={16} /> لوحة Kanban
            </Link>
            <Link to="/sales" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <BarChart3 size={16} /> التقارير
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} to={card.link || '#'} className="block">
              <div className={`stat-card group animate-fade-in-up stagger-${i + 1}`}>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <p className="text-[13px] text-gray-400 mb-1.5 font-medium">{card.label}</p>
                  <p className="text-[1.65rem] font-bold text-gray-900 tracking-tight">{card.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Middle Row: Pipeline + Top Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pipeline Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">مسار المبيعات</h3>
          <p className="text-xs text-gray-400 mb-4">توزيع المراحل</p>
          {pipelineChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={pipelineChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {pipelineChart.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pipelineChart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 text-[13px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Top Scored Leads */}
        <div className="card overflow-hidden lg:col-span-2 animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
                <Target size={18} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">أفضل العملاء المحتملين</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">بناءً على تقييم الذكاء</p>
              </div>
            </div>
            <Link to="/leads" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
          </div>
          <div className="px-6 pb-5">
            {scoredLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">لا توجد عملاء محتملين</div>
            ) : (
              <div className="space-y-1">
                {scoredLeads.map((lead) => {
                  const sc = getScoreColor(lead.score);
                  const TempIcon = tempIcons[lead.temperature] || Sun;
                  return (
                    <Link key={lead.id} to={`/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        {/* Score ring */}
                        <div className={`relative w-10 h-10 rounded-full ring-2 ${sc.ring} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${sc.text}`}>{lead.score}</span>
                          <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                            <circle cx="20" cy="20" r="17" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                            <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor"
                              className={sc.text}
                              strokeWidth="2.5"
                              strokeDasharray={`${(lead.score / 100) * 107} 107`}
                              strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{lead.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            <span>{stageLabels[lead.stage]}</span>
                            <TempIcon size={10} className={tempColors[lead.temperature]} />
                            {lead.expected_budget && (
                              <span>• {lead.expected_budget.toLocaleString()} ج.م</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Eye size={14} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Follow-up + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Needs Follow-up */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-100">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">يحتاجون متابعة</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">لم يتم التواصل منذ 7+ أيام</p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">{needsFollowUp.length}</span>
          </div>
          <div className="px-6 pb-5">
            {needsFollowUp.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp size={36} className="text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">جميع العملاء تمت متابعتهم</p>
              </div>
            ) : (
              <div className="space-y-1">
                {needsFollowUp.map((lead) => {
                  const days = lead.last_followup_date
                    ? Math.floor((Date.now() - new Date(lead.last_followup_date).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <Link key={lead.id} to={`/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 transition-colors group">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{lead.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{stageLabels[lead.stage]}</p>
                      </div>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                        {days !== null ? `${days} يوم` : 'لم يتم التواصل'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">إجراءات سريعة</h3>
          <p className="text-xs text-gray-400 mb-5">الوصول السريع لأهم العمليات</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'عميل محتمل جديد', icon: UserPlus, to: '/leads', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { label: 'لوحة Kanban', icon: Target, to: '/leads', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { label: 'تقارير المبيعات', icon: BarChart3, to: '/sales', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              { label: 'أداء الفريق', icon: Users, to: '/sales', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} to={action.to}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${action.color}`}>
                  <Icon size={20} />
                  <span className="text-sm font-semibold">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
