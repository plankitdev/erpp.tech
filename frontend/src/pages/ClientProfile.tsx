import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClient } from '../hooks/useClients';
import { useInvoices } from '../hooks/useInvoices';
import { formatCurrency, formatDate, statusLabels, statusColors } from '../utils';
import type { InvoiceStatus, ContractStatus } from '../types';
import {
  ArrowRight, Pencil, Phone, Building2, Briefcase, Calendar,
  FileText, FolderKanban, CheckSquare, DollarSign, TrendingUp,
  AlertCircle, User, Clock, CircleDot,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatusBadge from '../components/StatusBadge';

const projectStatusLabels: Record<string, string> = {
  active: 'نشط', completed: 'مكتمل', on_hold: 'متوقف', cancelled: 'ملغي',
};

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || '0');
  const { data: client, isLoading, isError, refetch } = useClient(clientId);
  const { data: invoiceData } = useInvoices({ client_id: clientId, per_page: 50 });
  const invoices = invoiceData?.data ?? [];
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'contracts' | 'projects'>('overview');

  if (isLoading) return <LoadingSpinner />;
  if (isError || !client) return <ErrorMessage onRetry={refetch} />;

  const contracts = client.contracts ?? [];
  const projects = client.projects ?? [];
  const tasks = client.tasks ?? [];
  const activeContract = contracts.find(c => c.status === 'active');
  const totalContractValue = contracts.reduce((sum, c) => sum + c.value, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalOutstanding = client.total_outstanding ?? 0;
  const paymentRate = totalContractValue > 0 ? Math.round((totalPaid / totalContractValue) * 100) : 0;

  const tabs = [
    { key: 'overview' as const, label: 'نظرة عامة', icon: User },
    { key: 'invoices' as const, label: `الفواتير (${invoices.length})`, icon: FileText },
    { key: 'contracts' as const, label: `العقود (${contracts.length})`, icon: Briefcase },
    { key: 'projects' as const, label: `المشاريع (${projects.length})`, icon: FolderKanban },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <Link to="/clients" className="mt-1 action-icon text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {client.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors.client[client.status]}`}>
                {statusLabels.client[client.status]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {client.phone && (
                <span className="flex items-center gap-1.5"><Phone size={14} />{client.phone}</span>
              )}
              {client.company_name && (
                <span className="flex items-center gap-1.5"><Building2 size={14} />{client.company_name}</span>
              )}
              {client.sector && (
                <span className="flex items-center gap-1.5"><Briefcase size={14} />{client.sector}</span>
              )}
              <span className="flex items-center gap-1.5"><Calendar size={14} />عميل منذ {formatDate(client.created_at)}</span>
            </div>
          </div>
          <Link to={`/clients/${client.id}/edit`} className="btn-secondary text-sm flex-shrink-0">
            <Pencil size={14} /> تعديل
          </Link>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><DollarSign size={16} className="text-blue-600" /></div>
            <span className="text-xs text-gray-500">إجمالي العقود</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalContractValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp size={16} className="text-emerald-600" /></div>
            <span className="text-xs text-gray-500">المحصّل</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><AlertCircle size={16} className="text-red-500" /></div>
            <span className="text-xs text-gray-500">المستحق</span>
          </div>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><CheckSquare size={16} className="text-purple-600" /></div>
            <span className="text-xs text-gray-500">نسبة التحصيل</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-900">{paymentRate}%</p>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-l from-primary-500 to-primary-600 rounded-full"
                style={{ width: `${paymentRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border border-b-0 border-gray-100">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-100 p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">بيانات العميل</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'الاسم', value: client.name },
                  { label: 'الموبايل', value: client.phone },
                  { label: 'الشركة', value: client.company_name },
                  { label: 'القطاع', value: client.sector },
                  { label: 'الخدمة', value: client.service },
                  { label: 'تاريخ الإضافة', value: formatDate(client.created_at) },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-gray-700">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
              {client.notes && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium mb-1">ملاحظات</p>
                  <p className="text-sm text-amber-800">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Active Contract */}
            {activeContract && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">العقد النشط</h3>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-emerald-600">القيمة</p>
                      <p className="font-bold text-emerald-800">{formatCurrency(activeContract.value, activeContract.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">النوع</p>
                      <p className="font-medium text-emerald-800">{statusLabels.payment_type[activeContract.payment_type]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">البداية</p>
                      <p className="font-medium text-emerald-800">{formatDate(activeContract.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">النهاية</p>
                      <p className="font-medium text-emerald-800">{activeContract.end_date ? formatDate(activeContract.end_date) : 'مفتوح'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {tasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">أحدث المهام</h3>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map(task => (
                    <Link key={task.id} to={`/tasks/${task.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <StatusBadge status={task.status} size="sm" />
                      <span className="flex-1 text-sm text-gray-700 truncate">{task.title}</span>
                      {task.assigned_user && (
                        <span className="text-xs text-gray-400">{task.assigned_user.name}</span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />{formatDate(task.due_date)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رقم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المدفوع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المتبقي</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الاستحقاق</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">لا يوجد فواتير</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/invoices/${inv.id}`} className="text-primary-600 hover:underline font-medium text-sm">#{inv.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600">{formatCurrency(inv.paid_amount, inv.currency)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(inv.remaining, inv.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors.invoice[inv.status as InvoiceStatus]}`}>
                        {statusLabels.invoice[inv.status as InvoiceStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            {contracts.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">لا يوجد عقود</p>
            ) : contracts.map(c => (
              <Link key={c.id} to={`/contracts/${c.id}/installments`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-12 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : c.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{formatCurrency(c.value, c.currency)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors.contract[c.status as ContractStatus]}`}>
                      {statusLabels.contract[c.status as ContractStatus]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{statusLabels.payment_type[c.payment_type]}</span>
                    <span>{formatDate(c.start_date)} → {c.end_date ? formatDate(c.end_date) : 'مفتوح'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm col-span-2">لا يوجد مشاريع مرتبطة</p>
            ) : projects.map(p => (
              <Link key={p.id} to={`/projects/${p.slug || p.id}`}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100 hover:border-primary-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{projectStatusLabels[p.status] || p.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CircleDot size={12} />{p.tasks_count || 0} مهمة</span>
                  {p.start_date && <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(p.start_date)}</span>}
                </div>
                {p.progress !== undefined && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
