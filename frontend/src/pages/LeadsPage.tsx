import { useState, useRef } from 'react';
import { useLeads, useCreateLead, useUpdateLeadStage, useDeleteLead, useImportLeads } from '../hooks/useLeads';
import { leadsApi } from '../api/leads';
import { Link } from 'react-router-dom';
import type { Lead, LeadStage } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, X, Phone, Mail, Calendar, User,
  Target, DollarSign, Trash2, Eye, GripVertical,
  Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle,
} from 'lucide-react';
import SearchInput from '../components/SearchInput';

const stageLabels: Record<LeadStage, string> = {
  new: 'جديد',
  first_contact: 'تواصل أولي',
  proposal_sent: 'عرض مرسل',
  negotiation: 'تفاوض',
  contract_signed: 'تم التعاقد',
};

const stageColors: Record<LeadStage, { bg: string; border: string; badge: string; dot: string }> = {
  new:              { bg: 'bg-blue-50/80',    border: 'border-blue-200', badge: 'badge-info',    dot: 'bg-blue-500' },
  first_contact:    { bg: 'bg-amber-50/80',   border: 'border-amber-200', badge: 'badge-warning', dot: 'bg-amber-500' },
  proposal_sent:    { bg: 'bg-purple-50/80',  border: 'border-purple-200', badge: 'badge-purple', dot: 'bg-purple-500' },
  negotiation:      { bg: 'bg-orange-50/80',  border: 'border-orange-200', badge: 'badge-warning', dot: 'bg-orange-500' },
  contract_signed:  { bg: 'bg-emerald-50/80', border: 'border-emerald-200', badge: 'badge-success', dot: 'bg-emerald-500' },
};

const sourceLabels: Record<string, string> = {
  ad: 'إعلان', referral: 'إحالة', website: 'موقع', social: 'سوشيال', other: 'أخرى',
};

const serviceLabels: Record<string, string> = {
  marketing: 'تسويق', design: 'تصميم', moderation: 'إدارة محتوى', development: 'تطوير', other: 'أخرى',
};

const stages: LeadStage[] = ['new', 'first_contact', 'proposal_sent', 'negotiation', 'contract_signed'];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useLeads(search ? { search } : undefined);
  const createMutation = useCreateLead();
  const stageMutation = useUpdateLeadStage();
  const deleteMutation = useDeleteLead();
  const importMutation = useImportLeads();
  const leads: Lead[] = data?.data ?? [];

  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'other' as string,
    service_type: 'other' as string, expected_budget: '', notes: '',
    assigned_to: '' as string,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        source: form.source as Lead['source'],
        service_type: form.service_type as Lead['service_type'],
        expected_budget: form.expected_budget ? parseFloat(form.expected_budget) : null,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', source: 'other', service_type: 'other', expected_budget: '', notes: '', assigned_to: '' });
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
    try {
      await stageMutation.mutateAsync({ id: leadId, stage });
      toast.success(`تم نقل "${lead.name}" إلى ${stageLabels[stage]}`);
    } catch {
      toast.error('حدث خطأ في تحديث المرحلة');
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

  const groupedLeads = stages.reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.stage === stage);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">العملاء المحتملين</h1>
          <p className="page-subtitle">إدارة مسار المبيعات — اسحب وأفلت لتحديث المرحلة</p>
        </div>
        <div className="flex gap-2">
          <Link to="/sales" className="btn-secondary">
            <Target size={16} /> لوحة المبيعات
          </Link>
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); }} className="btn-secondary">
            {showImport ? <><X size={16} /> إلغاء</> : <><Upload size={16} /> استيراد CSV</>}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> عميل جديد</>}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card card-body">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="بحث بالاسم أو الهاتف أو البريد..."
          className="max-w-md"
        />
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
                  {importMutation.data.data.errors.map((err, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="input-label">الميزانية المتوقعة</label>
              <input type="number" step="0.01" value={form.expected_budget} onChange={e => setForm({ ...form, expected_budget: e.target.value })} className="input" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="input-label">ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[500px]">
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
                    <span className="text-sm font-bold text-gray-700">{stageLabels[stage]}</span>
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
                      className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-800 leading-tight">{lead.name}</h4>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/leads/${lead.id}`} className="p-1 hover:bg-gray-100 rounded-lg">
                            <Eye size={13} className="text-gray-400" />
                          </Link>
                          <button onClick={() => handleDelete(lead.id)} className="p-1 hover:bg-red-50 rounded-lg">
                            <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>

                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                          <Phone size={11} /> {lead.phone}
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                          <Mail size={11} /> <span className="truncate">{lead.email}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {serviceLabels[lead.service_type] || lead.service_type}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                      </div>

                      {lead.expected_budget && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-600">
                          <DollarSign size={11} />
                          <span className="font-semibold">{lead.expected_budget.toLocaleString()}</span>
                        </div>
                      )}

                      {lead.assigned_to && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                          <User size={11} /> {lead.assigned_to.name}
                        </div>
                      )}

                      {lead.converted_client_id && (
                        <div className="mt-2">
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
    </div>
  );
}
