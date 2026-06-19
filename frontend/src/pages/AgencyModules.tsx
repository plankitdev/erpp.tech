import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Save, Building2, PanelRightClose, Info } from 'lucide-react';
import { HIDEABLE_MODULES } from '../components/Layout';
import { companiesApi } from '../api/companies';
import { useAuthStore } from '../store/authStore';
import type { Company } from '../types';
import toast from 'react-hot-toast';

export default function AgencyModules() {
  const { user, setCompanySettings } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(user?.company?.id ?? null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companiesApi.getAll()
      .then(r => {
        const list = r.data.data || [];
        setCompanies(list);
        setCompanyId(prev => prev ?? user?.company?.id ?? list[0]?.id ?? null);
      })
      .catch(() => toast.error('تعذّر تحميل الشركات'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => companies.find(c => c.id === companyId) ?? null, [companies, companyId]);

  useEffect(() => {
    setHidden(new Set(selected?.settings?.hidden_modules ?? []));
  }, [selected?.id]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof HIDEABLE_MODULES> = {};
    for (const m of HIDEABLE_MODULES) (map[m.section] ||= []).push(m);
    return map;
  }, []);

  const toggle = (path: string) =>
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const visibleCount = HIDEABLE_MODULES.length - hidden.size;

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const newSettings = { ...(selected?.settings ?? {}), hidden_modules: Array.from(hidden) };
      const { data } = await companiesApi.update(companyId, { settings: newSettings });
      const updated = data.data;
      setCompanies(prev => prev.map(c => (c.id === companyId ? updated : c)));
      if (user?.company?.id === companyId) {
        setCompanySettings(updated.settings ?? { hidden_modules: Array.from(hidden) });
      }
      toast.success('تم حفظ إعدادات القائمة ✅');
    } catch {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 p-6">جاري التحميل...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PanelRightClose className="text-primary-600" size={24} /> تبسيط القائمة (وضع الوكالة)
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            أخفِ الموديولات اللي الشركة مش بتستخدمها — تختفي من القائمة الجانبية لكل مستخدمي الشركة.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-semibold"
        >
          <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>

      {/* Company selector + counter */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3">
        {companies.length > 1 ? (
          <label className="flex items-center gap-2 text-sm">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-gray-500">الشركة:</span>
            <select
              value={companyId ?? ''}
              onChange={e => setCompanyId(Number(e.target.value))}
              className="rounded-lg bg-gray-100 dark:bg-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        ) : (
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-200">
            <Building2 size={16} className="text-gray-400" /> {selected?.name}
          </span>
        )}
        <span className="text-xs font-bold text-gray-400">{visibleCount} ظاهر · {hidden.size} مخفي</span>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>الإخفاء بيرتّب القائمة فقط — مايحذفش بيانات ولا يلغي صلاحية. أدوات الإدارة (المستخدمين، السجل، الإعدادات) بتفضل ظاهرة دايمًا للأدمن.</span>
      </div>

      {/* Module groups */}
      {Object.entries(grouped).map(([section, mods]) => (
        <div key={section} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">{section}</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {mods.map(m => {
              const isHidden = hidden.has(m.path);
              return (
                <button
                  key={m.path}
                  onClick={() => toggle(m.path)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition text-right"
                >
                  <span className={`text-sm ${isHidden ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>
                    {m.label}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1 ${
                      isHidden ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {isHidden ? <><EyeOff size={14} /> مخفي</> : <><Eye size={14} /> ظاهر</>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
