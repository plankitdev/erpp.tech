import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployees, useDeleteEmployee } from '../hooks/useEmployees';
import { formatCurrency, formatDate } from '../utils';
import { Plus, Pencil, Trash2, Eye, Download, UserCog } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';

export default function Employees() {
  const { data, isLoading, isError, refetch } = useEmployees();
  const deleteMutation = useDeleteEmployee();
  const employees = data?.data ?? [];
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الموظفين</h1>
          <p className="page-subtitle">{employees.length} موظف مسجل</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('employees', ['الاسم', 'المسمى الوظيفي', 'الراتب الأساسي', 'تاريخ التعيين'], employees.map(emp => [emp.name, emp.position, String(emp.base_salary), emp.join_date]))} disabled={employees.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير CSV
          </button>
          <Link to="/employees/create" className="btn-primary">
            <Plus size={16} /> موظف جديد
          </Link>
        </div>
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
              ) : employees.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <UserCog size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد موظفين</p>
                </td></tr>
              ) : employees.map((emp) => (
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
