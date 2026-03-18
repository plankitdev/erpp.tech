import { useParams, Link } from 'react-router-dom';
import { useContract } from '../hooks/useContracts';
import { useInstallments, useGenerateInstallments, useMarkInstallmentPaid } from '../hooks/useInstallments';
import { formatCurrency, formatDate } from '../utils';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

import type { Currency } from '../types';

interface Installment {
  id: number;
  installment_number: number;
  amount: number;
  currency: string;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  notes: string | null;
}

export default function Installments() {
  const { id } = useParams();
  const contractId = parseInt(id || '0');
  const { data: contract } = useContract(contractId);
  const { data: installmentsData, isLoading } = useInstallments(contractId);
  const generateMutation = useGenerateInstallments();
  const payMutation = useMarkInstallmentPaid();

  const installments: Installment[] = installmentsData?.data ?? [];
  const contractData = (contract as any)?.data;

  const handleGenerate = () => {
    generateMutation.mutate(contractId, {
      onSuccess: () => toast.success('تم إنشاء الأقساط بنجاح'),
      onError: () => toast.error('حدث خطأ أثناء إنشاء الأقساط'),
    });
  };

  const handlePay = (installmentId: number) => {
    payMutation.mutate(
      { id: installmentId },
      {
        onSuccess: () => toast.success('تم تسجيل الدفع'),
        onError: () => toast.error('حدث خطأ'),
      },
    );
  };

  const statusIcon = {
    paid: <CheckCircle size={16} className="text-green-600" />,
    pending: <Clock size={16} className="text-yellow-600" />,
    overdue: <AlertCircle size={16} className="text-red-600" />,
  };

  const statusLabel = {
    paid: 'مدفوع',
    pending: 'قيد الانتظار',
    overdue: 'متأخر',
  };

  const statusColor = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
  };

  const paidCount = installments.filter(i => i.status === 'paid').length;
  const totalAmount = installments.reduce((sum, i) => sum + Number(i.amount), 0);
  const paidAmount = installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'العقود', href: '/contracts' }, { label: `عقد #${contractId}` }, { label: 'الأقساط' }]} />
      <div className="flex items-center gap-3 mb-6">
        <Link to="/contracts" className="action-icon text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
        <h1 className="page-title">
          أقساط العقد #{contractId}
          {contractData?.client && <span className="text-gray-500 text-lg mr-2">- {contractData.client.company_name || contractData.client.name}</span>}
        </h1>
      </div>

      {/* Summary Cards */}
      {installments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-gray-500">إجمالي الأقساط</p>
            <p className="text-xl font-bold text-gray-800">{installments.length} قسط</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">المدفوع</p>
            <p className="text-xl font-bold text-green-600">
              {paidCount} / {installments.length} — {formatCurrency(paidAmount, installments[0]?.currency as Currency)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">المتبقي</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(totalAmount - paidAmount, installments[0]?.currency as Currency)}
            </p>
          </div>
        </div>
      )}

      {/* Generate Button */}
      {installments.length === 0 && !isLoading && (
        <div className="card card-body text-center mb-6">
          <p className="text-gray-500 mb-4">لم يتم إنشاء أقساط لهذا العقد بعد</p>
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="btn-primary"
          >
            {generateMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء جدول الأقساط'}
          </button>
        </div>
      )}

      {/* Installments Table */}
      {installments.length > 0 && (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">#</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">تاريخ الاستحقاق</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">تاريخ الدفع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {installments.map(inst => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{inst.installment_number}</td>
                    <td className="px-6 py-4">{formatCurrency(inst.amount, inst.currency as Currency)}</td>
                    <td className="px-6 py-4">{formatDate(inst.due_date)}</td>
                    <td className="px-6 py-4">{inst.paid_date ? formatDate(inst.paid_date) : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${statusColor[inst.status]}`}>
                        {statusIcon[inst.status]} {statusLabel[inst.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {inst.status !== 'paid' && (
                        <button
                          onClick={() => handlePay(inst.id)}
                          disabled={payMutation.isPending}
                          className="btn-primary text-sm bg-green-600 hover:bg-green-700 !px-3 !py-1"
                        >
                          تسجيل دفع
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && <p className="text-center text-gray-500 py-8">جاري التحميل...</p>}
    </div>
  );
}
