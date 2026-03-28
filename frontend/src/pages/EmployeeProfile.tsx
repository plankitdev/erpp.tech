import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEmployee, useSalaries } from '../hooks/useEmployees';
import { employeesApi } from '../api/employees';
import { formatCurrency, formatDate } from '../utils';
import {
  ArrowRight, Pencil, Upload, Trash2, FileText, User, Wallet, CreditCard,
  Phone, Mail, MapPin, Building2, Calendar, Shield, AlertCircle, Loader2, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { InlinePreview, resolveFileUrl, isPreviewable, getFileIconComponent, getFileIconColor } from '../components/FilePreview';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../store/authStore';

const fileTypes: Record<string, string> = {
  national_id: 'هوية وطنية',
  passport: 'جواز سفر',
  contract: 'عقد العمل',
  certificate: 'شهادة',
  insurance: 'تأمين',
  other: 'أخرى',
};

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const employeeId = parseInt(id || '0');
  const { data: employee, isLoading, isError, refetch } = useEmployee(employeeId);
  const { data: salaryData } = useSalaries({ employee_id: employeeId, per_page: 100 });
  const salaries = salaryData?.data ?? [];

  const [activeTab, setActiveTab] = useState<'info' | 'salary' | 'files'>('info');
  const [uploadType, setUploadType] = useState('other');
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await employeesApi.uploadFile(employeeId, file, uploadType);
      refetch();
      toast.success('تم رفع الملف');
    } catch {
      toast.error('حدث خطأ في رفع الملف');
    }
    e.target.value = '';
  };

  const handleDeleteFile = (fileId: number) => {
    setDeleteFileId(fileId);
  };

  const confirmDeleteFile = async () => {
    if (!deleteFileId) return;
    try {
      await employeesApi.deleteFile(employeeId, deleteFileId);
      refetch();
      toast.success('تم الحذف');
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteFileId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="bg-white rounded-xl p-12 border text-center">
        <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-3">حدث خطأ</p>
        <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">إعادة المحاولة</button>
      </div>
    );
  }

  const totalPaid = salaries.reduce((sum, s) => sum + (s.transfer_amount || 0), 0);
  const totalDeductions = salaries.reduce((sum, s) => sum + (s.deductions || 0), 0);
  const files = employee.files || [];
  const { hasPermission } = useAuthStore();
  const canViewSalaries = hasPermission('salaries.view');

  const InfoItem = ({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) => (
    value ? (
      <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0 mt-0.5">
          <Icon size={14} />
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
          <p className="text-sm font-medium text-gray-800">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/employees" className="hover:text-primary-600 flex items-center gap-1">
          <ArrowRight size={14} /> الموظفين
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{employee.name}</span>
      </div>

      {/* Header Card */}
      <div className="card card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-sm text-gray-500">{employee.position}</p>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                {employee.phone && <span className="flex items-center gap-1"><Phone size={10} />{employee.phone}</span>}
                {employee.email && <span className="flex items-center gap-1"><Mail size={10} />{employee.email}</span>}
                <span className="flex items-center gap-1"><Calendar size={10} />منذ {formatDate(employee.join_date)}</span>
              </div>
            </div>
          </div>
          <Link to={`/employees/${employee.id}/edit`}
            className="btn-secondary text-sm">
            <Pencil size={14} /> تعديل
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {canViewSalaries && (
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-emerald-600">الراتب الأساسي</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(employee.base_salary)}</p>
          </div>
          )}
          {canViewSalaries && (
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-blue-600">إجمالي المدفوع</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalPaid)}</p>
          </div>
          )}
          {canViewSalaries && (
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-red-600">الخصومات</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(totalDeductions)}</p>
          </div>
          )}
          {canViewSalaries && (
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-purple-600">أشهر مسجلة</p>
            <p className="text-lg font-bold text-purple-700">{salaries.length}</p>
          </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar w-fit">
        {([
          { key: 'info' as const, label: 'البيانات', icon: User },
          ...(canViewSalaries ? [{ key: 'salary' as const, label: 'الرواتب والتحويلات', icon: Wallet }] : []),
          { key: 'files' as const, label: 'الملفات', icon: FileText },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`tab-item flex items-center gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="card card-body">
          <h2 className="font-semibold text-gray-800 mb-4">البيانات الشخصية والوظيفية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoItem icon={User} label="الاسم" value={employee.name} />
            <InfoItem icon={Shield} label="المسمى الوظيفي" value={employee.position} />
            <InfoItem icon={Phone} label="الهاتف" value={employee.phone} />
            <InfoItem icon={Mail} label="البريد الإلكتروني" value={employee.email} />
            <InfoItem icon={CreditCard} label="رقم الهوية" value={employee.national_id} />
            <InfoItem icon={MapPin} label="العنوان" value={employee.address} />
            <InfoItem icon={Building2} label="البنك" value={employee.bank_name} />
            <InfoItem icon={CreditCard} label="رقم الحساب البنكي" value={employee.bank_account} />
            {canViewSalaries && <InfoItem icon={Wallet} label="الراتب الأساسي" value={formatCurrency(employee.base_salary)} />}
            <InfoItem icon={Calendar} label="تاريخ التعيين" value={formatDate(employee.join_date)} />
            <InfoItem icon={Calendar} label="بداية العقد" value={employee.contract_start ? formatDate(employee.contract_start) : null} />
            <InfoItem icon={Calendar} label="نهاية العقد" value={employee.contract_end ? formatDate(employee.contract_end) : null} />
          </div>
          {employee.notes && (
            <div className="mt-4 p-3 bg-amber-50/50 rounded-xl">
              <p className="text-[11px] text-amber-600 mb-1">ملاحظات</p>
              <p className="text-sm text-gray-700">{employee.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && canViewSalaries && (
        <div className="table-container">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">سجل الرواتب والتحويلات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الشهر</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الأساسي</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الخصومات</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">سبب الخصم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الإجمالي</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">المحول</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">المتبقي</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ التحويل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salaries.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">لا يوجد رواتب مسجلة</td></tr>
                ) : salaries.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.month}/{s.year}</td>
                    <td className="px-4 py-3">{s.base_salary?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {s.deductions > 0 && <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-lg text-xs">{s.deductions.toLocaleString()}</span>}
                      {!s.deductions && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.deduction_reason || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{s.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs font-medium">{s.transfer_amount?.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.remaining > 0 ? (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-xs">{s.remaining.toLocaleString()}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.payment_date ? formatDate(s.payment_date) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">ملفات الموظف ({files.length})</h2>
            <div className="flex items-center gap-2">
              <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20">
                {Object.entries(fileTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="btn-primary text-sm cursor-pointer">
                <Upload size={16} /> رفع ملف
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {files.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
              <FileText size={40} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">لا توجد ملفات مرفوعة</p>
              <p className="text-gray-400 text-xs mt-1">ارفع ملفات الموظف مثل الهوية وعقد العمل والشهادات</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {files.map(file => {
                const FileIcon = getFileIconComponent(file.file_name);
                const iconColor = getFileIconColor(file.file_name);
                return (
                  <div key={file.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
                        <FileIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{file.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{fileTypes[file.type || 'other'] || file.type}</span>
                          {file.uploaded_by && <span>رفع بواسطة: {file.uploaded_by.name}</span>}
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPreviewable(file.file_name) && (
                        <InlinePreview name={file.file_name} path={file.file_path} className="w-8 h-8 rounded" />
                      )}
                      <a href={resolveFileUrl(file.file_path)} target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-600 p-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Download size={14} />
                      </a>
                      <button onClick={() => handleDeleteFile(file.id)}
                        className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteFileId !== null}
        title="حذف الملف"
        message="هل أنت متأكد من حذف هذا الملف؟"
        confirmText="حذف"
        onConfirm={confirmDeleteFile}
        onCancel={() => setDeleteFileId(null)}
      />
    </div>
  );
}
