import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployees, useDeleteEmployee } from '../hooks/useEmployees';
import { formatCurrency, formatDate } from '../utils';
import { Plus, Pencil, Trash2, Eye, Download, UserCog, Users, Wallet, CalendarDays, Sparkles, ArrowUpRight, Search } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Employees() {
  const { data, isLoading, isError, refetch } = useEmployees();
  const deleteMutation = useDeleteEmployee();
  const employees = data?.data ?? [];
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف الموظف');
      setDeleteId(null);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const totalSalaries = employees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
  const filtered = search
    ? employees.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const statCards = [
    { label: 'إجمالي الموظفين', value: employees.length, icon: Users, bg: 'bg-blue-500' },
    { label: 'إجمالي الرواتب', value: formatCurrency(totalSalaries), icon: Wallet, bg: 'bg-emerald-500' },
    { label: 'متوسط الراتب', value: formatCurrency(employees.length > 0 ? totalSalaries / employees.length : 0), icon: CalendarDays, bg: 'bg-violet-500' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الموارد البشرية' }, { label: 'الموظفين' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-800 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-blue-300" />
              <span className="text-blue-200 text-sm font-medium">إدارة الموظفين</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">فريق العمل</h1>
            <p className="text-blue-200/80 text-sm">{employees.length} موظف مسجل في النظام</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => exportToCSV('employees', ['الاسم', 'المسمى الوظيفي', 'الراتب الأساسي', 'تاريخ التعيين'], employees.map(emp => [emp.name, emp.position, String(emp.base_salary), emp.join_date]))} disabled={employees.length === 0} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Download size={16} /> تصدير CSV
            </button>
            <Link to="/employees/create" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Plus size={16} /> موظف جديد
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                <p className="text-[13px] text-gray-400 mb-1.5 font-medium">{card.label}</p>
                <p className="text-[1.65rem] font-bold text-gray-900 tracking-tight">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="card card-body !py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المسمى..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pr-10 !py-2"
          />
        </div>
        <Link to="/employees/create" className="btn-primary md:hidden">
          <Plus size={16} /> إضافة
        </Link>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th className="hidden sm:table-cell">المسمى الوظيفي</th>
                <th>الراتب الأساسي</th>
                <th className="hidden md:table-cell">تاريخ التعيين</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : isError ? (
                <tr><td colSpan={5} className="text-center py-12"><div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div><button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <UserCog size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">{search ? 'لا توجد نتائج' : 'لا يوجد موظفين'}</p>
                </td></tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-semibold text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xs">
                        {emp.name?.charAt(0)}
                      </div>
                      {emp.name}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">{emp.position}</td>
                  <td className="font-medium">{formatCurrency(emp.base_salary)}</td>
                  <td className="hidden md:table-cell">{formatDate(emp.join_date)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/employees/${emp.id}`} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                        <Eye size={15} />
                      </Link>
                      <Link to={`/employees/${emp.id}/edit`} className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => setDeleteId(emp.id)} className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الموظف"
        message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
