import { create } from 'zustand';

interface QuickTaskState {
  open: boolean;
  initialTitle: string;
  initialAssignedTo: number | null;
  /** Open the quick-task modal, optionally pre-filling title/assignee (e.g. from a chat message). */
  openTask: (opts?: { title?: string; assignedTo?: number | null }) => void;
  close: () => void;
}

export const useQuickTaskStore = create<QuickTaskState>((set) => ({
  open: false,
  initialTitle: '',
  initialAssignedTo: null,
  openTask: (opts) =>
    set({
      open: true,
      initialTitle: opts?.title ?? '',
      initialAssignedTo: opts?.assignedTo ?? null,
    }),
  close: () => set({ open: false, initialTitle: '', initialAssignedTo: null }),
}));
