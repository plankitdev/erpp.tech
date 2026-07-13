import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Phone, Mail, Building2, ExternalLink, Receipt } from 'lucide-react';
import { useProject } from '../hooks/useProjects';
import { invoicesApi } from '../api/invoices';
import { formatCurrency, formatDate, statusLabels, statusColors } from '../utils';
import type { InvoiceStatus } from '../types';
import ProjectTabs from '../components/ProjectTabs';

export default function ProjectClient() {
  const { slug } = useParams();
  const { data: project } = useProject(slug || '');
  const client = project?.client ?? null;

  const { data: invoices = [] } = useQuery({
    queryKey: ['project-client-invoices', client?.id],
    queryFn: () => invoicesApi.getAll({ client_id: client!.id, per_page: 100 }).then(r => r.data.data),
    enabled: !!client?.id,
  });

  const totalDue = invoices.reduce((s, i) => s + (i.remaining ?? 0), 0);
  const currency = invoices[0]?.currency ?? 'EGP';

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/projects" className="action-icon text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
        <h1 className="page-title">{project?.name || 'المشروع'} — العميل والفواتير</h1>
      </div>

      {slug && <ProjectTabs slug={slug} />}

      {!client ? (
        <div className="card card-body text-center text-gray-400 py-10">لا يوجد عميل مرتبط بهذا المشروع.</div>
      ) : (
        <>
          {/* Client card */}
          <div className="card card-body mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{client.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  {client.company_name && <span className="flex items-center gap-1.5"><Building2 size={14} />{client.company_name}</span>}
                  {client.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{client.phone}</span>}
                  {client.email && <span className="flex items-center gap-1.5" dir="ltr"><Mail size={14} />{client.email}</span>}
                </div>
              </div>
              <Link to={`/clients/${client.slug || client.id}`} className="btn-secondary text-sm flex items-center gap-1.5">
                <ExternalLink size={15} /> ملف العميل الكامل
              </Link>
            </div>
          </div>

          {/* Invoices */}
          <div className="card card-body overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Receipt size={18} /> فواتير العميل
              </h3>
              <span className="text-sm text-gray-500">
                المتبقي: <span className="font-bold text-red-600">{formatCurrency(totalDue, currency)}</span>
              </span>
            </div>

            {invoices.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">لا توجد فواتير لهذا العميل.</p>
            ) : (
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 dark:border-slate-700">
                    <th className="text-right font-medium py-2">#</th>
                    <th className="text-right font-medium py-2">الحالة</th>
                    <th className="text-center font-medium py-2">الإجمالي</th>
                    <th className="text-center font-medium py-2">المدفوع</th>
                    <th className="text-center font-medium py-2">المتبقي</th>
                    <th className="text-left font-medium py-2">الاستحقاق</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5">
                        <Link to={`/invoices/${inv.id}`} className="text-primary-600 hover:underline font-medium">#{inv.id}</Link>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors.invoice[inv.status as InvoiceStatus]}`}>
                          {statusLabels.invoice[inv.status as InvoiceStatus]}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">{formatCurrency(inv.amount, inv.currency)}</td>
                      <td className="py-2.5 text-center text-green-600">{formatCurrency(inv.paid_amount, inv.currency)}</td>
                      <td className="py-2.5 text-center text-red-600">{formatCurrency(inv.remaining, inv.currency)}</td>
                      <td className="py-2.5 text-left">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
