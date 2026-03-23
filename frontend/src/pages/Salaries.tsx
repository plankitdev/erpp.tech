import { useState, useEffect, useMemo } from 'react';
import { useSalaries, useCreateSalary, useUpdateSalary } from '../hooks/useEmployees';
import { employeesApi } from '../api/employees';
import { formatCurrency, formatDate } from '../utils';
import type { Employee } from '../types';
import toast from 'react-hot-toast';
import { Wallet, Plus, X, Pencil } from 'lucide-react';
import { SkeletonTable } from '../components/Skeletons';

export default function Salaries() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const { data, isLoading, isError, refetch } = useSalaries({ month: selectedMonth, year: selectedYear });
  const createMutation = useCreateSalary();
  const updateMutation = useUpdateSalary();
  const salaries = data?.data ?? [];

  const [form, setForm] = useState({
    employee_id: '', base_salary: '', bonus: '0', bonus_reason: '', deductions: '0', deduction_reason: '',
    transfer_amount: '', payment_date: '',
  });

  useEffect(() => {
    employeesApi.getAll({ per_page: 1000 }).then(res => setEmployees(res.data.data)).catch(() => {});
  }, []);

  // Filter employees: only show those hired on or before the selected month/year, and not already paid
  const availableEmployees = useMemo(() => {
    const paidEmployeeIds = new Set(salaries.map((s: any) => s.employee?.id).filter(Boolean));
    return employees.filter(emp => {
      // Filter by join_date: employee must have been hired on or before the end of the selected month
      if (emp.join_date) {
        const joinDate = new Date(emp.join_date);
        const periodEnd = new Date(selectedYear, selectedMonth, 0); // last day of selected month
        if (joinDate > periodEnd) return false;
      }
      // Filter out already paid employees (unless editing)
      if (!editingId && paidEmployeeIds.has(emp.id)) return false;
      return true;
    });
  }, [employees, salaries, selectedMonth, selectedYear, editingId]);

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find(e => e.id === parseInt(empId));
    setForm({ ...form, employee_id: empId, base_salary: emp ? String(emp.base_salary) : '' });
  };

  const resetForm = () => {
    setForm({ employee_id: '', base_salary: '', bonus: '0', bonus_reason: '', deductions: '0', deduction_reason: '', transfer_amount: '', payment_date: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s: any) => {
    setForm({
      employee_id: String(s.employee?.id || ''),
      base_salary: String(s.base_salary || ''),
      bonus: String(s.bonus || '0'),
      bonus_reason: s.bonus_reason || '',
      deductions: String(s.deductions || '0'),
      deduction_reason: s.deduction_reason || '',
      transfer_amount: String(s.transfer_amount || ''),
      payment_date: s.payment_date ? s.payment_date.split('T')[0] : '',
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseSalary = parseFloat(form.base_salary || '0');
    const bonus = parseFloat(form.bonus || '0');
    const deductions = parseFloat(form.deductions || '0');
    const transferAmount = parseFloat(form.transfer_amount || '0');
    const total = baseSalary + bonus - deductions;
    const remaining = total - transferAmount;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            base_salary: baseSalary,
            bonus,
            bonus_reason: form.bonus_reason || null,
            deductions,
            deduction_reason: form.deduction_reason || null,
            total,
            transfer_amount: transferAmount,
            remaining,
            payment_date: form.payment_date || null,
          } as any,
        });
        toast.success('تم تحديث الراتب');
      } else {
        await createMutation.mutateAsync({
          employee_id: parseInt(form.employee_id),
          month: selectedMonth,
          year: selectedYear,
          base_salary: baseSalary,
          bonus,
          bonus_reason: form.bonus_reason || null,
          deductions,
          deduction_reason: form.deduction_reason || null,
          total,
          transfer_amount: transferAmount,
          remaining,
          payment_date: form.payment_date || null,
        } as any);
        toast.success('تم تسجيل الراتب');
      }
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.employee_id?.[0] || 'حدث خطأ';
      toast.error(msg);
    }
  };

  const baseSalary = parseFloat(form.base_salary || '0');
  const bonus = parseFloat(form.bonus || '0');
  const deductions = parseFloat(form.deductions || '0');
  const transferAmount = parseFloat(form.transfer_amount || '0');
  const total = baseSalary + bonus - deductions;
  const remaining = total - transferAmount;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">الرواتب الشهرية</h1>
          <p className="page-subtitle">شهر {selectedMonth} / {selectedYear}</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> تسجيل راتب</>}
        </button>
      </div>

      <div className="card card-body !py-3 flex items-center gap-3">
        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="select max-w-[140px]">
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>شهر {i + 1}</option>
          ))}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="select max-w-[120px]">
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up">
          {editingId && <h3 className="text-lg font-bold text-gray-800">تعديل الراتب</h3>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">الموظف</label>
              {editingId ? (
                <input type="text" value={employees.find(e => e.id === parseInt(form.employee_id))?.name || ''} className="input bg-gray-50" disabled />
              ) : (
                <select value={form.employee_id} onChange={e => handleEmployeeSelect(e.target.value)} className="select" required>
                  <option value="">اختر الموظف</option>
                  {availableEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="input-label">الراتب الأساسي</label>
              <input type="number" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} className="input" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">المكافأة</label>
              <input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">سبب المكافأة</label>
              <input type="text" value={form.bonus_reason} onChange={e => setForm({ ...form, bonus_reason: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">الخصومات</label>
              <input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">سبب الخصم</label>
              <input type="text" value={form.deduction_reason} onChange={e => setForm({ ...form, deduction_reason: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">مبلغ التحويل</label>
              <input type="number" value={form.transfer_amount} onChange={e => setForm({ ...form, transfer_amount: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="input-label">تاريخ الدفع</label>
              <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} className="input" required />
            </div>
          </div>
          <div className="flex items-center gap-6 p-4 rounded-xl bg-surface-50 border border-gray-100">
            <div className="text-sm text-gray-600">الإجمالي: <strong className="text-gray-900">{total.toLocaleString()}</strong></div>
            <div className="text-sm text-gray-600">المتبقي: <strong className={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}>{remaining.toLocaleString()}</strong></div>
          </div>
          <button type="submit" className="btn-primary">{editingId ? 'تحديث' : 'حفظ'}</button>
        </form>
      )}

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الأساسي</th>
                <th>المكافأة</th>
                <th>الخصومات</th>
                <th>الإجمالي</th>
                <th>المحول</th>
                <th>المتبقي</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={9} />
              ) : isError ? (
                <tr><td colSpan={9} className="text-center py-12"><div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div><button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button></td></tr>
              ) : salaries.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد رواتب لهذا الشهر</p>
                </td></tr>
              ) : salaries.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-gray-900">{s.employee?.name}</td>
                  <td className="font-medium">{s.base_salary?.toLocaleString()}</td>
                  <td className="text-emerald-600 font-medium" title={s.bonus_reason || ''}>{s.bonus?.toLocaleString() || '0'}</td>
                  <td className="text-red-500 font-medium" title={s.deduction_reason || ''}>{s.deductions?.toLocaleString()}</td>
                  <td className="font-bold text-gray-900">{s.total?.toLocaleString()}</td>
                  <td className="text-emerald-600 font-medium">{s.transfer_amount?.toLocaleString()}</td>
                  <td className={`font-medium ${(s.remaining || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.remaining?.toLocaleString()}</td>
                  <td className="text-gray-500 text-[13px]">{s.payment_date ? formatDate(s.payment_date) : '—'}</td>
                  <td>
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors" title="تعديل">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
