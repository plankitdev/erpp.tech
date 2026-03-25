import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTask, useUpdateTask, useAddComment } from '../hooks/useTasks';
import { useChecklists, useCreateChecklist, useUpdateChecklist, useDeleteChecklist } from '../hooks/useChecklists';
import { useRunningTimer, useStartTimer, useStopTimer } from '../hooks/useTimeEntries';
import { useUsersList } from '../hooks/useUsers';
import { tasksApi } from '../api/tasks';
import { formatDate, formatDateTime } from '../utils';
import type { Task, TaskStatus, TaskPriority, TaskChecklist } from '../types';
import StatusBadge from '../components/StatusBadge';
import FileDropZone from '../components/FileDropZone';
import { FileThumbnail, FilePreviewModal, isPreviewable, resolveFileUrl, getFileIconComponent, getFileIconColor } from '../components/FilePreview';
import toast from 'react-hot-toast';
import {
  ArrowRight, Paperclip, Send, Download, Clock, Calendar, User, FolderKanban,
  CheckSquare, Plus, Trash2, Timer, Play, Square, GripVertical, Pencil, X,
  Users as UsersIcon, Upload, Eye, Image, ZoomIn,
} from 'lucide-react';

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'جديد' },
  { value: 'in_progress', label: 'جاري التنفيذ' },
  { value: 'review', label: 'مراجعة' },
  { value: 'done', label: 'مكتمل' },
];

