import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Link, useNavigate } from 'react-router-dom';
import { useMarkBadgeSeen } from '../hooks/useDashboard';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { useUpdateTask } from '../hooks/useTasks';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import type { Task, Project } from '../types';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import { CheckSquare, Clock, FolderKanban, User, AlertCircle, Filter } from 'lucide-react';

const columns = [
  { id: 'todo', title: 'جديد', color: 'bg-gray-200', dot: 'bg-gray-400' },
  { id: 'in_progress', title: 'جاري التنفيذ', color: 'bg-blue-200', dot: 'bg-blue-500' },
  { id: 'review', title: 'مراجعة', color: 'bg-purple-200', dot: 'bg-purple-500' },
  { id: 'done', title: 'مكتمل', color: 'bg-green-200', dot: 'bg-emerald-500' },
] as const;

const priorityConfig: Record<string, { border: string; badge: string; label: string }> = {
  high: { border: 'border-r-red-500', badge: 'bg-red-50 text-red-600', label: 'عالية' },
  medium: { border: 'border-r-amber-400', badge: 'bg-amber-50 text-amber-600', label: 'متوسطة' },
  low: { border: 'border-r-emerald-500', badge: 'bg-emerald-50 text-emerald-600', label: 'منخفضة' },
};

type GroupedTasks = Record<string, Task[]>;

function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

export default function TaskBoard() {
  useMarkBadgeSeen('tasks');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const updateMutation = useUpdateTask();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      tasksApi.getAll({ per_page: 1000 }),
      projectsApi.getAll({ per_page: 1000 }),
    ]).then(([tasksRes, projectsRes]) => {
      setAllTasks(tasksRes.data.data as Task[]);
      setProjects(projectsRes.data.data as Project[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    if (projectFilter === 'all') return allTasks;
    if (projectFilter === 'none') return allTasks.filter(t => !t.project_id);
    return allTasks.filter(t => String(t.project_id) === projectFilter);
  }, [allTasks, projectFilter]);

  const grouped = useMemo(() => {
    const g: GroupedTasks = { todo: [], in_progress: [], review: [], done: [] };
    filteredTasks.forEach(task => {
      if (g[task.status]) g[task.status].push(task);
    });
    // Sort each column by deadline
    Object.keys(g).forEach(key => { g[key] = sortByDeadline(g[key]); });
    return g;
  }, [filteredTasks]);

  const today = new Date().toISOString().split('T')[0];

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const updated = allTasks.map(t => {
      if (String(t.id) === result.draggableId) {
        return { ...t, status: destination.droppableId as Task['status'] };
      }
      return t;
    });
    setAllTasks(updated);

    const movedId = parseInt(result.draggableId);
    try {
      await updateMutation.mutateAsync({ id: movedId, data: { status: destination.droppableId } as any });
    } catch {
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">لوحة المهام</h1>
          <Link to="/tasks" className="text-primary-600 hover:text-primary-800 text-sm">&larr; عرض القائمة</Link>
        </div>
        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Filter size={14} className="text-gray-400" />
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
              className="text-sm bg-transparent border-0 focus:ring-0 text-gray-700 pr-6">
              <option value="all">كل المشاريع</option>
              <option value="none">بدون مشروع</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {/* Task count summary */}
          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            {filteredTasks.length} مهمة
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.id}>
              <div className={`${col.color} rounded-t-xl px-4 py-2.5 font-semibold text-gray-700 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span>{col.title}</span>
                </div>
                <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-bold">{grouped[col.id].length}</span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-2 space-y-2 rounded-b-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50' : 'bg-gray-50'}`}
                  >
                    {grouped[col.id].map((task, index) => {
                      const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
                      const pc = priorityConfig[task.priority] || priorityConfig.medium;
                      return (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className={`bg-white rounded-xl p-3 shadow-sm border-r-4 cursor-pointer hover:shadow-md transition-all ${pc.border} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-200' : ''} ${isOverdue ? 'ring-1 ring-red-200' : ''}`}
                            >
                              {/* Project tag + Priority */}
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                {task.project && (
                                  <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                    <FolderKanban size={10} />{task.project.name}
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pc.badge}`}>{pc.label}</span>
                              </div>

                              {/* Title */}
                              <h4 className="font-semibold text-gray-800 text-sm leading-snug">{task.title}</h4>

                              {/* Progress indicators */}
                              <div className="flex items-center gap-3 mt-2">
                                {task.checklist_progress !== undefined && task.checklist_progress !== null && typeof task.checklist_progress === 'object' && (task.checklist_progress as any).total > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <CheckSquare size={11} />
                                    <span>{Math.round(((task.checklist_progress as any).completed / (task.checklist_progress as any).total) * 100)}%</span>
                                  </div>
                                )}
                                {task.total_time !== undefined && task.total_time > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock size={11} />
                                    <span>{Math.floor(task.total_time / 60)}h {task.total_time % 60}m</span>
                                  </div>
                                )}
                              </div>

                              {/* Footer: assignee + due date */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                {task.assigned_to ? (
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <User size={11} />{task.assigned_to.name}
                                  </span>
                                ) : <span />}
                                {task.due_date && (
                                  <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                    {isOverdue && <AlertCircle size={11} />}
                                    {formatDate(task.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTaskId && (
        <TaskDetailDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
