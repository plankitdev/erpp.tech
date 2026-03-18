import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLead, useAddLeadActivity, useUpdateLead, useConvertLead } from '../hooks/useLeads';
import { formatDate } from '../utils';
import type { LeadActivity, LeadActivityType, LeadActivityOutcome } from '../types';
import toast from 'react-hot-toast';
import {
  ArrowRight, Phone, Mail, Calendar, User, Target, DollarSign,
  MessageSquare, PhoneCall, Send, Video, Clock, CheckCircle2,
  AlertCircle, MinusCircle, PlusCircle, FileText, Edit3, X,
} from 'lucide-react';

const stageLabels: Record<string, string> = {
  new: 'جديد', first_contact: 'تواصل أولي', proposal_sent: 'عرض مرسل',
  negotiation: 'تفاوض', contract_signed: 'تم التعاقد',
};

const stageColors: Record<string, string> = {
  new: 'badge-info', first_contact: 'badge-warning', proposal_sent: 'badge-purple',
  negotiation: 'badge-warning', contract_signed: 'badge-success',
};

const sourceLabels: Record<string, string> = {
  ad: 'إعلان', referral: 'إحالة', website: 'موقع', social: 'سوشيال', other: 'أخرى',
};

const serviceLabels: Record<string, string> = {
  marketing: 'تسويق', design: 'تصميم', moderation: 'إدارة محتوى', development: 'تطوير', other: 'أخرى',
};

const activityTypeLabels: Record<LeadActivityType, string> = {
  call: 'مكالمة', message: 'رسالة', email: 'بريد إلكتروني',
  proposal_sent: 'إرسال عرض', meeting: 'اجتماع', followup: 'متابعة',
};

const activityTypeIcons: Record<LeadActivityType, typeof Phone> = {
  call: PhoneCall, message: MessageSquare, email: Send,
  proposal_sent: FileText, meeting: Video, followup: Clock,
};

const outcomeLabels: Record<LeadActivityOutcome, string> = {
  positive: 'إيجابي', neutral: 'محايد', negative: 'سلبي',
};

const outcomeIcons: Record<LeadActivityOutcome, typeof CheckCircle2> = {
  positive: CheckCircle2, neutral: MinusCircle, negative: AlertCircle,
};

