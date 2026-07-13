import TaskBoard from './TaskBoard';

/**
 * Unified "My Tasks" — every task assigned to the current user across all
 * projects, in one board (grouped by project by default). Reuses the shared
 * board scoped to the signed-in user.
 */
export default function MyTasks() {
  return <TaskBoard scopeMine defaultGroupBy="project" heading="مهامي" />;
}
