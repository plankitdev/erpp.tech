import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMarkBadgeSeen } from '../hooks/useDashboard';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { epicsApi } from '../api/epics';
import { usersApi } from '../api/users';
import { useUpdateTask } from '../hooks/useTasks';
import { useAuthStore } from '../store/authStore';
import KanbanBoard from '../components/KanbanBoard';
import TaskFilterBar, { applyTaskFilters, defaultTaskFilter, type TaskFilterState } from '../components/TaskFilterBar';
import type { Task, Project, Epic, TaskStatus } from '../types';
import toast from 'react-hot-toast';
import { SkeletonKanban } from '../components/Skeletons';

type UserLite = { id: number; name: string; role?: string };

interface Props {
  scopeMine?: boolean;
  defaultGroupBy?: TaskFilterState['groupBy'];
  heading?: string;
}

export default function TaskBoard({ scopeMine = false, defaultGroupBy = 'none', heading = 'لوحة المهام' }: Props) {
  useMarkBadgeSeen('tasks');
  const meId = useAuthStore(s => s.user?.id);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilterState>({
    ...defaultTaskFilter,
    assignee: scopeMine ? 'me' : 'all',
    groupBy: defaultGroupBy,
  });
  const updateMutation = useUpdateTask();

  useEffect(() => {
    Promise.all([
      tasksApi.getAll({ per_page: 300 }),
      projectsApi.getAll({ per_page: 100 }),
      epicsApi.getAll(),
      usersApi.getList(),
    ]).then(([tasksRes, projectsRes, epicsRes, usersRes]) => {
      setAllTasks(tasksRes.data.data as Task[]);
      setProjects(projectsRes.data.data as Project[]);
      setEpics(epicsRes.data.data as Epic[]);
      setUsers((usersRes.data.data || []) as UserLite[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(
    () => applyTaskFilters(allTasks, filter, meId),
    [allTasks, filter, meId],
  );

  const onTaskMove = async (taskId: number, newStatus: TaskStatus) => {
    setAllTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateMutation.mutateAsync({ id: taskId, data: { status: newStatus } as Partial<Task> });
    } catch {
      toast.error('حدث خطأ في تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div className="skeleton-shimmer h-7 w-36 rounded animate-pulse" />
          <div className="skeleton-shimmer h-10 w-40 rounded-xl animate-pulse" />
        </div>
        <SkeletonKanban columns={4} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">{heading}</h1>
          <Link to="/tasks" className="text-primary-600 hover:text-primary-800 text-sm">&larr; عرض القائمة</Link>
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">{filteredTasks.length} مهمة</div>
      </div>

      <div className="mb-5">
        <TaskFilterBar
          value={filter}
          onChange={setFilter}
          scope="tasks"
          projects={projects}
          epics={epics}
          users={users}
          showAssignee={!scopeMine}
        />
      </div>

      <KanbanBoard tasks={filteredTasks} groupBy={filter.groupBy} onTaskMove={onTaskMove} />
    </div>
  );
}
