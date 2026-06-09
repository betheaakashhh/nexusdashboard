'use client';
// src/app/dashboard/health/page.tsx
// ── Complete Family Health Management System ──────────────────────────────────

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, Btn } from '@/components/ui/FormField';

// ── Types ─────────────────────────────────────────────────────────────────────
interface HealthProfile {
  id: string; personName: string; relation: string;
  dateOfBirth?: string; gender?: string; bloodGroup?: string;
  allergies?: string; chronicConditions?: string; emergencyContact?: string;
  photoUrl?: string; notes?: string; isActive: boolean; createdAt: string;
  _count?: { records: number; vitals: number; medications: number; appointments: number };
}
interface HealthRecord {
  id: string; profileId: string; type: string; title: string; date: string;
  doctor?: string; hospital?: string; diagnosis?: string; notes?: string;
  labResults?: string; fileUrl?: string; fileName?: string; fileType?: string;
  createdAt: string;
  profile?: { id: string; personName: string; bloodGroup?: string };
}
interface VitalRecord {
  id: string; profileId: string; date: string; time?: string;
  systolic?: number; diastolic?: number; heartRate?: number;
  weight?: number; height?: number; temperature?: number;
  bloodSugar?: number; bloodSugarType?: string; spo2?: number;
  bmi?: number; respiratoryRate?: number; notes?: string; createdAt: string;
}
interface Medication {
  id: string; profileId: string; name: string; genericName?: string;
  dosage?: string; frequency?: string; route?: string;
  startDate?: string; endDate?: string; prescribedBy?: string;
  specialty?: string; purpose?: string; sideEffects?: string;
  isActive: boolean; notes?: string; createdAt: string;
  profile?: { id: string; personName: string };
}
interface HealthAppointment {
  id: string; profileId: string; title: string; doctor?: string;
  specialty?: string; hospital?: string; date: string; time?: string;
  status: string; reason?: string; outcome?: string;
  followUpDate?: string; notes?: string; createdAt: string;
  profile?: { id: string; personName: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const RELATIONS = [
  { value: 'self',    label: 'Myself'    },
  { value: 'spouse',  label: 'Spouse'    },
  { value: 'child',   label: 'Child'     },
  { value: 'parent',  label: 'Parent'    },
  { value: 'sibling', label: 'Sibling'   },
  { value: 'other',   label: 'Other'     },
];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }));
const GENDERS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other'  },
];
const RECORD_TYPES = [

  { value: 'blood_test',    label: 'Blood Test',      icon: 'fi fi-rr-blood-drop',    color: '#e05c6a' },
  { value: 'urine_test',    label: 'Urine Test',      icon: 'fi fi-rr-flask',         color: '#e89a45' },
  { value: 'imaging',       label: 'Imaging / Scan',  icon: 'fi fi-rr-x-ray',         color: '#a78bfa' },
  { value: 'vaccination',   label: 'Vaccination',     icon: 'fi fi-rr-syringe',       color: '#4db88a' },
  { value: 'doctor_visit',  label: 'Doctor Visit',    icon: 'fi fi-rr-stethoscope',   color: '#6aa3d8' },
  { value: 'dental',        label: 'Dental',          icon: 'fi fi-rr-tooth',         color: '#5dcaa5' },
  { value: 'eye_exam',      label: 'Eye Exam',        icon: 'fi fi-rr-eye',           color: '#818cf8' },
  { value: 'mental_health', label: 'Mental Health',   icon: 'fi fi-rr-brain',         color: '#c97eaa' },
  { value: 'surgery',       label: 'Surgery',         icon: 'fi fi-rr-scalpel',       color: '#ff6b6b' },
  { value: 'allergy',       label: 'Allergy',         icon: 'fi fi-rr-sneezing',      color: '#fbbf24' },
  { value: 'general',       label: 'General',         icon: 'fi fi-rr-clipboard',     color: '#6b7280' },
];

const RECORD_TYPE_MAP = Object.fromEntries(RECORD_TYPES.map(t => [t.value, t]));
const APPT_STATUSES = [
  { value: 'scheduled',  label: 'Scheduled'  },
  { value: 'completed',  label: 'Completed'  },
  { value: 'cancelled',  label: 'Cancelled'  },
  { value: 'missed',     label: 'Missed'     },
];
const STATUS_COLORS: Record<string, string> = {
  scheduled: '#6aa3d8',
  completed: '#4db88a',
  cancelled: '#6b7280',
  missed:    '#e05c6a',
};

// ── Helper functions ─────────────────────────────────────────────────────────
function calcAge(dob?: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age}y`;
}
function fmtDate(d: string): string {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function bpStatus(s?: number, d?: number): { label: string; color: string } {
  if (!s || !d) return { label: '', color: '' };
  if (s > 180 || d > 120) return { label: 'Crisis', color: '#e05c6a' };
  if (s >= 140 || d >= 90)  return { label: 'Stage 2 HT', color: '#e05c6a' };
  if (s >= 130 || d >= 80)  return { label: 'Stage 1 HT', color: '#e89a45' };
  if (s >= 120)              return { label: 'Elevated', color: '#fbbf24' };
  return { label: 'Normal', color: '#4db88a' };
}
function glucoseStatus(g?: number): { label: string; color: string } {
  if (!g) return { label: '', color: '' };
  if (g >= 126) return { label: 'Diabetic Range', color: '#e05c6a' };
  if (g >= 100) return { label: 'Pre-diabetic', color: '#e89a45' };
  if (g >= 70)  return { label: 'Normal', color: '#4db88a' };
  return { label: 'Low', color: '#e89a45' };
}
function bmiStatus(b?: number): { label: string; color: string } {
  if (!b) return { label: '', color: '' };
  if (b >= 30) return { label: 'Obese', color: '#e05c6a' };
  if (b >= 25) return { label: 'Overweight', color: '#e89a45' };
  if (b >= 18.5) return { label: 'Normal', color: '#4db88a' };
  return { label: 'Underweight', color: '#6aa3d8' };
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

// ── SVG Mini Line Chart ───────────────────────────────────────────────────────
function MiniLineChart({ data, color, width = 280, height = 80 }: {
  data: { date: string; value: number }[];
  color: string; width?: number; height?: number;
}) {
  if (data.length < 2) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 11 }}>
        Need ≥2 readings
      </div>
    );
  }
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 8;
  const pts = sorted.map((d, i) => ({
    x: pad + (i / (sorted.length - 1)) * (width - pad * 2),
    y: pad + (1 - (d.value - min) / range) * (height - pad * 2),
    v: d.value,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x},${height} L${pts[0].x},${height} Z`;
  const id = `grad_${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(y => (
        <line key={y} x1={0} y1={y * height} x2={width} y2={y * height}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color} />
          {i === pts.length - 1 && (
            <text x={p.x + 6} y={p.y + 4} fontSize={10} fill={color} fontWeight={700}>
              {p.v}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── SVG Mini Bar Chart ────────────────────────────────────────────────────────
function MiniBarChart({ data, color, width = 280, height = 80 }: {
  data: { label: string; value: number }[];
  color: string; width?: number; height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = (width - 8) / data.length - 4;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      {data.map((d, i) => {
        const bh = ((d.value / max) * (height - 20)) || 2;
        const x = 4 + i * ((width - 8) / data.length) + 2;
        const y = height - bh - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh}
              fill={color} opacity={0.75} rx={2} />
            <text x={x + bw / 2} y={height - 2} textAnchor="middle"
              fontSize={8} fill="var(--text3)">{d.label}</text>
            {d.value > 0 && (
              <text x={x + bw / 2} y={y - 2} textAnchor="middle"
                fontSize={9} fill={color}>{d.value}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const RELATION_COLORS: Record<string, [string, string]> = {
  self:    ['#c9a96e', '#3a3020'],
  spouse:  ['#c97eaa', '#2e1a28'],
  child:   ['#6aa3d8', '#1a2430'],
  parent:  ['#4db88a', '#1a2e22'],
  sibling: ['#a78bfa', '#1e1830'],
  other:   ['#6b7280', '#1f2937'],
};
function ProfileAvatar({ profile, size = 48 }: { profile: HealthProfile; size?: number }) {
  const [fg, bg] = RELATION_COLORS[profile.relation] || RELATION_COLORS.other;
  if (profile.photoUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${fg}40` }}>
        <img src={profile.photoUrl} alt={profile.personName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  const initials = profile.personName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700,
      fontFamily: 'var(--font-syne)', flexShrink: 0,
      border: `2px solid ${fg}40`,
    }}>{initials}</div>
  );
}

// ── Blood Group Badge ─────────────────────────────────────────────────────────
function BloodBadge({ group }: { group?: string }) {
  if (!group) return null;
  return (
    <span style={{
      fontSize: '10px', padding: '2px 6px', borderRadius: 4,
      background: 'rgba(224,92,106,0.15)', color: '#e05c6a',
      border: '1px solid rgba(224,92,106,0.3)',
      fontFamily: 'var(--font-syne)', fontWeight: 800,
    }}>{group}</span>
  );
}

// ── Stat Box ─────────────────────────────────────────────────────────────────
function StatBox({ val, label, color }: { val: number; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg4)', borderRadius: 8, padding: '8px 10px',
      border: '1px solid var(--border)', textAlign: 'center', flex: 1,
    }}>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{
        fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
        letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 700,
      }}>{title}</div>
      {action}
    </div>
  );
}

