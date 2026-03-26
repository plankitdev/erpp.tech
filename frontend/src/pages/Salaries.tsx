import { useState, useEffect, useMemo } from 'react';
import { useSalaries, useCreateSalary, useUpdateSalary } from '../hooks/useEmployees';
import { employeesApi } from '../api/employees';
import { formatCurrency, formatDate } from '../utils';
import type { Employee } from '../types';
import toast from 'react-hot-toast';
import { Wallet, Plus, X, Pencil, Sparkles, ArrowUpRight, DollarSign, TrendingDown, Users, Download, Search } from 'lucide-react';
import { SkeletonTable } from '../components/Skeletons';
import { exportToCSV } from '../utils/exportCsv';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Salaries() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');

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

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const totalBase = salaries.reduce((sum: number, s: any) => sum + (s.base_salary || 0), 0);
  const totalBonuses = salaries.reduce((sum: number, s: any) => sum + (s.bonus || 0), 0);
  const totalDeductions = salaries.reduce((sum: number, s: any) => sum + (s.deductions || 0), 0);
  const totalNet = salaries.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

  const filtered = search
    ? salaries.filter((s: any) => s.employee?.name?.toLowerCase().includes(search.toLowerCase()))
    : salaries;

  const statCards = [
    { label: 'إجمالي الرواتب', value: formatCurrency(totalNet), icon: Wallet, bg: 'bg-blue-500' },
    { label: 'عدد المرتبات', value: salaries.length, icon: Users, bg: 'bg-emerald-500' },
    { label: 'إجمالي المكافآت', value: formatCurrency(totalBonuses), icon: DollarSign, bg: 'bg-violet-500' },
    { label: 'إجمالي الخصومات', value: formatCurrency(totalDeductions), icon: TrendingDown, bg: 'bg-red-500' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الموارد البشرية' }, { label: 'الرواتب' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-teal-600 via-teal-700 to-emerald-800 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-teal-300" />
              <span className="text-teal-200 text-sm font-medium">الرواتب الشهرية</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{monthNames[selectedMonth - 1]} {selectedYear}</h1>
            <p className="text-teal-200/80 text-sm">{salaries.length} راتب مسجل هذا الشهر</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-white/10 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer">
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1} className="text-gray-900">{name}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-white/10 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer">
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="text-gray-900">{y}</option>
              ))}
            </select>
            <button onClick={() => exportToCSV('salaries', ['الموظف', 'الأساسي', 'المكافأة', 'الخصومات', 'الإجمالي', 'المحول', 'المتبقي', 'التاريخ'], salaries.map((s: any) => [s.employee?.name, String(s.base_salary || 0), String(s.bonus || 0), String(s.deductions || 0), String(s.total || 0), String(s.transfer_amount || 0), String(s.remaining || 0), s.payment_date || '']))} disabled={salaries.length === 0} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Download size={16} /> تصدير
            </button>
            <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> تسجيل راتب</>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: month/year selectors + action buttons */}
      <div className="md:hidden flex flex-wrap items-center gap-2">
        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="select flex-1">
          {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="select flex-1">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className={showForm ? 'btn-secondary flex-1' : 'btn-primary flex-1'}>
          {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> تسجيل راتب</>}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`stat-card group animate-fade-in-up stagger-${i + 1}`}>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="ابحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} className="input pr-10 !py-2.5" />
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
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد رواتب لهذا الشهر</p>
                </td></tr>
              ) : filtered.map((s) => (
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