const outcomeColors: Record<LeadActivityOutcome, string> = {
  positive: 'text-emerald-600 bg-emerald-50', neutral: 'text-gray-600 bg-gray-50', negative: 'text-red-600 bg-red-50',
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(Number(id));
  const addActivityMutation = useAddLeadActivity();
  const updateMutation = useUpdateLead();
  const convertMutation = useConvertLead();

  const [showActivity, setShowActivity] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [actForm, setActForm] = useState({
    type: 'call' as LeadActivityType,
    notes: '',
    outcome: '' as string,
    next_followup_date: '',
  });
  const [convertForm, setConvertForm] = useState({
    contract_value: '',
    currency: 'EGP',
    payment_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    installments_count: '',
  });

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addActivityMutation.mutateAsync({
        leadId: Number(id),
        type: actForm.type,
        notes: actForm.notes || null,
        outcome: (actForm.outcome || null) as LeadActivityOutcome | null,
        next_followup_date: actForm.next_followup_date || null,
      });
      setShowActivity(false);
      setActForm({ type: 'call', notes: '', outcome: '', next_followup_date: '' });
      toast.success('تم إضافة النشاط');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await convertMutation.mutateAsync({
        id: Number(id),
        contract_value: parseFloat(convertForm.contract_value),
        currency: convertForm.currency,
        payment_type: convertForm.payment_type,
        start_date: convertForm.start_date,
        end_date: convertForm.end_date || undefined,
        installments_count: convertForm.installments_count ? parseInt(convertForm.installments_count) : undefined,
      });
      toast.success('تم تحويل العميل المحتمل إلى عميل وعقد');
      setShowConvert(false);
    } catch {
      toast.error('حدث خطأ في التحويل');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">لم يتم العثور على العميل المحتمل</p>
        <Link to="/leads" className="btn-primary mt-4 inline-flex">العودة</Link>
      </div>
    );
  }

  const activities: LeadActivity[] = lead.activities ?? [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/leads" className="btn-icon">
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="page-title">{lead.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${stageColors[lead.stage]}`}>{stageLabels[lead.stage]}</span>
              <span className="text-xs text-gray-400">{serviceLabels[lead.service_type]}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{sourceLabels[lead.source]}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowActivity(true)} className="btn-secondary">
            <PlusCircle size={16} /> إضافة نشاط
          </button>
          {!lead.converted_client_id && (
            <button onClick={() => setShowConvert(true)} className="btn-primary">
              <CheckCircle2 size={16} /> تحويل لعميل
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="space-y-4">
          <div className="card card-body space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2">معلومات العميل المحتمل</h3>
            {lead.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-400" />
                <span className="text-gray-700">{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-700">{lead.email}</span>
              </div>
            )}
            {lead.assigned_to && (
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-700">{lead.assigned_to.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-700">تاريخ الإضافة: {formatDate(lead.created_at)}</span>
            </div>
            {lead.first_contact_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-700">أول تواصل: {formatDate(lead.first_contact_date)}</span>
              </div>
            )}
            {lead.last_followup_date && (
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-700">آخر متابعة: {formatDate(lead.last_followup_date)}</span>
              </div>
            )}
          </div>

          {/* Financial Info */}
          <div className="card card-body space-y-3">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2">المعلومات المالية</h3>
            {lead.expected_budget != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">الميزانية المتوقعة</span>
                <span className="font-bold text-gray-800">{lead.expected_budget.toLocaleString()}</span>
              </div>
            )}
            {lead.proposed_amount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">المبلغ المعروض</span>
                <span className="font-bold text-primary-600">{lead.proposed_amount.toLocaleString()}</span>
              </div>
            )}
            {lead.final_amount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">المبلغ النهائي</span>
                <span className="font-bold text-emerald-600">{lead.final_amount.toLocaleString()}</span>
              </div>
            )}
            {lead.converted_client_id && (
              <Link to={`/clients/${lead.converted_client_id}`} className="btn-primary w-full text-center text-sm mt-2">
                عرض العميل
              </Link>
            )}
          </div>

          {lead.notes && (
            <div className="card card-body">
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">ملاحظات</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">سجل النشاطات ({activities.length})</h3>
              <button onClick={() => setShowActivity(true)} className="btn-secondary text-xs">
                <PlusCircle size={14} /> إضافة
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">لا يوجد نشاطات بعد</p>
                <p className="text-gray-300 text-xs mt-1">ابدأ بإضافة أول نشاط</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-100" />

                <div className="space-y-4">
                  {activities.map((act, idx) => {
                    const Icon = activityTypeIcons[act.type] || Clock;
                    const OutcomeIcon = act.outcome ? outcomeIcons[act.outcome] : null;
                    return (
                      <div key={act.id} className="relative flex gap-4 pr-2">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-primary-200 flex items-center justify-center">
                          <Icon size={14} className="text-primary-500" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">
                                {activityTypeLabels[act.type]}
                              </span>
                              {act.outcome && OutcomeIcon && (
                                <span className={`badge text-[10px] ${outcomeColors[act.outcome]} flex items-center gap-1`}>
                                  <OutcomeIcon size={10} />
                                  {outcomeLabels[act.outcome]}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">{formatDate(act.created_at)}</span>
                          </div>

                          {act.notes && (
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{act.notes}</p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                            {act.user && (
                              <span className="flex items-center gap-1">
                                <User size={10} /> {act.user.name}
                              </span>
                            )}
                            {act.next_followup_date && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Calendar size={10} /> متابعة: {formatDate(act.next_followup_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      {showActivity && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowActivity(false)} />
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-bold">إضافة نشاط</h3>
              <button onClick={() => setShowActivity(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddActivity}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="input-label">نوع النشاط *</label>
                  <select value={actForm.type} onChange={e => setActForm({ ...actForm, type: e.target.value as LeadActivityType })} className="select">
                    {Object.entries(activityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">ملاحظات</label>
                  <textarea value={actForm.notes} onChange={e => setActForm({ ...actForm, notes: e.target.value })} className="input" rows={3} placeholder="تفاصيل النشاط..." />
                </div>
                <div>
                  <label className="input-label">النتيجة</label>
                  <select value={actForm.outcome} onChange={e => setActForm({ ...actForm, outcome: e.target.value })} className="select">
                    <option value="">غير محدد</option>
                    {Object.entries(outcomeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">تاريخ المتابعة القادمة</label>
                  <input type="date" value={actForm.next_followup_date} onChange={e => setActForm({ ...actForm, next_followup_date: e.target.value })} className="input" />
                </div>
              </div>
              <div className="modal-footer justify-end">
                <button type="button" onClick={() => setShowActivity(false)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={addActivityMutation.isPending} className="btn-primary">
                  {addActivityMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Client Modal */}
      {showConvert && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowConvert(false)} />
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h3 className="text-lg font-bold">تحويل إلى عميل وعقد</h3>
              <button onClick={() => setShowConvert(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleConvert}>
              <div className="modal-body space-y-4">
                <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
                  سيتم إنشاء عميل جديد باسم "<strong>{lead.name}</strong>" وعقد مرتبط به تلقائياً.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">قيمة العقد *</label>
                    <input type="number" step="0.01" value={convertForm.contract_value} onChange={e => setConvertForm({ ...convertForm, contract_value: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="input-label">العملة</label>
                    <select value={convertForm.currency} onChange={e => setConvertForm({ ...convertForm, currency: e.target.value })} className="select">
                      <option value="EGP">EGP</option>
                      <option value="USD">USD</option>
                      <option value="SAR">SAR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">نوع الدفع</label>
                    <select value={convertForm.payment_type} onChange={e => setConvertForm({ ...convertForm, payment_type: e.target.value })} className="select">
                      <option value="monthly">شهري</option>
                      <option value="installments">أقساط</option>
                      <option value="one_time">دفعة واحدة</option>
                    </select>
                  </div>
                  {convertForm.payment_type === 'installments' && (
                    <div>
                      <label className="input-label">عدد الأقساط</label>
                      <input type="number" min="1" value={convertForm.installments_count} onChange={e => setConvertForm({ ...convertForm, installments_count: e.target.value })} className="input" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">تاريخ البدء *</label>
                    <input type="date" value={convertForm.start_date} onChange={e => setConvertForm({ ...convertForm, start_date: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="input-label">تاريخ الانتهاء</label>
                    <input type="date" value={convertForm.end_date} onChange={e => setConvertForm({ ...convertForm, end_date: e.target.value })} className="input" />
                  </div>
                </div>
              </div>
              <div className="modal-footer justify-end">
                <button type="button" onClick={() => setShowConvert(false)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={convertMutation.isPending} className="btn-primary">
                  {convertMutation.isPending ? 'جاري التحويل...' : 'تحويل وإنشاء عقد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
