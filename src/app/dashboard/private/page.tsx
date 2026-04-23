'use client';
// src/app/dashboard/private/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Btn } from '@/components/ui/FormField';
import { VaultEntry, EducationCert, PersonalDoc, DocumentVaultItem, PersonalDocType } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────
const VAULT_CATEGORIES = ['all', 'general', 'educational', 'bank', 'social', 'work'] as const;
const VAULT_CATEGORY_COLORS: Record<string, string> = {
  general: 'var(--text3)', educational: 'var(--blue)', bank: 'var(--green)',
  social: 'var(--pink)', work: 'var(--amber)',
};
const EXAM_PRESETS = ['10th', '12th', 'Graduation', 'Post-Graduation', 'Diploma', 'PhD', 'Professional Certification'];
const PERSONAL_DOC_TYPES: { value: PersonalDocType; label: string }[] = [
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'aapar_id', label: 'Aapar ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'custom', label: 'Custom / Other' },
];
const DOC_TYPE_LABELS: Record<string, string> = {
  pan_card: 'PAN Card', aadhar: 'Aadhar Card', aapar_id: 'Aapar ID',
  passport: 'Passport', voter_id: 'Voter ID', driving_license: 'Driving License', custom: 'Custom',
};

type Tab = 'vault' | 'education' | 'personal' | 'documents';

// ── Utility: file → base64 ────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function copyToClipboard(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text).then(() => toast.success(label + ' copied!')).catch(() => toast.error('Copy failed'));
}

