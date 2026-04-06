// src/hooks/useEmails.ts
import { create } from 'zustand';
import { Email, EmailTab } from '@/types';
import toast from 'react-hot-toast';

interface EmailsState {
  emails: Email[];
  selected: Email | null;
  loading: boolean;
  tab: EmailTab;
  query: string;

  setTab: (t: EmailTab) => void;
  setQuery: (q: string) => void;
  setSelected: (e: Email | null) => void;

  fetchEmails: () => Promise<void>;
  sendEmail: (data: { to: string; subject: string; body: string }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  importFile: (file: File) => Promise<void>;
}

export const useEmails = create<EmailsState>((set, get) => ({
  emails: [],
  selected: null,
  loading: false,
  tab: 'inbox',
  query: '',

  setTab: (tab) => { set({ tab, selected: null }); get().fetchEmails(); },
  setQuery: (query) => set({ query }),
  setSelected: (selected) => set({ selected }),

  fetchEmails: async () => {
    set({ loading: true });
    const { tab, query } = get();
    const params = new URLSearchParams({ tab });
    if (query) params.set('q', query);
    try {
      const res = await fetch(`/api/emails?${params}`);
      const { emails } = await res.json();
      set({ emails, loading: false });
    } catch {
      toast.error('Failed to load emails');
      set({ loading: false });
    }
  },

  sendEmail: async ({ to, subject, body }) => {
    const res = await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'Me',
        senderEmail: to,
        subject,
        body,
        tab: 'sent',
        sentAt: new Date().toLocaleTimeString(),
      }),
    });
    if (!res.ok) { toast.error('Failed to send email'); return; }
    toast.success('Email sent');
    if (get().tab === 'sent') get().fetchEmails();
  },

  markRead: async (id) => {
    await fetch(`/api/emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unread: false }),
    });
    set((s) => ({
      emails: s.emails.map((e) => (e.id === id ? { ...e, unread: false } : e)),
    }));
  },

  toggleStar: async (id) => {
    const email = get().emails.find((e) => e.id === id);
    if (!email) return;
    const starred = !email.starred;
    await fetch(`/api/emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred }),
    });
    set((s) => ({
      emails: s.emails.map((e) => (e.id === id ? { ...e, starred } : e)),
      selected: s.selected?.id === id ? { ...s.selected, starred } : s.selected,
    }));
  },

  deleteEmail: async (id) => {
    const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete email'); return; }
    set((s) => ({
      emails: s.emails.filter((e) => e.id !== id),
      selected: s.selected?.id === id ? null : s.selected,
    }));
    toast.success('Email deleted');
  },

  importFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/emails/import', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Import failed'); return; }
    toast.success(`Imported ${data.imported} emails`);
    get().fetchEmails();
  },
}));
