import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { CheckSquare, Clock, FolderKanban, User, AlertCircle, Layers } from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { formatDate } from '../utils';

export type GroupBy = 'none' | 'assignee' | 'epic' | 'priority' | 'project';

export const columns = [
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

interface Swimlane {
  key: string;
  label: string;
  color?: string;
}

function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

/**
 * Derive the swimlanes present in the current task set for a given grouping.
 * Lanes are built from the data itself, so we never render an empty lane.
 */
function buildSwimlanes(tasks: Task[], groupBy: GroupBy): Swimlane[] {
  if (groupBy === 'none') return [{ key: 'all', label: '' }];

  if (groupBy === 'priority') {
    const order = ['high', 'medium', 'low'];
    return order
      .filter(p => tasks.some(t => t.priority === p))
      .map(p => ({ key: p, label: priorityConfig[p]?.label ?? p }));
  }

  const map = new Map<string, Swimlane>();
  for (const t of tasks) {
    let key = 'none';
    let label = '';
    let color: string | undefined;
    if (groupBy === 'assignee') {
      key = t.assigned_to ? String(t.assigned_to.id) : 'none';
      label = t.assigned_to?.name ?? 'غير مكلّف';
    } else if (groupBy === 'epic') {
      key = t.epic_id ? String(t.epic_id) : 'none';
      label = t.epic?.title ?? 'بدون ملحمة';
      color = t.epic?.color;
    } else if (groupBy === 'project') {
      key = t.project_id ? String(t.project_id) : 'none';
      label = t.project?.name ?? 'بدون مشروع';
    }
    if (!map.has(key)) map.set(key, { key, label, color });
  }

  const lanes = [...map.values()];
  lanes.sort((a, b) => {
    if (a.key === 'none') return 1;
    if (b.key === 'none') return -1;
    return a.label.localeCompare(b.label, 'ar');
  });
  return lanes;
}

function laneKeyOf(task: Task, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'assignee': return task.assigned_to ? String(task.assigned_to.id) : 'none';
    case 'epic': return task.epic_id ? String(task.epic_id) : 'none';
    case 'project': return task.project_id ? String(task.project_id) : 'none';
    case 'priority': return task.priority;
    default: return 'all';
  }
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
  const pc = priorityConfig[task.priority] || priorityConfig.medium;
  const progress = task.checklist_progress as { total: number; completed: number } | undefined;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 shadow-sm border-r-4 cursor-pointer hover:shadow-md transition-all ${pc.border} ${isOverdue ? 'ring-1 ring-red-200' : ''}`}
    >
      {/* Key + project + priority */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        {task.task_key && (
          <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{task.task_key}</span>
        )}
        {task.project && (
          <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
            <FolderKanban size={10} />{task.project.name}
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pc.badge}`}>{pc.label}</span>
      </div>

      {task.epic && (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium mb-1"
          style={{ backgroundColor: `${task.epic.color}1a`, color: task.epic.color }}
        >
          <Layers size={10} />{task.epic.title}
        </span>
      )}

      <h4 className="font-semibold text-gray-800 text-sm leading-snug">{task.title}</h4>

      <div className="flex items-center gap-3 mt-2">
        {progress && progress.total > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <CheckSquare size={11} />
            <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
          </div>
        )}
        {task.total_time !== undefined && task.total_time > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            <span>{Math.floor(task.total_time / 60)}h {task.total_time % 60}m</span>
          </div>
        )}
      </div>

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
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  groupBy?: GroupBy;
  onTaskMove: (taskId: number, newStatus: TaskStatus) => void;
  onCardClick?: (taskId: number) => void;
}

/**
 * Reusable Jira-style board. Renders a single row of status columns, or —
 * when `groupBy` is set — horizontal swimlanes, each with its own status columns.
 * Dragging only ever changes a card's status (the swimlane is derived from data),
 * keeping the interaction predictable across every grouping.
 */
export default function KanbanBoard({ tasks, groupBy = 'none', onTaskMove, onCardClick }: KanbanBoardProps) {
  const navigate = useNavigate();
  const handleClick = onCardClick ?? ((id: number) => navigate(`/tasks/${id}`));

  const lanes = useMemo(() => buildSwimlanes(tasks, groupBy), [tasks, groupBy]);

  // laneKey -> status -> tasks
  const grouped = useMemo(() => {
    const g: Record<string, Record<string, Task[]>> = {};
    for (const lane of lanes) {
      g[lane.key] = { todo: [], in_progress: [], review: [], done: [] };
    }
    for (const t of tasks) {
      const lk = laneKeyOf(t, groupBy);
      if (!g[lk]) g[lk] = { todo: [], in_progress: [], review: [], done: [] };
      if (g[lk][t.status]) g[lk][t.status].push(t);
    }
    for (const lk of Object.keys(g)) {
      for (const s of Object.keys(g[lk])) g[lk][s] = sortByDeadline(g[lk][s]);
    }
    return g;
  }, [tasks, lanes, groupBy]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const status = result.destination.droppableId.split('::')[1] as TaskStatus;
    const id = parseInt(result.draggableId, 10);
    onTaskMove(id, status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        {lanes.map(lane => (
          <div key={lane.key}>
            {groupBy !== 'none' && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lane.color || '#94a3b8' }}
                />
                <h3 className="text-sm font-bold text-gray-700">{lane.label}</h3>
                <span className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {columns.reduce((n, c) => n + (grouped[lane.key]?.[c.id]?.length ?? 0), 0)}
                </span>
              </div>
            )}
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
              {columns.map(col => {
                const colTasks = grouped[lane.key]?.[col.id] ?? [];
                const droppableId = `${lane.key}::${col.id}`;
                return (
                  <div key={col.id} className="min-w-[260px] flex-shrink-0 md:min-w-0 snap-start">
                    <div className={`${col.color} rounded-t-xl px-4 py-2.5 font-semibold text-gray-700 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span>{col.title}</span>
                      </div>
                      <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-bold">{colTasks.length}</span>
                    </div>
                    <Droppable droppableId={droppableId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[120px] p-2 space-y-2 rounded-b-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50' : 'bg-gray-50'} ${groupBy === 'none' ? 'min-h-[400px]' : ''}`}
                        >
                          {colTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={snap.isDragging ? 'ring-2 ring-primary-200 rounded-xl' : ''}
                                >
                                  <TaskCard task={task} onClick={() => handleClick(task.id)} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
