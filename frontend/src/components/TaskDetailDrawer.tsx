import { useState, useRef } from 'react';
import { useTask, useUpdateTask, useAddComment } from '../hooks/useTasks';
import { formatDate, formatDateTime } from '../utils';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { X, Paperclip, Send, Download, Eye, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { InlinePreview, resolveFileUrl, isPreviewable, getFileIconComponent, FileThumbnail, FilePreviewModal } from './FilePreview';

const statusLabels: Record<TaskStatus, string> = { todo: 'جديد', in_progress: 'جاري التنفيذ', review: 'مراجعة', done: 'مكتمل' };
const priorityLabels: Record<TaskPriority, string> = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
const priorityColors: Record<TaskPriority, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };

interface Props {
  taskId: number;
  onClose: () => void;
}

export default function TaskDetailDrawer({ taskId, onClose }: Props) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const addComment = useAddComment();

  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white shadow-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const handleStatusChange = async (status: string) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status } as Partial<Task> });
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

  const comments = task.comments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">تفاصيل المهمة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Priority */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
            </div>
            {task.description && <p className="text-gray-600 text-sm">{task.description}</p>}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">الحالة</p>
              <select value={task.status} onChange={e => handleStatusChange(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
                <option value="todo">جديد</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="review">مراجعة</option>
                <option value="done">مكتمل</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500">الأولوية</p>
              <p className="mt-1 font-medium">{priorityLabels[task.priority]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">المكلف</p>
              <p className="mt-1 font-medium">{task.assigned_to?.name || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">المنشئ</p>
              <p className="mt-1 font-medium">{task.created_by?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">العميل</p>
              <p className="mt-1 font-medium">{task.client?.name || 'بدون عميل'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">تاريخ التسليم</p>
              <p className="mt-1 font-medium">{task.due_date ? formatDate(task.due_date) : 'غير محدد'}</p>
            </div>
          </div>

          {/* Files */}
          {task.files && task.files.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Image size={16} className="text-violet-500" />
                الملفات ({task.files.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {task.files.map((file: any) => (
                  <div key={file.id} className="relative group">
                    <FileThumbnail name={file.name} path={file.file_path} className="w-full h-20 rounded-lg" />
                    {isPreviewable(file.name) && (
                      <button
                        onClick={() => setPreviewFile(file.id)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Eye size={16} className="text-white" />
                      </button>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Comments */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">التعليقات ({comments.length})</h4>
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد تعليقات بعد</p>
              ) : comments.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{c.user?.name}</span>
                    <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.comment}</p>
                  {c.attachment && (
                    <div className="mt-2">
                      {isPreviewable(c.attachment) ? (
                        <InlinePreview name={c.attachment.split('/').pop() || 'file'} path={c.attachment} className="w-32 h-24 rounded-lg" />
                      ) : (
                        <a href={resolveFileUrl(c.attachment)} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 text-xs hover:underline">
                          <Download size={12} /> تحميل المرفق
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleComment} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input type="text" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="اكتب تعليق..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Paperclip size={16} />
              </button>
              <input ref={fileRef} type="file" className="hidden"
                onChange={e => setAttachment(e.target.files?.[0] || null)} />
            </div>
            <button type="submit" disabled={addComment.isPending || !comment.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
          {attachment && (
            <p className="text-xs text-gray-500 mt-1">📎 {attachment.name}</p>
          )}
        </form>
      </div>
    </div>
  );
}
