import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { formatDate } from '../utils';
import { CheckSquare, Clock, User, AlertCircle } from 'lucide-react';

const columns = [
  { id: 'todo', title: 'جديد', color: 'bg-gray-100', dot: 'bg-gray-400' },
  { id: 'in_progress', title: 'جاري التنفيذ', color: 'bg-blue-50', dot: 'bg-blue-500' },
  { id: 'review', title: 'مراجعة', color: 'bg-purple-50', dot: 'bg-purple-500' },
  { id: 'done', title: 'مكتمل', color: 'bg-emerald-50', dot: 'bg-emerald-500' },
] as const;

const priorityConfig: Record<string, { border: string; badge: string; label: string }> = {
  high: { border: 'border-r-red-500', badge: 'bg-red-50 text-red-600', label: 'عالية' },
  medium: { border: 'border-r-amber-400', badge: 'bg-amber-50 text-amber-600', label: 'متوسطة' },
  low: { border: 'border-r-emerald-500', badge: 'bg-emerald-50 text-emerald-600', label: 'منخفضة' },
};

function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

interface ProjectKanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: number, newStatus: string) => Promise<void>;
}

export default function ProjectKanbanBoard({ tasks, onStatusChange }: ProjectKanbanBoardProps) {
  const navigate = useNavigate();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Sync with props
  useEffect(() => {
    setLocalTasks(tasks.filter(t => !t.parent_id)); // Only show main tasks in board
  }, [tasks]);

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = { todo: [], in_progress: [], review: [], done: [] };
    localTasks.forEach(task => {
      if (g[task.status]) g[task.status].push(task);
    });
    Object.keys(g).forEach(key => { g[key] = sortByDeadline(g[key]); });
    return g;
  }, [localTasks]);

  const today = new Date().toISOString().split('T')[0];

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic update
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

    // API call
    try {
      await onStatusChange(taskId, newStatus);
    } catch {
      // Revert on error
      setLocalTasks(tasks.filter(t => !t.parent_id));
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[280px] w-[280px] flex-shrink-0 snap-start flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100">
            {/* Column Header */}
            <div className={`px-4 py-3 border-b border-gray-100 rounded-t-2xl flex items-center justify-between ${col.color}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${col.dot}`} />
                <span className="font-bold text-gray-700">{col.title}</span>
              </div>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-gray-500 shadow-sm border border-gray-100">
                {grouped[col.id].length}
              </span>
            </div>

            {/* Column Body */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-3 min-h-[400px] transition-colors rounded-b-2xl ${snapshot.isDraggingOver ? 'bg-primary-50/50' : ''}`}
                >
                  <div className="space-y-3">
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
                              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-r-4 cursor-pointer hover:shadow-md transition-all
                                ${pc.border} 
                                ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-200 rotate-2' : ''} 
                                ${isOverdue ? 'ring-1 ring-red-200 bg-red-50/30' : ''}`}
                            >
                              {/* Tags */}
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${pc.badge}`}>
                                  {pc.label}
                                </span>
                                {isOverdue && (
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-100 text-red-600">
                                    متأخرة
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className="font-semibold text-gray-800 text-sm leading-snug mb-3">
                                {task.title}
                              </h4>

                              {/* Progress & Stats */}
                              <div className="flex items-center gap-3 mb-3">
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                    <CheckSquare size={12} />
                                    <span>{task.subtasks.filter((s: any) => s.status === 'done').length}/{task.subtasks.length}</span>
                                  </div>
                                )}
                                {task.total_time !== undefined && task.total_time > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                    <Clock size={12} />
                                    <span>{Math.floor(task.total_time / 60)}h</span>
                                  </div>
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                {task.assigned_to ? (
                                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                    <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                                      <User size={10} />
                                    </div>
                                    {task.assigned_to.name.split(' ')[0]}
                                  </span>
                                ) : <span />}
                                
                                {task.due_date && (
                                  <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                    {isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                                    {formatDate(task.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