// ── Health Record Card ────────────────────────────────────────────────────────
function RecordCard({ record, onEdit, onDelete }: {
  record: HealthRecord;
  onEdit: (r: HealthRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rtype = RECORD_TYPE_MAP[record.type] || RECORD_TYPE_MAP.general;
  let labData: Array<{ name: string; value: string; unit: string; normalMin?: number; normalMax?: number; status?: string }> = [];
  try { if (record.labResults) labData = JSON.parse(record.labResults); } catch {}

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', marginBottom: 8, overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${rtype.color}18`, border: `1px solid ${rtype.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>{rtype.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: rtype.color }}>{rtype.label}</span>
            <span>📅 {fmtDate(record.date)}</span>
            {record.doctor && <span>👨‍⚕️ {record.doctor}</span>}
            {record.hospital && <span>🏥 {record.hospital}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--text3)" strokeWidth="1.5"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M4 6l4 4 4-4"/>
          </svg>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
              {record.diagnosis && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Diagnosis</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{record.diagnosis}</div>
                </div>
              )}
              {record.notes && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{record.notes}</div>
                </div>
              )}

              {/* Lab Results Table */}
              {labData.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Lab Results</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg3)' }}>
                          {['Test', 'Value', 'Unit', 'Normal Range', 'Status'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {labData.map((row, i) => {
                          const isH = row.status === 'high';
                          const isL = row.status === 'low';
                          const statusColor = isH || isL ? '#e05c6a' : '#4db88a';
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '7px 10px', color: 'var(--text)', fontWeight: 500 }}>{row.name}</td>
                              <td style={{ padding: '7px 10px', color: isH || isL ? '#e05c6a' : 'var(--text)', fontWeight: 700 }}>{row.value}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--text3)' }}>{row.unit}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--text3)' }}>{row.normalMin !== undefined ? `${row.normalMin}–${row.normalMax}` : '—'}</td>
                              <td style={{ padding: '7px 10px' }}>
                                {row.status && (
                                  <span style={{
                                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                                    background: `${statusColor}18`, color: statusColor,
                                    fontFamily: 'var(--font-syne)', fontWeight: 700, textTransform: 'uppercase',
                                  }}>{row.status}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* File preview */}
              {record.fileUrl && (
                <div style={{ marginTop: 10 }}>
                  {record.fileType === 'image' ? (
                    <img src={record.fileUrl} alt={record.fileName} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, objectFit: 'contain' }} />
                  ) : (
                    <a href={record.fileUrl} download={record.fileName}
                      style={{ fontSize: 12, color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      📎 {record.fileName || 'Download attachment'}
                    </a>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <Btn size="sm" variant="ghost" onClick={() => onEdit(record)}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5l2 2-6.5 6.5H2v-1.5L8.5 2z"/></svg>
                  Edit
                </Btn>
                <Btn size="sm" variant="danger" onClick={() => onDelete(record.id)}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8"/></svg>
                  Delete
                </Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Vital Card ─────────────────────────────────────────────────────────────────
function VitalCard({ vital, onDelete }: { vital: VitalRecord; onDelete: (id: string) => void }) {
  const bp = bpStatus(vital.systolic, vital.diastolic);
  const glu = glucoseStatus(vital.bloodSugar);
  const bmi = bmiStatus(vital.bmi);

  const rows = [
    vital.systolic && vital.diastolic && { label: 'Blood Pressure', value: `${vital.systolic}/${vital.diastolic} mmHg`, badge: bp.label, badgeColor: bp.color, icon: '🫀' },
    vital.heartRate   && { label: 'Heart Rate',    value: `${vital.heartRate} bpm`,     icon: '❤️' },
    vital.weight      && { label: 'Weight',        value: `${vital.weight} kg`,          icon: '⚖️' },
    vital.bmi         && { label: 'BMI',           value: `${vital.bmi}`, badge: bmi.label, badgeColor: bmi.color, icon: '📊' },
    vital.bloodSugar  && { label: 'Blood Sugar',   value: `${vital.bloodSugar} mg/dL (${vital.bloodSugarType || 'fasting'})`, badge: glu.label, badgeColor: glu.color, icon: '🩸' },
    vital.temperature && { label: 'Temperature',   value: `${vital.temperature} °C`,     icon: '🌡️' },
    vital.spo2        && { label: 'SpO₂',          value: `${vital.spo2}%`,              icon: '💨' },
    vital.respiratoryRate && { label: 'Resp. Rate', value: `${vital.respiratoryRate} /min`, icon: '🫁' },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: string; badge?: string; badgeColor?: string }>;

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', padding: '14px', marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
            {fmtDate(vital.date)}{vital.time && ` at ${vital.time}`}
          </div>
          {vital.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{vital.notes}</div>}
        </div>
        <Btn size="sm" variant="danger" onClick={() => onDelete(vital.id)}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8"/></svg>
        </Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{row.icon} {row.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{row.value}</div>
            {row.badge && (
              <span style={{ fontSize: 9, color: row.badgeColor, background: `${row.badgeColor}18`, padding: '1px 5px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                {row.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Medication Card ───────────────────────────────────────────────────────────
function MedCard({ med, onEdit, onDelete, onToggle }: {
  med: Medication;
  onEdit: (m: Medication) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        background: 'var(--bg2)', border: `1px solid ${med.isActive ? 'rgba(232,154,69,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--r)', padding: '14px', marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: med.isActive ? 'rgba(232,154,69,0.15)' : 'var(--bg4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💊</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>{med.name}</span>
            {med.genericName && <span style={{ fontSize: 11, color: 'var(--text3)' }}>({med.genericName})</span>}
            <span style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase',
              background: med.isActive ? 'rgba(77,184,138,0.15)' : 'rgba(107,114,128,0.15)',
              color: med.isActive ? '#4db88a' : '#6b7280',
            }}>{med.isActive ? 'Active' : 'Stopped'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text2)' }}>
            {med.dosage && <span>💊 {med.dosage}</span>}
            {med.frequency && <span>🕐 {med.frequency}</span>}
            {med.prescribedBy && <span>👨‍⚕️ {med.prescribedBy}</span>}
            {med.startDate && <span>📅 From {fmtDate(med.startDate)}</span>}
            {med.endDate && <span>→ {fmtDate(med.endDate)}</span>}
          </div>
          {med.purpose && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5 }}>For: {med.purpose}</div>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Btn size="sm" variant="ghost" onClick={() => onToggle(med.id, !med.isActive)}>
            {med.isActive ? 'Stop' : 'Resume'}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => onEdit(med)}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5l2 2-6.5 6.5H2v-1.5L8.5 2z"/></svg>
          </Btn>
          <Btn size="sm" variant="danger" onClick={() => onDelete(med.id)}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8"/></svg>
          </Btn>
        </div>
      </div>
    </motion.div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function ApptCard({ appt, onEdit, onDelete, onStatus }: {
  appt: HealthAppointment;
  onEdit: (a: HealthAppointment) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: string) => void;
}) {
  const sc = STATUS_COLORS[appt.status] || '#6b7280';
  const today = new Date().toISOString().split('T')[0];
  const isUpcoming = appt.date >= today && appt.status === 'scheduled';
  const isPast = appt.date < today && appt.status === 'scheduled';

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${isUpcoming ? 'rgba(106,163,216,0.3)' : isPast ? 'rgba(224,92,106,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--r)', padding: '14px', marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${sc}18`, border: `1px solid ${sc}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🩺</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>{appt.title}</span>
            <span style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase',
              background: `${sc}18`, color: sc,
            }}>{appt.status}</span>
            {isPast && <span style={{ fontSize: 9, color: '#e05c6a', fontWeight: 700 }}>⚠️ MISSED?</span>}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text2)' }}>
            {appt.doctor && <span>👨‍⚕️ {appt.doctor}</span>}
            {appt.specialty && <span>🏥 {appt.specialty}</span>}
            <span>📅 {fmtDate(appt.date)}{appt.time && ` ${appt.time}`}</span>
          </div>
          {appt.hospital && <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 3 }}>🏥 {appt.hospital}</div>}
          {appt.reason && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Reason: {appt.reason}</div>}
          {appt.outcome && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Outcome: {appt.outcome}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {appt.status === 'scheduled' && (
            <Btn size="sm" variant="ghost" onClick={() => onStatus(appt.id, 'completed')}>✓ Done</Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => onEdit(appt)}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5l2 2-6.5 6.5H2v-1.5L8.5 2z"/></svg>
          </Btn>
          <Btn size="sm" variant="danger" onClick={() => onDelete(appt.id)}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8"/></svg>
          </Btn>
        </div>
      </div>
    </motion.div>
  );
}

// ── PDF Export Function ───────────────────────────────────────────────────────
function generateHealthReport(
  profile: HealthProfile,
  records: HealthRecord[],
  vitals: VitalRecord[],
  medications: Medication[],
  appointments: HealthAppointment[],
) {
  const latestVital = vitals[0];
  const activeMeds  = medications.filter(m => m.isActive);
  const age         = calcAge(profile.dateOfBirth);
  const today       = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const bpStat  = bpStatus(latestVital?.systolic, latestVital?.diastolic);
  const gluStat = glucoseStatus(latestVital?.bloodSugar);
  const bmiStat = bmiStatus(latestVital?.bmi);

  const photoSection = profile.photoUrl
    ? `<img src="${profile.photoUrl}" alt="Photo" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #c9a96e;"/>`
    : `<div style="width:90px;height:90px;border-radius:50%;background:#3a3020;display:flex;align-items:center;justify-content:center;font-size:32px;color:#c9a96e;font-weight:800;font-family:Georgia,serif;border:3px solid #c9a96e;">${profile.personName[0]?.toUpperCase()}</div>`;

  const labRowsHtml = (rec: HealthRecord) => {
    let lab: Array<{ name: string; value: string; unit: string; normalMin?: number; normalMax?: number; status?: string }> = [];
    try { if (rec.labResults) lab = JSON.parse(rec.labResults); } catch {}
    if (!lab.length) return '';
    return `<table class="lab-table">
      <thead><tr><th>Test</th><th>Value</th><th>Unit</th><th>Normal Range</th><th>Status</th></tr></thead>
      <tbody>${lab.map(r => `<tr>
        <td>${r.name}</td>
        <td style="color:${r.status === 'high' || r.status === 'low' ? '#c0392b' : '#333'};font-weight:700">${r.value}</td>
        <td>${r.unit}</td>
        <td>${r.normalMin !== undefined ? `${r.normalMin}–${r.normalMax}` : '—'}</td>
        <td><span class="badge ${r.status || ''}">${r.status || '—'}</span></td>
      </tr>`).join('')}</tbody>
    </table>`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Health Report — ${profile.personName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 13px; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  .header { display: flex; align-items: center; gap: 24px; padding-bottom: 20px; border-bottom: 3px solid #c9a96e; margin-bottom: 24px; }
  .header-right { flex: 1; }
  .report-title { font-size: 11px; color: #8a7050; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
  .person-name { font-size: 26px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px; }
  .person-sub { font-size: 13px; color: #666; margin-top: 4px; }
  .badges { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .badge-item { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .blood-badge { background: #fde8e8; color: #c0392b; border: 1px solid #f5c6c6; }
  .relation-badge { background: #f0e8d8; color: #8a6020; border: 1px solid #e0d0b0; }
  .gen-badge { background: #eef; color: #447; border: 1px solid #ccf; }
  .logo-area { margin-left: auto; text-align: right; }
  .logo-text { font-size: 22px; font-weight: 800; color: #c9a96e; letter-spacing: -0.5px; }
  .logo-sub { font-size: 10px; color: #999; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; color: #8a7050; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; padding-bottom: 6px; border-bottom: 1px solid #e8d8b0; margin-bottom: 14px; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .info-box { background: #faf8f4; border: 1px solid #ede8d8; border-radius: 8px; padding: 10px 12px; }
  .info-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .info-value { font-size: 14px; font-weight: 700; color: #1a1a1a; }
  .info-status { font-size: 10px; margin-top: 3px; font-weight: 600; }
  .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .vital-box { background: #faf8f4; border: 1px solid #ede8d8; border-radius: 8px; padding: 10px; text-align: center; }
  .vital-icon { font-size: 20px; margin-bottom: 4px; }
  .vital-val { font-size: 15px; font-weight: 800; color: #1a1a1a; }
  .vital-label { font-size: 10px; color: #888; margin-top: 2px; }
  .vital-status { font-size: 9px; font-weight: 700; margin-top: 3px; padding: 1px 6px; border-radius: 3px; display: inline-block; }
  .tag-green { background: #d4f4e4; color: #1a7a40; }
  .tag-red { background: #fde8e8; color: #c0392b; }
  .tag-amber { background: #fef3cd; color: #856404; }
  .record-row { background: #faf8f4; border: 1px solid #ede8d8; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .record-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .record-icon { font-size: 20px; }
  .record-type-tag { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 3px; margin-left: auto; }
  .record-title { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .record-meta { font-size: 11px; color: #888; }
  .lab-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  .lab-table th { background: #f0ebe0; padding: 6px 10px; text-align: left; font-weight: 700; color: #666; border-bottom: 2px solid #e0d0b0; }
  .lab-table td { padding: 6px 10px; border-bottom: 1px solid #ede8d8; }
  .badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
  .badge.high, .badge.low { background: #fde8e8; color: #c0392b; }
  .badge.normal { background: #d4f4e4; color: #1a7a40; }
  .med-row { display: flex; align-items: center; gap: 10px; background: #faf8f4; border: 1px solid #ede8d8; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; }
  .med-name { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .med-detail { font-size: 11px; color: #888; margin-top: 3px; }
  .appt-row { background: #faf8f4; border: 1px solid #ede8d8; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ede8d8; display: flex; justify-content: space-between; align-items: center; color: #aaa; font-size: 11px; }
  .alert-box { background: #fef3cd; border: 1px solid #f0c860; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; color: #856404; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 16px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    ${photoSection}
    <div class="header-right">
      <div class="report-title">Family Health Report</div>
      <div class="person-name">${profile.personName}</div>
      <div class="person-sub">
        ${profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : ''}
        ${age ? `· Age ${age}` : ''}
        ${profile.dateOfBirth ? `· DOB: ${fmtDate(profile.dateOfBirth)}` : ''}
      </div>
      <div class="badges">
        ${profile.bloodGroup ? `<span class="badge-item blood-badge">🩸 ${profile.bloodGroup}</span>` : ''}
        <span class="badge-item relation-badge">${profile.relation.charAt(0).toUpperCase() + profile.relation.slice(1)}</span>
        ${profile.emergencyContact ? `<span class="badge-item gen-badge">🆘 ${profile.emergencyContact}</span>` : ''}
      </div>
    </div>
    <div class="logo-area">
      <div class="logo-text">Nexus</div>
      <div class="logo-sub">Health Records</div>
      <div style="font-size:10px;color:#aaa;margin-top:4px;">Generated: ${today}</div>
    </div>
  </div>

  <!-- Alerts -->
  ${profile.allergies ? `<div class="alert-box">⚠️ <strong>Allergies:</strong> ${profile.allergies}</div>` : ''}
  ${profile.chronicConditions ? `<div class="alert-box" style="background:#fde8e8;border-color:#f5a0a0;color:#c0392b;">🔴 <strong>Chronic Conditions:</strong> ${profile.chronicConditions}</div>` : ''}

  <!-- Latest Vitals -->
  ${latestVital ? `
  <div class="section">
    <div class="section-title">Latest Vitals · ${fmtDate(latestVital.date)}</div>
    <div class="vitals-grid">
      ${latestVital.systolic ? `<div class="vital-box"><div class="vital-icon">🫀</div><div class="vital-val">${latestVital.systolic}/${latestVital.diastolic}</div><div class="vital-label">Blood Pressure</div><div class="vital-status ${bpStat.color === '#4db88a' ? 'tag-green' : bpStat.color === '#e05c6a' ? 'tag-red' : 'tag-amber'}">${bpStat.label}</div></div>` : ''}
      ${latestVital.heartRate ? `<div class="vital-box"><div class="vital-icon">❤️</div><div class="vital-val">${latestVital.heartRate}</div><div class="vital-label">Heart Rate (bpm)</div></div>` : ''}
      ${latestVital.weight ? `<div class="vital-box"><div class="vital-icon">⚖️</div><div class="vital-val">${latestVital.weight} kg</div><div class="vital-label">Weight</div></div>` : ''}
      ${latestVital.bmi ? `<div class="vital-box"><div class="vital-icon">📊</div><div class="vital-val">${latestVital.bmi}</div><div class="vital-label">BMI</div><div class="vital-status ${bmiStat.color === '#4db88a' ? 'tag-green' : bmiStat.color === '#e05c6a' ? 'tag-red' : 'tag-amber'}">${bmiStat.label}</div></div>` : ''}
      ${latestVital.bloodSugar ? `<div class="vital-box"><div class="vital-icon">🩸</div><div class="vital-val">${latestVital.bloodSugar}</div><div class="vital-label">Blood Sugar (mg/dL)</div><div class="vital-status ${gluStat.color === '#4db88a' ? 'tag-green' : gluStat.color === '#e05c6a' ? 'tag-red' : 'tag-amber'}">${gluStat.label}</div></div>` : ''}
      ${latestVital.temperature ? `<div class="vital-box"><div class="vital-icon">🌡️</div><div class="vital-val">${latestVital.temperature}°C</div><div class="vital-label">Temperature</div></div>` : ''}
      ${latestVital.spo2 ? `<div class="vital-box"><div class="vital-icon">💨</div><div class="vital-val">${latestVital.spo2}%</div><div class="vital-label">SpO₂</div></div>` : ''}
    </div>
  </div>` : ''}

  <!-- Active Medications -->
  ${activeMeds.length ? `
  <div class="section">
    <div class="section-title">Current Medications (${activeMeds.length})</div>
    ${activeMeds.map(m => `
    <div class="med-row">
      <div style="font-size:20px">💊</div>
      <div style="flex:1">
        <div class="med-name">${m.name}${m.genericName ? ` <span style="font-size:11px;color:#888;font-weight:400">(${m.genericName})</span>` : ''}</div>
        <div class="med-detail">
          ${m.dosage || ''} ${m.frequency ? `· ${m.frequency}` : ''} ${m.prescribedBy ? `· Dr. ${m.prescribedBy}` : ''} ${m.purpose ? `· For: ${m.purpose}` : ''}
        </div>
      </div>
      ${m.startDate ? `<div style="font-size:11px;color:#888">Since ${fmtDate(m.startDate)}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  <!-- Health Records -->
  ${records.length ? `
  <div class="section">
    <div class="section-title">Health Records (${records.length})</div>
    ${records.map(rec => {
      const rtype = RECORD_TYPE_MAP[rec.type] || RECORD_TYPE_MAP.general;
      return `<div class="record-row">
        <div class="record-header">
          <div class="record-icon">${rtype.icon}</div>
          <div style="flex:1">
            <div class="record-title">${rec.title}</div>
            <div class="record-meta">${fmtDate(rec.date)}${rec.doctor ? ` · ${rec.doctor}` : ''}${rec.hospital ? ` · ${rec.hospital}` : ''}</div>
          </div>
          <div class="record-type-tag" style="background:${rtype.color}18;color:${rtype.color}">${rtype.label}</div>
        </div>
        ${rec.diagnosis ? `<div style="font-size:12px;color:#555;margin-top:6px"><strong>Diagnosis:</strong> ${rec.diagnosis}</div>` : ''}
        ${rec.notes ? `<div style="font-size:12px;color:#777;margin-top:4px">${rec.notes}</div>` : ''}
        ${labRowsHtml(rec)}
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- Appointments -->
  ${appointments.length ? `
  <div class="section">
    <div class="section-title">Appointment History (${appointments.length})</div>
    ${appointments.map(a => `
    <div class="appt-row">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:13px">${a.title}</strong>
        <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;background:${STATUS_COLORS[a.status]}18;color:${STATUS_COLORS[a.status]};text-transform:uppercase">${a.status}</span>
      </div>
      <div style="font-size:11px;color:#888;margin-top:4px">
        ${fmtDate(a.date)}${a.time ? ` ${a.time}` : ''} ${a.doctor ? `· Dr. ${a.doctor}` : ''} ${a.specialty ? `· ${a.specialty}` : ''} ${a.hospital ? `· ${a.hospital}` : ''}
      </div>
      ${a.outcome ? `<div style="font-size:12px;color:#555;margin-top:4px">Outcome: ${a.outcome}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  <div class="footer">
    <div>Nexus Health Records — Confidential Medical Document</div>
    <div>Report Date: ${today}</div>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Reports Panel Component ───────────────────────────────────────────────────
function ReportsPanel({
  profile, vitals, records, onClose, period, setPeriod,
}: {
  profile: HealthProfile; vitals: VitalRecord[]; records: HealthRecord[];
  onClose: () => void; period: 'week' | 'month' | 'year';
  setPeriod: (p: 'week' | 'month' | 'year') => void;
}) {
  const now = new Date();

  const filterByPeriod = useCallback(<T extends { date: string }>(items: T[]) => {
    const cutoff = new Date();
    if (period === 'week')  cutoff.setDate(cutoff.getDate() - 7);
    if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
    if (period === 'year')  cutoff.setFullYear(cutoff.getFullYear() - 1);
    return items.filter(i => new Date(i.date + 'T00:00:00') >= cutoff);
  }, [period]);

  const filteredVitals = useMemo(() => filterByPeriod(vitals), [vitals, filterByPeriod]);
  const filteredRecords = useMemo(() => filterByPeriod(records), [records, filterByPeriod]);

  // Chart data
  const bpData = useMemo(() =>
    filteredVitals.filter(v => v.systolic).map(v => ({ date: v.date, value: v.systolic! })),
    [filteredVitals]);
  const hrData = useMemo(() =>
    filteredVitals.filter(v => v.heartRate).map(v => ({ date: v.date, value: v.heartRate! })),
    [filteredVitals]);
  const weightData = useMemo(() =>
    filteredVitals.filter(v => v.weight).map(v => ({ date: v.date, value: v.weight! })),
    [filteredVitals]);
  const glucoseData = useMemo(() =>
    filteredVitals.filter(v => v.bloodSugar).map(v => ({ date: v.date, value: v.bloodSugar! })),
    [filteredVitals]);

  // Record distribution by type
  const typeDistrib = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => {
      const t = RECORD_TYPE_MAP[type] || RECORD_TYPE_MAP.general;
      return { label: t.icon, value: count, color: t.color, name: t.label };
    });
  }, [filteredRecords]);

  // Records by month (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      const count = records.filter(r => r.date.startsWith(key)).length;
      months.push({ label, value: count });
    }
    return months;
  }, [records]);

  const latestV = filteredVitals[0];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      style={{
        width: 320, minWidth: 320, flexShrink: 0,
        background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Reports header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>📊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>Health Reports</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{profile.personName}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4L4 12M4 4l8 8"/></svg>
        </button>
      </div>

      {/* Period selector */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, flexShrink: 0 }}>
        {(['week', 'month', 'year'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: '5px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: period === p ? 'var(--accent)' : 'var(--bg3)',
            color: period === p ? '#fff' : 'var(--text3)',
            fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-syne)',
            transition: 'all 0.15s',
          }}>
            {{ week: 'Week', month: 'Month', year: 'Year' }[p]}
          </button>
        ))}
      </div>

      {/* Scrollable charts */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {/* Quick stat row */}
        {latestV && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {latestV.systolic && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>🫀 Blood Pressure</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: bpStatus(latestV.systolic, latestV.diastolic).color, fontFamily: 'var(--font-syne)' }}>
                  {latestV.systolic}/{latestV.diastolic}
                </div>
                <div style={{ fontSize: 9, color: bpStatus(latestV.systolic, latestV.diastolic).color, marginTop: 2 }}>
                  {bpStatus(latestV.systolic, latestV.diastolic).label}
                </div>
              </div>
            )}
            {latestV.bloodSugar && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>🩸 Blood Sugar</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: glucoseStatus(latestV.bloodSugar).color, fontFamily: 'var(--font-syne)' }}>
                  {latestV.bloodSugar} <span style={{ fontSize: 10, fontWeight: 400 }}>mg/dL</span>
                </div>
                <div style={{ fontSize: 9, color: glucoseStatus(latestV.bloodSugar).color, marginTop: 2 }}>
                  {glucoseStatus(latestV.bloodSugar).label}
                </div>
              </div>
            )}
            {latestV.bmi && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>📊 BMI</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: bmiStatus(latestV.bmi).color, fontFamily: 'var(--font-syne)' }}>
                  {latestV.bmi}
                </div>
                <div style={{ fontSize: 9, color: bmiStatus(latestV.bmi).color, marginTop: 2 }}>
                  {bmiStatus(latestV.bmi).label}
                </div>
              </div>
            )}
            {latestV.spo2 && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>💨 SpO₂</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: latestV.spo2 >= 95 ? '#4db88a' : '#e05c6a', fontFamily: 'var(--font-syne)' }}>
                  {latestV.spo2}%
                </div>
                <div style={{ fontSize: 9, color: latestV.spo2 >= 95 ? '#4db88a' : '#e05c6a', marginTop: 2 }}>
                  {latestV.spo2 >= 95 ? 'Normal' : 'Low'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chart: Blood Pressure trend */}
        {bpData.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              🫀 BP Trend (Systolic)
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <MiniLineChart data={bpData} color="#e05c6a" width={270} height={70} />
            </div>
          </div>
        )}

        {/* Chart: Heart Rate trend */}
        {hrData.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              ❤️ Heart Rate Trend
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <MiniLineChart data={hrData} color="#c97eaa" width={270} height={70} />
            </div>
          </div>
        )}

        {/* Chart: Weight trend */}
        {weightData.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              ⚖️ Weight Trend (kg)
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <MiniLineChart data={weightData} color="#c9a96e" width={270} height={70} />
            </div>
          </div>
        )}

        {/* Chart: Blood Sugar trend */}
        {glucoseData.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              🩸 Blood Sugar Trend
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <MiniLineChart data={glucoseData} color="#6aa3d8" width={270} height={70} />
            </div>
          </div>
        )}

        {/* Bar chart: Records by month */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            📋 Records by Month
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
            <MiniBarChart data={monthlyData} color="#c9a96e" width={270} height={80} />
          </div>
        </div>

        {/* Record type distribution */}
        {typeDistrib.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              🗂️ Record Types ({period})
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {typeDistrib.sort((a, b) => b.value - a.value).map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{t.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: t.color,
                      width: `${(t.value / Math.max(...typeDistrib.map(x => x.value))) * 100}%`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, flexShrink: 0 }}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredVitals.length === 0 && filteredRecords.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: '24px 0' }}>
            No data for this period.<br />Add vitals and records to see charts.
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── FILE UPLOAD BUTTON ────────────────────────────────────────────────────────
function FilePickerBtn({ onFile, accept = 'image/*,application/pdf', label = 'Attach file' }: {
  onFile: (f: File | null) => void; accept?: string; label?: string;
}) {
  const [name, setName] = useState('');
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 12px', background: 'var(--bg3)',
      border: '1px dashed var(--border2)', borderRadius: 'var(--r2)',
      cursor: 'pointer', fontSize: 12.5, color: 'var(--text2)',
    }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/>
      </svg>
      {name || label}
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={e => {
        const f = e.target.files?.[0] || null;
        setName(f?.name || ''); onFile(f);
      }} />
    </label>
  );
}


// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function HealthPage() {
  // ── Core state ──────────────────────────────────────────────────
  const [profiles,     setProfiles]     = useState<HealthProfile[]>([]);
  const [selected,     setSelected]     = useState<HealthProfile | null>(null);
  const [activeTab,    setActiveTab]    = useState<'overview' | 'records' | 'vitals' | 'medications' | 'appointments'>('overview');
  const [showReports,  setShowReports]  = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading,      setLoading]      = useState(false);

  // ── Data state ──────────────────────────────────────────────────
  const [records,      setRecords]      = useState<HealthRecord[]>([]);
  const [vitals,       setVitals]       = useState<VitalRecord[]>([]);
  const [medications,  setMedications]  = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);

  // ── Filter state ────────────────────────────────────────────────
  const [recordFilter, setRecordFilter] = useState('all');
  const [apptFilter,   setApptFilter]   = useState('all');
  const [medFilter,    setMedFilter]    = useState<'all' | 'active' | 'stopped'>('all');

  // ── Modal open states ───────────────────────────────────────────
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [editProfile,   setEditProfile]   = useState<HealthProfile | null>(null);
  const [recordOpen,    setRecordOpen]    = useState(false);
  const [editRecord,    setEditRecord]    = useState<HealthRecord | null>(null);
  const [vitalOpen,     setVitalOpen]     = useState(false);
  const [medOpen,       setMedOpen]       = useState(false);
  const [editMed,       setEditMed]       = useState<Medication | null>(null);
  const [apptOpen,      setApptOpen]      = useState(false);
  const [editAppt,      setEditAppt]      = useState<HealthAppointment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);

  // ── Form state ───────────────────────────────────────────────────
  const emptyProfile = { personName: '', relation: 'self', dateOfBirth: '', gender: '', bloodGroup: '', allergies: '', chronicConditions: '', emergencyContact: '', notes: '' };
  const emptyRecord  = { type: 'blood_test', title: '', date: '', doctor: '', hospital: '', diagnosis: '', notes: '' };
  const emptyVital   = { date: '', time: '', systolic: '', diastolic: '', heartRate: '', weight: '', height: '', temperature: '', bloodSugar: '', bloodSugarType: 'fasting', spo2: '', notes: '' };
  const emptyMed     = { name: '', genericName: '', dosage: '', frequency: '', route: '', startDate: '', endDate: '', prescribedBy: '', specialty: '', purpose: '', notes: '' };
  const emptyAppt    = { title: '', doctor: '', specialty: '', hospital: '', date: '', time: '', status: 'scheduled', reason: '', outcome: '', notes: '' };

  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [recordForm,  setRecordForm]  = useState(emptyRecord);
  const [vitalForm,   setVitalForm]   = useState(emptyVital);
  const [medForm,     setMedForm]     = useState(emptyMed);
  const [apptForm,    setApptForm]    = useState(emptyAppt);

  // Lab results builder (for records)
  const [labRows, setLabRows] = useState<Array<{ name: string; value: string; unit: string; normalMin: string; normalMax: string; status: string }>>([]);

  // File state
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [recordFile,   setRecordFile]   = useState<File | null>(null);

  // ── Fetch functions ──────────────────────────────────────────────
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/profiles');
      if (res.ok) { const d = await res.json(); setProfiles(d.profiles); }
    } catch { toast.error('Failed to load health profiles'); }
    setLoading(false);
  }, []);

  const fetchRecords = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/health/records?profileId=${profileId}`);
    if (res.ok) { const d = await res.json(); setRecords(d.records); }
  }, []);

  const fetchVitals = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/health/vitals?profileId=${profileId}`);
    if (res.ok) { const d = await res.json(); setVitals(d.vitals); }
  }, []);

  const fetchMedications = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/health/medications?profileId=${profileId}`);
    if (res.ok) { const d = await res.json(); setMedications(d.medications); }
  }, []);

  const fetchAppointments = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/health/appointments?profileId=${profileId}`);
    if (res.ok) { const d = await res.json(); setAppointments(d.appointments); }
  }, []);

  const fetchAll = useCallback(async (profileId: string) => {
    await Promise.all([
      fetchRecords(profileId),
      fetchVitals(profileId),
      fetchMedications(profileId),
      fetchAppointments(profileId),
    ]);
  }, [fetchRecords, fetchVitals, fetchMedications, fetchAppointments]);

  useEffect(() => { fetchProfiles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) fetchAll(selected.id);
    else { setRecords([]); setVitals([]); setMedications([]); setAppointments([]); }
  }, [selected, fetchAll]);

  // ── Derived / filtered data ──────────────────────────────────────
  const filteredRecords = useMemo(() =>
    records.filter(r => recordFilter === 'all' || r.type === recordFilter),
    [records, recordFilter]);

  const filteredMeds = useMemo(() =>
    medications.filter(m =>
      medFilter === 'all' ? true :
      medFilter === 'active' ? m.isActive : !m.isActive),
    [medications, medFilter]);

  const filteredAppts = useMemo(() =>
    appointments.filter(a => apptFilter === 'all' || a.status === apptFilter),
    [appointments, apptFilter]);

  const upcomingAppts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date >= today && a.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  }, [appointments]);

  // ── Profile CRUD ─────────────────────────────────────────────────
  async function handleSaveProfile() {
    if (!profileForm.personName) { toast.error('Name is required'); return; }
    let photoUrl = editProfile?.photoUrl || '';
    if (profilePhoto) photoUrl = await fileToBase64(profilePhoto);

    const url    = editProfile ? `/api/health/profiles/${editProfile.id}` : '/api/health/profiles';
    const method = editProfile ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profileForm, photoUrl: photoUrl || undefined }),
    });
    if (!res.ok) { toast.error('Failed to save profile'); return; }
    const data = await res.json();
    if (editProfile) {
      setProfiles(p => p.map(pr => pr.id === editProfile.id ? data.profile : pr));
      if (selected?.id === editProfile.id) setSelected(data.profile);
      toast.success('Profile updated');
    } else {
      setProfiles(p => [...p, data.profile]);
      toast.success('Profile added');
    }
    setProfileOpen(false); setEditProfile(null); setProfileForm(emptyProfile); setProfilePhoto(null);
  }

  function openEditProfile(p: HealthProfile) {
    setEditProfile(p);
    setProfileForm({ personName: p.personName, relation: p.relation, dateOfBirth: p.dateOfBirth || '', gender: p.gender || '', bloodGroup: p.bloodGroup || '', allergies: p.allergies || '', chronicConditions: p.chronicConditions || '', emergencyContact: p.emergencyContact || '', notes: p.notes || '' });
    setProfileOpen(true);
  }

  async function handleDeleteProfile(id: string) {
    const res = await fetch(`/api/health/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setProfiles(p => p.filter(pr => pr.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Profile removed');
    setDeleteConfirm(null);
  }

  // ── Record CRUD ──────────────────────────────────────────────────
  async function handleSaveRecord() {
    if (!selected || !recordForm.title || !recordForm.date) { toast.error('Title and date required'); return; }
    let fileUrl = editRecord?.fileUrl || ''; let fileName = editRecord?.fileName || ''; let fileType = editRecord?.fileType || '';
    if (recordFile) { fileUrl = await fileToBase64(recordFile); fileName = recordFile.name; fileType = recordFile.type.startsWith('image/') ? 'image' : 'pdf'; }
    const labData = labRows.filter(r => r.name).map(r => ({ ...r, normalMin: parseFloat(r.normalMin) || undefined, normalMax: parseFloat(r.normalMax) || undefined }));

    const url    = editRecord ? `/api/health/records/${editRecord.id}` : '/api/health/records';
    const method = editRecord ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: selected.id, ...recordForm, labResults: labData, fileUrl: fileUrl || undefined, fileName: fileName || undefined, fileType: fileType || undefined }),
    });
    if (!res.ok) { toast.error('Failed to save record'); return; }
    toast.success(editRecord ? 'Record updated' : 'Record added');
    setRecordOpen(false); setEditRecord(null); setRecordForm(emptyRecord); setRecordFile(null); setLabRows([]);
    fetchRecords(selected.id);
  }

  function openEditRecord(r: HealthRecord) {
    setEditRecord(r);
    setRecordForm({ type: r.type, title: r.title, date: r.date, doctor: r.doctor || '', hospital: r.hospital || '', diagnosis: r.diagnosis || '', notes: r.notes || '' });
    try { setLabRows(r.labResults ? JSON.parse(r.labResults).map((x: object) => ({ name: (x as {name:string}).name || '', value: (x as {value:string}).value || '', unit: (x as {unit:string}).unit || '', normalMin: String((x as {normalMin:string}).normalMin || ''), normalMax: String((x as {normalMax:string}).normalMax || ''), status: (x as {status:string}).status || '' })) : []); } catch { setLabRows([]); }
    setRecordOpen(true);
  }

  async function handleDeleteRecord(id: string) {
    const res = await fetch(`/api/health/records/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setRecords(r => r.filter(rec => rec.id !== id));
    toast.success('Record deleted');
  }

  // ── Vitals CRUD ──────────────────────────────────────────────────
  async function handleSaveVital() {
    if (!selected || !vitalForm.date) { toast.error('Date required'); return; }
    const payload: Record<string, unknown> = { profileId: selected.id, date: vitalForm.date, time: vitalForm.time || undefined, notes: vitalForm.notes || undefined };
    if (vitalForm.systolic)    payload.systolic        = parseInt(vitalForm.systolic);
    if (vitalForm.diastolic)   payload.diastolic       = parseInt(vitalForm.diastolic);
    if (vitalForm.heartRate)   payload.heartRate       = parseInt(vitalForm.heartRate);
    if (vitalForm.weight)      payload.weight          = parseFloat(vitalForm.weight);
    if (vitalForm.height)      payload.height          = parseFloat(vitalForm.height);
    if (vitalForm.temperature) payload.temperature     = parseFloat(vitalForm.temperature);
    if (vitalForm.bloodSugar)  payload.bloodSugar      = parseFloat(vitalForm.bloodSugar);
    if (vitalForm.spo2)        payload.spo2            = parseInt(vitalForm.spo2);
    payload.bloodSugarType = vitalForm.bloodSugarType;

    const res = await fetch('/api/health/vitals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error('Failed to save vitals'); return; }
    toast.success('Vitals recorded');
    setVitalOpen(false); setVitalForm(emptyVital); fetchVitals(selected.id);
  }

  async function handleDeleteVital(id: string) {
    const res = await fetch(`/api/health/vitals/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setVitals(v => v.filter(x => x.id !== id)); toast.success('Vital record deleted');
  }

  // ── Medication CRUD ──────────────────────────────────────────────
  async function handleSaveMed() {
    if (!selected || !medForm.name) { toast.error('Name required'); return; }
    const url    = editMed ? `/api/health/medications/${editMed.id}` : '/api/health/medications';
    const method = editMed ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: selected.id, ...medForm }) });
    if (!res.ok) { toast.error('Failed to save medication'); return; }
    toast.success(editMed ? 'Medication updated' : 'Medication added');
    setMedOpen(false); setEditMed(null); setMedForm(emptyMed); fetchMedications(selected.id);
  }

  async function handleToggleMed(id: string, isActive: boolean) {
    const res = await fetch(`/api/health/medications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) });
    if (!res.ok) { toast.error('Failed to update'); return; }
    setMedications(m => m.map(x => x.id === id ? { ...x, isActive } : x));
    toast.success(isActive ? 'Medication resumed' : 'Medication stopped');
  }

  async function handleDeleteMed(id: string) {
    const res = await fetch(`/api/health/medications/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setMedications(m => m.filter(x => x.id !== id)); toast.success('Medication removed');
  }

  function openEditMed(m: Medication) {
    setEditMed(m);
    setMedForm({ name: m.name, genericName: m.genericName || '', dosage: m.dosage || '', frequency: m.frequency || '', route: m.route || '', startDate: m.startDate || '', endDate: m.endDate || '', prescribedBy: m.prescribedBy || '', specialty: m.specialty || '', purpose: m.purpose || '', notes: m.notes || '' });
    setMedOpen(true);
  }

  // ── Appointment CRUD ─────────────────────────────────────────────
  async function handleSaveAppt() {
    if (!selected || !apptForm.title || !apptForm.date) { toast.error('Title and date required'); return; }
    const url    = editAppt ? `/api/health/appointments/${editAppt.id}` : '/api/health/appointments';
    const method = editAppt ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: selected.id, ...apptForm }) });
    if (!res.ok) { toast.error('Failed to save appointment'); return; }
    toast.success(editAppt ? 'Appointment updated' : 'Appointment added');
    setApptOpen(false); setEditAppt(null); setApptForm(emptyAppt); fetchAppointments(selected.id);
  }

  async function handleApptStatus(id: string, status: string) {
    const res = await fetch(`/api/health/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!res.ok) { toast.error('Failed to update'); return; }
    setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x));
    toast.success('Appointment updated');
  }

  async function handleDeleteAppt(id: string) {
    const res = await fetch(`/api/health/appointments/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setAppointments(a => a.filter(x => x.id !== id)); toast.success('Appointment removed');
  }

  function openEditAppt(a: HealthAppointment) {
    setEditAppt(a);
    setApptForm({ title: a.title, doctor: a.doctor || '', specialty: a.specialty || '', hospital: a.hospital || '', date: a.date, time: a.time || '', status: a.status, reason: a.reason || '', outcome: a.outcome || '', notes: a.notes || '' });
    setApptOpen(true);
  }

  // ── Tab add button label ─────────────────────────────────────────
  const tabAddLabel: Record<string, string> = {
    overview: '', records: '+ Record', vitals: '+ Vitals', medications: '+ Medication', appointments: '+ Appointment',
  };
  function handleTabAdd() {
    if (activeTab === 'records')      { setEditRecord(null); setRecordForm(emptyRecord); setLabRows([]); setRecordFile(null); setRecordOpen(true); }
    if (activeTab === 'vitals')       { setVitalForm(emptyVital); setVitalOpen(true); }
    if (activeTab === 'medications')  { setEditMed(null); setMedForm(emptyMed); setMedOpen(true); }
    if (activeTab === 'appointments') { setEditAppt(null); setApptForm(emptyAppt); setApptOpen(true); }
  }

  // ── Counts for tab badges ────────────────────────────────────────
  const activeMedCount  = medications.filter(m => m.isActive).length;
  const upcomingApptCnt = appointments.filter(a => { const t = new Date().toISOString().split('T')[0]; return a.date >= t && a.status === 'scheduled'; }).length;

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* ── Topbar ── */}
      <div style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, height: 'var(--topbar-height)',
      }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 17, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🏥</span> Health
        </div>
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4"/></svg>
            <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{selected.personName}</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        {selected && tabAddLabel[activeTab] && (
          <Btn variant="ghost" size="sm" onClick={handleTabAdd} style={{ flexShrink: 0 }}>
            {tabAddLabel[activeTab]}
          </Btn>
        )}
        {selected && (
          <>
            <button
              onClick={() => generateHealthReport(selected, records, vitals, medications, appointments)}
              title="Export PDF Report"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 'var(--r2)',
                background: 'var(--bg4)', border: '1px solid var(--border)',
                color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v5h5"/><path d="M8 10v4M6 12l2 2 2-2"/>
              </svg>
              <span className="health-pdf-label">PDF</span>
            </button>
            <button
              onClick={() => setShowReports(r => !r)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 'var(--r2)',
                background: showReports ? 'var(--accent3)' : 'var(--bg4)',
                border: `1px solid ${showReports ? 'var(--accent)' : 'var(--border)'}`,
                color: showReports ? 'var(--accent2)' : 'var(--text2)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              📊 <span className="health-report-label">Reports</span>
            </button>
          </>
        )}
        <Btn variant="primary" onClick={() => { setEditProfile(null); setProfileForm(emptyProfile); setProfilePhoto(null); setProfileOpen(true); }} style={{ flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
          <span className="health-add-label">Add Person</span>
        </Btn>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel: Family members ── */}
        <div style={{
          width: 260, minWidth: 260, background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-syne)', fontWeight: 700 }}>
              Family Members ({profiles.length})
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {loading && profiles.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>Loading…</div>
            )}
            {!loading && profiles.length === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍👩‍👧‍👦</div>
                <div style={{ fontSize: 12, marginBottom: 4, color: 'var(--text2)' }}>No family members yet</div>
                <div style={{ fontSize: 11 }}>Click "Add Person" to start tracking health records for your family.</div>
              </div>
            )}
            <AnimatePresence>
              {profiles.map(p => {
                const isActive = selected?.id === p.id;
                const [fg] = RELATION_COLORS[p.relation] || RELATION_COLORS.other;
                return (
                  <motion.div
                    key={p.id}
                    layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={() => setSelected(isActive ? null : p)}
                    style={{
                      background: isActive ? 'var(--bg4)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--border2)' : 'transparent'}`,
                      borderRadius: 'var(--r2)', padding: '10px 10px', marginBottom: 4,
                      cursor: 'pointer', transition: 'all 0.12s', position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isActive && <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: '0 3px 3px 0', background: 'var(--accent)' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <ProfileAvatar profile={p} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.personName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, color: fg, textTransform: 'capitalize', fontWeight: 600 }}>{p.relation}</span>
                          {p.bloodGroup && <BloodBadge group={p.bloodGroup} />}
                          {p.dateOfBirth && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{calcAge(p.dateOfBirth)}</span>}
                        </div>
                      </div>
                    </div>
                    {isActive && p._count && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <StatBox val={p._count.records}      label="Records" color="var(--accent2)" />
                        <StatBox val={p._count.medications}  label="Meds"    color="#e89a45" />
                        <StatBox val={p._count.appointments} label="Appts"   color="#6aa3d8" />
                      </div>
                    )}
                    {isActive && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        <button onClick={e => { e.stopPropagation(); openEditProfile(p); }} style={{ flex: 1, padding: '4px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', fontSize: 11, color: 'var(--text2)' }}>✏️ Edit</button>
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: 'profile', id: p.id }); }} style={{ padding: '4px 8px', background: 'rgba(224,92,106,0.1)', border: '1px solid rgba(224,92,106,0.25)', borderRadius: 5, cursor: 'pointer', color: 'var(--red)', fontSize: 11 }}>🗑️</button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Center: Main content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg5)' }}>
          {!selected ? (
            /* ── No selection: Family overview cards ── */
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {profiles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text3)', textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏥</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-syne)', color: 'var(--text2)', marginBottom: 6 }}>Family Health Hub</div>
                    <div style={{ fontSize: 13, maxWidth: 300 }}>Track health records, vitals, medications and appointments for your entire family — all in one place.</div>
                  </div>
                  <Btn variant="primary" onClick={() => { setEditProfile(null); setProfileForm(emptyProfile); setProfilePhoto(null); setProfileOpen(true); }}>
                    👨‍👩‍👧‍👦 Add Your First Family Member
                  </Btn>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: 14 }}>
                    Family Health Overview — Select a member to view details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {profiles.map(p => {
                      const [fg, bg] = RELATION_COLORS[p.relation] || RELATION_COLORS.other;
                      return (
                        <motion.div key={p.id} whileHover={{ y: -2 }} onClick={() => setSelected(p)}
                          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18, cursor: 'pointer', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <ProfileAvatar profile={p} size={52} />
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{p.personName}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: fg, fontWeight: 600, textTransform: 'capitalize' }}>{p.relation}</span>
                                {p.bloodGroup && <BloodBadge group={p.bloodGroup} />}
                                {p.dateOfBirth && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{calcAge(p.dateOfBirth)}</span>}
                              </div>
                            </div>
                          </div>
                          {p._count && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                              <div style={{ background: 'var(--bg4)', borderRadius: 8, padding: '8px 10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-syne)', color: 'var(--accent2)' }}>{p._count.records}</div>
                                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>Records</div>
                              </div>
                              <div style={{ background: 'var(--bg4)', borderRadius: 8, padding: '8px 10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-syne)', color: '#e89a45' }}>{p._count.medications}</div>
                                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>Active Meds</div>
                              </div>
                              <div style={{ background: 'var(--bg4)', borderRadius: 8, padding: '8px 10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-syne)', color: '#6aa3d8' }}>{p._count.appointments}</div>
                                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>Appts</div>
                              </div>
                            </div>
                          )}
                          {p.allergies && <div style={{ marginTop: 10, fontSize: 11, color: '#e89a45', background: 'rgba(232,154,69,0.1)', borderRadius: 6, padding: '4px 8px', border: '1px solid rgba(232,154,69,0.2)' }}>⚠️ {p.allergies}</div>}
                          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 4 }}>View health records <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4l4 4-4 4"/></svg></div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Selected person: Tabbed health dashboard ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Person header strip */}
              <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 20px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <ProfileAvatar profile={selected} size={48} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-syne)', color: 'var(--text)', letterSpacing: '-0.3px' }}>{selected.personName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {selected.bloodGroup && <BloodBadge group={selected.bloodGroup} />}
                      {selected.gender && <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{selected.gender}</span>}
                      {selected.dateOfBirth && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Age {calcAge(selected.dateOfBirth)} · DOB {fmtDate(selected.dateOfBirth)}</span>}
                      {selected.allergies && <span style={{ fontSize: 10, color: '#e89a45', background: 'rgba(232,154,69,0.1)', border: '1px solid rgba(232,154,69,0.25)', padding: '2px 7px', borderRadius: 4 }}>⚠️ {selected.allergies}</span>}
                    </div>
                  </div>
                  {/* Upcoming appointment badge */}
                  {upcomingAppts.length > 0 && (
                    <div style={{ background: 'rgba(106,163,216,0.1)', border: '1px solid rgba(106,163,216,0.25)', borderRadius: 8, padding: '8px 12px', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: '#6aa3d8', fontWeight: 700, marginBottom: 2 }}>Next Appointment</div>
                      <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{upcomingAppts[0].title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(upcomingAppts[0].date)}{upcomingAppts[0].time && ` ${upcomingAppts[0].time}`}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
                {[
                    { key: 'overview', label: 'Overview', icon: 'fi fi-rr-dashboard', },
                    { key: 'records', label: 'Records', icon: 'fi fi-rr-clipboard', count: records.length },
                    { key: 'vitals', label: 'Vitals', icon: 'fi fi-rr-heart-rate', count: vitals.length },
                    { key: 'medications', label: 'Medications', icon: 'fi fi-rr-pills', count: activeMedCount },
                    { key: 'appointments', label: 'Appointments', icon: 'fi fi-rr-calendar', count: upcomingApptCnt },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} style={{
                    flex: '0 0 auto', padding: '11px 16px', border: 'none', cursor: 'pointer',
                    background: 'transparent', fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 12,
                    color: activeTab === tab.key ? 'var(--accent2)' : 'var(--text3)',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}>
                    <i className={tab.icon}/> {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{ fontSize: 9, background: activeTab === tab.key ? 'var(--accent3)' : 'var(--bg4)', color: activeTab === tab.key ? 'var(--accent2)' : 'var(--text3)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                <AnimatePresence mode="wait">
                  {/* OVERVIEW */}
                  {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {[
                          { label: 'Health Records', val: records.length,     color: 'var(--accent2)', emoji: '📋', onClick: () => setActiveTab('records') },
                          { label: 'Vitals Tracked', val: vitals.length,      color: '#e05c6a',        emoji: '❤️',  onClick: () => setActiveTab('vitals') },
                          { label: 'Active Meds',    val: activeMedCount,     color: '#e89a45',        emoji: '💊', onClick: () => setActiveTab('medications') },
                          { label: 'Upcoming Appts', val: upcomingApptCnt,    color: '#6aa3d8',        emoji: '🩺', onClick: () => setActiveTab('appointments') },
                        ].map(s => (
                          <div key={s.label} onClick={s.onClick} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '16px', cursor: 'pointer', transition: 'border-color 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.emoji}</div>
                            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {selected.chronicConditions && (
                        <div style={{ background: 'rgba(224,92,106,0.07)', border: '1px solid rgba(224,92,106,0.2)', borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 16 }}>
                          <div style={{ fontSize: 10, color: '#e05c6a', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 4 }}>🔴 Chronic Conditions</div>
                          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.chronicConditions}</div>
                        </div>
                      )}

                      {/* Latest vitals snapshot */}
                      {vitals.length > 0 && (() => {
                        const lv = vitals[0];
                        return (
                          <div style={{ marginBottom: 16 }}>
                            <SectionHeader title={`Latest Vitals · ${fmtDate(lv.date)}`} action={<button onClick={() => setActiveTab('vitals')} style={{ fontSize: 11, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                              {lv.systolic && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>🫀 Blood Pressure</div><div style={{ fontSize: 15, fontWeight: 800, color: bpStatus(lv.systolic, lv.diastolic).color }}>{lv.systolic}/{lv.diastolic}</div><div style={{ fontSize: 9, color: bpStatus(lv.systolic, lv.diastolic).color }}>{bpStatus(lv.systolic, lv.diastolic).label}</div></div>}
                              {lv.heartRate && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>❤️ Heart Rate</div><div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{lv.heartRate} bpm</div></div>}
                              {lv.weight && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>⚖️ Weight</div><div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{lv.weight} kg</div></div>}
                              {lv.bloodSugar && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>🩸 Blood Sugar</div><div style={{ fontSize: 15, fontWeight: 800, color: glucoseStatus(lv.bloodSugar).color }}>{lv.bloodSugar} mg/dL</div><div style={{ fontSize: 9, color: glucoseStatus(lv.bloodSugar).color }}>{glucoseStatus(lv.bloodSugar).label}</div></div>}
                              {lv.spo2 && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>💨 SpO₂</div><div style={{ fontSize: 15, fontWeight: 800, color: lv.spo2 >= 95 ? '#4db88a' : '#e05c6a' }}>{lv.spo2}%</div></div>}
                              {lv.bmi && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>📊 BMI</div><div style={{ fontSize: 15, fontWeight: 800, color: bmiStatus(lv.bmi).color }}>{lv.bmi}</div><div style={{ fontSize: 9, color: bmiStatus(lv.bmi).color }}>{bmiStatus(lv.bmi).label}</div></div>}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Recent records */}
                      {records.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <SectionHeader title="Recent Records" action={<button onClick={() => setActiveTab('records')} style={{ fontSize: 11, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>} />
                          {records.slice(0, 3).map(r => { const rt = RECORD_TYPE_MAP[r.type] || RECORD_TYPE_MAP.general; return (
                            <div key={r.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 18 }}>{rt.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.title}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{rt.label} · {fmtDate(r.date)}</div></div>
                            </div>
                          ); })}
                        </div>
                      )}

                      {/* Notes */}
                      {selected.notes && <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '12px 14px' }}><div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Notes</div><div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{selected.notes}</div></div>}
                    </motion.div>
                  )}

                  {/* RECORDS */}
                  {activeTab === 'records' && (
                    <motion.div key="records" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                     <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
  <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Filter</span>
  {[{ value: 'all', label: 'All', icon: '', color: '' }, ...RECORD_TYPES].map(t => (
    <button
      key={t.value}
      onClick={() => setRecordFilter(t.value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontWeight: 500,
        border: `1px solid ${recordFilter === t.value ? 'var(--accent)' : 'var(--border)'}`,
        background: recordFilter === t.value ? 'var(--accent3)' : 'transparent',
        color: recordFilter === t.value ? 'var(--accent2)' : 'var(--text3)',
        transition: 'all 0.12s',
      }}
    >
      {t.icon && <i className={t.icon} style={{ fontSize: 11, color: recordFilter === t.value ? 'var(--accent2)' : t.color }} />}
      {t.label}
    </button>
  ))}
</div>
                      {filteredRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                          No records found. <button onClick={() => { setEditRecord(null); setRecordForm(emptyRecord); setLabRows([]); setRecordFile(null); setRecordOpen(true); }} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add one →</button>
                        </div>
                      ) : (
                        <AnimatePresence>{filteredRecords.map(r => <RecordCard key={r.id} record={r} onEdit={openEditRecord} onDelete={handleDeleteRecord} />)}</AnimatePresence>
                      )}
                    </motion.div>
                  )}

                  {/* VITALS */}
                  {activeTab === 'vitals' && (
                    <motion.div key="vitals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                      {vitals.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>❤️</div>
                          No vitals recorded. <button onClick={() => { setVitalForm(emptyVital); setVitalOpen(true); }} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add reading →</button>
                        </div>
                      ) : (
                        <AnimatePresence>{vitals.map(v => <VitalCard key={v.id} vital={v} onDelete={handleDeleteVital} />)}</AnimatePresence>
                      )}
                    </motion.div>
                  )}

                  {/* MEDICATIONS */}
                  {activeTab === 'medications' && (
                    <motion.div key="medications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                        {(['all', 'active', 'stopped'] as const).map(f => (
                          <button key={f} onClick={() => setMedFilter(f)} style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontWeight: 500,
                            border: `1px solid ${medFilter === f ? 'var(--accent)' : 'var(--border)'}`,
                            background: medFilter === f ? 'var(--accent3)' : 'transparent',
                            color: medFilter === f ? 'var(--accent2)' : 'var(--text3)', transition: 'all 0.12s',
                          }}>{{ all: 'All', active: '✅ Active', stopped: '⏹ Stopped' }[f]}</button>
                        ))}
                      </div>
                      {filteredMeds.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
                          No medications found. <button onClick={() => { setEditMed(null); setMedForm(emptyMed); setMedOpen(true); }} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add one →</button>
                        </div>
                      ) : (
                        <AnimatePresence>{filteredMeds.map(m => <MedCard key={m.id} med={m} onEdit={openEditMed} onDelete={handleDeleteMed} onToggle={handleToggleMed} />)}</AnimatePresence>
                      )}
                    </motion.div>
                  )}

                  {/* APPOINTMENTS */}
                  {activeTab === 'appointments' && (
                    <motion.div key="appointments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
                        {[{ value: 'all', label: 'All' }, ...APPT_STATUSES].map(s => (
                          <button key={s.value} onClick={() => setApptFilter(s.value)} style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontWeight: 500,
                            border: `1px solid ${apptFilter === s.value ? 'var(--accent)' : 'var(--border)'}`,
                            background: apptFilter === s.value ? 'var(--accent3)' : 'transparent',
                            color: apptFilter === s.value ? 'var(--accent2)' : 'var(--text3)', transition: 'all 0.12s',
                          }}>{s.label}</button>
                        ))}
                      </div>
                      {filteredAppts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
                          No appointments found. <button onClick={() => { setEditAppt(null); setApptForm(emptyAppt); setApptOpen(true); }} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Schedule one →</button>
                        </div>
                      ) : (
                        <AnimatePresence>{filteredAppts.map(a => <ApptCard key={a.id} appt={a} onEdit={openEditAppt} onDelete={handleDeleteAppt} onStatus={handleApptStatus} />)}</AnimatePresence>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Reports slide-in panel ── */}
        <AnimatePresence>
          {showReports && selected && (
            <ReportsPanel
              profile={selected} vitals={vitals} records={records}
              onClose={() => setShowReports(false)}
              period={reportPeriod} setPeriod={setReportPeriod}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════ */}

      {/* Add/Edit Profile */}
      <Modal open={profileOpen} onClose={() => { setProfileOpen(false); setEditProfile(null); }} title={editProfile ? 'Edit Health Profile' : 'Add Family Member'} width={480}
        footer={<><Btn variant="ghost" onClick={() => setProfileOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSaveProfile}>{editProfile ? 'Update' : 'Add Member'}</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Full Name *"><Input value={profileForm.personName} onChange={e => setProfileForm(f => ({ ...f, personName: e.target.value }))} placeholder="e.g. Ranjan Kumar" /></FormField></div>
          <FormField label="Relation"><Select value={profileForm.relation} onChange={e => setProfileForm(f => ({ ...f, relation: e.target.value }))} options={RELATIONS} /></FormField>
          <FormField label="Gender"><Select value={profileForm.gender} onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value }))} options={[{ value: '', label: 'Not specified' }, ...GENDERS]} /></FormField>
          <FormField label="Date of Birth"><Input type="date" value={profileForm.dateOfBirth} onChange={e => setProfileForm(f => ({ ...f, dateOfBirth: e.target.value }))} /></FormField>
          <FormField label="Blood Group"><Select value={profileForm.bloodGroup} onChange={e => setProfileForm(f => ({ ...f, bloodGroup: e.target.value }))} options={[{ value: '', label: 'Unknown' }, ...BLOOD_GROUPS]} /></FormField>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Allergies"><Input value={profileForm.allergies} onChange={e => setProfileForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin, Peanuts" /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Chronic Conditions"><Input value={profileForm.chronicConditions} onChange={e => setProfileForm(f => ({ ...f, chronicConditions: e.target.value }))} placeholder="e.g. Diabetes Type 2, Hypertension" /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Emergency Contact"><Input value={profileForm.emergencyContact} onChange={e => setProfileForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="Name & phone" /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Profile Photo"><FilePickerBtn onFile={setProfilePhoto} accept="image/*" label={profilePhoto ? profilePhoto.name : (editProfile?.photoUrl ? 'Change photo…' : 'Upload photo…')} /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Notes"><Textarea value={profileForm.notes} onChange={e => setProfileForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" /></FormField></div>
        </div>
      </Modal>

      {/* Add/Edit Record */}
      <Modal open={recordOpen} onClose={() => { setRecordOpen(false); setEditRecord(null); }} title={editRecord ? 'Edit Health Record' : 'Add Health Record'} width={560}
        footer={<><Btn variant="ghost" onClick={() => setRecordOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSaveRecord}>{editRecord ? 'Update' : 'Add Record'}</Btn></>}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {RECORD_TYPES.map(t => (
            <button key={t.value} onClick={() => setRecordForm(f => ({ ...f, type: t.value }))} style={{
              padding: '5px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${recordForm.type === t.value ? t.color : 'var(--border)'}`,
              background: recordForm.type === t.value ? `${t.color}18` : 'transparent',
              color: recordForm.type === t.value ? t.color : 'var(--text3)', fontWeight: 500, transition: 'all 0.12s',
            }}><i className={t.icon} />{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Title *"><Input value={recordForm.title} onChange={e => setRecordForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Blood Panel, Chest X-Ray" /></FormField></div>
          <FormField label="Date *"><Input type="date" value={recordForm.date} onChange={e => setRecordForm(f => ({ ...f, date: e.target.value }))} /></FormField>
          <FormField label="Doctor"><Input value={recordForm.doctor} onChange={e => setRecordForm(f => ({ ...f, doctor: e.target.value }))} placeholder="Dr. Name" /></FormField>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Hospital / Lab"><Input value={recordForm.hospital} onChange={e => setRecordForm(f => ({ ...f, hospital: e.target.value }))} placeholder="Hospital or laboratory name" /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Diagnosis / Finding"><Textarea value={recordForm.diagnosis} onChange={e => setRecordForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Doctor's diagnosis or findings…" style={{ minHeight: 60 }} /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Notes"><Textarea value={recordForm.notes} onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes…" style={{ minHeight: 50 }} /></FormField></div>
        </div>

        {/* Lab results builder */}
        {['blood_test', 'urine_test'].includes(recordForm.type) && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: 8 }}>Lab Results (Optional)</div>
            {labRows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 4, marginBottom: 4 }}>
                <input value={row.name} onChange={e => setLabRows(r => r.map((x, j) => j===i ? {...x, name: e.target.value} : x))} placeholder="Test name" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                <input value={row.value} onChange={e => setLabRows(r => r.map((x, j) => j===i ? {...x, value: e.target.value} : x))} placeholder="Value" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                <input value={row.unit} onChange={e => setLabRows(r => r.map((x, j) => j===i ? {...x, unit: e.target.value} : x))} placeholder="Unit" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                <input value={row.normalMin} onChange={e => setLabRows(r => r.map((x, j) => j===i ? {...x, normalMin: e.target.value} : x))} placeholder="Min" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                <input value={row.normalMax} onChange={e => setLabRows(r => r.map((x, j) => j===i ? {...x, normalMax: e.target.value} : x))} placeholder="Max" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                <button onClick={() => setLabRows(r => r.filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--red)', padding: '0 6px' }}>✕</button>
              </div>
            ))}
            <Btn size="sm" variant="ghost" onClick={() => setLabRows(r => [...r, { name: '', value: '', unit: '', normalMin: '', normalMax: '', status: '' }])}>+ Add Row</Btn>
          </div>
        )}

        <div style={{ marginTop: 12 }}><FormField label="Attach File (PDF / Image)"><FilePickerBtn onFile={setRecordFile} label={recordFile ? recordFile.name : (editRecord?.fileName || 'Attach file…')} /></FormField></div>
      </Modal>

      {/* Add Vitals */}
      <Modal open={vitalOpen} onClose={() => setVitalOpen(false)} title="Record Vitals" width={520}
        footer={<><Btn variant="ghost" onClick={() => setVitalOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSaveVital}>Save Vitals</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <FormField label="Date *"><Input type="date" value={vitalForm.date} onChange={e => setVitalForm(f => ({ ...f, date: e.target.value }))} /></FormField>
          <FormField label="Time"><Input type="time" value={vitalForm.time} onChange={e => setVitalForm(f => ({ ...f, time: e.target.value }))} /></FormField>
          <FormField label="Systolic BP (mmHg)"><Input type="number" value={vitalForm.systolic} onChange={e => setVitalForm(f => ({ ...f, systolic: e.target.value }))} placeholder="e.g. 120" /></FormField>
          <FormField label="Diastolic BP (mmHg)"><Input type="number" value={vitalForm.diastolic} onChange={e => setVitalForm(f => ({ ...f, diastolic: e.target.value }))} placeholder="e.g. 80" /></FormField>
          <FormField label="Heart Rate (bpm)"><Input type="number" value={vitalForm.heartRate} onChange={e => setVitalForm(f => ({ ...f, heartRate: e.target.value }))} placeholder="e.g. 72" /></FormField>
          <FormField label="SpO₂ (%)"><Input type="number" value={vitalForm.spo2} onChange={e => setVitalForm(f => ({ ...f, spo2: e.target.value }))} placeholder="e.g. 98" /></FormField>
          <FormField label="Weight (kg)"><Input type="number" step="0.1" value={vitalForm.weight} onChange={e => setVitalForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 70.5" /></FormField>
          <FormField label="Height (cm)"><Input type="number" step="0.1" value={vitalForm.height} onChange={e => setVitalForm(f => ({ ...f, height: e.target.value }))} placeholder="e.g. 170" /></FormField>
          <FormField label="Temperature (°C)"><Input type="number" step="0.1" value={vitalForm.temperature} onChange={e => setVitalForm(f => ({ ...f, temperature: e.target.value }))} placeholder="e.g. 37.0" /></FormField>
          <FormField label="Blood Sugar (mg/dL)"><Input type="number" step="0.1" value={vitalForm.bloodSugar} onChange={e => setVitalForm(f => ({ ...f, bloodSugar: e.target.value }))} placeholder="e.g. 95" /></FormField>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Sugar Type"><Select value={vitalForm.bloodSugarType} onChange={e => setVitalForm(f => ({ ...f, bloodSugarType: e.target.value }))} options={[{ value: 'fasting', label: 'Fasting' }, { value: 'post_meal', label: 'Post Meal (2hr)' }, { value: 'random', label: 'Random' }]} /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Notes"><Textarea value={vitalForm.notes} onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any relevant notes…" style={{ minHeight: 50 }} /></FormField></div>
        </div>
        {vitalForm.weight && vitalForm.height && (
          <div style={{ fontSize: 11.5, color: 'var(--accent2)', marginTop: -8, marginBottom: 8 }}>
            📊 Calculated BMI: {(parseFloat(vitalForm.weight) / Math.pow(parseFloat(vitalForm.height) / 100, 2)).toFixed(1)} — {bmiStatus(parseFloat(vitalForm.weight) / Math.pow(parseFloat(vitalForm.height) / 100, 2)).label}
          </div>
        )}
      </Modal>

      {/* Add/Edit Medication */}
      <Modal open={medOpen} onClose={() => { setMedOpen(false); setEditMed(null); }} title={editMed ? 'Edit Medication' : 'Add Medication'} width={520}
        footer={<><Btn variant="ghost" onClick={() => setMedOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSaveMed}>{editMed ? 'Update' : 'Add Medication'}</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Medication Name *"><Input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Metformin" /></FormField></div>
          <FormField label="Generic Name"><Input value={medForm.genericName} onChange={e => setMedForm(f => ({ ...f, genericName: e.target.value }))} placeholder="Generic name" /></FormField>
          <FormField label="Dosage"><Input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" /></FormField>
          <FormField label="Frequency"><Input value={medForm.frequency} onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. Twice daily" /></FormField>
          <FormField label="Route"><Select value={medForm.route} onChange={e => setMedForm(f => ({ ...f, route: e.target.value }))} options={[{ value: '', label: 'Select…' }, { value: 'oral', label: 'Oral' }, { value: 'injection', label: 'Injection' }, { value: 'topical', label: 'Topical' }, { value: 'inhaled', label: 'Inhaled' }, { value: 'other', label: 'Other' }]} /></FormField>
          <FormField label="Start Date"><Input type="date" value={medForm.startDate} onChange={e => setMedForm(f => ({ ...f, startDate: e.target.value }))} /></FormField>
          <FormField label="End Date"><Input type="date" value={medForm.endDate} onChange={e => setMedForm(f => ({ ...f, endDate: e.target.value }))} /></FormField>
          <FormField label="Prescribed By"><Input value={medForm.prescribedBy} onChange={e => setMedForm(f => ({ ...f, prescribedBy: e.target.value }))} placeholder="Doctor name" /></FormField>
          <FormField label="Specialty"><Input value={medForm.specialty} onChange={e => setMedForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Cardiologist" /></FormField>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Purpose / Condition"><Input value={medForm.purpose} onChange={e => setMedForm(f => ({ ...f, purpose: e.target.value }))} placeholder="What this medication is for" /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Notes"><Textarea value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))} placeholder="Side effects, instructions, notes…" style={{ minHeight: 50 }} /></FormField></div>
        </div>
      </Modal>

      {/* Add/Edit Appointment */}
      <Modal open={apptOpen} onClose={() => { setApptOpen(false); setEditAppt(null); }} title={editAppt ? 'Edit Appointment' : 'Schedule Appointment'} width={520}
        footer={<><Btn variant="ghost" onClick={() => setApptOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSaveAppt}>{editAppt ? 'Update' : 'Schedule'}</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Title *"><Input value={apptForm.title} onChange={e => setApptForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Checkup, Follow-up" /></FormField></div>
          <FormField label="Doctor"><Input value={apptForm.doctor} onChange={e => setApptForm(f => ({ ...f, doctor: e.target.value }))} placeholder="Dr. Name" /></FormField>
          <FormField label="Specialty"><Input value={apptForm.specialty} onChange={e => setApptForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Cardiologist" /></FormField>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Hospital / Clinic"><Input value={apptForm.hospital} onChange={e => setApptForm(f => ({ ...f, hospital: e.target.value }))} placeholder="Hospital or clinic name" /></FormField></div>
          <FormField label="Date *"><Input type="date" value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} /></FormField>
          <FormField label="Time"><Input type="time" value={apptForm.time} onChange={e => setApptForm(f => ({ ...f, time: e.target.value }))} /></FormField>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Status"><Select value={apptForm.status} onChange={e => setApptForm(f => ({ ...f, status: e.target.value }))} options={APPT_STATUSES} /></FormField></div>
          <div style={{ gridColumn: '1/-1' }}><FormField label="Reason for Visit"><Textarea value={apptForm.reason} onChange={e => setApptForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why are you visiting?" style={{ minHeight: 50 }} /></FormField></div>
          {editAppt && <div style={{ gridColumn: '1/-1' }}><FormField label="Outcome / Notes"><Textarea value={apptForm.outcome} onChange={e => setApptForm(f => ({ ...f, outcome: e.target.value }))} placeholder="Doctor's notes, outcome…" style={{ minHeight: 50 }} /></FormField></div>}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete"
        footer={<><Btn variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Btn><Btn variant="danger" onClick={() => { if (deleteConfirm?.type === 'profile') handleDeleteProfile(deleteConfirm.id); }}>Delete</Btn></>}>
        <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7 }}>
          This will permanently delete this {deleteConfirm?.type === 'profile' ? 'health profile and all associated records, vitals, medications, and appointments' : 'entry'}. This cannot be undone.
        </div>
      </Modal>

      <style>{`
        .health-pdf-label, .health-report-label, .health-add-label { display: inline; }
        @media (max-width: 768px) {
          .health-pdf-label, .health-report-label, .health-add-label { display: none; }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
