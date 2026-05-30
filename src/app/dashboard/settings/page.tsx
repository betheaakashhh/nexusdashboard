'use client';
// src/app/dashboard/settings/page.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Btn } from '@/components/ui/FormField';

// ─── Section tabs ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'appearance', label: 'Appearance', icon: '🎨' },
  { key: 'security',   label: 'Security',   icon: '🔒' },
  { key: 'email',      label: 'Email',      icon: '✉️'  },
  { key: 'contacts',   label: 'Contacts',   icon: '👤' },
  { key: 'data',       label: 'Data',       icon: '💾' },
] as const;
type Section = typeof SECTIONS[number]['key'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Settings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  compactMode: boolean;
  defaultLanding: 'contacts' | 'tasks' | 'email' | 'private';
  defaultView: 'cards' | 'table';
  // Security
  sessionTimeout: 0 | 5 | 15 | 30 | 60;
  vaultPin: string; // empty = disabled
  // Email
  defaultSenderName: string;
  defaultFromEmail: string;
  emailSignature: string;
  bccSelf: boolean;
  quickRecipients: string[]; // emails
  // Contacts
  defaultContactSort: 'name' | 'recent' | 'added';
  contactSearchFields: ('name' | 'phone' | 'email' | 'tags' | 'notes')[];
  importDuplicateHandling: 'skip' | 'overwrite' | 'merge';
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accentColor: '#6c63ff',
  compactMode: false,
  defaultLanding: 'contacts',
  defaultView: 'cards',
  sessionTimeout: 0,
  vaultPin: '',
  defaultSenderName: '',
  defaultFromEmail: '',
  emailSignature: '',
  bccSelf: false,
  quickRecipients: [],
  defaultContactSort: 'recent',
  contactSearchFields: ['name', 'phone', 'email'],
  importDuplicateHandling: 'skip',
};

const ACCENT_PRESETS = [
  { label: 'Violet',  value: '#6c63ff' },
  { label: 'Rose',    value: '#ff6b9d' },
  { label: 'Cyan',    value: '#22d3ee' },
  { label: 'Emerald', value: '#22c77a' },
  { label: 'Amber',   value: '#ffb547' },
  { label: 'Coral',   value: '#ff6b6b' },
  { label: 'Sky',     value: '#4d9fff' },
  { label: 'Fuchsia', value: '#c084fc' },
];

// ─── Helper components ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-syne)', fontSize: '10px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text3)',
      marginBottom: '12px', marginTop: '4px',
    }}>{children}</div>
  );
}

function SettingRow({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      animate={{ background: checked ? 'var(--accent)' : 'var(--bg4)' }}
      transition={{ duration: 0.2 }}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#fff', position: 'absolute', top: '3px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </motion.button>
  );
}

function PillGroup<T extends string | number>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: '3px', border: '1px solid var(--border)' }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
            fontWeight: 500, cursor: 'pointer', border: 'none',
            background: value === o.value ? 'var(--bg2)' : 'transparent',
            color: value === o.value ? 'var(--text)' : 'var(--text3)',
            boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.15s',
            fontFamily: 'var(--font-syne)',
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

