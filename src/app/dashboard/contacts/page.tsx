'use client';
// src/app/dashboard/contacts/page.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContacts } from '@/hooks/useContacts';
import { useTasks } from '@/hooks/useTasks';
import { Contact, ContactTag, SortOption } from '@/types';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, Btn } from '@/components/ui/FormField';

const TAGS: { key: ContactTag; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'emergency', label: 'Emergency' },
  { key: 'family',    label: 'Family'    },
  { key: 'work',      label: 'Work'      },
  { key: 'personal',  label: 'Personal'  },
];
const SORTS: { key: SortOption; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'name',   label: 'A–Z'   },
  { key: 'added',  label: 'Added' },
];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  emergency: { bg: 'rgba(255,77,106,0.15)',   color: 'var(--red)'    },
  family:    { bg: 'rgba(34,199,122,0.12)',    color: 'var(--green)'  },
  work:      { bg: 'rgba(77,159,255,0.12)',    color: 'var(--blue)'   },
  personal:  { bg: 'rgba(108,99,255,0.15)',    color: 'var(--accent2)'},
};

const AVATAR_COLORS = [
  ['#6c63ff','#1e1e3a'],['#22c77a','#0a2e1e'],['#ff4d6a','#2e0a10'],
  ['#4d9fff','#0a1e2e'],['#ffb547','#2e1e0a'],['#ff6b9d','#2e0a1e'],
  ['#5dd5d5','#0a2a2a'],['#a78bfa','#1e0a2e'],
];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const TAG_OPTS = [
  { value: 'personal',  label: 'Personal'  },
  { value: 'family',    label: 'Family'    },
  { value: 'work',      label: 'Work'      },
  { value: 'emergency', label: 'Emergency' },
];

const PRIORITY_OPTS = [
  { value: 'high', label: 'High'   },
  { value: 'med',  label: 'Medium' },
  { value: 'low',  label: 'Low'    },
];

export default function ContactsPage() {
  const { contacts, selected, loading, filter, sort, alpha, query,
    setFilter, setSort, setAlpha, setQuery, setSelected,
    fetchContacts, addContact, updateContact, deleteContact, importFile } = useContacts();
  const { tasks, addTask, toggleTask, deleteTask, fetchTasks } = useTasks();

  // Modals
  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  // Add form
  const [form, setForm] = useState({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  // Edit form
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  // Task form
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'med', due: '' });

  useEffect(() => { fetchContacts(); }, []);
  useEffect(() => { if (selected) fetchTasks(selected.id); }, [selected]);

  // Local filter by alpha
  const displayed = contacts.filter((c) => {
    if (alpha && !c.name.toUpperCase().startsWith(alpha)) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.phone.includes(query)) return false;
    return true;
  });

  const contactTasks = tasks.filter((t) => t.contactId === selected?.id);

  function openEdit(c: Contact) {
    setEditForm({ name: c.name, phone: c.phone, email: c.email || '', tag: c.tag, notes: c.notes || '' });
    setEditOpen(true);
  }

  async function handleAdd() {
    if (!form.name || !form.phone) return;
    await addContact(form);
    setAddOpen(false);
    setForm({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  }

  async function handleEdit() {
    if (!selected) return;
    await updateContact(selected.id, editForm);
    setEditOpen(false);
  }

  async function handleDelete() {
    if (!selected) return;
    await deleteContact(selected.id);
  }

  async function handleAddTask() {
    if (!selected || !taskForm.title) return;
    await addTask({ ...taskForm, contactId: selected.id });
    await fetchTasks(selected.id);
    setTaskOpen(false);
    setTaskForm({ title: '', priority: 'med', due: '' });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { importFile(file); e.target.value = ''; }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flex: 1 }}>Contacts</div>
        <div style={{ position: 'relative', maxWidth: '280px', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input value={query} onChange={(e) => { setQuery(e.target.value); fetchContacts(); }}
            placeholder="Search name or number…"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 32px', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: 'var(--r2)', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/></svg>
          Import
          <input type="file" accept=".vcf,.csv" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <Btn variant="primary" onClick={() => setAddOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
          New
        </Btn>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* List panel */}
        <div style={{ width: '300px', minWidth: '300px', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', padding: '12px 12px 0' }}>
            {[
              { label: 'Total',     val: contacts.length },
              { label: 'Emergency', val: contacts.filter(c => c.tag === 'emergency').length },
              { label: 'Family',    val: contacts.filter(c => c.tag === 'family').length },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: '8px 10px', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            {TAGS.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${filter === t.key ? (TAG_COLORS[t.key]?.color || 'var(--accent)') : 'var(--border)'}`,
                  background: filter === t.key ? (TAG_COLORS[t.key]?.bg || 'var(--accent3)') : 'transparent',
                  color: filter === t.key ? (TAG_COLORS[t.key]?.color || 'var(--accent2)') : 'var(--text2)',
                  fontWeight: 500, transition: 'all 0.15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sort</span>
            {SORTS.map((s) => (
              <button key={s.key} onClick={() => setSort(s.key)}
                style={{
                  fontSize: '11px', padding: '3px 8px', borderRadius: '20px', cursor: 'pointer',
                  border: `1px solid ${sort === s.key ? 'var(--border)' : 'transparent'}`,
                  background: sort === s.key ? 'var(--bg4)' : 'transparent',
                  color: sort === s.key ? 'var(--text)' : 'var(--text3)',
                  fontWeight: sort === s.key ? 500 : 400, transition: 'all 0.15s',
                }}
              >{s.label}</button>
            ))}
          </div>

          {/* Alpha strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setAlpha(null)}
              style={{ width: '22px', height: '20px', borderRadius: '3px', border: 'none', background: alpha === null ? 'var(--accent3)' : 'transparent', color: alpha === null ? 'var(--accent2)' : 'var(--text3)', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
              All
            </button>
            {ALPHA.map((l) => (
              <button key={l} onClick={() => setAlpha(alpha === l ? null : l)}
                style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: alpha === l ? 'var(--accent3)' : 'transparent', color: alpha === l ? 'var(--accent2)' : 'var(--text3)', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600, transition: 'all 0.12s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Contact list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>Loading…</div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>No contacts found</div>
            ) : (
              displayed.map((c) => {
                const [bg, clr] = avatarColor(c.name);
                const tc = TAG_COLORS[c.tag];
                const isActive = selected?.id === c.id;
                return (
                  <motion.div key={c.id} whileHover={{ x: 2 }}
                    onClick={() => setSelected(isActive ? null : c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px', borderRadius: 'var(--r2)',
                      cursor: 'pointer', marginBottom: '2px', transition: 'all 0.15s',
                      background: isActive ? 'var(--bg4)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--border2)' : 'transparent'}`,
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-syne)', flexShrink: 0 }}>
                      {initials(c.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: '1px' }}>{c.phone}</div>
                    </div>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', fontFamily: 'var(--font-syne)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', background: tc?.bg, color: tc?.color }}>
                      {c.tag}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ flex: 1, overflowY: 'auto' }}>
              <ContactDetail
                contact={selected}
                tasks={contactTasks}
                onEdit={() => openEdit(selected)}
                onDelete={handleDelete}
                onAddTask={() => setTaskOpen(true)}
                onToggleTask={async (id, done) => { await toggleTask(id, done); fetchTasks(selected.id); }}
                onDeleteTask={async (id) => { await deleteTask(id); fetchTasks(selected.id); }}
              />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8"/></svg>
              </div>
              <div style={{ fontSize: '13px' }}>Select a contact to view details</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Contact Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Contact"
        footer={<><Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAdd}>Save Contact</Btn></>}>
        <FormField label="Full Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" /></FormField>
        <FormField label="Phone Number *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" /></FormField>
        <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></FormField>
        <FormField label="Tag"><Select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} options={TAG_OPTS} /></FormField>
        <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" /></FormField>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Contact"
        footer={<><Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleEdit}>Update</Btn></>}>
        <FormField label="Full Name"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></FormField>
        <FormField label="Phone Number"><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></FormField>
        <FormField label="Email"><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></FormField>
        <FormField label="Tag"><Select value={editForm.tag} onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })} options={TAG_OPTS} /></FormField>
        <FormField label="Notes"><Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></FormField>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title={`Add Task for ${selected?.name || ''}`}
        footer={<><Btn variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAddTask}>Add Task</Btn></>}>
        <FormField label="Task Title *"><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="What needs to be done?" /></FormField>
        <FormField label="Priority"><Select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} options={PRIORITY_OPTS} /></FormField>
        <FormField label="Due Date"><Input type="date" value={taskForm.due} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} /></FormField>
      </Modal>
    </div>
  );
}