const priorityLabels: Record<TaskPriority, string> = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const { data: task, isLoading, refetch } = useTask(taskId);
  const { data: checklists = [] } = useChecklists(taskId);
  const { data: usersListData } = useUsersList();
  const allUsers = usersListData?.data || [];
  const updateTask = useUpdateTask();
  const addComment = useAddComment();
  const createChecklist = useCreateChecklist();
  const updateChecklist = useUpdateChecklist();
  const deleteChecklist = useDeleteChecklist();
  const { data: runningTimer } = useRunningTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', priority: 'medium' as string,
    start_date: '', due_date: '', assignee_ids: [] as number[],
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const isTimerRunning = runningTimer && runningTimer.task_id === taskId;

  useEffect(() => {
    if (!isTimerRunning || !runningTimer) return;
    const start = new Date(runningTimer.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, runningTimer]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
            <div className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
          </div>
          <div className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page-container">
        <div className="text-center py-20">
          <p className="text-gray-500">لم يتم العثور على المهمة</p>
          <Link to="/tasks/board" className="text-primary-600 hover:underline text-sm mt-2 inline-block">العودة للمهام</Link>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (status: string) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status } as Partial<Task> });
      toast.success('تم تحديث الحالة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const openEditModal = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      start_date: task.start_date?.slice(0, 10) || '',
      due_date: task.due_date?.slice(0, 10) || '',
      assignee_ids: task.assignees?.map(u => u.id) || (task.assigned_to ? [task.assigned_to.id] : []),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) { toast.error('العنوان مطلوب'); return; }
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: editForm.title,
          description: editForm.description || null,
          priority: editForm.priority as TaskPriority,
          start_date: editForm.start_date || null,
          due_date: editForm.due_date || null,
          assignee_ids: editForm.assignee_ids,
        } as Partial<Task>,
      });
      setShowEditModal(false);
      toast.success('تم تحديث المهمة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync({
        taskId: task.id,
        data: { comment, attachment: attachment || undefined },
      });
      setComment('');
      setAttachment(null);
      toast.success('تم إضافة التعليق');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    try {
      await createChecklist.mutateAsync({ taskId: task.id, title: newChecklistTitle });
      setNewChecklistTitle('');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleToggleChecklist = async (item: TaskChecklist) => {
    try {
      await updateChecklist.mutateAsync({
        taskId: task.id,
        id: item.id,
        data: { is_completed: !item.is_completed },
      });
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDeleteChecklist = async (itemId: number) => {
    try {
      await deleteChecklist.mutateAsync({ taskId: task.id, id: itemId });
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleTimerToggle = async () => {
    try {
      if (isTimerRunning && runningTimer) {
        await stopTimer.mutateAsync(runningTimer.id);
        toast.success('تم إيقاف المؤقت');
      } else {
        await startTimer.mutateAsync(task.id);
        toast.success('تم بدء المؤقت');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      for (const file of files) {
        await tasksApi.uploadFile(task.id, file);
      }
      refetch();
      toast.success(files.length > 1 ? `تم رفع ${files.length} ملفات` : 'تم رفع الملف');
    } catch {
      toast.error('حدث خطأ في رفع الملف');
    }
    e.target.value = '';
  };

  const handleFilesDrop = async (files: File[]) => {
    try {
      for (const file of files) {
        await tasksApi.uploadFile(task.id, file);
      }
      refetch();
      toast.success(files.length > 1 ? `تم رفع ${files.length} ملفات` : 'تم رفع الملف');
    } catch {
      toast.error('حدث خطأ في رفع الملف');
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      await tasksApi.deleteFile(task.id, fileId);
      refetch();
      toast.success('تم حذف الملف');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const completedChecklists = checklists.filter((c: TaskChecklist) => c.is_completed).length;
  const checklistProgress = checklists.length > 0 ? Math.round((completedChecklists / checklists.length) * 100) : 0;
  const comments = task.comments ?? [];

  return (
    <div className="page-container">
      {/* Back navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/tasks/board" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors text-sm">
          <ArrowRight size={16} />
          العودة للمهام
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description card */}
          <div className="card card-body">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
                  <StatusBadge status={task.priority} size="md" />
                </div>
                {task.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
                )}
              </div>
              <button onClick={openEditModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all border border-gray-200">
                <Pencil size={14} />
                تعديل
              </button>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    task.status === opt.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Card */}
          <div className="card card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTimerRunning ? 'bg-red-50 ring-1 ring-red-100' : 'bg-primary-50 ring-1 ring-primary-100'}`}>
                  <Timer size={18} className={isTimerRunning ? 'text-red-600' : 'text-primary-600'} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">تتبع الوقت</h3>
                  <p className="text-[11px] text-gray-400">سجل الوقت المستغرق في هذه المهمة</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isTimerRunning && (
                  <span className="text-2xl font-mono font-bold text-red-600 animate-pulse">
                    {formatElapsed(elapsed)}
                  </span>
                )}
                <button
                  onClick={handleTimerToggle}
                  disabled={startTimer.isPending || stopTimer.isPending}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isTimerRunning
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Square size={14} />
                      إيقاف
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      بدء المؤقت
                    </>
                  )}
                </button>
              </div>
            </div>
            {task.total_time != null && task.total_time > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  إجمالي الوقت المسجل: <span className="font-bold text-gray-800">{Math.floor(task.total_time / 60)}h {task.total_time % 60}m</span>
                </p>
              </div>
            )}
          </div>

          {/* Checklist Card */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
                  <CheckSquare size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">قائمة المهام</h3>
                  <p className="text-[11px] text-gray-400">{completedChecklists}/{checklists.length} مكتمل</p>
                </div>
              </div>
              {checklists.length > 0 && (
                <span className="text-xs font-bold text-primary-600">{checklistProgress}%</span>
              )}
            </div>

            {/* Progress bar */}
            {checklists.length > 0 && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-l from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            )}

            {/* Checklist items */}
            <div className="space-y-2 mb-4">
              {checklists.map((item: TaskChecklist) => (
                <div key={item.id} className="flex items-center gap-3 group py-1.5">
                  <button
                    onClick={() => handleToggleChecklist(item)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      item.is_completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {item.is_completed && <CheckSquare size={12} />}
                  </button>
                  <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.title}
                  </span>
                  <button
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new checklist item */}
            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="أضف عنصر جديد..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={!newChecklistTitle.trim() || createChecklist.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Files Card */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center ring-1 ring-violet-100">
                  <Image size={18} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">الملفات والصور</h3>
                  <p className="text-[11px] text-gray-400">{task.files?.length || 0} ملف</p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 bg-primary-600 text-white px-3 py-1.5 rounded-xl text-sm hover:bg-primary-700 transition-colors cursor-pointer shadow-sm">
                <Upload size={14} /> رفع ملفات
                <input type="file" className="hidden" onChange={handleFileUpload} multiple />
              </label>
            </div>

            {(!task.files || task.files.length === 0) ? (
              <FileDropZone onFileDrop={(f) => handleFilesDrop([f])} onFilesDrop={handleFilesDrop} multiple>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors">
                  <Upload size={36} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">اسحب الملفات هنا أو اضغط للرفع</p>
                </div>
              </FileDropZone>
            ) : (
              <FileDropZone onFileDrop={(f) => handleFilesDrop([f])} onFilesDrop={handleFilesDrop} multiple className="rounded-xl">
                {/* Image files - inline gallery */}
                {(() => {
                  const imageFiles = task.files.filter((f: any) => ['jpg','jpeg','png','gif','webp','svg','bmp'].includes((f.name?.split('.').pop() || '').toLowerCase()));
                  const otherFiles = task.files.filter((f: any) => !['jpg','jpeg','png','gif','webp','svg','bmp'].includes((f.name?.split('.').pop() || '').toLowerCase()));
                  return (
                    <>
                      {imageFiles.length > 0 && (
                        <div className={`grid gap-2 mb-3 ${imageFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                          {imageFiles.map((file: any) => (
                            <div key={file.id} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                              <img
                                src={resolveFileUrl(file.file_path)}
                                alt={file.name}
                                className={`w-full object-cover cursor-pointer ${imageFiles.length === 1 ? 'max-h-80' : 'h-40'}`}
                                loading="lazy"
                                onClick={() => setPreviewFile(file.id)}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                              <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file.id); }}
                                  className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-primary-600 shadow-sm">
                                  <ZoomIn size={14} />
                                </button>
                                <a href={resolveFileUrl(file.file_path)} download={file.name} onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-blue-600 shadow-sm">
                                  <Download size={14} />
                                </a>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                                  className="p-1.5 bg-white/90 rounded-lg text-gray-600 hover:text-red-600 shadow-sm">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent text-white text-[11px] px-2 py-1.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Non-image files - compact list */}
                      {otherFiles.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {otherFiles.map((file: any) => {
                            const canPreview = isPreviewable(file.name);
                            return (
                              <div key={file.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3">
                                  <FileThumbnail
                                    name={file.name}
                                    path={file.file_path}
                                    className="w-10 h-10 rounded-lg flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                      {file.uploaded_by?.name || '—'} · {file.created_at}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                                  {canPreview && (
                                    <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file.id); }}
                                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-primary-50 transition-all">
                                      <Eye size={12} /> معاينة
                                    </button>
                                  )}
                                  <a href={resolveFileUrl(file.file_path)} download={file.name} onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-all">
                                    <Download size={12} /> تحميل
                                  </a>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all mr-auto">
                                    <Trash2 size={12} /> حذف
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </FileDropZone>
            )}
          </div>

          {/* File Preview Modal */}
          {previewFile !== null && task.files && (() => {
            const previewableFiles = task.files.filter((f: any) => isPreviewable(f.name));
            const currentIdx = previewableFiles.findIndex((f: any) => f.id === previewFile);
            if (currentIdx === -1) return null;
            const currentFile = previewableFiles[currentIdx];
            return (
              <FilePreviewModal
                file={{ name: currentFile.name, path: currentFile.file_path }}
                files={previewableFiles.map((f: any) => ({ name: f.name, path: f.file_path }))}
                onClose={() => setPreviewFile(null)}
              />
            );
          })()}

          {/* Comments Card */}
          <div className="card card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center ring-1 ring-blue-100">
                <Send size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">التعليقات</h3>
                <p className="text-[11px] text-gray-400">{comments.length} تعليق</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">لا يوجد تعليقات بعد</p>
              ) : comments.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {c.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{c.user?.name}</span>
                    <span className="text-[11px] text-gray-400">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mr-9">{c.comment}</p>
                  {c.attachment && (
                    <a href={c.attachment} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary-600 text-xs mt-2 mr-9 hover:underline">
                      <Download size={12} /> تحميل المرفق
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleComment} className="border-t border-gray-100 pt-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input type="text" value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="اكتب تعليق..."
                    className="w-full px-4 py-2.5 pr-4 pl-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Paperclip size={16} />
                  </button>
                  <input ref={fileRef} type="file" className="hidden"
                    onChange={e => setAttachment(e.target.files?.[0] || null)} />
                </div>
                <button type="submit" disabled={addComment.isPending || !comment.trim()}
                  className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  <Send size={16} />
                </button>
              </div>
              {attachment && (
                <p className="text-xs text-gray-500 mt-2">📎 {attachment.name}</p>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="card card-body">
            <h3 className="font-bold text-gray-900 mb-4">التفاصيل</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400">المكلف</p>
                  <p className="text-sm font-medium text-gray-800">{task.assigned_to?.name || 'غير محدد'}</p>
                </div>
              </div>
              {task.assignees && task.assignees.length > 1 && (
                <div className="flex items-start gap-3">
                  <User size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-[11px] text-gray-400">المكلفين</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.assignees.map(u => (
                        <span key={u.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">{u.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400">أنشئت بواسطة</p>
                  <p className="text-sm font-medium text-gray-800">{task.created_by?.name || '—'}</p>
                </div>
              </div>
              {task.project && (
                <div className="flex items-center gap-3">
                  <FolderKanban size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400">المشروع</p>
                    <Link to={`/projects/${task.project.slug || task.project.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      {task.project.name}
                    </Link>
                  </div>
                </div>
              )}
              {task.client && (
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400">العميل</p>
                    <p className="text-sm font-medium text-gray-800">{task.client.name}</p>
                  </div>
                </div>
              )}
              <div className="h-px bg-gray-100" />
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400">تاريخ البداية</p>
                  <p className="text-sm font-medium text-gray-800">{task.start_date ? formatDate(task.start_date) : 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400">تاريخ التسليم</p>
                  <p className="text-sm font-medium text-gray-800">{task.due_date ? formatDate(task.due_date) : 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400">تاريخ الإنشاء</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(task.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="card card-body">
              <h3 className="font-bold text-gray-900 mb-3">المهام الفرعية</h3>
              <div className="space-y-2">
                {task.subtasks.map(sub => (
                  <Link key={sub.id} to={`/tasks/${sub.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700">{sub.title}</span>
                    <StatusBadge status={sub.status} size="sm" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowEditModal(false)} />
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                  <Pencil size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">تعديل المهمة</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">العنوان *</label>
                  <input type="text" value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="form-input" required />
                </div>
                <div>
                  <label className="form-label">الوصف</label>
                  <textarea value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    className="form-input" rows={3} />
                </div>
                <div>
                  <label className="form-label">الأولوية</label>
                  <select value={editForm.priority}
                    onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                    className="form-input">
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">تاريخ البداية</label>
                    <input type="date" value={editForm.start_date}
                      onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))}
                      className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">تاريخ التسليم</label>
                    <input type="date" value={editForm.due_date}
                      onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                      className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <UsersIcon size={14} /> المكلفين
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                    {allUsers.map((u: any) => (
                      <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.assignee_ids.includes(u.id)}
                          onChange={() => setEditForm(f => ({
                            ...f,
                            assignee_ids: f.assignee_ids.includes(u.id)
                              ? f.assignee_ids.filter(id => id !== u.id)
                              : [...f.assignee_ids, u.id],
                          }))}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{u.name}</span>
                        <span className="text-xs text-gray-400 mr-auto">{u.role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={updateTask.isPending} className="btn-primary">
                  {updateTask.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