// ── Email Send Modal ──────────────────────────────────────────────────────────
function SendEmailModal({ entryId, entryName, open, onClose }: { entryId: string; entryName: string; open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!email) return;
    setSending(true);
    const res = await fetch(`/api/vault/${entryId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: email }),
    });
    setSending(false);
    if (res.ok) { toast.success('Email sent!'); onClose(); setEmail(''); }
    else toast.error('Failed to send email');
  }

  return (
    <Modal open={open} onClose={onClose} title={`Send "${entryName}" via Email`}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={handleSend}>{sending ? 'Sending…' : 'Send'}</Btn></>}>
      <FormField label="Recipient Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recipient@email.com" />
      </FormField>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
        This will send the name, user ID, password, and link to the recipient's inbox.
      </div>
    </Modal>
  );
}

// ── Vault Card ────────────────────────────────────────────────────────────────
function VaultCard({ entry, onEdit, onDelete, onSend }: { entry: VaultEntry; onEdit: () => void; onDelete: () => void; onSend: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}
    >
      {/* Card Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--r2)', background: 'var(--bg4)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '15px' }}>{categoryEmoji(entry.category)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: VAULT_CATEGORY_COLORS[entry.category] || 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{entry.category}</span>
            {entry.userId_field && <span style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.userId_field}</span>}
          </div>
        </div>
        <svg style={{ color: 'var(--text3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" /></svg>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              {/* Fields */}
              {entry.userId_field && (
                <ExpandedField label="User ID / Email" value={entry.userId_field} onCopy={() => copyToClipboard(entry.userId_field!, 'User ID')} />
              )}
              {entry.registrationNumber && (
                <ExpandedField label="Registration No." value={entry.registrationNumber} onCopy={() => copyToClipboard(entry.registrationNumber!, 'Registration No.')} />
              )}
              {entry.password && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Password</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', color: 'var(--text)', background: 'var(--bg4)', padding: '6px 10px', borderRadius: 'var(--r3)', letterSpacing: showPass ? '0' : '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {showPass ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
                    </div>
                    <button onClick={() => setShowPass((v) => !v)} style={iconBtnStyle} title={showPass ? 'Hide' : 'Show'}>
                      {showPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button onClick={() => copyToClipboard(entry.password!, 'Password')} style={iconBtnStyle} title="Copy">
                      <CopyIcon />
                    </button>
                  </div>
                </div>
              )}
              {entry.link && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Link</div>
                  <a href={entry.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--accent2)', wordBreak: 'break-all' }}>{entry.link}</a>
                </div>
              )}
              {entry.notes && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.6 }}>{entry.notes}</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                <Btn size="sm" variant="ghost" onClick={onSend}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L6 9M13 2H8M13 2v5"/><path d="M11 4H3a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V8"/></svg>
                  Email
                </Btn>
                <Btn size="sm" variant="ghost" onClick={onEdit}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExpandedField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text)', background: 'var(--bg4)', padding: '6px 10px', borderRadius: 'var(--r3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        <button onClick={onCopy} style={iconBtnStyle} title="Copy"><CopyIcon /></button>
      </div>
    </div>
  );
}

// ── Education Card ─────────────────────────────────────────────────────────────
function EducationCard({ cert, onEdit, onDelete }: { cert: Omit<EducationCert, 'fileData'>; onEdit: () => void; onDelete: () => void }) {
  const [showFile, setShowFile] = useState(false);
  const [fileData, setFileData] = useState<{ fileData: string; fileType: string; fileName: string } | null>(null);

  async function loadFile() {
    if (fileData) { setShowFile(true); return; }
    const res = await fetch(`/api/education/${cert.id}`);
    const { cert: full } = await res.json();
    if (full.fileData) { setFileData({ fileData: full.fileData, fileType: full.fileType, fileName: full.fileName }); setShowFile(true); }
    else toast('No file attached');
  }

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', background: 'var(--accent3)', color: 'var(--accent2)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{cert.ownerName}</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{cert.examName}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Btn size="sm" variant="ghost" onClick={onEdit}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {cert.institution && <InfoChip label="Institution" value={cert.institution} />}
        {cert.year && <InfoChip label="Year" value={cert.year} />}
        {cert.grade && <InfoChip label="Grade / %ile" value={cert.grade} />}
        {cert.rollNumber && <InfoChip label="Roll No." value={cert.rollNumber} onCopy={() => copyToClipboard(cert.rollNumber!, 'Roll No.')} />}
      </div>
      {cert.notes && <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', lineHeight: 1.5 }}>{cert.notes}</div>}

      {cert.fileName && (
        <button onClick={loadFile} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent2)', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '5px 10px', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 13h8M8 2v8M5 7l3 3 3-3"/></svg>
          {cert.fileName}
        </button>
      )}

      {/* File preview modal */}
      {showFile && fileData && (
        <FilePreviewModal fileData={fileData.fileData} fileType={fileData.fileType} fileName={fileData.fileName} onClose={() => setShowFile(false)} />
      )}
    </motion.div>
  );
}

// ── Personal Doc Card ──────────────────────────────────────────────────────────
function PersonalDocCard({ doc, onEdit, onDelete }: { doc: Omit<PersonalDoc, 'fileData'>; onEdit: () => void; onDelete: () => void }) {
  const [showFile, setShowFile] = useState(false);
  const [fileData, setFileData] = useState<{ fileData: string; fileType: string; fileName: string } | null>(null);

  async function loadFile() {
    if (fileData) { setShowFile(true); return; }
    const res = await fetch(`/api/personal-docs/${doc.id}`);
    const { doc: full } = await res.json();
    if (full.fileData) { setFileData({ fileData: full.fileData, fileType: full.fileType, fileName: full.fileName }); setShowFile(true); }
    else toast('No file attached');
  }

  const label = doc.docType === 'custom' ? (doc.customLabel || 'Custom') : DOC_TYPE_LABELS[doc.docType];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', background: 'var(--bg4)', color: 'var(--text2)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>{doc.ownerName}</span>
            <span style={{ fontSize: '10px', color: 'var(--amber)', fontWeight: 600 }}>{label}</span>
          </div>
          {doc.docNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text)', letterSpacing: '1px' }}>{doc.docNumber}</span>
              <button onClick={() => copyToClipboard(doc.docNumber!, 'Doc number')} style={iconBtnStyle}><CopyIcon /></button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Btn size="sm" variant="ghost" onClick={onEdit}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
        </div>
      </div>

      {doc.notes && <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', lineHeight: 1.5 }}>{doc.notes}</div>}

      {doc.fileName && (
        <button onClick={loadFile} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent2)', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '5px 10px', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 13h8M8 2v8M5 7l3 3 3-3"/></svg>
          {doc.fileName}
        </button>
      )}

      {showFile && fileData && (
        <FilePreviewModal fileData={fileData.fileData} fileType={fileData.fileType} fileName={fileData.fileName} onClose={() => setShowFile(false)} />
      )}
    </motion.div>
  );
}

// ── Document Vault Card ────────────────────────────────────────────────────────
function DocVaultCard({ item, onEdit, onDelete }: { item: Omit<DocumentVaultItem, 'fileData'>; onEdit: () => void; onDelete: () => void }) {
  const [showFile, setShowFile] = useState(false);
  const [fileData, setFileData] = useState<{ fileData: string; fileType: string; fileName: string } | null>(null);

  async function loadFile() {
    if (fileData) { setShowFile(true); return; }
    const res = await fetch(`/api/document-vault/${item.id}`);
    const { item: full } = await res.json();
    setFileData({ fileData: full.fileData, fileType: full.fileType, fileName: full.fileName });
    setShowFile(true);
  }

  const isImage = item.fileType?.startsWith('image/');
  const isPdf = item.fileType === 'application/pdf';

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--r2)', background: isImage ? 'var(--accent3)' : isPdf ? 'rgba(255,77,106,0.1)' : 'var(--bg4)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
          {isImage ? '🖼️' : isPdf ? '📄' : '📁'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{item.name}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {item.tag && <span style={{ fontSize: '10px', background: 'var(--bg4)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '10px', border: '1px solid var(--border)' }}>{item.tag}</span>}
            {item.idType && <span style={{ fontSize: '10px', background: 'var(--bg4)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '10px', border: '1px solid var(--border)' }}>{item.idType}</span>}
            {item.fileSize && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{formatBytes(item.fileSize)}</span>}
          </div>
          {item.notes && <div style={{ fontSize: '11.5px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '8px' }}>{item.notes}</div>}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Btn size="sm" variant="ghost" onClick={loadFile}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>
              View
            </Btn>
            <Btn size="sm" variant="ghost" onClick={onEdit}>Edit</Btn>
            <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
          </div>
        </div>
      </div>

      {showFile && fileData && (
        <FilePreviewModal fileData={fileData.fileData} fileType={fileData.fileType} fileName={fileData.fileName} onClose={() => setShowFile(false)} />
      )}
    </motion.div>
  );
}

// ── File Preview Modal ─────────────────────────────────────────────────────────
function FilePreviewModal({ fileData, fileType, fileName, onClose }: { fileData: string; fileType: string; fileName: string; onClose: () => void }) {
  const dataUrl = `data:${fileType};base64,${fileData}`;
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';

  function download() {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
  }

  return (
    <Modal open onClose={onClose} title={fileName} width={680}
      footer={<><Btn variant="ghost" onClick={download}>Download</Btn><Btn variant="ghost" onClick={onClose}>Close</Btn></>}>
      <div style={{ textAlign: 'center' }}>
        {isImage && <img src={dataUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--r2)' }} />}
        {isPdf && <iframe src={dataUrl} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: 'var(--r2)' }} title={fileName} />}
        {!isImage && !isPdf && <div style={{ padding: '40px', color: 'var(--text3)' }}>Preview not available. <button onClick={download} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>Download</button></div>}
      </div>
    </Modal>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function InfoChip({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div style={{ background: 'var(--bg4)', borderRadius: 'var(--r3)', padding: '6px 10px' }}>
      <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text)' }}>{value}</span>
        {onCopy && <button onClick={onCopy} style={{ ...iconBtnStyle, width: '16px', height: '16px', padding: 0 }}><CopyIcon size={10} /></button>}
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = { background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0 };

function CopyIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"/></svg>;
}
function EyeIcon() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>;
}
function EyeOffIcon() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l12 12M6.5 6.6A3 3 0 0010 10M4 4.3C2.5 5.5 1.5 7 1.5 7S4.5 12 8 12c1 0 2-.3 2.8-.8M8 4c3.5 0 6.5 5 6.5 5s-.7 1.4-2 2.6"/></svg>;
}

function categoryEmoji(cat: string) {
  const map: Record<string, string> = { general: '🔑', educational: '🎓', bank: '🏦', social: '💬', work: '💼' };
  return map[cat] || '🔑';
}

// ── File Upload Field ──────────────────────────────────────────────────────────
function FileUploadField({ label, onChange, currentFileName }: { label: string; onChange: (data: string, type: string, name: string) => void; currentFileName?: string }) {
  const [fileName, setFileName] = useState(currentFileName || '');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be < 5 MB'); return; }
    const b64 = await fileToBase64(file);
    setFileName(file.name);
    onChange(b64, file.type, file.name);
    e.target.value = '';
  }

  return (
    <FormField label={label}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--bg3)', border: '1px dashed var(--border2)', borderRadius: 'var(--r2)', padding: '10px 14px', transition: 'border-color 0.15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border2)')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text3)', flexShrink: 0 }}><path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/></svg>
        <span style={{ fontSize: '13px', color: fileName ? 'var(--text)' : 'var(--text3)' }}>{fileName || 'Upload image or PDF (max 5 MB)'}</span>
        <input type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: 'none' }} />
      </label>
    </FormField>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function PrivatePage() {
  const [activeTab, setActiveTab] = useState<Tab>('vault');

  // ── Vault state ─────────────────────────────────────────────────────────────
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultCategory, setVaultCategory] = useState<string>('all');
  const [vaultQuery, setVaultQuery] = useState('');
  const [vaultModal, setVaultModal] = useState(false);
  const [editingVault, setEditingVault] = useState<VaultEntry | null>(null);
  const [vaultForm, setVaultForm] = useState({ name: '', userId_field: '', password: '', registrationNumber: '', link: '', category: 'general', notes: '' });
  const [sendEmailModal, setSendEmailModal] = useState<{ id: string; name: string } | null>(null);

  // ── Education state ──────────────────────────────────────────────────────────
  const [certs, setCerts] = useState<Omit<EducationCert, 'fileData'>[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certOwnerFilter, setCertOwnerFilter] = useState('');
  const [certModal, setCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<Omit<EducationCert, 'fileData'> | null>(null);
  const [certForm, setCertForm] = useState({ ownerName: '', examName: '', institution: '', year: '', grade: '', rollNumber: '', notes: '' });
  const [certFileData, setCertFileData] = useState('');
  const [certFileType, setCertFileType] = useState('');
  const [certFileName, setCertFileName] = useState('');
  const [customExam, setCustomExam] = useState('');

  // ── Personal docs state ──────────────────────────────────────────────────────
  const [personalDocs, setPersonalDocs] = useState<Omit<PersonalDoc, 'fileData'>[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docOwnerFilter, setDocOwnerFilter] = useState('');
  const [docModal, setDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Omit<PersonalDoc, 'fileData'> | null>(null);
  const [docForm, setDocForm] = useState({ ownerName: '', docType: 'pan_card' as PersonalDocType, customLabel: '', docNumber: '', notes: '' });
  const [docFileData, setDocFileData] = useState('');
  const [docFileType, setDocFileType] = useState('');
  const [docFileName, setDocFileName] = useState('');

  // ── Document vault state ─────────────────────────────────────────────────────
  const [docVaultItems, setDocVaultItems] = useState<Omit<DocumentVaultItem, 'fileData'>[]>([]);
  const [docVaultLoading, setDocVaultLoading] = useState(false);
  const [docVaultQuery, setDocVaultQuery] = useState('');
  const [docVaultModal, setDocVaultModal] = useState(false);
  const [editingDocVault, setEditingDocVault] = useState<Omit<DocumentVaultItem, 'fileData'> | null>(null);
  const [docVaultForm, setDocVaultForm] = useState({ name: '', tag: '', idType: '', notes: '' });
  const [dvFileData, setDvFileData] = useState('');
  const [dvFileType, setDvFileType] = useState('');
  const [dvFileName, setDvFileName] = useState('');
  const [dvFileSize, setDvFileSize] = useState(0);

  // ── Fetchers ─────────────────────────────────────────────────────────────────
  const fetchVault = useCallback(async () => {
    setVaultLoading(true);
    const params = new URLSearchParams();
    if (vaultCategory !== 'all') params.set('category', vaultCategory);
    if (vaultQuery) params.set('q', vaultQuery);
    const res = await fetch(`/api/vault?${params}`);
    const { entries } = await res.json();
    setVaultEntries(entries || []);
    setVaultLoading(false);
  }, [vaultCategory, vaultQuery]);

  const fetchCerts = useCallback(async () => {
    setCertsLoading(true);
    const params = new URLSearchParams();
    if (certOwnerFilter) params.set('ownerName', certOwnerFilter);
    const res = await fetch(`/api/education?${params}`);
    const { certs: data } = await res.json();
    setCerts(data || []);
    setCertsLoading(false);
  }, [certOwnerFilter]);

  const fetchPersonalDocs = useCallback(async () => {
    setDocsLoading(true);
    const params = new URLSearchParams();
    if (docOwnerFilter) params.set('ownerName', docOwnerFilter);
    const res = await fetch(`/api/personal-docs?${params}`);
    const { docs: data } = await res.json();
    setPersonalDocs(data || []);
    setDocsLoading(false);
  }, [docOwnerFilter]);

  const fetchDocVault = useCallback(async () => {
    setDocVaultLoading(true);
    const params = new URLSearchParams();
    if (docVaultQuery) params.set('q', docVaultQuery);
    const res = await fetch(`/api/document-vault?${params}`);
    const { items } = await res.json();
    setDocVaultItems(items || []);
    setDocVaultLoading(false);
  }, [docVaultQuery]);

  useEffect(() => { fetchVault(); }, [fetchVault]);
  useEffect(() => { if (activeTab === 'education') fetchCerts(); }, [activeTab, fetchCerts]);
  useEffect(() => { if (activeTab === 'personal') fetchPersonalDocs(); }, [activeTab, fetchPersonalDocs]);
  useEffect(() => { if (activeTab === 'documents') fetchDocVault(); }, [activeTab, fetchDocVault]);

  // ── Vault CRUD ────────────────────────────────────────────────────────────────
  function openVaultNew() {
    setEditingVault(null);
    setVaultForm({ name: '', userId_field: '', password: '', registrationNumber: '', link: '', category: 'general', notes: '' });
    setVaultModal(true);
  }
  function openVaultEdit(entry: VaultEntry) {
    setEditingVault(entry);
    setVaultForm({ name: entry.name, userId_field: entry.userId_field || '', password: entry.password || '', registrationNumber: entry.registrationNumber || '', link: entry.link || '', category: entry.category, notes: entry.notes || '' });
    setVaultModal(true);
  }
  async function saveVault() {
    const url = editingVault ? `/api/vault/${editingVault.id}` : '/api/vault';
    const method = editingVault ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vaultForm) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success(editingVault ? 'Updated' : 'Entry added');
    setVaultModal(false);
    fetchVault();
  }
  async function deleteVault(id: string) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/vault/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    fetchVault();
  }

  // ── Cert CRUD ─────────────────────────────────────────────────────────────────
  function openCertNew() {
    setEditingCert(null);
    setCertForm({ ownerName: '', examName: '', institution: '', year: '', grade: '', rollNumber: '', notes: '' });
    setCertFileData(''); setCertFileType(''); setCertFileName(''); setCustomExam('');
    setCertModal(true);
  }
  function openCertEdit(cert: Omit<EducationCert, 'fileData'>) {
    setEditingCert(cert);
    setCertForm({ ownerName: cert.ownerName, examName: cert.examName, institution: cert.institution || '', year: cert.year || '', grade: cert.grade || '', rollNumber: cert.rollNumber || '', notes: cert.notes || '' });
    setCertFileName(cert.fileName || ''); setCertFileData(''); setCertFileType('');
    setCustomExam(EXAM_PRESETS.includes(cert.examName) ? '' : cert.examName);
    setCertModal(true);
  }
  async function saveCert() {
    const examName = customExam.trim() || certForm.examName;
    if (!certForm.ownerName || !examName) { toast.error('Owner name and exam name required'); return; }
    const payload = { ...certForm, examName, fileData: certFileData || undefined, fileType: certFileType || undefined, fileName: certFileName || undefined };
    const url = editingCert ? `/api/education/${editingCert.id}` : '/api/education';
    const method = editingCert ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success(editingCert ? 'Updated' : 'Certificate added');
    setCertModal(false);
    fetchCerts();
  }
  async function deleteCert(id: string) {
    if (!confirm('Delete this certificate?')) return;
    await fetch(`/api/education/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    fetchCerts();
  }

  // ── Personal Doc CRUD ─────────────────────────────────────────────────────────
  function openDocNew() {
    setEditingDoc(null);
    setDocForm({ ownerName: '', docType: 'pan_card', customLabel: '', docNumber: '', notes: '' });
    setDocFileData(''); setDocFileType(''); setDocFileName('');
    setDocModal(true);
  }
  function openDocEdit(doc: Omit<PersonalDoc, 'fileData'>) {
    setEditingDoc(doc);
    setDocForm({ ownerName: doc.ownerName, docType: doc.docType, customLabel: doc.customLabel || '', docNumber: doc.docNumber || '', notes: doc.notes || '' });
    setDocFileName(doc.fileName || ''); setDocFileData(''); setDocFileType('');
    setDocModal(true);
  }
  async function saveDoc() {
    if (!docForm.ownerName || !docForm.docType) { toast.error('Owner and type required'); return; }
    const payload = { ...docForm, fileData: docFileData || undefined, fileType: docFileType || undefined, fileName: docFileName || undefined };
    const url = editingDoc ? `/api/personal-docs/${editingDoc.id}` : '/api/personal-docs';
    const method = editingDoc ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success(editingDoc ? 'Updated' : 'Document added');
    setDocModal(false);
    fetchPersonalDocs();
  }
  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/personal-docs/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    fetchPersonalDocs();
  }

  // ── Doc Vault CRUD ─────────────────────────────────────────────────────────────
  function openDocVaultNew() {
    setEditingDocVault(null);
    setDocVaultForm({ name: '', tag: '', idType: '', notes: '' });
    setDvFileData(''); setDvFileType(''); setDvFileName(''); setDvFileSize(0);
    setDocVaultModal(true);
  }
  function openDocVaultEdit(item: Omit<DocumentVaultItem, 'fileData'>) {
    setEditingDocVault(item);
    setDocVaultForm({ name: item.name, tag: item.tag || '', idType: item.idType || '', notes: item.notes || '' });
    setDvFileName(item.fileName); setDvFileData(''); setDvFileType('');
    setDocVaultModal(true);
  }
  async function saveDocVault() {
    if (!docVaultForm.name) { toast.error('Name required'); return; }
    if (!editingDocVault && !dvFileData) { toast.error('Please upload a file'); return; }
    const payload = { ...docVaultForm, fileData: dvFileData || undefined, fileType: dvFileType || undefined, fileName: dvFileName || undefined, fileSize: dvFileSize || undefined };
    const url = editingDocVault ? `/api/document-vault/${editingDocVault.id}` : '/api/document-vault';
    const method = editingDocVault ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success(editingDocVault ? 'Updated' : 'Document saved');
    setDocVaultModal(false);
    fetchDocVault();
  }
  async function deleteDocVault(id: string) {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/document-vault/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    fetchDocVault();
  }

  // Get unique owner names for filter pills
  const certOwners = Array.from(new Set(certs.map((c) => c.ownerName)));
  const docOwners = Array.from(new Set(personalDocs.map((d) => d.ownerName)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, height: 'var(--topbar-height)' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔒</span> Private
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" onClick={() => {
          if (activeTab === 'vault') openVaultNew();
          else if (activeTab === 'education') openCertNew();
          else if (activeTab === 'personal') openDocNew();
          else openDocVaultNew();
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" /></svg>
          Add New
        </Btn>
      </div>

      {/* Tab Bar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
        {([
          { key: 'vault', label: '🔑 Password Vault' },
          { key: 'education', label: '🎓 Education' },
          { key: 'personal', label: '🪪 Personal Docs' },
          { key: 'documents', label: '📁 Document Vault' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-syne)', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === t.key ? 'var(--accent)' : 'transparent'}`, color: activeTab === t.key ? 'var(--accent2)' : 'var(--text3)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* ── VAULT TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'vault' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
                <input value={vaultQuery} onChange={(e) => setVaultQuery(e.target.value)} placeholder="Search vault…"
                  style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {VAULT_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setVaultCategory(cat)}
                    style={{ padding: '6px 12px', borderRadius: 'var(--r2)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: vaultCategory === cat ? 'var(--accent)' : 'var(--border)', background: vaultCategory === cat ? 'var(--accent3)' : 'var(--bg3)', color: vaultCategory === cat ? 'var(--accent2)' : 'var(--text2)', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {vaultLoading ? (
              <LoadingSpinner />
            ) : vaultEntries.length === 0 ? (
              <EmptyState icon="🔑" title="No vault entries" desc="Add your first credential to get started." />
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                <AnimatePresence>
                  {vaultEntries.map((e) => (
                    <VaultCard key={e.id} entry={e}
                      onEdit={() => openVaultEdit(e)}
                      onDelete={() => deleteVault(e.id)}
                      onSend={() => setSendEmailModal({ id: e.id, name: e.name })} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ── EDUCATION TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'education' && (
          <div>
            {/* Owner filter pills */}
            {certOwners.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => setCertOwnerFilter('')}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid', borderColor: !certOwnerFilter ? 'var(--accent)' : 'var(--border)', background: !certOwnerFilter ? 'var(--accent3)' : 'var(--bg3)', color: !certOwnerFilter ? 'var(--accent2)' : 'var(--text2)', cursor: 'pointer' }}>
                  All
                </button>
                {certOwners.map((name) => (
                  <button key={name} onClick={() => setCertOwnerFilter(name === certOwnerFilter ? '' : name)}
                    style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid', borderColor: certOwnerFilter === name ? 'var(--accent)' : 'var(--border)', background: certOwnerFilter === name ? 'var(--accent3)' : 'var(--bg3)', color: certOwnerFilter === name ? 'var(--accent2)' : 'var(--text2)', cursor: 'pointer' }}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {certsLoading ? <LoadingSpinner /> : certs.length === 0 ? (
              <EmptyState icon="🎓" title="No certificates" desc="Add educational certificates to track them here." />
            ) : (
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                <AnimatePresence>
                  {certs.map((c) => (
                    <EducationCard key={c.id} cert={c} onEdit={() => openCertEdit(c)} onDelete={() => deleteCert(c.id)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ── PERSONAL DOCS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'personal' && (
          <div>
            {docOwners.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => setDocOwnerFilter('')}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid', borderColor: !docOwnerFilter ? 'var(--accent)' : 'var(--border)', background: !docOwnerFilter ? 'var(--accent3)' : 'var(--bg3)', color: !docOwnerFilter ? 'var(--accent2)' : 'var(--text2)', cursor: 'pointer' }}>
                  All
                </button>
                {docOwners.map((name) => (
                  <button key={name} onClick={() => setDocOwnerFilter(name === docOwnerFilter ? '' : name)}
                    style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid', borderColor: docOwnerFilter === name ? 'var(--accent)' : 'var(--border)', background: docOwnerFilter === name ? 'var(--accent3)' : 'var(--bg3)', color: docOwnerFilter === name ? 'var(--accent2)' : 'var(--text2)', cursor: 'pointer' }}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {docsLoading ? <LoadingSpinner /> : personalDocs.length === 0 ? (
              <EmptyState icon="🪪" title="No personal documents" desc="Store your PAN, Aadhar, and other ID documents securely." />
            ) : (
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                <AnimatePresence>
                  {personalDocs.map((d) => (
                    <PersonalDocCard key={d.id} doc={d} onEdit={() => openDocEdit(d)} onDelete={() => deleteDoc(d.id)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENT VAULT TAB ────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
              <input value={docVaultQuery} onChange={(e) => setDocVaultQuery(e.target.value)} placeholder="Search documents…"
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
            </div>

            {docVaultLoading ? <LoadingSpinner /> : docVaultItems.length === 0 ? (
              <EmptyState icon="📁" title="No documents" desc="Upload and tag any document for quick retrieval." />
            ) : (
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                <AnimatePresence>
                  {docVaultItems.map((item) => (
                    <DocVaultCard key={item.id} item={item} onEdit={() => openDocVaultEdit(item)} onDelete={() => deleteDocVault(item.id)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── VAULT MODAL ──────────────────────────────────────────────────────── */}
      <Modal open={vaultModal} onClose={() => setVaultModal(false)} title={editingVault ? 'Edit Vault Entry' : 'New Vault Entry'}
        footer={<><Btn variant="ghost" onClick={() => setVaultModal(false)}>Cancel</Btn><Btn variant="primary" onClick={saveVault}>Save</Btn></>}>
        <FormField label="Name / Label">
          <Input value={vaultForm.name} onChange={(e) => setVaultForm({ ...vaultForm, name: e.target.value })} placeholder="e.g. Mom's Gmail, HDFC Bank" />
        </FormField>
        <FormField label="Category">
          <select value={vaultForm.category} onChange={(e) => setVaultForm({ ...vaultForm, category: e.target.value })}
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', color: 'var(--text)', fontSize: '13.5px', outline: 'none' }}>
            {['general', 'educational', 'bank', 'social', 'work'].map((c) => (
              <option key={c} value={c} style={{ background: 'var(--bg2)', textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="User ID / Email"><Input value={vaultForm.userId_field} onChange={(e) => setVaultForm({ ...vaultForm, userId_field: e.target.value })} placeholder="username or email" /></FormField>
        <FormField label="Password"><Input type="text" value={vaultForm.password} onChange={(e) => setVaultForm({ ...vaultForm, password: e.target.value })} placeholder="stored as-is (not hashed)" /></FormField>
        <FormField label="Registration Number"><Input value={vaultForm.registrationNumber} onChange={(e) => setVaultForm({ ...vaultForm, registrationNumber: e.target.value })} placeholder="for educational / govt registrations" /></FormField>
        <FormField label="Link / URL"><Input type="url" value={vaultForm.link} onChange={(e) => setVaultForm({ ...vaultForm, link: e.target.value })} placeholder="https://…" /></FormField>
        <FormField label="Notes"><Textarea value={vaultForm.notes} onChange={(e) => setVaultForm({ ...vaultForm, notes: e.target.value })} placeholder="Any additional info…" /></FormField>
      </Modal>

      {/* ── CERT MODAL ────────────────────────────────────────────────────────── */}
      <Modal open={certModal} onClose={() => setCertModal(false)} title={editingCert ? 'Edit Certificate' : 'Add Certificate'}
        footer={<><Btn variant="ghost" onClick={() => setCertModal(false)}>Cancel</Btn><Btn variant="primary" onClick={saveCert}>Save</Btn></>}>
        <FormField label="Person Name (Owner)"><Input value={certForm.ownerName} onChange={(e) => setCertForm({ ...certForm, ownerName: e.target.value })} placeholder="e.g. Ranjan, Mom, Dad" /></FormField>
        <FormField label="Exam / Certificate">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {EXAM_PRESETS.map((p) => (
              <button key={p} onClick={() => { setCertForm({ ...certForm, examName: p }); setCustomExam(''); }}
                style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: '1px solid', cursor: 'pointer', borderColor: certForm.examName === p && !customExam ? 'var(--accent)' : 'var(--border)', background: certForm.examName === p && !customExam ? 'var(--accent3)' : 'var(--bg4)', color: certForm.examName === p && !customExam ? 'var(--accent2)' : 'var(--text3)', transition: 'all 0.15s' }}>
                {p}
              </button>
            ))}
          </div>
          <Input value={customExam} onChange={(e) => { setCustomExam(e.target.value); setCertForm({ ...certForm, examName: e.target.value }); }} placeholder="Or type a custom name…" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <FormField label="Institution"><Input value={certForm.institution} onChange={(e) => setCertForm({ ...certForm, institution: e.target.value })} placeholder="School / College" /></FormField>
          <FormField label="Year"><Input value={certForm.year} onChange={(e) => setCertForm({ ...certForm, year: e.target.value })} placeholder="2020" /></FormField>
          <FormField label="Grade / Percentage"><Input value={certForm.grade} onChange={(e) => setCertForm({ ...certForm, grade: e.target.value })} placeholder="85% / A+" /></FormField>
          <FormField label="Roll Number"><Input value={certForm.rollNumber} onChange={(e) => setCertForm({ ...certForm, rollNumber: e.target.value })} placeholder="Roll no." /></FormField>
        </div>
        <FormField label="Notes"><Textarea value={certForm.notes} onChange={(e) => setCertForm({ ...certForm, notes: e.target.value })} placeholder="Any additional info…" /></FormField>
        <FileUploadField label="Certificate (Image / PDF)"
          currentFileName={certFileName}
          onChange={(data, type, name) => { setCertFileData(data); setCertFileType(type); setCertFileName(name); }} />
      </Modal>

      {/* ── PERSONAL DOC MODAL ───────────────────────────────────────────────── */}
      <Modal open={docModal} onClose={() => setDocModal(false)} title={editingDoc ? 'Edit Document' : 'Add Personal Document'}
        footer={<><Btn variant="ghost" onClick={() => setDocModal(false)}>Cancel</Btn><Btn variant="primary" onClick={saveDoc}>Save</Btn></>}>
        <FormField label="Person Name (Owner)"><Input value={docForm.ownerName} onChange={(e) => setDocForm({ ...docForm, ownerName: e.target.value })} placeholder="e.g. Ranjan, Mom, Dad" /></FormField>
        <FormField label="Document Type">
          <select value={docForm.docType} onChange={(e) => setDocForm({ ...docForm, docType: e.target.value as PersonalDocType })}
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', color: 'var(--text)', fontSize: '13.5px', outline: 'none' }}>
            {PERSONAL_DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value} style={{ background: 'var(--bg2)' }}>{t.label}</option>
            ))}
          </select>
        </FormField>
        {docForm.docType === 'custom' && (
          <FormField label="Custom Label"><Input value={docForm.customLabel} onChange={(e) => setDocForm({ ...docForm, customLabel: e.target.value })} placeholder="Document name" /></FormField>
        )}
        <FormField label="Document Number"><Input value={docForm.docNumber} onChange={(e) => setDocForm({ ...docForm, docNumber: e.target.value })} placeholder="XXXX-XXXX-XXXX" /></FormField>
        <FormField label="Notes"><Textarea value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} placeholder="Any details…" /></FormField>
        <FileUploadField label="Document Scan (Image / PDF)"
          currentFileName={docFileName}
          onChange={(data, type, name) => { setDocFileData(data); setDocFileType(type); setDocFileName(name); }} />
      </Modal>

      {/* ── DOCUMENT VAULT MODAL ─────────────────────────────────────────────── */}
      <Modal open={docVaultModal} onClose={() => setDocVaultModal(false)} title={editingDocVault ? 'Edit Document' : 'Upload Document'}
        footer={<><Btn variant="ghost" onClick={() => setDocVaultModal(false)}>Cancel</Btn><Btn variant="primary" onClick={saveDocVault}>Save</Btn></>}>
        <FormField label="Display Name"><Input value={docVaultForm.name} onChange={(e) => setDocVaultForm({ ...docVaultForm, name: e.target.value })} placeholder="e.g. Mom's Birth Certificate" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <FormField label="Tag / Person"><Input value={docVaultForm.tag} onChange={(e) => setDocVaultForm({ ...docVaultForm, tag: e.target.value })} placeholder="e.g. Mom" /></FormField>
          <FormField label="ID / Doc Type"><Input value={docVaultForm.idType} onChange={(e) => setDocVaultForm({ ...docVaultForm, idType: e.target.value })} placeholder="e.g. Certificate" /></FormField>
        </div>
        <FormField label="Notes"><Textarea value={docVaultForm.notes} onChange={(e) => setDocVaultForm({ ...docVaultForm, notes: e.target.value })} placeholder="Any details…" /></FormField>
        <FileUploadField label={editingDocVault ? 'Replace File (optional)' : 'File (Image / PDF) *'}
          currentFileName={dvFileName}
          onChange={async (data, type, name) => {
            setDvFileData(data);
            setDvFileType(type);
            setDvFileName(name);
            // Approximate size from base64
            setDvFileSize(Math.round(data.length * 0.75));
          }} />
      </Modal>

      {/* ── SEND EMAIL MODAL ─────────────────────────────────────────────────── */}
      {sendEmailModal && (
        <SendEmailModal entryId={sendEmailModal.id} entryName={sendEmailModal.name}
          open={!!sendEmailModal} onClose={() => setSendEmailModal(null)} />
      )}
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
      <span style={{ width: '16px', height: '16px', border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      Loading…
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px' }}>{desc}</div>
    </div>
  );
}