// ── Contact Detail sub-component ──────────────────────────────────────────────
function ContactDetail({ contact, tasks, onEdit, onDelete, onAddTask, onToggleTask, onDeleteTask }: {
  contact: Contact;
  tasks: ReturnType<typeof useTasks>['tasks'];
  onEdit: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  onToggleTask: (id: string, done: boolean) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [bg, clr] = avatarColor(contact.name);
  const tc = TAG_COLORS[contact.tag];

  const PRIORITY_COLOR: Record<string, string> = { high: 'var(--red)', med: 'var(--amber)', low: 'var(--green)' };

  return (
    <div>
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: bg, color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-syne)', flexShrink: 0 }}>
          {initials(contact.name)}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>{contact.name}</div>
          <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-syne)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', background: tc?.bg, color: tc?.color }}>
            {contact.tag}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <Btn size="sm" variant="ghost" onClick={onEdit}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 600, marginBottom: '10px' }}>Contact Info</div>
        {[
          { icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6.5c0 2.5 2 4.5 6 4.5V9l-2-1-1 1-2-1.5"/></svg>, label: 'Phone', val: contact.phone },
          ...(contact.email ? [{ icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="M1.5 5l6.5 4 6.5-4"/></svg>, label: 'Email', val: contact.email }] : []),
          ...(contact.notes ? [{ icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h10v8l-3 3H3z"/></svg>, label: 'Notes', val: contact.notes }] : []),
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text3)', marginTop: '2px', flexShrink: 0 }}>{row.icon}</span>
            <span style={{ fontSize: '12px', color: 'var(--text3)', minWidth: '50px' }}>{row.label}</span>
            <span style={{ fontSize: '13.5px' }}>{row.val}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
            Linked Tasks ({tasks.length})
          </div>
          <Btn size="sm" variant="ghost" onClick={onAddTask}>+ Add Task</Btn>
        </div>
        {tasks.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '12.5px' }}>No tasks linked.</div>
        ) : tasks.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLOR[t.priority], flexShrink: 0, marginTop: '5px' }} />
            <div
              onClick={() => onToggleTask(t.id, !t.done)}
              style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${t.done ? 'var(--green)' : 'var(--border2)'}`, background: t.done ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}
            >
              {t.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text3)' : 'var(--text)' }}>{t.title}</div>
              {t.due && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>Due: {t.due}</div>}
            </div>
            <button onClick={() => onDeleteTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }} title="Delete task">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
