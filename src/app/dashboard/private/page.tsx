'use client';
// src/app/dashboard/private/page.tsx
// PIN lock uses /api/settings/pin/verify — PIN is stored as bcrypt hash in DB

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Btn } from '@/components/ui/FormField';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VaultEntry {
  id: string; name: string; userId_field?: string; password: string;
  registrationNumber?: string; link?: string; notes?: string; createdAt: string;
}
interface EduRecord {
  id: string; personName: string; level: string; institution?: string;
  board?: string; year?: string; percentage?: string; rollNumber?: string;
  notes?: string; fileUrl?: string; fileName?: string; fileType?: string; createdAt: string;
}
interface PersonalDoc {
  id: string; personName: string; docType: string; docNumber?: string;
  issuedBy?: string; issuedDate?: string; expiryDate?: string; notes?: string;
  fileUrl?: string; fileName?: string; fileType?: string; createdAt: string;
}
interface DocVault {
  id: string; name: string; tag?: string; idType?: string; description?: string;
  fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number; createdAt: string;
}

const SECTIONS = [
  { key: 'passwords',  label: 'Passwords',  icon: 'fi fi-rr-lock' },
  { key: 'education',  label: 'Education',  icon: 'fi fi-rr-graduation-cap' },
  { key: 'personal',   label: 'Identity',   icon: 'fi fi-rr-id-badge' },
  { key: 'documents',  label: 'Documents',  icon: 'fi fi-rr-folder' },
] as const;
type Section = typeof SECTIONS[number]['key'];

const EDU_LEVELS = ['10th', '12th', 'Diploma', 'Graduation', 'Post Graduation', 'PhD', 'Other'];
const ID_TYPES   = ['Aadhaar Card', 'PAN Card', 'ABHA ID', 'Passport', 'Voter ID', 'Driving License', 'Birth Certificate', 'Other'];

function copyText(text: string, label = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => toast.success(label)).catch(() => toast.error('Copy failed'));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

function fileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── PIN Lock Screen ──────────────────────────────────────────────────────────
function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  async function handleVerify() {
    if (!pin || pin.length < 4) { setError('Enter your PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/settings/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        onUnlock();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(`Incorrect PIN${next >= 3 ? ' — go to Settings → Security to reset' : ''}`);
        setPin('');
      }
    } catch { setError('Something went wrong'); }
    setLoading(false);
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg5)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: '340px', margin: '20px',
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r)', padding: '32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        }}
      >
        <div style={{ fontSize: '48px' }}><i className="fi fi-rr-shield-lock" style={{ fontSize: '48px' }}></i></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
            Private Vault
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text3)' }}>
            Enter your vault PIN to continue
          </div>
        </div>

        {/* PIN dots display */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: pin.length > i ? 'var(--accent)' : 'var(--bg4)',
              border: `2px solid ${pin.length > i ? 'var(--accent)' : 'var(--border2)'}`,
              transition: 'all 0.15s',
            }} />
          ))}
          {pin.length > 4 && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center', marginLeft: '4px' }}>
              +{pin.length - 4}
            </div>
          )}
        </div>

        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
          placeholder="Enter PIN"
          autoFocus
          style={{
            width: '100%', background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 'var(--r2)', padding: '12px 16px', color: 'var(--text)',
            fontSize: '20px', letterSpacing: '6px', textAlign: 'center',
            outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--border)'; }}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '12px', color: 'var(--red)', textAlign: 'center' }}
          >
            {error}
          </motion.div>
        )}

        <Btn variant="primary" onClick={handleVerify} disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Verifying…' : 'Unlock Vault'}
        </Btn>

        <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
          Forgot PIN?{' '}
          <a href="/dashboard/settings" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
            Go to Settings → Security
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Masked password display ──────────────────────────────────────────────────
function MaskedField({ value, label }: { value: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontFamily: show ? 'inherit' : 'monospace', letterSpacing: show ? 'normal' : '2px', fontSize: '13px' }}>
        {show ? value : '•'.repeat(Math.min(value.length, 12))}
      </span>
      <button onClick={() => setShow(!show)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '2px', display: 'flex', alignItems: 'center' }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          {show
            ? <><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></>
            : <><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></>}
        </svg>
      </button>
      <button onClick={() => copyText(value, `${label} copied`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', padding: '2px', display: 'flex', alignItems: 'center' }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="2"/><rect x="3" y="3" width="8" height="8" rx="2"/></svg>
      </button>
    </div>
  );
}