function MultiToggle<T extends string>({
  options, values, onChange,
}: {
  options: { value: T; label: string }[];
  values: T[];
  onChange: (v: T[]) => void;
}) {
  function toggle(v: T) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px',
              fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent3)' : 'transparent',
              color: active ? 'var(--accent2)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>('appearance');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Change password modal
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Vault PIN modal
  const [pinOpen, setPinOpen] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', confirm: '' });

  // Quick recipient modal
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  // Data modals
  const [clearModal, setClearModal] = useState<'contacts' | 'tasks' | 'emails' | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_settings');
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch { /* ignore */ }
  }, []);

  function save(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem('nexus_settings', JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function handleChangePassword() {
    if (!pwdForm.current || !pwdForm.next) { toast.error('All fields required'); return; }
    if (pwdForm.next.length < 8) { toast.error('New password must be ≥ 8 characters'); return; }
    if (pwdForm.next !== pwdForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwdLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); }
      else { toast.success('Password updated'); setPwdOpen(false); setPwdForm({ current: '', next: '', confirm: '' }); }
    } catch { toast.error('Something went wrong'); }
    setPwdLoading(false);
  }

  function handleSetPin() {
    if (pinForm.pin.length < 4) { toast.error('PIN must be ≥ 4 digits'); return; }
    if (pinForm.pin !== pinForm.confirm) { toast.error('PINs do not match'); return; }
    save({ vaultPin: pinForm.pin });
    toast.success('Vault PIN set');
    setPinOpen(false);
    setPinForm({ pin: '', confirm: '' });
  }

  async function handleExportData() {
    try {
      const [contacts, tasks, emails] = await Promise.all([
        fetch('/api/contacts').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/emails').then(r => r.json()),
      ]);
      const blob = new Blob([JSON.stringify({ contacts, tasks, emails, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch { toast.error('Export failed'); }
  }

  async function handleClearSection(section: 'contacts' | 'tasks' | 'emails') {
    try {
      const res = await fetch(`/api/${section}/clear`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`All ${section} deleted`);
    } catch { toast.error('Failed to clear data'); }
    setClearModal(null);
  }

  async function handleExportContacts(format: 'csv' | 'vcf') {
    try {
      const res = await fetch('/api/contacts');
      const { contacts } = await res.json();
      let content = '';
      let filename = '';
      if (format === 'csv') {
        content = 'Name,Phone,Email,Tag,Notes\n' + contacts.map((c: Record<string, string>) =>
          `"${c.name}","${c.phone}","${c.email || ''}","${c.tag}","${(c.notes || '').replace(/"/g, '""')}"`
        ).join('\n');
        filename = 'contacts.csv';
      } else {
        content = contacts.map((c: Record<string, string>) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL:${c.phone}${c.email ? `\nEMAIL:${c.email}` : ''}\nEND:VCARD`
        ).join('\n');
        filename = 'contacts.vcf';
      }
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Contacts exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0, height: 'var(--topbar-height)',
      }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
          </svg>
          Settings
        </div>

        {/* Saved indicator */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--green)' }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8l4 4 8-8"/></svg>
              Saved
            </motion.div>
          )}
        </AnimatePresence>

        {/* User info (right side) */}
        {user && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{user.email}</div>
            </div>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '12px', fontWeight: 700,
              color: 'var(--accent2)', fontFamily: 'var(--font-syne)',
            }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left nav */}
        <div style={{
          width: '200px', minWidth: '200px', background: 'var(--bg2)',
          borderRight: '1px solid var(--border)', display: 'flex',
          flexDirection: 'column', overflow: 'hidden',
        }} className="settings-sidenav">
          <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: 'var(--r2)', marginBottom: '2px',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: section === s.key ? 'var(--accent3)' : 'transparent',
                  color: section === s.key ? 'var(--accent2)' : 'var(--text2)',
                  fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '13px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (section !== s.key) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={(e) => { if (section !== s.key) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '16px' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Logout button at bottom of settings nav */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setLogoutConfirm(true)}
              style={{
                width: '100%', padding: '9px 10px', borderRadius: 'var(--r2)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-syne)',
                fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12h3a1 1 0 001-1V5a1 1 0 00-1-1h-3M7 9l3-3-3-3M10 6H3"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >

              {/* ── APPEARANCE ── */}
              {section === 'appearance' && (
                <div style={{ maxWidth: '580px' }}>
                  <SectionTitle>Theme</SectionTitle>
                  <SettingRow label="Color scheme" description="Choose how Nexus looks">
                    <PillGroup
                      options={[
                        { value: 'dark',   label: 'Dark'   },
                        { value: 'light',  label: 'Light'  },
                        { value: 'system', label: 'System' },
                      ]}
                      value={settings.theme}
                      onChange={(v) => save({ theme: v })}
                    />
                  </SettingRow>

                  <SettingRow label="Compact mode" description="Tighter spacing throughout the UI">
                    <Toggle checked={settings.compactMode} onChange={(v) => save({ compactMode: v })} />
                  </SettingRow>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Accent Color</SectionTitle>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {ACCENT_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => save({ accentColor: p.value })}
                          title={p.label}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: p.value, border: `3px solid ${settings.accentColor === p.value ? 'var(--text)' : 'transparent'}`,
                            cursor: 'pointer', transition: 'border-color 0.15s', flexShrink: 0,
                            boxShadow: settings.accentColor === p.value ? `0 0 0 2px var(--bg2), 0 0 0 4px ${p.value}` : 'none',
                          }}
                        />
                      ))}
                      {/* Custom color */}
                      <label title="Custom" style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--border)', overflow: 'hidden', flexShrink: 0,
                      }}>
                        <input
                          type="color"
                          value={settings.accentColor}
                          onChange={(e) => save({ accentColor: e.target.value })}
                          style={{ width: '200%', height: '200%', opacity: 0, cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                    {/* Preview swatch */}
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '20px', borderRadius: '4px', background: settings.accentColor }} />
                      <span style={{ fontSize: '11.5px', color: 'var(--text3)', fontFamily: 'monospace' }}>{settings.accentColor}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Navigation</SectionTitle>
                    <SettingRow label="Default landing page" description="Where you land after logging in">
                      <PillGroup
                        options={[
                          { value: 'contacts', label: 'Contacts' },
                          { value: 'tasks',    label: 'Tasks'    },
                          { value: 'email',    label: 'Email'    },
                          { value: 'private',  label: 'Vault'    },
                        ]}
                        value={settings.defaultLanding}
                        onChange={(v) => save({ defaultLanding: v })}
                      />
                    </SettingRow>
                    <SettingRow label="Default view" description="Cards or table layout for lists">
                      <PillGroup
                        options={[
                          { value: 'cards', label: 'Cards' },
                          { value: 'table', label: 'Table' },
                        ]}
                        value={settings.defaultView}
                        onChange={(v) => save({ defaultView: v })}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {section === 'security' && (
                <div style={{ maxWidth: '560px' }}>
                  <SectionTitle>Account</SectionTitle>
                  <SettingRow label="Change password" description="Update your login password">
                    <Btn size="sm" variant="ghost" onClick={() => setPwdOpen(true)}>Change</Btn>
                  </SettingRow>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Session</SectionTitle>
                    <SettingRow label="Auto-logout" description="Sign out after inactivity">
                      <PillGroup
                        options={[
                          { value: 0,  label: 'Off'   },
                          { value: 5,  label: '5 min' },
                          { value: 15, label: '15m'   },
                          { value: 30, label: '30m'   },
                          { value: 60, label: '1 hr'  },
                        ] as { value: 0 | 5 | 15 | 30 | 60; label: string }[]}
                        value={settings.sessionTimeout}
                        onChange={(v) => save({ sessionTimeout: v })}
                      />
                    </SettingRow>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Private Vault</SectionTitle>
                    <SettingRow
                      label="Two-step vault unlock"
                      description={settings.vaultPin ? 'PIN is set — vault requires extra unlock' : 'Require a PIN before opening the vault'}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {settings.vaultPin && (
                          <span style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>
                            PIN set
                          </span>
                        )}
                        <Btn size="sm" variant="ghost" onClick={() => setPinOpen(true)}>
                          {settings.vaultPin ? 'Change PIN' : 'Set PIN'}
                        </Btn>
                        {settings.vaultPin && (
                          <Btn size="sm" variant="danger" onClick={() => { save({ vaultPin: '' }); toast.success('PIN removed'); }}>
                            Remove
                          </Btn>
                        )}
                      </div>
                    </SettingRow>
                  </div>

                  {/* Danger zone */}
                  <div style={{
                    marginTop: '32px', padding: '16px', borderRadius: 'var(--r)',
                    border: '1px solid rgba(255,77,106,0.2)', background: 'rgba(255,77,106,0.04)',
                  }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--red)', marginBottom: '12px' }}>
                      Danger Zone
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>Sign out of Nexus</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>Clear your session and return to login</div>
                      </div>
                      <Btn variant="danger" onClick={() => setLogoutConfirm(true)}>Sign Out</Btn>
                    </div>
                  </div>
                </div>
              )}

              {/* ── EMAIL ── */}
              {section === 'email' && (
                <div style={{ maxWidth: '560px' }}>
                  <SectionTitle>Sender Identity</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <FormField label="Default sender name">
                      <Input
                        value={settings.defaultSenderName}
                        onChange={(e) => save({ defaultSenderName: e.target.value })}
                        placeholder="Your Name"
                      />
                    </FormField>
                    <FormField label="Default from email">
                      <Input
                        type="email"
                        value={settings.defaultFromEmail}
                        onChange={(e) => save({ defaultFromEmail: e.target.value })}
                        placeholder="you@yourdomain.com"
                      />
                    </FormField>
                  </div>

                  <SectionTitle>Compose Options</SectionTitle>
                  <SettingRow label="BCC self" description="Always BCC yourself on sent emails">
                    <Toggle checked={settings.bccSelf} onChange={(v) => save({ bccSelf: v })} />
                  </SettingRow>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Email Signature</SectionTitle>
                    <textarea
                      value={settings.emailSignature}
                      onChange={(e) => save({ emailSignature: e.target.value })}
                      placeholder="Your email signature (auto-appended to outgoing emails)…"
                      rows={4}
                      style={{
                        width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r2)', padding: '10px 14px', color: 'var(--text)',
                        fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Quick Recipients</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                      {settings.quickRecipients.length === 0 ? (
                        <div style={{ fontSize: '12.5px', color: 'var(--text3)', padding: '10px 0' }}>No quick recipients saved.</div>
                      ) : settings.quickRecipients.map((email, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', background: 'var(--bg3)',
                          borderRadius: 'var(--r2)', border: '1px solid var(--border)',
                        }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--text3)" strokeWidth="1.5"><rect x="2" y="4" width="12" height="9" rx="2"/><path d="M2 7l6 4 6-4"/></svg>
                          <span style={{ flex: 1, fontSize: '13px' }}>{email}</span>
                          <button
                            onClick={() => save({ quickRecipients: settings.quickRecipients.filter((_, j) => j !== i) })}
                            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.5 3.5l-7 7M3.5 3.5l7 7"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setRecipientOpen(true)}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
                      Add recipient
                    </Btn>
                  </div>
                </div>
              )}

              {/* ── CONTACTS ── */}
              {section === 'contacts' && (
                <div style={{ maxWidth: '560px' }}>
                  <SectionTitle>Display</SectionTitle>
                  <SettingRow label="Default sort order" description="How contacts are ordered by default">
                    <PillGroup
                      options={[
                        { value: 'name',   label: 'A–Z'     },
                        { value: 'recent', label: 'Recent'  },
                        { value: 'added',  label: 'Added'   },
                      ]}
                      value={settings.defaultContactSort}
                      onChange={(v) => save({ defaultContactSort: v })}
                    />
                  </SettingRow>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Search</SectionTitle>
                    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500, marginBottom: '10px' }}>Search fields</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginBottom: '10px' }}>Which fields are included in contact search</div>
                      <MultiToggle
                        options={[
                          { value: 'name',  label: 'Name'  },
                          { value: 'phone', label: 'Phone' },
                          { value: 'email', label: 'Email' },
                          { value: 'tags',  label: 'Tags'  },
                          { value: 'notes', label: 'Notes' },
                        ]}
                        values={settings.contactSearchFields}
                        onChange={(v) => save({ contactSearchFields: v as Settings['contactSearchFields'] })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Import</SectionTitle>
                    <SettingRow label="Duplicate handling" description="What to do when importing contacts that already exist">
                      <PillGroup
                        options={[
                          { value: 'skip',      label: 'Skip'      },
                          { value: 'overwrite', label: 'Overwrite' },
                          { value: 'merge',     label: 'Merge'     },
                        ]}
                        value={settings.importDuplicateHandling}
                        onChange={(v) => save({ importDuplicateHandling: v })}
                      />
                    </SettingRow>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <SectionTitle>Export Contacts</SectionTitle>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <Btn variant="ghost" onClick={() => handleExportContacts('csv')}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 10l4 4 4-4"/><path d="M2 14h12"/></svg>
                        Export CSV
                      </Btn>
                      <Btn variant="ghost" onClick={() => handleExportContacts('vcf')}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 10l4 4 4-4"/><path d="M2 14h12"/></svg>
                        Export VCF
                      </Btn>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DATA ── */}
              {section === 'data' && (
                <div style={{ maxWidth: '560px' }}>
                  <SectionTitle>Backup & Export</SectionTitle>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 500 }}>Export all data</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>Full JSON backup of contacts, tasks, and emails</div>
                    </div>
                    <Btn variant="ghost" onClick={handleExportData}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 10l4 4 4-4"/><path d="M2 14h12"/></svg>
                      Export
                    </Btn>
                  </div>

                  <div style={{ marginTop: '28px' }}>
                    <SectionTitle>Clear Section Data</SectionTitle>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
                      Permanently deletes all records in the chosen section. This cannot be undone.
                    </div>
                    {(['contacts', 'tasks', 'emails'] as const).map((sec) => (
                      <div key={sec} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r2)', marginBottom: '6px',
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>Delete all {sec}</div>
                        <Btn size="sm" variant="danger" onClick={() => setClearModal(sec)}>Delete</Btn>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile section tabs (shown below topbar on small screens) */}
      <style>{`
        @media (max-width: 768px) {
          .settings-sidenav { display: none !important; }
          .settings-mobile-tabs { display: flex !important; }
        }
        @media (min-width: 769px) {
          .settings-mobile-tabs { display: none !important; }
        }
      `}</style>

      {/* ─── Modals ─── */}

      {/* Change password */}
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Password"
        footer={<><Btn variant="ghost" onClick={() => setPwdOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleChangePassword} disabled={pwdLoading}>{pwdLoading ? 'Saving…' : 'Update Password'}</Btn></>}>
        <FormField label="Current password">
          <Input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} placeholder="••••••••" />
        </FormField>
        <FormField label="New password">
          <Input type="password" value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} placeholder="Min. 8 characters" />
        </FormField>
        <FormField label="Confirm new password">
          <Input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Repeat new password" />
        </FormField>
      </Modal>

      {/* Set Vault PIN */}
      <Modal open={pinOpen} onClose={() => setPinOpen(false)} title="Set Vault PIN"
        footer={<><Btn variant="ghost" onClick={() => setPinOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSetPin}>Set PIN</Btn></>}>
        <div style={{ fontSize: '12.5px', color: 'var(--text3)', marginBottom: '16px' }}>
          Set a numeric PIN that must be entered before opening the Private Vault. Stored locally in your browser.
        </div>
        <FormField label="PIN (min. 4 digits)">
          <Input type="password" inputMode="numeric" value={pinForm.pin} onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/\D/g, '') })} placeholder="••••" />
        </FormField>
        <FormField label="Confirm PIN">
          <Input type="password" inputMode="numeric" value={pinForm.confirm} onChange={(e) => setPinForm({ ...pinForm, confirm: e.target.value.replace(/\D/g, '') })} placeholder="••••" />
        </FormField>
      </Modal>

      {/* Add quick recipient */}
      <Modal open={recipientOpen} onClose={() => setRecipientOpen(false)} title="Add Quick Recipient"
        footer={<><Btn variant="ghost" onClick={() => setRecipientOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={() => {
          if (!newRecipient) return;
          save({ quickRecipients: [...settings.quickRecipients, newRecipient] });
          setNewRecipient('');
          setRecipientOpen(false);
          toast.success('Recipient added');
        }}>Add</Btn></>}>
        <FormField label="Email address">
          <Input type="email" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} placeholder="dad@example.com" />
        </FormField>
      </Modal>

      {/* Clear section confirmation */}
      <Modal
        open={!!clearModal}
        onClose={() => setClearModal(null)}
        title={`Delete all ${clearModal}?`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setClearModal(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => clearModal && handleClearSection(clearModal)}>
              Yes, delete all {clearModal}
            </Btn>
          </>
        }
      >
        <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.7 }}>
          This will permanently delete <strong>all {clearModal}</strong> from your account. This action cannot be undone.
        </div>
      </Modal>

      {/* Logout confirmation */}
      <Modal
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        title="Sign out?"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setLogoutConfirm(false)}>Stay</Btn>
            <Btn variant="danger" onClick={logout}>Sign Out</Btn>
          </>
        }
      >
        <div style={{ fontSize: '13.5px', color: 'var(--text2)' }}>
          You'll be redirected to the login page. Your data is safely stored.
        </div>
      </Modal>
    </div>
  );
}