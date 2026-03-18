import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects';
import { clientsApi } from '../api/clients';
import type { Client } from '../types';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import {
  Plus, FolderKanban, AlertCircle, Calendar, Users,
  MoreVertical, Trash2, Eye, CircleDot, X, Sparkles,
  Globe, Megaphone, Palette, Smartphone, FileText, ArrowLeft,
  DollarSign, Clock, Pen, Share2, Code, ShoppingCart,
  Video, Search, BarChart3, Layout,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import SearchInput from '../components/SearchInput';
import { SkeletonCard } from '../components/Skeletons';

const PROJECT_TEMPLATES = [
  {
    id: 'blank',
    name: 'مشروع فارغ',
    description: 'ابدأ من الصفر',
    icon: FileText,
    color: 'from-gray-400 to-gray-500',
    defaults: {},
  },
  {
    id: 'content_plan',
    name: 'كونتنت بلان',
    description: 'خطة محتوى شهرية لمنصات التواصل',
    icon: Pen,
    color: 'from-violet-500 to-purple-600',
    defaults: {
      description: 'خطة محتوى شاملة تشمل: كتابة المحتوى، تصميم البوستات، جدولة النشر، وتحليل الأداء',
      budget: '3000',
      currency: 'EGP',
    },
  },
  {
    id: 'social_media',
    name: 'إدارة سوشيال ميديا',
    description: 'إدارة ونشر وتفاعل على المنصات',
    icon: Share2,
    color: 'from-pink-500 to-rose-600',
    defaults: {
      description: 'إدارة حسابات التواصل الاجتماعي: نشر المحتوى، الرد على التعليقات، إعداد التقارير الشهرية',
      budget: '4000',
      currency: 'EGP',
    },
  },
  {
    id: 'marketing',
    name: 'حملة تسويقية',
    description: 'حملة إعلانية ممولة على المنصات',
    icon: Megaphone,
    color: 'from-orange-500 to-red-500',
    defaults: {
      description: 'حملة تسويقية متكاملة: تحديد الجمهور المستهدف، إعداد الإعلانات، المتابعة والتحسين',
      budget: '5000',
      currency: 'EGP',
    },
  },
  {
    id: 'branding',
    name: 'تصميم هوية بصرية',
    description: 'شعار وألوان وخطوط ومطبوعات',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    defaults: {
      description: 'تصميم هوية بصرية كاملة: شعار، ألوان، خطوط، بطاقات أعمال، ليتر هيد، ومطبوعات',
      budget: '8000',
      currency: 'EGP',
    },
  },
  {
    id: 'website',
    name: 'تطوير موقع إلكتروني',
    description: 'موقع شركة أو متجر أو لاندنج بيج',
    icon: Globe,
    color: 'from-blue-500 to-indigo-600',
    defaults: {
      description: 'تصميم وتطوير موقع إلكتروني متجاوب مع جميع الأجهزة، مع لوحة تحكم ونظام إدارة محتوى',
      budget: '15000',
      currency: 'EGP',
    },
  },
  {
    id: 'ecommerce',
    name: 'متجر إلكتروني',
    description: 'متجر أونلاين مع بوابة دفع وإدارة منتجات',
    icon: ShoppingCart,
    color: 'from-emerald-500 to-green-600',
    defaults: {
      description: 'تطوير متجر إلكتروني: تصميم UI/UX، نظام سلة الشراء، بوابة دفع، إدارة المنتجات والطلبات',
      budget: '20000',
      currency: 'EGP',
    },
  },
  {
    id: 'app',
    name: 'تطوير تطبيق موبايل',
    description: 'تطبيق iOS و Android مع لوحة تحكم',
    icon: Smartphone,
    color: 'from-teal-500 to-cyan-600',
    defaults: {
      description: 'تطوير تطبيق موبايل متكامل لنظامي iOS و Android مع لوحة تحكم وAPI',
      budget: '25000',
      currency: 'EGP',
    },
  },
  {
    id: 'software',
    name: 'نظام برمجي / ERP',
    description: 'برنامج مخصص أو نظام إداري',
    icon: Code,
    color: 'from-slate-600 to-gray-800',
    defaults: {
      description: 'تطوير نظام برمجي مخصص: تحليل المتطلبات، التصميم، البرمجة، الاختبار، والتسليم',
      budget: '35000',
      currency: 'EGP',
    },
  },
  {
    id: 'video',
    name: 'إنتاج فيديو',
    description: 'موشن جرافيك أو فيديو إعلاني',
    icon: Video,
    color: 'from-red-500 to-orange-600',
    defaults: {
      description: 'إنتاج فيديو احترافي: كتابة السيناريو، التصميم، الأنيميشن، المونتاج والإخراج',
      budget: '5000',
      currency: 'EGP',
    },
  },
  {
    id: 'seo',
    name: 'تحسين محركات البحث SEO',
    description: 'تحسين الظهور في جوجل وزيادة الزيارات',
    icon: Search,
    color: 'from-yellow-500 to-amber-600',
    defaults: {
      description: 'خطة SEO شاملة: تحليل الكلمات المفتاحية، تحسين المحتوى، بناء الروابط، وتقارير شهرية',
      budget: '4000',
      currency: 'EGP',
    },
  },
  {
    id: 'uiux',
    name: 'تصميم UI/UX',
    description: 'تصميم واجهات وتجربة مستخدم',
    icon: Layout,
    color: 'from-indigo-500 to-blue-600',
    defaults: {
      description: 'تصميم واجهة المستخدم وتجربة الاستخدام: بحث المستخدمين، Wireframes، تصميم الشاشات، Prototype',
      budget: '10000',
      currency: 'EGP',
    },
  },
];

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'template' | 'form'>('template');
  const [clients, setClients] = useState<Client[]>([]);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  const params: Record<string, unknown> = {};
  if (statusFilter !== 'all') params.status = statusFilter;
  if (searchQuery.trim()) params.search = searchQuery;

  const { data, isLoading, isError, refetch } = useProjects(params);
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const projects = data?.data ?? [];

  const [form, setForm] = useState({
    name: '', description: '', client_id: '', status: 'active',
    start_date: '', end_date: '', budget: '', currency: 'EGP',
  });

  useEffect(() => {
    clientsApi.getAll({ per_page: 1000 }).then(res => setClients(res.data.data)).catch(() => {});
  }, []);

  const openModal = () => {
    setForm({ name: '', description: '', client_id: '', status: 'active', start_date: '', end_date: '', budget: '', currency: 'EGP' });
    setModalStep('template');
    setShowModal(true);
  };

  const selectTemplate = (templateId: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (template?.defaults) {
      setForm(prev => ({ ...prev, ...template.defaults }));
    }
    setModalStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        description: form.description || null,
        client_id: form.client_id ? parseInt(form.client_id) : null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        currency: form.currency,
      });
      setShowModal(false);
      toast.success('تم إنشاء المشروع بنجاح');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = (slug: string) => {
    setDeleteSlug(slug);
    setActionMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteSlug) return;
    try {
      await deleteMutation.mutateAsync(deleteSlug);
      toast.success('تم حذف المشروع');
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteSlug(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">المشاريع</h1>
          <p className="page-subtitle">{projects.length} مشروع</p>
        </div>
        <button onClick={openModal}
          className="btn-primary">
          <Plus size={18} />
          مشروع جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="بحث بالاسم..."
            className="flex-1 min-w-[200px]"
          />
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'active', label: 'نشط' },
              { key: 'completed', label: 'مكتمل' },
              { key: 'on_hold', label: 'متوقف' },
            ].map(s => (
              <button key={s.key} onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">حدث خطأ</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">إعادة المحاولة</button>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <FolderKanban size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">لا توجد مشاريع</p>
          <p className="text-gray-400 text-sm mt-1">اضغط "مشروع جديد" للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, idx) => {
            return (
              <div key={project.id}
                className={`bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-200 group animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/projects/${project.slug}`}
                      className="font-bold text-gray-800 hover:text-primary-600 transition-colors block truncate">
                      {project.name}
                    </Link>
                    {project.client && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Users size={10} />{project.client.company_name || project.client.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={project.status} size="sm" />
                    <div className="relative">
                      <button onClick={() => setActionMenu(actionMenu === project.id ? null : project.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical size={14} />
                      </button>
                      {actionMenu === project.id && (
                        <div className="absolute left-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border z-10 animate-scale-in origin-top-left overflow-hidden">
                          <Link to={`/projects/${project.slug}`}
                            className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Eye size={14} /> عرض
                          </Link>
                          <button onClick={() => handleDelete(project.slug)}
                            className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                )}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                    <span>التقدم</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <CircleDot size={12} />
                    {project.completed_tasks_count}/{project.tasks_count} مهمة
                  </span>
                  {project.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(project.start_date)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content" style={{ maxWidth: modalStep === 'template' ? '640px' : '560px' }}>
            {/* Template Selection Step */}
            {modalStep === 'template' && (
              <>
                <div className="modal-header">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">اختر قالب المشروع</h2>
                      <p className="text-xs text-gray-400">ابدأ بقالب جاهز أو من الصفر</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
                </div>
                <div className="modal-body">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                    {PROJECT_TEMPLATES.map(template => {
                      const Icon = template.icon;
                      return (
                        <button key={template.id}
                          onClick={() => selectTemplate(template.id)}
                          className="text-right p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-md transition-all group">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                            <Icon size={20} />
                          </div>
                          <h3 className="font-bold text-gray-800 text-sm">{template.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Form Step */}
            {modalStep === 'form' && (
              <>
                <div className="modal-header">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setModalStep('template')}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">تفاصيل المشروع</h2>
                      <p className="text-xs text-gray-400">أكمل المعلومات الأساسية</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
                </div>
                <form id="create-project-form" onSubmit={handleSubmit} className="modal-body space-y-5">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم المشروع *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="مثال: تطوير موقع الشركة" required autoFocus
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm" />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">الوصف</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="اكتب وصف مختصر للمشروع..." rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/20 text-sm" />
                  </div>

                  {/* Client & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        <Users size={14} className="text-gray-400" /> العميل
                      </label>
                      <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                        <option value="">بدون عميل</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">الحالة</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                        <option value="active">نشط</option>
                        <option value="on_hold">متوقف</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Clock size={14} className="text-gray-400" /> الجدول الزمني
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">تاريخ البداية</label>
                        <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">تاريخ النهاية</label>
                        <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                    </div>
                  </div>

                  {/* Budget Section */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <DollarSign size={14} className="text-gray-400" /> الميزانية
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                          placeholder="0.00" step="0.01"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                      <div>
                        <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20">
                          <option value="EGP">EGP</option>
                          <option value="USD">USD</option>
                          <option value="SAR">SAR</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="modal-footer">
                  <button type="submit" form="create-project-form" disabled={createMutation.isPending}
                    className="btn-primary flex-1">
                    {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}
                    className="btn-secondary">إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteSlug !== null}
        title="حذف المشروع"
        message="هل أنت متأكد من حذف هذا المشروع؟"
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteSlug(null)}
      />
    </div>
  );
}
