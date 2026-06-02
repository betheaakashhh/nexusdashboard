'use client';
// src/app/dashboard/tasks/page.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTasks } from '@/hooks/useTasks';
import { useContacts } from '@/hooks/useContacts';
import { Task, Contact } from '@/types';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Select, Btn } from '@/components/ui/FormField';

const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--red)',
  med:  'var(--amber)',
  low:  'var(--green)',
};
const PRIORITY_OPTS = [
  { value: 'high', label: 'High'   },
  { value: 'med',  label: 'Medium' },
  { value: 'low',  label: 'Low'    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isOverdue(due?: string, dueTime?: string): boolean {
  if (!due) return false;
  const now = new Date();
  if (dueTime) {
    const [h, m] = dueTime.split(':').map(Number);
    const dueDate = new Date(`${due}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
    return dueDate < now;
  }
  // Just date — compare as date only
  const today = now.toISOString().split('T')[0];
  return due < today;
}

function formatDue(due?: string, dueTime?: string): string {
  if (!due) return '';
  const base = due;
  if (dueTime) return `${base} ${dueTime}`;
  return base;
}

function isDueSoon(due?: string, dueTime?: string): boolean {
  if (!due || !dueTime) return false;
  const now = new Date();
  const [h, m] = dueTime.split(':').map(Number);
  const dueDate = new Date(`${due}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  const diff = dueDate.getTime() - now.getTime();
  return diff > 0 && diff <= 60 * 60 * 1000; // within 1 hour
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, loading, query, setQuery, fetchTasks, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const { contacts, fetchContacts } = useContacts();

  const [addOpen,         setAddOpen]         = useState(false);
  const [editOpen,        setEditOpen]         = useState(false);
  const [editTarget,      setEditTarget]       = useState<Task | null>(null);
  const [form,            setForm]             = useState({ title: '', priority: 'med', due: '', dueTime: '', contactId: '' });
  const [editForm,        setEditForm]         = useState({ title: '', priority: 'med', due: '', dueTime: '', contactId: '' });
  const [quickTask,       setQuickTask]        = useState('');
  const [filterPriority,  setFilterPriority]   = useState<string>('all');
  const [filterStatus,    setFilterStatus]     = useState<'all' | 'pending' | 'done'>('all');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTasks(); fetchContacts(); }, []);

  const contactOpts = [
    { value: '', label: 'None' },
    ...contacts.map((c) => ({ value: c.id, label: c.name })),
  ];

  const filtered = tasks.filter((t) => {
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus === 'pending' && t.done) return false;
    if (filterStatus === 'done' && !t.done) return false;
    return true;
  });

  const pending   = filtered.filter((t) => !t.done);
  const completed = filtered.filter((t) =>  t.done);
  const overdueCount = tasks.filter(t => !t.done && isOverdue(t.due, t.dueTime)).length;

  async function handleAdd() {
    if (!form.title) return;
    await addTask({
      title: form.title,
      priority: form.priority as Task['priority'],
      due: form.due || undefined,
      dueTime: form.dueTime || undefined,
      contactId: form.contactId || undefined,
    });
    setAddOpen(false);
    setForm({ title: '', priority: 'med', due: '', dueTime: '', contactId: '' });
  }

  async function handleQuickAdd() {
    if (!quickTask.trim()) return;
    await addTask({ title: quickTask.trim(), priority: 'med' });
    setQuickTask('');
  }

  function openEdit(t: Task) {
    setEditTarget(t);
    setEditForm({
      title: t.title,
      priority: t.priority,
      due: t.due || '',
      dueTime: (t as Task & { dueTime?: string }).dueTime || '',
      contactId: t.contactId || '',
    });
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editTarget) return;
    await updateTask(editTarget.id, {
      title: editForm.title,
      priority: editForm.priority as Task['priority'],
      due: editForm.due || undefined,
      dueTime: editForm.dueTime || undefined,
      contactId: editForm.contactId || undefined,
    } as Partial<Task>);
    setEditOpen(false);
    setEditTarget(null);
  }

  async function sendTestReminder() {
    try {
      const res = await fetch('/api/tasks/reminders');
      const data = await res.json();
      if (res.ok) toast.success(data.message || 'Reminders checked');
      else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed to check reminders'); }
  }

  const totalPending   = tasks.filter(t => !t.done).length;
  const totalCompleted = tasks.filter(t =>  t.done).length;
  const highCount      = tasks.filter(t => t.priority === 'high' && !t.done).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0, height: 'var(--topbar-height)',
      }}>
        <div className="topbar-title" style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flexShrink: 0 }}>
          Tasks
          {overdueCount > 0 && (
            <span style={{ marginLeft: 8, background: 'rgba(224,92,106,0.15)', color: 'var(--red)', fontSize: '10px', padding: '1px 7px', borderRadius: 10, fontWeight: 600, border: '1px solid rgba(224,92,106,0.3)' }}>
              {overdueCount} overdue
            </span>
          )}
        </div>
        <div className="topbar-search" style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
        </div>
        <Btn variant="primary" onClick={() => setAddOpen(true)} style={{ flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
          <span className="btn-task-label">New Task</span>
        </Btn>
      </div>

      {/* Task content */}
      <div className="tasks-content" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Pending',  val: totalPending,   color: 'var(--amber)' },
            { label: 'Done',     val: totalCompleted, color: 'var(--green)' },
            { label: 'Urgent',   val: highCount,      color: 'var(--red)'   },
            { label: 'Overdue',  val: overdueCount,   color: '#e05c6a'      },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick add */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status</span>
          {(['all', 'pending', 'done'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: '11px', cursor: 'pointer', fontWeight: 500,
              border: `1px solid ${filterStatus === s ? 'var(--accent)' : 'var(--border)'}`,
              background: filterStatus === s ? 'var(--accent3)' : 'transparent',
              color: filterStatus === s ? 'var(--accent2)' : 'var(--text3)', transition: 'all 0.12s',
            }}>{{ all: 'All', pending: 'Pending', done: 'Done' }[s]}</button>
          ))}
          <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginLeft: 4 }}>Priority</span>
          {['all', 'high', 'med', 'low'].map((p) => (
            <button key={p} onClick={() => setFilterPriority(p)} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: '11px', cursor: 'pointer', fontWeight: 500,
              border: `1px solid ${filterPriority === p ? (PRIORITY_COLOR[p] || 'var(--accent)') : 'var(--border)'}`,
              background: filterPriority === p ? (p === 'all' ? 'var(--accent3)' : `${PRIORITY_COLOR[p]}22`) : 'transparent',
              color: filterPriority === p ? (PRIORITY_COLOR[p] || 'var(--accent2)') : 'var(--text3)', transition: 'all 0.12s',
            }}>{{ all: 'All', high: 'High', med: 'Medium', low: 'Low' }[p]}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '32px' }}>Loading…</div>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text3)', marginBottom: '8px' }}>
              Pending ({pending.length})
            </div>
            {pending.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px', padding: '16px', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--border)', textAlign: 'center' }}>
                🎉 All done! Nothing pending.
              </div>
            ) : (
              <AnimatePresence>
                {pending.map((t) => (
                  <TaskCard key={t.id} task={t} contacts={contacts}
                    onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} />
                ))}
              </AnimatePresence>
            )}

            {completed.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text3)', margin: '20px 0 8px' }}>
                  Completed ({completed.length})
                </div>
                <AnimatePresence>
                  {completed.map((t) => (
                    <TaskCard key={t.id} task={t} contacts={contacts}
                      onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} />
                  ))}
                </AnimatePresence>
              </>
            )}
          </>
        )}

        {/* Reminder info banner */}
        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-syne)' }}>
              Task Reminder Emails
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text3)', lineHeight: 1.7 }}>
              When you set a <strong style={{ color: 'var(--text2)' }}>due date + time</strong> on a task, two reminder emails are sent to your email address (<strong style={{ color: 'var(--text2)' }}>Settings → Email → Your email address</strong>):<br />
              &nbsp;&nbsp;• <strong style={{ color: 'var(--text2)' }}>15 minutes before</strong> — early warning<br />
              &nbsp;&nbsp;• <strong style={{ color: 'var(--text2)' }}>At the exact due time</strong> — final alert<br />
              Both only fire if the task is still <strong style={{ color: 'var(--amber)' }}>pending</strong>.
              Requires the cron job running at{' '}
              <code style={{ fontFamily: 'monospace', background: 'var(--bg4)', padding: '1px 5px', borderRadius: 3, fontSize: '11px' }}>
                POST /api/tasks/reminders
              </code>{' '}
              every minute.
            </div>
          </div>
          {process.env.NODE_ENV !== 'production' && (
            <Btn size="sm" variant="ghost" onClick={sendTestReminder} style={{ flexShrink: 0 }}>
              Test now
            </Btn>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Task"
        footer={<><Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAdd}>Add Task</Btn></>}>
        <FormField label="Task Title *">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" />
        </FormField>
        <FormField label="Priority">
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITY_OPTS} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <FormField label="Due Date">
            <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          </FormField>
          <FormField label="Due Time">
            <Input type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
              title="Set a time to receive an email reminder 15 min before" />
          </FormField>
        </div>
        {form.dueTime && (
          <div style={{ fontSize: '11.5px', color: 'var(--accent2)', marginTop: -6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            You'll receive an email reminder 15 minutes before this task is due
          </div>
        )}
        <FormField label="Linked Contact">
          <Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} options={contactOpts} />
        </FormField>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Task"
        footer={<><Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleEdit}>Update Task</Btn></>}>
        <FormField label="Task Title">
          <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
        </FormField>
        <FormField label="Priority">
          <Select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} options={PRIORITY_OPTS} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <FormField label="Due Date">
            <Input type="date" value={editForm.due} onChange={(e) => setEditForm({ ...editForm, due: e.target.value })} />
          </FormField>
          <FormField label="Due Time">
            <Input type="time" value={editForm.dueTime} onChange={(e) => setEditForm({ ...editForm, dueTime: e.target.value })} />
          </FormField>
        </div>
        {editForm.dueTime && (
          <div style={{ fontSize: '11.5px', color: 'var(--accent2)', marginTop: -6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            Email reminder 15 min before due time
          </div>
        )}
        <FormField label="Linked Contact">
          <Select value={editForm.contactId} onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })} options={contactOpts} />
        </FormField>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .tasks-content { padding: 16px !important; }
          .btn-task-label { display: none; }
        }
      `}</style>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, contacts, onToggle, onEdit, onDelete }: {
  task: Task; contacts: Contact[];
  onToggle: (id: string, done: boolean) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const linked  = contacts.find((c) => c.id === task.contactId);
  const taskAny = task as Task & { dueTime?: string };
  const overdue  = !task.done && isOverdue(task.due, taskAny.dueTime);
  const soon     = !task.done && isDueSoon(task.due, taskAny.dueTime);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${overdue ? 'rgba(224,92,106,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--r)',
        padding: '12px 14px', marginBottom: '8px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = overdue ? 'rgba(224,92,106,0.7)' : 'var(--border2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = overdue ? 'rgba(224,92,106,0.4)' : 'var(--border)')}
    >
      {/* Priority dot */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0, marginTop: 7 }} />

      {/* Checkbox */}
      <motion.div
        whileTap={{ scale: 0.85 }}
        onClick={() => onToggle(task.id, !task.done)}
        style={{
          width: 20, height: 20, borderRadius: 5,
          border: `1.5px solid ${task.done ? 'var(--green)' : 'var(--border2)'}`,
          background: task.done ? 'var(--green)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1, transition: 'all 0.15s',
        }}
      >
        {task.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
      </motion.div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text3)' : 'var(--text)' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '11.5px', color: 'var(--text3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {linked && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="4" r="2.5"/><path d="M1 11c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>
              {linked.name}
            </span>
          )}
          {(task.due || taskAny.dueTime) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: overdue ? 'var(--red)' : soon ? 'var(--amber)' : 'var(--text3)' }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="10" height="9" rx="1"/><path d="M4 1v2M8 1v2M1 5h10"/></svg>
              {formatDue(task.due, taskAny.dueTime)}
              {overdue && !task.done && <span style={{ marginLeft: 3 }}>⚠️ Overdue</span>}
              {soon && !task.done && !overdue && <span style={{ marginLeft: 3 }}>🔔 Soon</span>}
            </span>
          )}
          {taskAny.dueTime && !task.done && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent2)', fontSize: '10px' }}>
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
              Reminder set
            </span>
          )}
          <span style={{ background: `${PRIORITY_COLOR[task.priority]}22`, color: PRIORITY_COLOR[task.priority], padding: '1px 6px', borderRadius: 3, fontSize: '10px', fontFamily: 'var(--font-syne)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {task.priority === 'med' ? 'Med' : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <Btn size="sm" variant="ghost" onClick={() => onEdit(task)}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5l2 2-6.5 6.5H2v-1.5L8.5 2z"/></svg>
        </Btn>
        <Btn size="sm" variant="danger" onClick={() => onDelete(task.id)}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3h10M4 3V1.5h4V3M3 3l.5 7.5h5L9 3"/></svg>
        </Btn>
      </div>
    </motion.div>
  );
}