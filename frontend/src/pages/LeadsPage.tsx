import { useState, useRef } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useUpdateLeadStage, useDeleteLead, useImportLeads } from '../hooks/useLeads';
import { useEmployees } from '../hooks/useEmployees';
import { leadsApi } from '../api/leads';
import { Link } from 'react-router-dom';
import type { Lead, LeadStage, LeadTemperature } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, X, Phone, Mail, User,
  Target, DollarSign, Trash2, Eye,
  Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle,
  Filter, Edit3, Flame, Snowflake, Sun,
} from 'lucide-react';
import SearchInput from '../components/SearchInput';
import { calculateLeadScore, getScoreColor } from '../utils/leadScoring';

const stageLabels: Record<LeadStage, string> = {
  new: 'جديد',
  first_contact: 'تواصل أولي',
  proposal_sent: 'عرض مرسل',
  negotiation: 'تفاوض',
  contract_signed: 'تم التعاقد',
  lost: 'خسارة',
};

const stageColors: Record<LeadStage, { bg: string; border: string; badge: string; dot: string }> = {
  new:              { bg: 'bg-blue-50/80',    border: 'border-blue-200',    badge: 'badge-info',    dot: 'bg-blue-500' },
  first_contact:    { bg: 'bg-amber-50/80',   border: 'border-amber-200',   badge: 'badge-warning', dot: 'bg-amber-500' },
  proposal_sent:    { bg: 'bg-purple-50/80',  border: 'border-purple-200',  badge: 'badge-purple',  dot: 'bg-purple-500' },
  negotiation:      { bg: 'bg-orange-50/80',  border: 'border-orange-200',  badge: 'badge-warning', dot: 'bg-orange-500' },
  contract_signed:  { bg: 'bg-emerald-50/80', border: 'border-emerald-200', badge: 'badge-success', dot: 'bg-emerald-500' },
  lost:             { bg: 'bg-red-50/80',     border: 'border-red-200',     badge: 'badge-error',   dot: 'bg-red-500' },
};

const sourceLabels: Record<string, string> = {
  ad: 'إعلان', referral: 'إحالة', website: 'موقع', social: 'سوشيال', other: 'أخرى',
};

const serviceLabels: Record<string, string> = {
  marketing: 'تسويق', design: 'تصميم', moderation: 'إدارة محتوى', development: 'تطوير', other: 'أخرى',
};

const temperatureConfig: Record<LeadTemperature, { icon: typeof Flame; label: string; color: string }> = {
  hot:  { icon: Flame,    label: 'ساخن', color: 'text-red-500' },
  warm: { icon: Sun,      label: 'دافئ', color: 'text-amber-500' },
  cold: { icon: Snowflake, label: 'بارد', color: 'text-blue-400' },
};

