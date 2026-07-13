import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  ArrowRight, Plus, Layers, Pencil, Trash2, X, GripVertical, ChevronDown, ChevronLeft, ListChecks,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProject } from '../hooks/useProjects';
import { useEpics, useCreateEpic, useUpdateEpic, useDeleteEpic } from '../hooks/useEpics';
import { tasksApi } from '../api/tasks';
import { useAuthStore } from '../store/authStore';
import ProjectTabs from '../components/ProjectTabs';
import StatusBadge from '../components/StatusBadge';
import type { Task, Epic } from '../types';

const EPIC_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const NO_EPIC = 'none';

const canManageEpics = (role?: string) =>
  ['super_admin', 'company_admin', 'manager', 'marketing_manager'].includes(role || '');

function byOrder(a: Task, b: Task) {
  return (a.board_order ?? 0) - (b.board_order ?? 0) || a.id - b.id;
}

export default function Backlog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore(s => s.user?.role);
  const manage = canManageEpics(role);

  const { data: project } = useProject(slug || '');
  const projectId = project?.id;
  const { data: epics = [] } = useEpics(projectId ? { project_id: projectId } : undefined);
  const createEpic = useCreateEpic();
  const updateEpic = useUpdateEpic();
  const deleteEpic = useDeleteEpic();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [epicModal, setEpicModal] = useState<{ open: boolean; edit?: Epic } | null>(null);
  const [epicForm, setEpicForm] = useState({ title: '', description: '', color: EPIC_COLORS[0] });

  useEffect(() => {
    if (!projectId) return;
    tasksApi.getAll({ project_id: projectId, parent_only: 1, per_page: 300 })
      .then(r => setTasks((r.data.data as Task[]).slice().sort(byOrder)));
  }, [projectId]);

  // group id ('none' | epicId) -> ordered tasks
  const groups = useMemo(() => {
    const g: Record<string, Task[]> = { [NO_EPIC]: [] };
    epics.forEach(e => { g[String(e.id)] = []; });
    tasks.forEach(t => {
      const ek = t.epic_id ? String(t.epic_id) : NO_EPIC;
      const k = g[ek] ? ek : NO_EPIC; // fall back if the epic is no longer present
      g[k].push(t);
    });
    Object.keys(g).forEach(k => g[k].sort(byOrder));
    return g;
  }, [tasks, epics]);

  const orderedGroupKeys = [...epics.map(e => String(e.id)), NO_EPIC];

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = Number(draggableId);
    const destKey = destination.droppableId;
    const destEpicId = destKey === NO_EPIC ? null : Number(destKey);

    const moved = tasks.find(t => t.id === taskId);
    if (!moved) return;
    const epicChanged = (moved.epic_id ?? null) !== destEpicId;

    // Rebuild the affected groups locally.
    const srcList = groups[source.droppableId].filter(t => t.id !== taskId);
    const destList = source.droppableId === destKey ? srcList : groups[destKey].slice();
    destList.splice(destination.index, 0, { ...moved, epic_id: destEpicId });

    const nextById = new Map<number, Task>();
    destList.forEach((t, i) => nextById.set(t.id, { ...t, board_order: i, epic_id: destEpicId }));
    if (source.droppableId !== destKey) {
      srcList.forEach((t, i) => nextById.set(t.id, { ...t, board_order: i }));
    }
    setTasks(prev => prev.map(t => nextById.get(t.id) ?? t));

    try {
      if (epicChanged) await tasksApi.update(taskId, { epic_id: destEpicId } as Partial<Task>);
      await tasksApi.reorder(destList.map(t => t.id));
      if (source.droppableId !== destKey) await tasksApi.reorder(srcList.map(t => t.id));
    } catch {
      toast.error('تعذّر حفظ الترتيب');
    }
  };

  const openCreate = () => {
    setEpicForm({ title: '', description: '', color: EPIC_COLORS[0] });
    setEpicModal({ open: true });
  };
  const openEdit = (e: Epic) => {
    setEpicForm({ title: e.title, description: e.description || '', color: e.color });
    setEpicModal({ open: true, edit: e });
  };

  const submitEpic = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!epicForm.title.trim() || !projectId) return;
    try {
      if (epicModal?.edit) {
        await updateEpic.mutateAsync({ id: epicModal.edit.id, data: epicForm });
        toast.success('تم تحديث الملحمة');
      } else {
        await createEpic.mutateAsync({ project_id: projectId, ...epicForm });
        toast.success('تم إنشاء الملحمة');
      }
      setEpicModal(null);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const removeEpic = async (e: Epic) => {
    if (!confirm(`حذف الملحمة "${e.title}"؟ ستبقى مهامها كمهام بدون ملحمة.`)) return;
    try {
      await deleteEpic.mutateAsync(e.id);
      setTasks(prev => prev.map(t => (t.epic_id === e.id ? { ...t, epic_id: null } : t)));
      toast.success('تم حذف الملحمة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const groupMeta = (key: string): { title: string; color: string } =>
    key === NO_EPIC
      ? { title: 'بدون ملحمة', color: '#94a3b8' }
      : (() => {
          const e = epics.find(ep => String(ep.id) === key);
          return { title: e?.title || 'ملحمة', color: e?.color || '#6366f1' };
        })();

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/projects" className="action-icon text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
        <h1 className="page-title flex items-center gap-2">
          <ListChecks size={22} className="text-primary-600" />
          {project?.name || 'المشروع'} — الباكلوج
        </h1>
      </div>

      {slug && <ProjectTabs slug={slug} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Backlog list */}
        <div className="lg:col-span-3">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-4">
              {orderedGroupKeys.map(key => {
                const meta = groupMeta(key);
                const list = groups[key] || [];
                const isCollapsed = collapsed[key];
                const done = list.filter(t => t.status === 'done').length;
                return (
                  <div key={key} className="card overflow-hidden">
                    <button
                      onClick={() => setCollapsed(c => ({ ...c, [key]: !c[key] }))}
                      className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-right"
                    >
                      {isCollapsed ? <ChevronLeft size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                      <span className="font-bold text-gray-800 dark:text-gray-100">{meta.title}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 rounded-full px-2 py-0.5">
                        {done}/{list.length}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <Droppable droppableId={key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 min-h-[56px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50/50 dark:bg-slate-800/50' : ''}`}
                          >
                            {list.length === 0 && (
                              <p className="text-center text-xs text-gray-400 py-4">اسحب المهام هنا</p>
                            )}
                            {list.map((task, index) => (
                              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    className={`flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-3 py-2 mb-1.5 ${snap.isDragging ? 'shadow-lg ring-2 ring-primary-200' : 'hover:border-primary-200'}`}
                                  >
                                    <span {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab">
                                      <GripVertical size={15} />
                                    </span>
                                    {task.task_key && (
                                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                        {task.task_key}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => navigate(`/tasks/${task.id}`)}
                                      className="flex-1 text-right text-sm text-gray-800 dark:text-gray-100 hover:text-primary-600 truncate"
                                    >
                                      {task.title}
                                    </button>
                                    {task.assigned_to && (
                                      <span className="text-[11px] text-gray-400 hidden sm:inline">{task.assigned_to.name}</span>
                                    )}
                                    <StatusBadge status={task.status} size="sm" />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {/* Epics panel */}
        <div className="space-y-3">
          <div className="card card-body">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Layers size={16} className="text-primary-600" /> الملاحم
              </h3>
              {manage && (
                <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1 px-2.5 py-1.5">
                  <Plus size={13} /> ملحمة
                </button>
              )}
            </div>

            {epics.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">لا توجد ملاحم بعد. أنشئ ملحمة لتجميع المهام المتعلقة.</p>
            ) : (
              <div className="space-y-2">
                {epics.map(e => (
                  <div key={e.id} className="group border border-gray-100 dark:border-slate-700 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1 truncate">{e.title}</span>
                      {manage && (
                        <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(e)} className="text-gray-300 hover:text-amber-500"><Pencil size={13} /></button>
                          <button onClick={() => removeEpic(e)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${e.progress}%`, backgroundColor: e.color }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{e.completed_tasks_count}/{e.tasks_count} مكتمل · {e.progress}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Epic modal */}
      {epicModal?.open && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setEpicModal(null)} />
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white">
                  <Layers size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{epicModal.edit ? 'تعديل الملحمة' : 'ملحمة جديدة'}</h2>
              </div>
              <button onClick={() => setEpicModal(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <form onSubmit={submitEpic}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">العنوان *</label>
                  <input value={epicForm.title} onChange={e => setEpicForm(f => ({ ...f, title: e.target.value }))} className="form-input" required autoFocus />
                </div>
                <div>
                  <label className="form-label">الوصف</label>
                  <textarea value={epicForm.description} onChange={e => setEpicForm(f => ({ ...f, description: e.target.value }))} className="form-input" rows={2} />
                </div>
                <div>
                  <label className="form-label">اللون</label>
                  <div className="flex flex-wrap gap-2">
                    {EPIC_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEpicForm(f => ({ ...f, color: c }))}
                        className={`w-7 h-7 rounded-full transition-transform ${epicForm.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEpicModal(null)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={createEpic.isPending || updateEpic.isPending} className="btn-primary">
                  {epicModal.edit ? 'حفظ' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
