import { useState } from 'react';
import { Zap, Plus, Play, Pause, Trash2, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Copy } from 'lucide-react';
import { WorkflowRule, WorkflowAction, WorkflowTrigger } from '../types';
import {
  useWorkflows,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useToggleWorkflow,
  useWorkflowLogs,
  useWorkflowTemplates,
} from '../hooks/useWorkflows';

const triggerLabels: Record<WorkflowTrigger, string> = {
  lead_converted: 'تحويل عميل محتمل',
  contract_expiring: 'عقد قارب على الانتهاء',
  contract_expired: 'عقد منتهي',
  invoice_overdue: 'فاتورة متأخرة',
  invoice_paid: 'فاتورة مدفوعة',
  task_completed: 'مهمة مكتملة',
};

const actionLabels: Record<WorkflowAction, string> = {
  create_invoice: 'إنشاء فاتورة',
  create_task: 'إنشاء مهمة',
  send_notification: 'إرسال إشعار',
  update_status: 'تحديث الحالة',
};

const triggerColors: Record<WorkflowTrigger, string> = {
  lead_converted: 'bg-green-100 text-green-700',
  contract_expiring: 'bg-yellow-100 text-yellow-700',
  contract_expired: 'bg-red-100 text-red-700',
  invoice_overdue: 'bg-orange-100 text-orange-700',
  invoice_paid: 'bg-blue-100 text-blue-700',
  task_completed: 'bg-purple-100 text-purple-700',
};

const actionColors: Record<WorkflowAction, string> = {
  create_invoice: 'bg-indigo-100 text-indigo-700',
  create_task: 'bg-cyan-100 text-cyan-700',
  send_notification: 'bg-pink-100 text-pink-700',
  update_status: 'bg-gray-100 text-gray-700',
};

type Tab = 'rules' | 'logs' | 'templates';

const emptyForm: Partial<WorkflowRule> = {
  name: '',
  trigger: 'contract_expiring',
  conditions: null,
  action: 'send_notification',
  action_config: null,
  is_active: true,
};

