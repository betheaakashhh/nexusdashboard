// src/hooks/useTasks.ts
import { create } from 'zustand';
import { Task } from '@/types';
import toast from 'react-hot-toast';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  query: string;
  setQuery: (q: string) => void;
  fetchTasks: (contactId?: string) => Promise<void>;
  addTask: (data: Partial<Task> & { dueTime?: string }) => Promise<Task | null>;
  toggleTask: (id: string, done: boolean) => Promise<void>;
  updateTask: (id: string, data: Partial<Task> & { dueTime?: string }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  query: '',

  setQuery: (query) => set({ query }),

  fetchTasks: async (contactId) => {
    set({ loading: true });
    const params = new URLSearchParams();
    if (contactId) params.set('contactId', contactId);
    const { query } = get();
    if (query) params.set('q', query);
    try {
      const res = await fetch(`/api/tasks?${params}`);
      const { tasks } = await res.json();
      set({ tasks, loading: false });
    } catch {
      toast.error('Failed to load tasks');
      set({ loading: false });
    }
  },

  addTask: async (data) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to add task'); return null; }
    const { task } = await res.json();
    set((s) => ({ tasks: [task, ...s.tasks] }));
    toast.success('Task added');
    return task;
  },

  toggleTask: async (id, done) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) { toast.error('Failed to update task'); return; }
    const { task } = await res.json();
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
  },

  updateTask: async (id, data) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to update task'); return; }
    const { task } = await res.json();
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
    toast.success('Task updated');
  },

  deleteTask: async (id) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete task'); return; }
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    toast.success('Task deleted');
  },
}));