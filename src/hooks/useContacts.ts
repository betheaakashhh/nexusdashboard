// src/hooks/useContacts.ts
import { create } from 'zustand';
import { Contact, ContactTag, SortOption } from '@/types';
import toast from 'react-hot-toast';

interface ContactsState {
  contacts: Contact[];
  selected: Contact | null;
  loading: boolean;
  filter: ContactTag;
  sort: SortOption;
  alpha: string | null;
  query: string;

  setFilter: (f: ContactTag) => void;
  setSort: (s: SortOption) => void;
  setAlpha: (a: string | null) => void;
  setQuery: (q: string) => void;
  setSelected: (c: Contact | null) => void;

  fetchContacts: () => Promise<void>;
  addContact: (data: Partial<Contact>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  importFile: (file: File) => Promise<void>;
}

export const useContacts = create<ContactsState>((set, get) => ({
  contacts: [],
  selected: null,
  loading: false,
  filter: 'all',
  sort: 'recent',
  alpha: null,
  query: '',

  setFilter: (filter) => { set({ filter }); get().fetchContacts(); },
  setSort:   (sort)   => { set({ sort });   get().fetchContacts(); },
  setAlpha:  (alpha)  => set({ alpha }),
  setQuery:  (query)  => set({ query }),
  setSelected: (selected) => set({ selected }),

  fetchContacts: async () => {
    set({ loading: true });
    const { filter, sort, query } = get();
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.set('tag', filter);
    if (sort) params.set('sort', sort);
    if (query) params.set('q', query);

    try {
      const res = await fetch(`/api/contacts?${params}`);
      const { contacts } = await res.json();
      set({ contacts, loading: false });
    } catch {
      toast.error('Failed to load contacts');
      set({ loading: false });
    }
  },

  addContact: async (data) => {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to add contact'); return; }
    const { contact } = await res.json();
    set((s) => ({ contacts: [contact, ...s.contacts] }));
    toast.success('Contact added');
  },

  updateContact: async (id, data) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to update contact'); return; }
    const { contact } = await res.json();
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? contact : c)),
      selected: s.selected?.id === id ? contact : s.selected,
    }));
    toast.success('Contact updated');
  },

  deleteContact: async (id) => {
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete contact'); return; }
    set((s) => ({
      contacts: s.contacts.filter((c) => c.id !== id),
      selected: s.selected?.id === id ? null : s.selected,
    }));
    toast.success('Contact deleted');
  },

  importFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/contacts/import', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Import failed'); return; }
    toast.success(`Imported ${data.imported} contacts`);
    get().fetchContacts();
  },
}));