function SendEmailModal({ open, onClose, entry }: { open: boolean; onClose: () => void; entry: VaultEntry | null }) {
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);
  async function handleSend() {
    if (!entry || !to) return;
    setSending(true);
    const body = [
      `Name: ${entry.name}`,
      entry.userId_field       ? `User ID: ${entry.userId_field}` : '',
      entry.registrationNumber ? `Reg No.: ${entry.registrationNumber}` : '',
      `Password: ${entry.password}`,
      entry.link               ? `Link: ${entry.link}` : '',
      entry.notes              ? `Notes: ${entry.notes}` : '',
    ].filter(Boolean).join('\n');
    const res = await fetch('/api/emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender: 'Me (Vault)', senderEmail: to, subject: `Credentials for: ${entry.name}`, body, tab: 'sent', sentAt: new Date().toLocaleTimeString() }) });
    setSending(false);
    if (res.ok) { toast.success('Sent!'); onClose(); setTo(''); } else toast.error('Failed to send');
  }
  return (
    <Modal open={open} onClose={onClose} title="Send Credentials via Email" footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={handleSend} disabled={sending}>{sending ? 'Sending…' : 'Send'}</Btn></>}>
      <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text2)' }}>Sending credentials for <strong style={{ color: 'var(--text)' }}>{entry?.name}</strong></div>
      <FormField label="Recipient Email"><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com" /></FormField>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>The credentials will be emailed in plain text. Only share with trusted persons.</div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PrivatePage() {
  // PIN gate state
  const [pinCheckLoading, setPinCheckLoading] = useState(true);
  const [requiresPin, setRequiresPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const [section, setSection] = useState<Section>('passwords');
  const [query, setQuery] = useState('');

  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [selected, setSelected] = useState<VaultEntry | null>(null);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [editVaultOpen, setEditVaultOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [vaultForm, setVaultForm] = useState({ name: '', userId_field: '', password: '', registrationNumber: '', link: '', notes: '' });

  const [eduRecords, setEduRecords] = useState<EduRecord[]>([]);
  const [eduPersonFilter, setEduPersonFilter] = useState('');
  const [eduOpen, setEduOpen] = useState(false);
  const [editEduOpen, setEditEduOpen] = useState(false);
  const [editEduTarget, setEditEduTarget] = useState<EduRecord | null>(null);
  const [eduForm, setEduForm] = useState({ personName: '', level: '10th', levelCustom: '', institution: '', board: '', year: '', percentage: '', rollNumber: '', notes: '' });
  const [eduFile, setEduFile] = useState<File | null>(null);

  const [personalDocs, setPersonalDocs] = useState<PersonalDoc[]>([]);
  const [personalPersonFilter, setPersonalPersonFilter] = useState('');
  const [personalOpen, setPersonalOpen] = useState(false);
  const [editPersonalOpen, setEditPersonalOpen] = useState(false);
  const [editPersonalTarget, setEditPersonalTarget] = useState<PersonalDoc | null>(null);
  const [personalForm, setPersonalForm] = useState({ personName: '', docType: 'Aadhaar Card', docTypeCustom: '', docNumber: '', issuedBy: '', issuedDate: '', expiryDate: '', notes: '' });
  const [personalFile, setPersonalFile] = useState<File | null>(null);

  const [docVault, setDocVault] = useState<DocVault[]>([]);
  const [docTagFilter, setDocTagFilter] = useState('');
  const [docOpen, setDocOpen] = useState(false);
  const [editDocOpen, setEditDocOpen] = useState(false);
  const [editDocTarget, setEditDocTarget] = useState<DocVault | null>(null);
  const [docForm, setDocForm] = useState({ name: '', tag: '', idType: '', description: '' });
  const [docFile, setDocFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  // Check if PIN is required on mount
  useEffect(() => {
    fetch('/api/settings/pin')
      .then(r => r.json())
      .then(d => {
        if (d.hasPin) {
          setRequiresPin(true);
          setUnlocked(false);
        } else {
          setUnlocked(true);
        }
        setPinCheckLoading(false);
      })
      .catch(() => { setUnlocked(true); setPinCheckLoading(false); });
  }, []);

  const fetchVault = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    // Exclude the PIN sentinel entry from results
    const res = await fetch(`/api/vault?${params}`);
    if (res.ok) { const { entries } = await res.json(); setEntries(entries.filter((e: VaultEntry) => e.name !== '__vault_pin__')); }
    setLoading(false);
  }, [query]);

  const fetchEdu = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (eduPersonFilter) params.set('person', eduPersonFilter);
    const res = await fetch(`/api/vault/education?${params}`);
    if (res.ok) { const { records } = await res.json(); setEduRecords(records); }
    setLoading(false);
  }, [eduPersonFilter]);

  const fetchPersonal = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (personalPersonFilter) params.set('person', personalPersonFilter);
    const res = await fetch(`/api/vault/personal?${params}`);
    if (res.ok) { const { docs } = await res.json(); setPersonalDocs(docs); }
    setLoading(false);
  }, [personalPersonFilter]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (docTagFilter) params.set('tag', docTagFilter);
    if (query) params.set('q', query);
    const res = await fetch(`/api/vault/documents?${params}`);
    if (res.ok) { const { docs } = await res.json(); setDocVault(docs); }
    setLoading(false);
  }, [docTagFilter, query]);

  useEffect(() => {
    if (!unlocked) return;
    if (section === 'passwords') fetchVault();
    if (section === 'education') fetchEdu();
    if (section === 'personal')  fetchPersonal();
    if (section === 'documents') fetchDocs();
  }, [section, unlocked, fetchVault, fetchEdu, fetchPersonal, fetchDocs]);

  // Vault CRUD
  async function handleAddVault() {
    if (!vaultForm.name) { toast.error('Name is required'); return; }
    const res = await fetch('/api/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vaultForm) });
    if (res.ok) { toast.success('Entry added'); setVaultOpen(false); setVaultForm({ name: '', userId_field: '', password: '', registrationNumber: '', link: '', notes: '' }); fetchVault(); }
    else toast.error('Failed to add');
  }
  async function handleEditVault() {
    if (!selected) return;
    const res = await fetch(`/api/vault/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vaultForm) });
    if (res.ok) { toast.success('Updated'); setEditVaultOpen(false); setSelected(null); fetchVault(); } else toast.error('Failed to update');
  }
  async function handleDeleteVault(id: string) {
    const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); setEntries(prev => prev.filter(e => e.id !== id)); if (selected?.id === id) setSelected(null); } else toast.error('Failed to delete');
  }
  function openEditVault(e: VaultEntry) {
    setSelected(e); setVaultForm({ name: e.name, userId_field: e.userId_field || '', password: e.password, registrationNumber: e.registrationNumber || '', link: e.link || '', notes: e.notes || '' }); setEditVaultOpen(true);
  }

  // Education CRUD
  async function handleAddEdu() {
    if (!eduForm.personName) { toast.error('Person name required'); return; }
    const level = eduForm.level === 'Other' ? eduForm.levelCustom : eduForm.level;
    if (!level) { toast.error('Level required'); return; }
    let fileUrl = ''; let fileName = ''; let fileType = '';
    if (eduFile) { fileUrl = await fileToBase64(eduFile); fileName = eduFile.name; fileType = eduFile.type.startsWith('image/') ? 'image' : 'pdf'; }
    const res = await fetch('/api/vault/education', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...eduForm, level, fileUrl: fileUrl || undefined, fileName: fileName || undefined, fileType: fileType || undefined }) });
    if (res.ok) { toast.success('Record added'); setEduOpen(false); resetEduForm(); fetchEdu(); } else toast.error('Failed to add');
  }
  async function handleEditEdu() {
    if (!editEduTarget) return;
    const level = eduForm.level === 'Other' ? eduForm.levelCustom : eduForm.level;
    let fileUrl = editEduTarget.fileUrl || ''; let fileName = editEduTarget.fileName || ''; let fileType = editEduTarget.fileType || '';
    if (eduFile) { fileUrl = await fileToBase64(eduFile); fileName = eduFile.name; fileType = eduFile.type.startsWith('image/') ? 'image' : 'pdf'; }
    const res = await fetch(`/api/vault/education/${editEduTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...eduForm, level, fileUrl, fileName, fileType }) });
    if (res.ok) { toast.success('Updated'); setEditEduOpen(false); setEditEduTarget(null); fetchEdu(); } else toast.error('Failed');
  }
  async function handleDeleteEdu(id: string) {
    const res = await fetch(`/api/vault/education/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchEdu(); } else toast.error('Failed');
  }
  function openEditEdu(r: EduRecord) {
    setEditEduTarget(r);
    const isCustom = !EDU_LEVELS.slice(0, -1).includes(r.level);
    setEduForm({ personName: r.personName, level: isCustom ? 'Other' : r.level, levelCustom: isCustom ? r.level : '', institution: r.institution || '', board: r.board || '', year: r.year || '', percentage: r.percentage || '', rollNumber: r.rollNumber || '', notes: r.notes || '' });
    setEduFile(null); setEditEduOpen(true);
  }
  function resetEduForm() { setEduForm({ personName: '', level: '10th', levelCustom: '', institution: '', board: '', year: '', percentage: '', rollNumber: '', notes: '' }); setEduFile(null); }

  // Personal CRUD
  async function handleAddPersonal() {
    if (!personalForm.personName) { toast.error('Person name required'); return; }
    const docType = personalForm.docType === 'Other' ? personalForm.docTypeCustom : personalForm.docType;
    if (!docType) { toast.error('Document type required'); return; }
    let fileUrl = ''; let fileName = ''; let fileType = '';
    if (personalFile) { fileUrl = await fileToBase64(personalFile); fileName = personalFile.name; fileType = personalFile.type.startsWith('image/') ? 'image' : 'pdf'; }
    const res = await fetch('/api/vault/personal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...personalForm, docType, fileUrl: fileUrl || undefined, fileName: fileName || undefined, fileType: fileType || undefined }) });
    if (res.ok) { toast.success('Document added'); setPersonalOpen(false); resetPersonalForm(); fetchPersonal(); } else toast.error('Failed');
  }
  async function handleEditPersonal() {
    if (!editPersonalTarget) return;
    const docType = personalForm.docType === 'Other' ? personalForm.docTypeCustom : personalForm.docType;
    let fileUrl = editPersonalTarget.fileUrl || ''; let fileName = editPersonalTarget.fileName || ''; let fileType = editPersonalTarget.fileType || '';
    if (personalFile) { fileUrl = await fileToBase64(personalFile); fileName = personalFile.name; fileType = personalFile.type.startsWith('image/') ? 'image' : 'pdf'; }
    const res = await fetch(`/api/vault/personal/${editPersonalTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...personalForm, docType, fileUrl, fileName, fileType }) });
    if (res.ok) { toast.success('Updated'); setEditPersonalOpen(false); setEditPersonalTarget(null); fetchPersonal(); } else toast.error('Failed');
  }
  async function handleDeletePersonal(id: string) {
    const res = await fetch(`/api/vault/personal/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchPersonal(); } else toast.error('Failed');
  }
  function openEditPersonal(d: PersonalDoc) {
    setEditPersonalTarget(d);
    const isCustom = !ID_TYPES.slice(0, -1).includes(d.docType);
    setPersonalForm({ personName: d.personName, docType: isCustom ? 'Other' : d.docType, docTypeCustom: isCustom ? d.docType : '', docNumber: d.docNumber || '', issuedBy: d.issuedBy || '', issuedDate: d.issuedDate || '', expiryDate: d.expiryDate || '', notes: d.notes || '' });
    setPersonalFile(null); setEditPersonalOpen(true);
  }
  function resetPersonalForm() { setPersonalForm({ personName: '', docType: 'Aadhaar Card', docTypeCustom: '', docNumber: '', issuedBy: '', issuedDate: '', expiryDate: '', notes: '' }); setPersonalFile(null); }

  // Doc CRUD
  async function handleAddDoc() {
    if (!docForm.name) { toast.error('Name is required'); return; }
    let fileUrl = ''; let fileName = ''; let fileType = ''; let fileSize = 0;
    if (docFile) { fileUrl = await fileToBase64(docFile); fileName = docFile.name; fileSize = docFile.size; if (docFile.type.startsWith('image/')) fileType = 'image'; else if (docFile.type === 'application/pdf') fileType = 'pdf'; else fileType = 'doc'; }
    const res = await fetch('/api/vault/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...docForm, fileUrl: fileUrl || undefined, fileName: fileName || undefined, fileType: fileType || undefined, fileSize: fileSize || undefined }) });
    if (res.ok) { toast.success('Document saved'); setDocOpen(false); setDocForm({ name: '', tag: '', idType: '', description: '' }); setDocFile(null); fetchDocs(); } else toast.error('Failed');
  }
  async function handleEditDoc() {
    if (!editDocTarget) return;
    let fileUrl = editDocTarget.fileUrl || ''; let fileName = editDocTarget.fileName || ''; let fileType = editDocTarget.fileType || ''; let fileSize = editDocTarget.fileSize || 0;
    if (docFile) { fileUrl = await fileToBase64(docFile); fileName = docFile.name; fileSize = docFile.size; if (docFile.type.startsWith('image/')) fileType = 'image'; else if (docFile.type === 'application/pdf') fileType = 'pdf'; else fileType = 'doc'; }
    const res = await fetch(`/api/vault/documents/${editDocTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...docForm, fileUrl, fileName, fileType, fileSize }) });
    if (res.ok) { toast.success('Updated'); setEditDocOpen(false); setEditDocTarget(null); fetchDocs(); } else toast.error('Failed');
  }
  async function handleDeleteDoc(id: string) {
    const res = await fetch(`/api/vault/documents/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchDocs(); } else toast.error('Failed');
  }
  function openEditDoc(d: DocVault) { setEditDocTarget(d); setDocForm({ name: d.name, tag: d.tag || '', idType: d.idType || '', description: d.description || '' }); setDocFile(null); setEditDocOpen(true); }

  const eduPersons      = [...new Set(eduRecords.map(r => r.personName.trim()).filter(Boolean))];
  const personalPersons = [...new Set(personalDocs.map(d => d.personName.trim()).filter(Boolean))];
  const docTags         = [...new Set(docVault.map(d => d.tag?.trim()).filter((tag): tag is string => Boolean(tag)))];

 

  // ── Render PIN check loading ───────────────────────────────────────────────
  if (pinCheckLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '13px', gap: '10px' }}>
        <span style={{ width: '16px', height: '16px', border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
        Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Render PIN lock screen ─────────────────────────────────────────────────
  if (requiresPin && !unlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', height: 'var(--topbar-height)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <i className="fi fi-rr-lock-alt" style={{ fontSize: '17px' }}></i>
  Private Vault
</span>
          </div>
        </div>
        <PinLockScreen onUnlock={() => setUnlocked(true)} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Main vault UI ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, height: 'var(--topbar-height)' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span>🔒</span> Private Vault
        </div>
        {/* Lock button */}
        {requiresPin && (
          <button onClick={() => setUnlocked(false)} title="Lock vault" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r2)', color: 'var(--text3)', cursor: 'pointer', padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
            Lock
          </button>
        )}
        {(section === 'passwords' || section === 'documents') && (
          <div style={{ position: 'relative', flex: 1 }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
          </div>
        )}
        {section === 'passwords' && <Btn variant="primary" onClick={() => { setVaultForm({ name: '', userId_field: '', password: '', registrationNumber: '', link: '', notes: '' }); setVaultOpen(true); }} style={{ flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg><span className="vault-btn-label">New Entry</span></Btn>}
        {section === 'education' && <Btn variant="primary" onClick={() => { resetEduForm(); setEduOpen(true); }} style={{ flexShrink: 0, marginLeft: 'auto' }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg><span className="vault-btn-label">Add Record</span></Btn>}
        {section === 'personal' && <Btn variant="primary" onClick={() => { resetPersonalForm(); setPersonalOpen(true); }} style={{ flexShrink: 0, marginLeft: 'auto' }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg><span className="vault-btn-label">Add Document</span></Btn>}
        {section === 'documents' && <Btn variant="primary" onClick={() => { setDocForm({ name: '', tag: '', idType: '', description: '' }); setDocFile(null); setDocOpen(true); }} style={{ flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg><span className="vault-btn-label">Upload</span></Btn>}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
        {SECTIONS.map((s) => (
          <button key={s.key} onClick={() => { setSection(s.key); setQuery(''); }} style={{ flex: 1, minWidth: '80px', padding: '11px 8px', fontSize: '12px', fontFamily: 'var(--font-syne)', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: section === s.key ? 'var(--accent)' : 'transparent', color: section === s.key ? 'var(--accent2)' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            <span><i className={s.icon}></i></span><span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {section === 'passwords' && (
          <div>
            {loading ? <LoadingState /> : entries.length === 0 ? <EmptyState icon="fi fi-rr-lock" title="No entries yet" desc="Store your usernames and passwords securely." /> : (
              <div className="vault-grid">{entries.map((e) => <PasswordCard key={e.id} entry={e} onEdit={openEditVault} onDelete={handleDeleteVault} onEmail={(entry) => { setSelected(entry); setSendEmailOpen(true); }} />)}</div>
            )}
          </div>
        )}
        {section === 'education' && (
          <div>
            {eduPersons.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Filter by</span>
                <PillBtn active={!eduPersonFilter} onClick={() => setEduPersonFilter('')}>All</PillBtn>
                {eduPersons.map(p => <PillBtn key={p} active={eduPersonFilter === p} onClick={() => setEduPersonFilter(eduPersonFilter === p ? '' : p)}>{p}</PillBtn>)}
              </div>
            )}
            {loading ? <LoadingState /> : eduRecords.length === 0 ? <EmptyState icon="fi fi-rr-graduation-cap" title="No education records" desc="Add certificates, mark sheets, and degrees." /> : (
              <div className="vault-grid">{eduRecords.map((r) => <EduCard key={r.id} record={r} onEdit={openEditEdu} onDelete={handleDeleteEdu} />)}</div>
            )}
          </div>
        )}
        {section === 'personal' && (
          <div>
            {personalPersons.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Filter by</span>
                <PillBtn active={!personalPersonFilter} onClick={() => setPersonalPersonFilter('')}>All</PillBtn>
                {personalPersons.map(p => <PillBtn key={p} active={personalPersonFilter === p} onClick={() => setPersonalPersonFilter(personalPersonFilter === p ? '' : p)}>{p}</PillBtn>)}
              </div>
            )}
            {loading ? <LoadingState /> : personalDocs.length === 0 ? <EmptyState icon="fi fi-rr-id-badge" title="No identity documents" desc="Store Aadhaar, PAN, Passport and more." /> : (
              <div className="vault-grid">{personalDocs.map((d) => <PersonalDocCard key={d.id} doc={d} onEdit={openEditPersonal} onDelete={handleDeletePersonal} />)}</div>
            )}
          </div>
        )}
        {section === 'documents' && (
          <div>
            {docTags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tag</span>
                <PillBtn active={!docTagFilter} onClick={() => setDocTagFilter('')}>All</PillBtn>
               {docTags.map(t => <PillBtn key={t} active={docTagFilter === t} onClick={() => setDocTagFilter(docTagFilter === t ? '' : t)}>{t}</PillBtn>)}
              </div>
            )}
            {loading ? <LoadingState /> : docVault.length === 0 ? <EmptyState icon="fi fi-rr-folder" title="No documents" desc="Upload invoices, certificates, photos, and more." /> : (
              <div className="vault-grid">{docVault.map((d) => <DocVaultCard key={d.id} doc={d} onEdit={openEditDoc} onDelete={handleDeleteDoc} />)}</div>
            )}
          </div>
        )}
      </div>

      {/* Modals — reuse same modal components as before */}
      <VaultEntryModal open={vaultOpen || editVaultOpen} onClose={() => { setVaultOpen(false); setEditVaultOpen(false); setSelected(null); }} title={editVaultOpen ? 'Edit Vault Entry' : 'New Vault Entry'} form={vaultForm} setForm={setVaultForm} onSave={editVaultOpen ? handleEditVault : handleAddVault} saveLabel={editVaultOpen ? 'Update' : 'Save Entry'} />
      <EduModal open={eduOpen} onClose={() => setEduOpen(false)} title="Add Education Record" form={eduForm} setForm={setEduForm} onFile={setEduFile} onSave={handleAddEdu} saveLabel="Add Record" />
      <EduModal open={editEduOpen} onClose={() => { setEditEduOpen(false); setEditEduTarget(null); }} title="Edit Education Record" form={eduForm} setForm={setEduForm} onFile={setEduFile} onSave={handleEditEdu} saveLabel="Update" />
      <PersonalDocModal open={personalOpen} onClose={() => setPersonalOpen(false)} title="Add Identity Document" form={personalForm} setForm={setPersonalForm} onFile={setPersonalFile} onSave={handleAddPersonal} saveLabel="Add Document" />
      <PersonalDocModal open={editPersonalOpen} onClose={() => { setEditPersonalOpen(false); setEditPersonalTarget(null); }} title="Edit Identity Document" form={personalForm} setForm={setPersonalForm} onFile={setPersonalFile} onSave={handleEditPersonal} saveLabel="Update" />
      <DocVaultModal open={docOpen} onClose={() => setDocOpen(false)} title="Upload Document" form={docForm} setForm={setDocForm} onFile={setDocFile} onSave={handleAddDoc} saveLabel="Save" />
      <DocVaultModal open={editDocOpen} onClose={() => { setEditDocOpen(false); setEditDocTarget(null); }} title="Edit Document" form={docForm} setForm={setDocForm} onFile={setDocFile} onSave={handleEditDoc} saveLabel="Update" />
      <SendEmailModal open={sendEmailOpen} onClose={() => { setSendEmailOpen(false); setSelected(null); }} entry={selected} />

      <style>{`
        .vault-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .vault-btn-label { display: inline; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 768px) { .vault-grid { grid-template-columns: 1fr; } .vault-btn-label { display: none; } }
      `}</style>
    </div>
  );
}

// ── Shared helper UI (same as original) ───────────────────────────────────────
function LoadingState() { return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Loading…</div>; }

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const isIconClass = icon.startsWith('fi ');  // Flaticon Uicon classes start with "fi "
  return (
    <div style={{
      padding: '48px 20px', textAlign: 'center', color: 'var(--text3)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    }}>
      {isIconClass ? (
        <i className={icon} style={{ fontSize: '40px' }}></i>
      ) : (
        <div style={{ fontSize: '40px', marginBottom: '4px' }}>{icon}</div>
      )}
      <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-syne)', color: 'var(--text2)' }}>
        {title}
      </div>
      <div style={{ fontSize: '12.5px' }}>{desc}</div>
    </div>
  );
}
function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: 500, border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent3)' : 'transparent', color: active ? 'var(--accent2)' : 'var(--text2)', transition: 'all 0.15s' }}>{children}</button>;
}
function CardShell({ children }: { children: React.ReactNode }) {
  return <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px', transition: 'border-color 0.15s' }} whileHover={{ borderColor: 'var(--border2)' }}>{children}</motion.div>;
}
function CardActions({ onEdit, onDelete, onEmail }: { onEdit: () => void; onDelete: () => void; onEmail?: () => void }) {
  return <div style={{ display: 'flex', gap: '4px', marginTop: '12px', justifyContent: 'flex-end' }}>
    {onEmail && <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEmail(); }} style={{ fontSize: '11px', gap: '4px' }}><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="12" height="9" rx="2"/><path d="M2 7l6 4 6-4"/></svg>Email</Btn>}
    <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(); }}><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5l2 2-6.5 6.5H2v-1.5L8.5 2z"/></svg></Btn>
    <Btn size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8"/></svg></Btn>
  </div>;
}
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>{label}</span>{children}</div>;
}
function CopyBtn({ text }: { text: string }) {
  return <button onClick={() => copyText(text)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', padding: '2px', display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="2"/><rect x="3" y="3" width="8" height="8" rx="2"/></svg></button>;
}
function FilePreview({ fileUrl, fileName, fileType }: { fileUrl?: string; fileName?: string; fileType?: string }) {
  const [open, setOpen] = useState(false);
  if (!fileUrl) return null;
  return <div style={{ marginTop: '8px' }}>
    <button onClick={() => setOpen(!open)} style={{ fontSize: '11px', color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '0' }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{fileType === 'image' ? <><rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="6" cy="6" r="1.5"/><path d="M2 10l4-4 3 3 2-2 3 3"/></> : <><path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5z"/><path d="M10 2v4h4"/></>}</svg>
      {open ? 'Hide' : 'View'} {fileName || 'file'}
    </button>
    {open && <div style={{ marginTop: '8px', borderRadius: 'var(--r2)', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '300px' }}>
      {fileType === 'image' ? <img src={fileUrl} alt={fileName} style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '300px', objectFit: 'contain' }} /> : <div style={{ padding: '16px', background: 'var(--bg3)', textAlign: 'center' }}><a href={fileUrl} download={fileName} style={{ color: 'var(--accent2)', fontSize: '13px', textDecoration: 'none' }}>📥 Download {fileName}</a></div>}
    </div>}
  </div>;
}
function PasswordCard({ entry, onEdit, onDelete, onEmail }: { entry: VaultEntry; onEdit: (e: VaultEntry) => void; onDelete: (id: string) => void; onEmail: (e: VaultEntry) => void }) {
  const [expanded, setExpanded] = useState(false);
  return <CardShell>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
  <i className="fi fi-rr-lock" style={{ fontSize: '16px' }}></i>
</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{entry.name}</div>
        {entry.link && <a href={entry.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--accent2)', textDecoration: 'none', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>{entry.link.replace(/^https?:\/\//, '')}</a>}
      </div>
    </div>
    <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text2)', fontSize: '12px', marginBottom: expanded ? '8px' : '0' }}>
      <span>Click to {expanded ? 'hide' : 'view'} credentials</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M2 4l4 4 4-4"/></svg>
    </button>
    <AnimatePresence>
      {expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entry.userId_field && <DetailRow label="User ID"><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '13px' }}>{entry.userId_field}</span><CopyBtn text={entry.userId_field} /></div></DetailRow>}
          {entry.registrationNumber && <DetailRow label="Reg. No."><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '13px' }}>{entry.registrationNumber}</span><CopyBtn text={entry.registrationNumber} /></div></DetailRow>}
          <DetailRow label="Password"><MaskedField value={entry.password} label="Password" /></DetailRow>
          {entry.notes && <DetailRow label="Notes"><span style={{ fontSize: '12px', color: 'var(--text2)' }}>{entry.notes}</span></DetailRow>}
        </div>
      </motion.div>}
    </AnimatePresence>
    <CardActions onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} onEmail={() => onEmail(entry)} />
  </CardShell>;
}
function EduCard({ record, onEdit, onDelete }: { record: EduRecord; onEdit: (r: EduRecord) => void; onDelete: (id: string) => void }) {
  return <CardShell>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(34,199,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}><i className="fi fi-rr-graduation-cap" style={{ fontSize: '18px' }}></i></div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{record.level}</span>
          <span style={{ fontSize: '10px', background: 'rgba(34,199,122,0.12)', color: 'var(--green)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>{record.personName}</span>
        </div>
        {record.institution && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{record.institution}</div>}
        {record.board && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Board: {record.board}</div>}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text2)' }}>
      {record.year && <span>📅 {record.year}</span>}
      {record.percentage && <span>📊 {record.percentage}%</span>}
      {record.rollNumber && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🔢 {record.rollNumber} <CopyBtn text={record.rollNumber} /></span>}
    </div>
    {record.notes && <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '6px' }}>{record.notes}</div>}
    <FilePreview fileUrl={record.fileUrl} fileName={record.fileName} fileType={record.fileType} />
    <CardActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record.id)} />
  </CardShell>;
}
function PersonalDocCard({ doc, onEdit, onDelete }: { doc: PersonalDoc; onEdit: (d: PersonalDoc) => void; onDelete: (id: string) => void }) {
  const iconClass: Record<string, string> = {
  'Aadhaar Card': 'fi fi-rr-id-badge',
  'PAN Card': 'fi fi-rr-credit-card',
  'Passport': 'fi fi-rr-passport',
  'Voter ID': 'fi fi-rr-vote-yea',
  'Driving License': 'fi fi-rr-car',
  'Birth Certificate': 'fi fi-rr-file-certificate',
  'ABHA ID': 'fi fi-rr-heart',        // or 'fi fi-rr-stethoscope'
};
  return <CardShell>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
     <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(77,159,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
  <i className={iconClass[doc.docType] || 'fi fi-rr-file'} style={{ fontSize: '18px' }}></i>
</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{doc.docType}</span>
          <span style={{ fontSize: '10px', background: 'rgba(77,159,255,0.12)', color: 'var(--blue)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>{doc.personName}</span>
        </div>
        {doc.docNumber && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{doc.docNumber} <CopyBtn text={doc.docNumber} /></div>}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11.5px', color: 'var(--text3)' }}>
      {doc.issuedBy && <span>By: {doc.issuedBy}</span>}
      {doc.issuedDate && <span>Issued: {doc.issuedDate}</span>}
      {doc.expiryDate && <span style={{ color: 'var(--amber)' }}>Expires: {doc.expiryDate}</span>}
    </div>
    {doc.notes && <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '6px' }}>{doc.notes}</div>}
    <FilePreview fileUrl={doc.fileUrl} fileName={doc.fileName} fileType={doc.fileType} />
    <CardActions onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc.id)} />
  </CardShell>;
}
function DocVaultCard({ doc, onEdit, onDelete }: { doc: DocVault; onEdit: (d: DocVault) => void; onDelete: (id: string) => void }) {
 const typeIconClass: Record<string, string> = {
  image: 'fi fi-rr-picture',
  pdf: 'fi fi-rr-file-pdf',
  doc: 'fi fi-rr-file-word',
};
  return <CardShell>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
     <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,181,71,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
  <i className={typeIconClass[doc.fileType || ''] || 'fi fi-rr-folder'} style={{ fontSize: '18px' }}></i>
</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>{doc.name}</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {doc.tag && <span style={{ fontSize: '10px', background: 'rgba(255,181,71,0.12)', color: 'var(--amber)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>{doc.tag}</span>}
          {doc.idType && <span style={{ fontSize: '10px', background: 'var(--bg4)', color: 'var(--text3)', padding: '1px 6px', borderRadius: '4px' }}>{doc.idType}</span>}
          {doc.fileSize && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{fileSize(doc.fileSize)}</span>}
        </div>
      </div>
    </div>
    {doc.description && <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>{doc.description}</div>}
    <FilePreview fileUrl={doc.fileUrl} fileName={doc.fileName} fileType={doc.fileType} />
    <CardActions onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc.id)} />
  </CardShell>;
}

// ── Form Modals ───────────────────────────────────────────────────────────────
function VaultEntryModal({ open, onClose, title, form, setForm, onSave, saveLabel }: { open: boolean; onClose: () => void; title: string; form: { name: string; userId_field: string; password: string; registrationNumber: string; link: string; notes: string }; setForm: (f: typeof form) => void; onSave: () => void; saveLabel: string }) {
  return <Modal open={open} onClose={onClose} title={title} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={onSave}>{saveLabel}</Btn></>}>
    <FormField label="Name / Label *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='e.g. "Ranjan", "My Bank"' /></FormField>
    <FormField label="User ID / Username"><Input value={form.userId_field} onChange={(e) => setForm({ ...form, userId_field: e.target.value })} placeholder="Login username or user ID" /></FormField>
    <FormField label="Password"><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" /></FormField>
    <FormField label="Registration Number"><Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="Optional" /></FormField>
    <FormField label="Link / URL"><Input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></FormField>
    <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" /></FormField>
  </Modal>;
}
function EduModal({ open, onClose, title, form, setForm, onFile, onSave, saveLabel }: { open: boolean; onClose: () => void; title: string; form: { personName: string; level: string; levelCustom: string; institution: string; board: string; year: string; percentage: string; rollNumber: string; notes: string }; setForm: (f: typeof form) => void; onFile: (f: File | null) => void; onSave: () => void; saveLabel: string }) {
  return <Modal open={open} onClose={onClose} title={title} width={480} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={onSave}>{saveLabel}</Btn></>}>
    <FormField label="Person Name *"><Input value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} placeholder='e.g. "Ranjan", "Mom"' /></FormField>
    <FormField label="Education Level *">
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: form.level === 'Other' ? '8px' : '0' }}>
        {EDU_LEVELS.map(l => <button key={l} onClick={() => setForm({ ...form, level: l })} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: `1px solid ${form.level === l ? 'var(--accent)' : 'var(--border)'}`, background: form.level === l ? 'var(--accent3)' : 'transparent', color: form.level === l ? 'var(--accent2)' : 'var(--text2)', fontWeight: 500 }}>{l}</button>)}
      </div>
      {form.level === 'Other' && <Input value={form.levelCustom} onChange={(e) => setForm({ ...form, levelCustom: e.target.value })} placeholder="Type custom level…" />}
    </FormField>
    <FormField label="Institution"><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="School / College name" /></FormField>
    <FormField label="Board / University"><Input value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} placeholder="e.g. CBSE, CGBSE" /></FormField>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <FormField label="Year"><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2022" /></FormField>
      <FormField label="% / CGPA"><Input value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} placeholder="85.4" /></FormField>
    </div>
    <FormField label="Roll / Reg. Number"><Input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} placeholder="Roll number" /></FormField>
    <FormField label="Certificate / Marksheet"><FileUploadBtn onFile={onFile} accept="image/*,application/pdf" /></FormField>
    <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" /></FormField>
  </Modal>;
}
function PersonalDocModal({ open, onClose, title, form, setForm, onFile, onSave, saveLabel }: { open: boolean; onClose: () => void; title: string; form: { personName: string; docType: string; docTypeCustom: string; docNumber: string; issuedBy: string; issuedDate: string; expiryDate: string; notes: string }; setForm: (f: typeof form) => void; onFile: (f: File | null) => void; onSave: () => void; saveLabel: string }) {
  return <Modal open={open} onClose={onClose} title={title} width={480} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={onSave}>{saveLabel}</Btn></>}>
    <FormField label="Person Name *"><Input value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} placeholder='e.g. "Self", "Dad"' /></FormField>
    <FormField label="Document Type *">
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: form.docType === 'Other' ? '8px' : '0' }}>
        {ID_TYPES.map(t => <button key={t} onClick={() => setForm({ ...form, docType: t })} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: `1px solid ${form.docType === t ? 'var(--accent)' : 'var(--border)'}`, background: form.docType === t ? 'var(--accent3)' : 'transparent', color: form.docType === t ? 'var(--accent2)' : 'var(--text2)', fontWeight: 500 }}>{t}</button>)}
      </div>
      {form.docType === 'Other' && <Input value={form.docTypeCustom} onChange={(e) => setForm({ ...form, docTypeCustom: e.target.value })} placeholder="Type custom doc type…" />}
    </FormField>
    <FormField label="Document Number"><Input value={form.docNumber} onChange={(e) => setForm({ ...form, docNumber: e.target.value })} placeholder="e.g. 1234-5678-9012" /></FormField>
    <FormField label="Issued By"><Input value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} placeholder="Issuing authority" /></FormField>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <FormField label="Issued Date"><Input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} /></FormField>
      <FormField label="Expiry Date"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></FormField>
    </div>
    <FormField label="Document Image / PDF"><FileUploadBtn onFile={onFile} accept="image/*,application/pdf" /></FormField>
    <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" /></FormField>
  </Modal>;
}
function DocVaultModal({ open, onClose, title, form, setForm, onFile, onSave, saveLabel }: { open: boolean; onClose: () => void; title: string; form: { name: string; tag: string; idType: string; description: string }; setForm: (f: typeof form) => void; onFile: (f: File | null) => void; onSave: () => void; saveLabel: string }) {
  return <Modal open={open} onClose={onClose} title={title} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={onSave}>{saveLabel}</Btn></>}>
    <FormField label="Document Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='e.g. "Offer Letter"' /></FormField>
    <FormField label="Tag"><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder='e.g. "invoice", "certificate"' /></FormField>
    <FormField label="ID Type / Category"><Input value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })} placeholder='e.g. "Government", "Work"' /></FormField>
    <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" /></FormField>
    <FormField label="File (Image / PDF / Doc)"><FileUploadBtn onFile={onFile} accept="image/*,application/pdf,.doc,.docx,.txt" /></FormField>
  </Modal>;
}
function FileUploadBtn({ onFile, accept }: { onFile: (f: File | null) => void; accept: string }) {
  const [name, setName] = useState('');
  return <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: 'var(--bg3)', border: '1px dashed var(--border2)', borderRadius: 'var(--r2)', cursor: 'pointer', fontSize: '13px', color: 'var(--text2)' }}>
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/></svg>
    {name || 'Choose file…'}
    <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0] || null; setName(f?.name || ''); onFile(f); }} />
  </label>;
}