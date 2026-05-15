import { useState } from 'react';
import {
  useBankAccounts, useCreateBankAccount, useUpdateBankAccount,
  useDeleteBankAccount, useBankTransactions, useAddBankTransaction,
  useReconcileTransactions,
} from '../hooks/useFinancial';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import {
  Plus, X, Edit3, Trash2, Building2, ArrowUpCircle, ArrowDownCircle,
  CheckCircle2, Circle, Eye, RefreshCw,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';
import type { BankAccount } from '../types';

const currencyLabels: Record<string, string> = { EGP: 'جنيه مصري', USD: 'دولار', SAR: 'ريال' };

export default function BankAccounts() {
  const { data: accounts, isLoading, isError, refetch } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();
  const addTxMutation = useAddBankTransaction();
  const reconcileMutation = useReconcileTransactions();

  const bankAccounts = (accounts ?? []) as BankAccount[];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [showTxForm, setShowTxForm] = useState(false);
  const [selectedForReconcile, setSelectedForReconcile] = useState<number[]>([]);

  const { data: txData, isLoading: txLoading } = useBankTransactions(selectedAccount || 0);
  const transactions = txData?.data ?? [];

  const [form, setForm] = useState({
    name: '', bank_name: '', account_number: '', iban: '',
    currency: 'EGP', opening_balance: '', notes: '',
  });

  const [txForm, setTxForm] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal' | 'transfer',
    amount: '', date: new Date().toISOString().split('T')[0],
    description: '', reference: '',
  });

  const resetForm = () => {
    setForm({ name: '', bank_name: '', account_number: '', iban: '', currency: 'EGP', opening_balance: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (account: BankAccount) => {
    setForm({
      name: account.name, bank_name: account.bank_name,
      account_number: account.account_number || '', iban: account.iban || '',
      currency: account.currency, opening_balance: String(account.opening_balance || ''),
      notes: account.notes || '',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, opening_balance: parseFloat(form.opening_balance) || 0 };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success('تم تحديث الحساب البنكي');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('تم إنشاء الحساب البنكي');
      }
      resetForm();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف الحساب');
      setDeleteId(null);
      if (selectedAccount === deleteId) setSelectedAccount(null);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await addTxMutation.mutateAsync({
        accountId: selectedAccount,
        data: { ...txForm, amount: parseFloat(txForm.amount) },
      });
      toast.success('تم تسجيل الحركة');
      setShowTxForm(false);
      setTxForm({ type: 'deposit', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference: '' });
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleReconcile = async () => {
    if (!selectedAccount || selectedForReconcile.length === 0) return;
    try {
      await reconcileMutation.mutateAsync({ accountId: selectedAccount, ids: selectedForReconcile });
      toast.success(`تمت تسوية ${selectedForReconcile.length} حركة`);
      setSelectedForReconcile([]);
    } catch {
      toast.error('حدث خطأ في التسوية');
    }
  };

  const toggleReconcileSelection = (id: number) => {
    setSelectedForReconcile(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">الحسابات البنكية</h1>
          <p className="page-subtitle">إدارة الحسابات البنكية والحركات والتسوية</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> حساب بنكي جديد</>}
        </button>
      </div>

      {/* Account Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Building2 size={18} className="text-primary-600" />
            {editingId ? 'تعديل الحساب البنكي' : 'إضافة حساب بنكي'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">اسم الحساب</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="حساب جاري رئيسي" required />
            </div>
            <div>
              <label className="input-label">اسم البنك</label>
              <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className="input" placeholder="البنك الأهلي" required />
            </div>
            <div>
              <label className="input-label">العملة</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
                <option value="EGP">🇪🇬 جنيه مصري</option>
                <option value="USD">🇺🇸 دولار</option>
                <option value="SAR">🇸🇦 ريال</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">رقم الحساب</label>
              <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className="input" dir="ltr" />
            </div>
            <div>
              <label className="input-label">IBAN</label>
              <input type="text" value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} className="input" dir="ltr" />
            </div>
            <div>
              <label className="input-label">الرصيد الافتتاحي</label>
              <input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: e.target.value })} className="input" placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">إلغاء</button>
          </div>
        </form>
      )}

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3"><SkeletonTable rows={3} cols={3} /></div>
        ) : isError ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-red-400 mb-2">حدث خطأ</p>
            <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">لا يوجد حسابات بنكية</p>
          </div>
        ) : bankAccounts.map((account) => (
          <div
            key={account.id}
            onClick={() => { setSelectedAccount(account.id); setSelectedForReconcile([]); }}
            className={`card card-body cursor-pointer transition-all hover:shadow-md ${selectedAccount === account.id ? 'ring-2 ring-primary-500 shadow-md' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{account.name}</p>
                  <p className="text-xs text-gray-400">{account.bank_name}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); startEdit(account); }} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                  <Edit3 size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(account.id); }} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {Number(account.current_balance || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
              </span>
              <span className="badge badge-neutral text-[11px]">{account.currency}</span>
            </div>
            {account.account_number && (
              <p className="text-xs text-gray-400 mt-2 font-mono" dir="ltr">****{account.account_number.slice(-4)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Transactions for Selected Account */}
      {selectedAccount && (
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-primary-500" />
              <span className="text-sm font-semibold text-gray-700">
                حركات: {bankAccounts.find(a => a.id === selectedAccount)?.name}
              </span>
            </div>
            <div className="flex gap-2">
              {selectedForReconcile.length > 0 && (
                <button onClick={handleReconcile} disabled={reconcileMutation.isPending} className="btn-secondary text-xs">
                  <CheckCircle2 size={14} /> تسوية ({selectedForReconcile.length})
                </button>
              )}
              <button onClick={() => setShowTxForm(!showTxForm)} className={showTxForm ? 'btn-secondary text-xs' : 'btn-primary text-xs'}>
                {showTxForm ? <><X size={14} /> إلغاء</> : <><Plus size={14} /> حركة جديدة</>}
              </button>
            </div>
          </div>

          {showTxForm && (
            <form onSubmit={handleAddTx} className="p-4 border-b border-gray-100 bg-blue-50/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value as any })} className="select text-sm">
                  <option value="deposit">إيداع</option>
                  <option value="withdrawal">سحب</option>
                  <option value="transfer">تحويل</option>
                </select>
                <input type="number" step="0.01" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} className="input text-sm" placeholder="المبلغ" required />
                <input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} className="input text-sm" required />
                <input type="text" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} className="input text-sm" placeholder="الوصف" />
                <button type="submit" disabled={addTxMutation.isPending} className="btn-primary text-sm">
                  {addTxMutation.isPending ? 'جاري...' : 'إضافة'}
                </button>
              </div>
            </form>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <span className="text-xs text-gray-400">تسوية</span>
                  </th>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>الوصف</th>
                  <th>الرصيد بعد</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {txLoading ? (
                  <SkeletonTable rows={5} cols={7} />
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا يوجد حركات</td></tr>
                ) : transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td>
                      {!tx.is_reconciled && (
                        <button onClick={() => toggleReconcileSelection(tx.id)} className="text-gray-400 hover:text-primary-600">
                          {selectedForReconcile.includes(tx.id) ? <CheckCircle2 size={16} className="text-primary-600" /> : <Circle size={16} />}
                        </button>
                      )}
                    </td>
                    <td className="text-gray-500 text-[13px]">{formatDate(tx.date)}</td>
                    <td>
                      <span className={`badge ${tx.type === 'deposit' ? 'badge-success' : tx.type === 'withdrawal' ? 'badge-danger' : 'badge-info'} flex items-center gap-1 w-fit`}>
                        {tx.type === 'deposit' ? <ArrowUpCircle size={13} /> : <ArrowDownCircle size={13} />}
                        {tx.type === 'deposit' ? 'إيداع' : tx.type === 'withdrawal' ? 'سحب' : 'تحويل'}
                      </span>
                    </td>
                    <td className={`font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{Number(tx.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-gray-500 text-[13px] max-w-[200px] truncate">{tx.description || '—'}</td>
                    <td className="font-semibold text-gray-900">{Number(tx.balance_after).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                    <td>
                      {tx.is_reconciled ? (
                        <span className="badge badge-success text-[10px]">✓ تمت التسوية</span>
                      ) : (
                        <span className="badge badge-warning text-[10px]">معلقة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الحساب البنكي"
        message="هل أنت متأكد من حذف هذا الحساب البنكي وجميع حركاته؟"
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
