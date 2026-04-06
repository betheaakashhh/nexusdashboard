'use client';
// src/app/dashboard/tasks/page.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { useContacts } from '@/hooks/useContacts';
import { Task } from '@/types';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Select, Btn } from '@/components/ui/FormField';

const PRIORITY_COLOR: Record<string, string> = { high: 'var(--red)', med: 'var(--amber)', low: 'var(--green)' };
const PRIORITY_OPTS = [
  { value: 'high', label: 'High'   },
  { value: 'med',  label: 'Medium' },
  { value: 'low',  label: 'Low'    },
];

export default function TasksPage() {
  const { tasks, loading, query, setQuery, fetchTasks, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const { contacts, fetchContacts } = useContacts();

  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', priority: 'med', due: '', contactId: '' });
  const [editForm, setEditForm] = useState({ title: '', priority: 'med', due: '', contactId: '' });
  const [quickTask, setQuickTask] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => { fetchTasks(); fetchContacts(); }, []);

  const contactOpts = [{ value: '', label: 'None' }, ...contacts.map((c) => ({ value: c.id, label: c.name }))];

  const displayed = tasks.filter((t) => {
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const pending   = displayed.filter((t) => !t.done);
  const completed = displayed.filter((t) =>  t.done);

  async function handleAdd() {
    if (!form.title) return;
    await addTask({ ...form, contactId: form.contactId || undefined });
    setAddOpen(false);
    setForm({ title: '', priority: 'med', due: '', contactId: '' });
  }

  async function handleQuickAdd() {
    if (!quickTask.trim()) return;
    await addTask({ title: quickTask.trim(), priority: 'med' });
    setQuickTask('');
  }

  function openEdit(t: Task) {
    setEditTarget(t);
    setEditForm({ title: t.title, priority: t.priority, due: t.due || '', contactId: t.contactId || '' });
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editTarget) return;
    await updateTask(editTarget.id, { ...editForm, contactId: editForm.contactId || null });
    setEditOpen(false);
    setEditTarget(null);
  }

  const totalPending   = tasks.filter(t => !t.done).length;
  const totalCompleted = tasks.filter(t =>  t.done).length;
  const highCount      = tasks.filter(t => t.priority === 'high' && !t.done).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flex: 1 }}>Tasks</div>
        <div style={{ position: 'relative', maxWidth: '260px', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 32px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
        </div>
        <Btn variant="primary" onClick={() => setAddOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
          New Task
        </Btn>
      </div>

      {/* Task content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px', maxWidth: '500px' }}>
          {[
            { label: 'Pending',   val: totalPending,   color: 'var(--amber)' },
            { label: 'Completed', val: totalCompleted, color: 'var(--green)' },
            { label: 'High',      val: highCount,      color: 'var(--red)'   },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick add */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            value={quickTask}
            onChange={(e) => setQuickTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); }}
            placeholder="Quick add — type and press Enter"
            style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '10px 14px', color: 'var(--text)', fontSize: '13.5px', outline: 'none', transition: 'border-color 0.15s' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <Btn variant="primary" onClick={handleQuickAdd}>Add</Btn>
        </div>

        {/* Priority filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginRight: '4px' }}>Priority</span>
          {['all', 'high', 'med', 'low'].map((p) => (
            <button key={p} onClick={() => setFilterPriority(p)}
              style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: 500,
                border: `1px solid ${filterPriority === p ? (PRIORITY_COLOR[p] || 'var(--accent)') : 'var(--border)'}`,
                background: filterPriority === p ? (p === 'all' ? 'var(--accent3)' : `${PRIORITY_COLOR[p]}22`) : 'transparent',
                color: filterPriority === p ? (PRIORITY_COLOR[p] || 'var(--accent2)') : 'var(--text3)',
                transition: 'all 0.15s',
              }}
            >{{ all: 'All', high: 'High', med: 'Medium', low: 'Low' }[p]}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading…</div>
        ) : (
          <>
            {/* Pending */}
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text3)', marginBottom: '8px' }}>
              Pending ({pending.length})
            </div>
            {pending.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px' }}>All done! Nothing pending.</div>
            ) : (
              <AnimatePresence>
                {pending.map((t) => (
                  <TaskCard key={t.id} task={t} contacts={contacts} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} />
                ))}
              </AnimatePresence>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text3)', margin: '20px 0 8px' }}>
                  Completed ({completed.length})
                </div>
                <AnimatePresence>
                  {completed.map((t) => (
                    <TaskCard key={t.id} task={t} contacts={contacts} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} />
                  ))}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Task"
        footer={<><Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAdd}>Add Task</Btn></>}>
        <FormField label="Task Title *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" /></FormField>
        <FormField label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITY_OPTS} /></FormField>
        <FormField label="Due Date"><Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></FormField>
        <FormField label="Linked Contact"><Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} options={contactOpts} /></FormField>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Task"
        footer={<><Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleEdit}>Update Task</Btn></>}>
        <FormField label="Task Title"><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></FormField>
        <FormField label="Priority"><Select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} options={PRIORITY_OPTS} /></FormField>
        <FormField label="Due Date"><Input type="date" value={editForm.due} onChange={(e) => setEditForm({ ...editForm, due: e.target.value })} /></FormField>
        <FormField label="Linked Contact"><Select value={editForm.contactId} onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })} options={contactOpts} /></FormField>
      </Modal>
    </div>
  );
}

function TaskCard({ task, contacts, onToggle, onEdit, onDelete }: {
  task: Task;
  contacts: ReturnType<typeof useContacts>['contacts'];
  onToggle: (id: string, done: boolean) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const linked = contacts.find((c) => c.id === task.contactId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
        padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0, marginTop: '6px' }} />
      <div
        onClick={() => onToggle(task.id, !task.done)}
        style={{ width: '18px', height: '18px', borderRadius: '5px', border: `1.5px solid ${task.done ? 'var(--green)' : 'var(--border2)'}`, background: task.done ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s' }}
      >
        {task.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text3)' : 'var(--text)' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11.5px', color: 'var(--text3)' }}>
          {linked && <span>Contact: {linked.name}</span>}
          {task.due && <span>Due: {task.due}</span>}
          <span style={{ background: `${PRIORITY_COLOR[task.priority]}22`, color: PRIORITY_COLOR[task.priority], padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontFamily: 'var(--font-syne)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {task.priority === 'med' ? 'Medium' : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <Btn size="sm" variant="ghost" onClick={() => onEdit(task)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => onDelete(task.id)}>✕</Btn>
      </div>
    </motion.div>
  );
}