export default function WorkflowAutomation() {
  const [tab, setTab] = useState<Tab>('rules');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<WorkflowRule>>(emptyForm);
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // Condition fields
  const [daysBefore, setDaysBefore] = useState('');
  const [minValue, setMinValue] = useState('');

  // Action config fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [dueDays, setDueDays] = useState('7');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifRoles, setNotifRoles] = useState<string[]>(['super_admin', 'manager']);
  const [newStatus, setNewStatus] = useState('');

  const { data: rulesData, isLoading } = useWorkflows();
  const { data: logsData } = useWorkflowLogs();
  const { data: templates } = useWorkflowTemplates();
  const createMutation = useCreateWorkflow();
  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const toggleMutation = useToggleWorkflow();

  const rules = rulesData?.data ?? [];
  const logs = logsData?.data ?? [];

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setDaysBefore('');
    setMinValue('');
    setTaskTitle('');
    setTaskPriority('medium');
    setDueDays('7');
    setNotifTitle('');
    setNotifBody('');
    setNotifRoles(['super_admin', 'manager']);
    setNewStatus('');
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (rule: WorkflowRule) => {
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      action: rule.action,
      is_active: rule.is_active,
    });
    setEditId(rule.id);

    const cond = rule.conditions ?? {};
    setDaysBefore(String(cond.days_before ?? ''));
    setMinValue(String(cond.min_value ?? ''));

    const cfg = rule.action_config ?? {};
    setTaskTitle(String(cfg.task_title ?? ''));
    setTaskPriority(String(cfg.priority ?? 'medium'));
    setDueDays(String(cfg.due_days ?? '7'));
    setNotifTitle(String(cfg.title ?? ''));
    setNotifBody(String(cfg.body ?? ''));
    setNotifRoles((cfg.roles as string[]) ?? ['super_admin', 'manager']);
    setNewStatus(String(cfg.new_status ?? ''));

    setShowModal(true);
  };

  const useTemplate = (template: Partial<WorkflowRule>) => {
    setForm({
      name: template.name ?? '',
      trigger: template.trigger,
      action: template.action,
      is_active: true,
    });
    setEditId(null);

    const cond = template.conditions ?? {};
    setDaysBefore(String(cond.days_before ?? ''));
    setMinValue(String(cond.min_value ?? ''));

    const cfg = template.action_config ?? {};
    setTaskTitle(String(cfg.task_title ?? ''));
    setTaskPriority(String(cfg.priority ?? 'medium'));
    setDueDays(String(cfg.due_days ?? '7'));
    setNotifTitle(String(cfg.title ?? ''));
    setNotifBody(String(cfg.body ?? ''));
    setNotifRoles((cfg.roles as string[]) ?? ['super_admin', 'manager']);
    setNewStatus(String(cfg.new_status ?? ''));

    setShowModal(true);
  };

  const buildPayload = (): Partial<WorkflowRule> => {
    const conditions: Record<string, unknown> = {};
    if (daysBefore) conditions.days_before = Number(daysBefore);
    if (minValue) conditions.min_value = Number(minValue);

    const action_config: Record<string, unknown> = {};
    if (form.action === 'create_task') {
      if (taskTitle) action_config.task_title = taskTitle;
      action_config.priority = taskPriority;
      action_config.due_days = Number(dueDays);
    } else if (form.action === 'send_notification') {
      action_config.roles = notifRoles;
      if (notifTitle) action_config.title = notifTitle;
      if (notifBody) action_config.body = notifBody;
    } else if (form.action === 'update_status') {
      if (newStatus) action_config.new_status = newStatus;
    } else if (form.action === 'create_invoice') {
      action_config.due_days = Number(dueDays);
    }

    return {
      ...form,
      conditions: Object.keys(conditions).length > 0 ? conditions : null,
      action_config: Object.keys(action_config).length > 0 ? action_config : null,
    };
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload }, { onSuccess: () => { setShowModal(false); resetForm(); } });
    } else {
      createMutation.mutate(payload, { onSuccess: () => { setShowModal(false); resetForm(); } });
    }
  };

  const toggleRole = (role: string) => {
    setNotifRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const activeCount = rules.filter((r: WorkflowRule) => r.is_active).length;
  const totalExecutions = rules.reduce((sum: number, r: WorkflowRule) => sum + r.executions_count, 0);
  const successLogs = logs.filter(l => l.status === 'success').length;
  const failedLogs = logs.filter(l => l.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">أتمتة العمليات</h1>
            <p className="text-sm text-gray-500">إنشاء قواعد تلقائية لتبسيط سير العمل</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          <Plus size={18} /> قاعدة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Zap size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold">{rules.length}</p>
              <p className="text-sm text-gray-500">إجمالي القواعد</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Play size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-gray-500">قواعد مفعّلة</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><CheckCircle size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{totalExecutions}</p>
              <p className="text-sm text-gray-500">إجمالي التنفيذات</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><XCircle size={20} className="text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold">{failedLogs}</p>
              <p className="text-sm text-gray-500">تنفيذات فاشلة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([['rules', 'القواعد'], ['logs', 'سجل التنفيذ'], ['templates', 'القوالب الجاهزة']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <Zap className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">لا توجد قواعد أتمتة بعد</p>
              <p className="text-sm text-gray-400 mt-1">ابدأ بإنشاء قاعدة جديدة أو اختر من القوالب الجاهزة</p>
            </div>
          ) : (
            rules.map((rule: WorkflowRule) => (
              <div key={rule.id} className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleMutation.mutate(rule.id)}
                      className={`p-1.5 rounded-lg transition ${rule.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      title={rule.is_active ? 'إيقاف' : 'تفعيل'}
                    >
                      {rule.is_active ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                        {!rule.is_active && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">معطّل</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${triggerColors[rule.trigger]}`}>
                          {triggerLabels[rule.trigger]}
                        </span>
                        <span className="text-gray-400">←</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[rule.action]}`}>
                          {actionLabels[rule.action]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-left text-sm text-gray-500 ml-4">
                      <div>{rule.executions_count} تنفيذ</div>
                      {rule.last_executed_at && (
                        <div className="text-xs text-gray-400">آخر: {new Date(rule.last_executed_at).toLocaleDateString('ar-EG')}</div>
                      )}
                    </div>
                    <button onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      {expandedRule === rule.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => openEdit(rule)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg text-sm">
                      تعديل
                    </button>
                    <button
                      onClick={() => { if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) deleteMutation.mutate(rule.id); }}
                      className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {expandedRule === rule.id && (
                  <div className="border-t bg-gray-50 p-4 text-sm space-y-2">
                    {rule.conditions && Object.keys(rule.conditions).length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">الشروط: </span>
                        {'days_before' in rule.conditions && <span className="text-gray-600">قبل {String(rule.conditions.days_before)} يوم</span>}
                        {'min_value' in rule.conditions && <span className="text-gray-600 mr-3">الحد الأدنى: {String(rule.conditions.min_value)}</span>}
                      </div>
                    )}
                    {rule.action_config && Object.keys(rule.action_config).length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">إعدادات الإجراء: </span>
                        <span className="text-gray-600">{JSON.stringify(rule.action_config, null, 2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">لا يوجد سجل تنفيذ بعد</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">القاعدة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">المحفّز</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الإجراء</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الكيان</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">النتيجة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{log.rule?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${triggerColors[log.trigger]}`}>{triggerLabels[log.trigger]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${actionColors[log.action]}`}>{actionLabels[log.action]}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'success' ? (
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> نجح</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600"><XCircle size={14} /> فشل</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.entity_type} #{log.entity_id}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{log.result || log.error || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(log.created_at).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates ?? []).map((tmpl, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900 mb-2">{tmpl.name}</h3>
              <div className="flex items-center gap-2 text-sm mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${triggerColors[tmpl.trigger!]}`}>
                  {triggerLabels[tmpl.trigger!]}
                </span>
                <span className="text-gray-400">←</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[tmpl.action!]}`}>
                  {actionLabels[tmpl.action!]}
                </span>
              </div>
              <button
                onClick={() => useTemplate(tmpl)}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <Copy size={14} /> استخدام هذا القالب
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">{editId ? 'تعديل القاعدة' : 'قاعدة أتمتة جديدة'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القاعدة</label>
                <input
                  type="text"
                  value={form.name ?? ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="مثال: فاتورة نهائية عند انتهاء العقد"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحفّز (عندما يحدث...)</label>
                <select
                  value={form.trigger ?? ''}
                  onChange={e => setForm({ ...form, trigger: e.target.value as WorkflowTrigger })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(triggerLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">الشروط (اختياري)</h4>
                {(form.trigger === 'contract_expiring') && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">عدد الأيام قبل الانتهاء</label>
                    <input
                      type="number"
                      value={daysBefore}
                      onChange={e => setDaysBefore(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="7"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الحد الأدنى للقيمة</label>
                  <input
                    type="number"
                    value={minValue}
                    onChange={e => setMinValue(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="اتركه فارغاً لتجاهل الشرط"
                  />
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الإجراء (نفّذ...)</label>
                <select
                  value={form.action ?? ''}
                  onChange={e => setForm({ ...form, action: e.target.value as WorkflowAction })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(actionLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Action Config */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">إعدادات الإجراء</h4>

                {form.action === 'create_task' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">عنوان المهمة</label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={e => setTaskTitle(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="متابعة تلقائية"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">الأولوية</label>
                        <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="high">عالية</option>
                          <option value="medium">متوسطة</option>
                          <option value="low">منخفضة</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">موعد التسليم (أيام)</label>
                        <input type="number" value={dueDays} onChange={e => setDueDays(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </>
                )}

                {form.action === 'send_notification' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">عنوان الإشعار</label>
                      <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="إشعار أتمتة" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">نص الإشعار (يدعم: {'{client_name}'}, {'{amount}'}, {'{days}'})</label>
                      <textarea value={notifBody} onChange={e => setNotifBody(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="عقد العميل {client_name} ينتهي خلال {days} يوم" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">إرسال لـ</label>
                      <div className="flex flex-wrap gap-2">
                        {['super_admin', 'company_admin', 'manager', 'marketing_manager', 'accountant', 'sales', 'employee'].map(role => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRole(role)}
                            className={`px-2 py-1 rounded text-xs transition ${notifRoles.includes(role) ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {role === 'super_admin' ? 'مدير عام' : role === 'company_admin' ? 'أدمن الشركة' : role === 'manager' ? 'مدير' : role === 'marketing_manager' ? 'مدير تسويق' : role === 'accountant' ? 'محاسب' : role === 'sales' ? 'مبيعات' : 'موظف'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {form.action === 'create_invoice' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">تاريخ الاستحقاق (أيام من الآن)</label>
                    <input type="number" value={dueDays} onChange={e => setDueDays(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="14" />
                  </div>
                )}

                {form.action === 'update_status' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الحالة الجديدة</label>
                    <input type="text" value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="completed" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.trigger || !form.action || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {editId ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