const stages: LeadStage[] = ['new', 'first_contact', 'proposal_sent', 'negotiation', 'contract_signed', 'lost'];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterSource, setFilterSource] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTemperature, setFilterTemperature] = useState('');

  // Lost reason dialog
  const [lostDialog, setLostDialog] = useState<{ leadId: number; leadName: string } | null>(null);
  const [lostReason, setLostReason] = useState('');

  // Edit modal
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', phone: '', email: '', source: 'other',
    service_type: 'other', expected_budget: '', notes: '',
    assigned_to: '', temperature: 'warm' as string,
  });

  // Build query params
  const queryParams: Record<string, unknown> = {};
  if (search) queryParams.search = search;
  if (filterSource) queryParams.source = filterSource;
  if (filterService) queryParams.service_type = filterService;
  if (filterAssignee) queryParams.assigned_to = filterAssignee;

  const { data, isLoading } = useLeads(Object.keys(queryParams).length > 0 ? queryParams : undefined);
  const { data: employeesData } = useEmployees({ per_page: 100 });
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const stageMutation = useUpdateLeadStage();
  const deleteMutation = useDeleteLead();
  const importMutation = useImportLeads();

  let leads: Lead[] = data?.data ?? [];
  // Client-side temperature filter (not supported by backend query)
  if (filterTemperature) {
    leads = leads.filter(l => l.temperature === filterTemperature);
  }

  const employees = employeesData?.data ?? [];

  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'other' as string,
    service_type: 'other' as string, expected_budget: '', notes: '',
    assigned_to: '' as string, temperature: 'warm' as string,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createData: Record<string, unknown> = {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        source: form.source,
        service_type: form.service_type,
        expected_budget: form.expected_budget ? parseFloat(form.expected_budget) : null,
        notes: form.notes || null,
        assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
        temperature: form.temperature,
      };
      await createMutation.mutateAsync(createData as Partial<Lead>);
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', source: 'other', service_type: 'other', expected_budget: '', notes: '', assigned_to: '', temperature: 'warm' });
      toast.success('تم إضافة العميل المحتمل');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('leadId', String(leadId));
  };

  const handleDrop = async (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData('leadId'));
    if (!leadId) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === stage) return;

    // If dropping to lost, show lost reason dialog
    if (stage === 'lost') {
      setLostDialog({ leadId, leadName: lead.name });
      return;
    }

    try {
      await stageMutation.mutateAsync({ id: leadId, stage });
      toast.success(`تم نقل "${lead.name}" إلى ${stageLabels[stage]}`);
    } catch {
      toast.error('حدث خطأ في تحديث المرحلة');
    }
  };

  const handleLostConfirm = async () => {
    if (!lostDialog) return;
    try {
      await stageMutation.mutateAsync({
        id: lostDialog.leadId,
        stage: 'lost',
        lost_reason: lostReason || undefined,
      });
      toast.success(`تم نقل "${lostDialog.leadName}" إلى خسارة`);
      setLostDialog(null);
      setLostReason('');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل المحتمل؟')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('تم الحذف');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setEditForm({
      name: lead.name,
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source,
      service_type: lead.service_type,
      expected_budget: lead.expected_budget?.toString() || '',
      notes: lead.notes || '',
      assigned_to: lead.assigned_to?.id?.toString() || '',
      temperature: lead.temperature || 'warm',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLead) return;
    try {
      const updateData: Record<string, unknown> = {
        id: editLead.id,
        name: editForm.name,
        phone: editForm.phone || null,
        email: editForm.email || null,
        source: editForm.source,
        service_type: editForm.service_type,
        expected_budget: editForm.expected_budget ? parseFloat(editForm.expected_budget) : null,
        notes: editForm.notes || null,
        assigned_to: editForm.assigned_to ? parseInt(editForm.assigned_to) : null,
        temperature: editForm.temperature,
      };
      await updateMutation.mutateAsync(updateData as Partial<Lead> & { id: number });
      setEditLead(null);
      toast.success('تم تحديث بيانات العميل المحتمل');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleExportCSV = () => {
    const headers = ['الاسم', 'الهاتف', 'البريد', 'المصدر', 'نوع الخدمة', 'المرحلة', 'الحرارة', 'الميزانية', 'المسؤول'];
    const rows = leads.map(l => [
      l.name,
      l.phone || '',
      l.email || '',
      sourceLabels[l.source] || l.source,
      serviceLabels[l.service_type] || l.service_type,
      stageLabels[l.stage] || l.stage,
      temperatureConfig[l.temperature]?.label || l.temperature,
      l.expected_budget?.toString() || '',
      l.assigned_to?.name || '',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير الملف');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      setImportFile(file);
    } else {
      toast.error('يرجى رفع ملف CSV فقط');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const result = await importMutation.mutateAsync(importFile);
      toast.success(result.message || `تم استيراد ${result.data?.imported} عميل محتمل`);
      if (result.data?.failed && result.data.failed > 0) {
        toast.error(`فشل استيراد ${result.data.failed} صف`);
      }
      setShowImport(false);
      setImportFile(null);
    } catch {
      toast.error('حدث خطأ في الاستيراد');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await leadsApi.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads_template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('حدث خطأ في تحميل القالب');
    }
  };

  const activeFiltersCount = [filterSource, filterService, filterAssignee, filterTemperature].filter(Boolean).length;

  const groupedLeads = stages.reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.stage === stage);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  const TemperatureBadge = ({ temp }: { temp: LeadTemperature }) => {
    const cfg = temperatureConfig[temp];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] ${cfg.color}`} title={cfg.label}>
        <Icon size={11} />
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">العملاء المحتملين</h1>
          <p className="page-subtitle">إدارة مسار المبيعات — اسحب وأفلت لتحديث المرحلة</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/sales" className="btn-secondary">
            <Target size={16} /> لوحة المبيعات
          </Link>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} /> تصدير CSV
          </button>
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); }} className="btn-secondary">
            {showImport ? <><X size={16} /> إلغاء</> : <><Upload size={16} /> استيراد CSV</>}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> عميل جديد</>}
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card card-body space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="بحث بالاسم أو الهاتف أو البريد..."
            className="max-w-md flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary relative ${activeFiltersCount > 0 ? 'border-primary-400 bg-primary-50' : ''}`}
          >
            <Filter size={16} /> فلترة
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100 animate-fade-in-up">
            <div>
              <label className="input-label text-xs">المصدر</label>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="select text-sm">
                <option value="">الكل</option>
                {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label text-xs">نوع الخدمة</label>
              <select value={filterService} onChange={e => setFilterService(e.target.value)} className="select text-sm">
                <option value="">الكل</option>
                {Object.entries(serviceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label text-xs">المسؤول</label>
              <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="select text-sm">
                <option value="">الكل</option>
                {employees.map(emp => <option key={emp.id} value={emp.user?.id || emp.id}>{emp.user?.name || emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label text-xs">الحرارة</label>
              <select value={filterTemperature} onChange={e => setFilterTemperature(e.target.value)} className="select text-sm">
                <option value="">الكل</option>
                <option value="hot">🔥 ساخن</option>
                <option value="warm">☀️ دافئ</option>
                <option value="cold">❄️ بارد</option>
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <div className="col-span-full">
                <button
                  onClick={() => { setFilterSource(''); setFilterService(''); setFilterAssignee(''); setFilterTemperature(''); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  ✕ مسح جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="card card-body space-y-4 animate-fade-in-up border-r-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-600" />
              استيراد عملاء محتملين من CSV
            </h3>
            <button onClick={handleDownloadTemplate} className="btn-secondary text-sm flex items-center gap-1.5">
              <Download size={14} /> تحميل القالب
            </button>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-emerald-400 bg-emerald-50' : importFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            {importFile ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle size={24} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{importFile.name}</p>
                  <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setImportFile(null); }} className="p-1 hover:bg-red-50 rounded-lg">
                  <X size={16} className="text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-600 font-medium">اسحب ملف CSV هنا أو اضغط للاختيار</p>
                <p className="text-xs text-gray-400 mt-1">الأعمدة: name, phone, email, source, service_type, expected_budget, notes</p>
              </>
            )}
          </div>

          {importFile && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="btn-primary"
              >
                {importMutation.isPending ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> جاري الاستيراد...</>
                ) : (
                  <><Upload size={16} /> بدء الاستيراد</>
                )}
              </button>
              <button onClick={() => { setImportFile(null); setShowImport(false); }} className="btn-secondary">
                إلغاء
              </button>
            </div>
          )}

          {importMutation.data?.data && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle size={16} /> تم استيراد: {importMutation.data.data.imported}
                </span>
                {importMutation.data.data.failed > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <AlertCircle size={16} /> فشل: {importMutation.data.data.failed}
                  </span>
                )}
              </div>
              {importMutation.data.data.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importMutation.data.data.errors.map((err: string, i: number) => (
                    <p key={i} className="text-xs text-red-500">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
          <h3 className="text-base font-bold text-gray-800">إضافة عميل محتمل جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">الاسم *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="input-label">الهاتف</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="input-label">المصدر</label>
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="select">
                {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">نوع الخدمة</label>
              <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} className="select">
                {Object.entries(serviceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">المسؤول</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="select">
                <option value="">بدون تعيين</option>
                {employees.map(emp => <option key={emp.id} value={emp.user?.id || emp.id}>{emp.user?.name || emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">الحرارة</label>
              <select value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} className="select">
                <option value="hot">🔥 ساخن</option>
                <option value="warm">☀️ دافئ</option>
                <option value="cold">❄️ بارد</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">الميزانية المتوقعة</label>
              <input type="number" step="0.01" value={form.expected_budget} onChange={e => setForm({ ...form, expected_budget: e.target.value })} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="input-label">ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={1} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </form>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 min-h-[500px]">
          {stages.map(stage => {
            const stageLeads = groupedLeads[stage] || [];
            const col = stageColors[stage];
            return (
              <div
                key={stage}
                className={`rounded-2xl border ${col.border} ${col.bg} p-3 transition-colors`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className="text-xs font-bold text-gray-700">{stageLabels[stage]}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-lg">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-gray-800 leading-tight">{lead.name}</h4>
                          <TemperatureBadge temp={lead.temperature} />
                          {(() => {
                            const score = calculateLeadScore(lead);
                            const sc = getScoreColor(score);
                            return (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{score}</span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(lead)} className="p-1 hover:bg-blue-50 rounded-lg">
                            <Edit3 size={12} className="text-gray-400 hover:text-blue-500" />
                          </button>
                          <Link to={`/leads/${lead.id}`} className="p-1 hover:bg-gray-100 rounded-lg">
                            <Eye size={12} className="text-gray-400" />
                          </Link>
                          <button onClick={() => handleDelete(lead.id)} className="p-1 hover:bg-red-50 rounded-lg">
                            <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>

                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-0.5">
                          <Phone size={10} /> {lead.phone}
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-0.5">
                          <Mail size={10} /> <span className="truncate">{lead.email}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {serviceLabels[lead.service_type] || lead.service_type}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                      </div>

                      {lead.expected_budget && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-600">
                          <DollarSign size={10} />
                          <span className="font-semibold">{lead.expected_budget.toLocaleString()}</span>
                        </div>
                      )}

                      {lead.assigned_to && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400">
                          <User size={10} /> {lead.assigned_to.name}
                        </div>
                      )}

                      {stage === 'lost' && lead.lost_reason && (
                        <div className="mt-1.5 text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded">
                          {lead.lost_reason}
                        </div>
                      )}

                      {lead.converted_client_id && (
                        <div className="mt-1.5">
                          <span className="badge badge-success text-[10px]">✓ تم التحويل</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-gray-400">
                      لا يوجد عملاء
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lost Reason Dialog */}
      {lostDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setLostDialog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">نقل "{lostDialog.leadName}" إلى خسارة</h3>
            <p className="text-sm text-gray-500 mb-4">ما سبب خسارة هذا العميل؟ (اختياري)</p>
            <textarea
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="مثال: اختار شركة أخرى / الميزانية غير مناسبة / لم يرد..."
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={handleLostConfirm} disabled={stageMutation.isPending} className="btn-primary bg-red-600 hover:bg-red-700">
                {stageMutation.isPending ? 'جاري النقل...' : 'تأكيد الخسارة'}
              </button>
              <button onClick={() => { setLostDialog(null); setLostReason(''); }} className="btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditLead(null)}>
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">تعديل بيانات العميل المحتمل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">الاسم *</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="input-label">الهاتف</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">البريد الإلكتروني</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input" />
              </div>
              <div>
                <label className="input-label">المصدر</label>
                <select value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} className="select">
                  {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">نوع الخدمة</label>
                <select value={editForm.service_type} onChange={e => setEditForm({ ...editForm, service_type: e.target.value })} className="select">
                  {Object.entries(serviceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">المسؤول</label>
                <select value={editForm.assigned_to} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })} className="select">
                  <option value="">بدون تعيين</option>
                  {employees.map(emp => <option key={emp.id} value={emp.user?.id || emp.id}>{emp.user?.name || emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">الحرارة</label>
                <select value={editForm.temperature} onChange={e => setEditForm({ ...editForm, temperature: e.target.value })} className="select">
                  <option value="hot">🔥 ساخن</option>
                  <option value="warm">☀️ دافئ</option>
                  <option value="cold">❄️ بارد</option>
                </select>
              </div>
              <div>
                <label className="input-label">الميزانية المتوقعة</label>
                <input type="number" step="0.01" value={editForm.expected_budget} onChange={e => setEditForm({ ...editForm, expected_budget: e.target.value })} className="input" />
              </div>
            </div>
            <div className="mt-4">
              <label className="input-label">ملاحظات</label>
              <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="input" rows={2} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button type="button" onClick={() => setEditLead(null)} className="btn-secondary">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
