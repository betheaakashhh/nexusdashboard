// src/hooks/useSettings.ts
// Settings are now DB-backed (UserSettings table).
// applySettingsToDOM is still called client-side for live theme/accent changes.

'use client';
import { create } from 'zustand';
import toast from 'react-hot-toast';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  compactMode: boolean;
  defaultLanding: 'contacts' | 'tasks' | 'email' | 'private';
  defaultView: 'cards' | 'table';
  sessionTimeout: 0 | 5 | 15 | 30 | 60;
  defaultSenderName: string;
  defaultFromEmail: string;
  emailSignature: string;
  bccSelf: boolean;
  quickRecipients: string[];
  defaultContactSort: 'name' | 'recent' | 'added';
  contactSearchFields: ('name' | 'phone' | 'email' | 'tags' | 'notes')[];
  importDuplicateHandling: 'skip' | 'overwrite' | 'merge';
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#c9a96e',
  compactMode: false,
  defaultLanding: 'contacts',
  defaultView: 'cards',
  sessionTimeout: 0,
  defaultSenderName: '',
  defaultFromEmail: '',
  emailSignature: '',
  bccSelf: false,
  quickRecipients: [],
  defaultContactSort: 'recent',
  contactSearchFields: ['name', 'phone', 'email'],
  importDuplicateHandling: 'skip',
};

// ── Theme tokens ───────────────────────────────────────────────────────────────
const LIGHT_TOKENS: Record<string, string> = {
  '--bg':      '#f5f4f0',
  '--bg2':     '#ffffff',
  '--bg3':     '#f0eeea',
  '--bg4':     '#e8e6e0',
  '--bg5':     '#edecea',
  '--bg6':     '#e0deda',
  '--border':  '#d8d4cc',
  '--border2': '#c0bbb0',
  '--text':    '#1a1916',
  '--text2':   '#4a4640',
  '--text3':   '#9a9490',
  '--accent3': '#f0e8d8',
};

const DARK_TOKENS: Record<string, string> = {
  '--bg':      '#1c1b19',
  '--bg2':     '#24231f',
  '--bg3':     '#262624',
  '--bg4':     '#2e2d2b',
  '--bg5':     '#30302e',
  '--bg6':     '#383632',
  '--border':  '#3a3832',
  '--border2': '#4a4844',
  '--text':    '#e8e4dc',
  '--text2':   '#a09890',
  '--text3':   '#5e5a54',
  '--accent3': '#3a3020',
};

function hexToRgb(hex: string) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}
function lighten(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const r = Math.min(255, Math.round(c.r + (255 - c.r) * amount));
  const g = Math.min(255, Math.round(c.g + (255 - c.g) * amount));
  const b = Math.min(255, Math.round(c.b + (255 - c.b) * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
function hexToAlpha(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

export function applySettingsToDOM(settings: AppSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && prefersDark);

  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  for (const [k, v] of Object.entries(tokens)) {
    root.style.setProperty(k, v);
  }
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const acc = settings.accentColor;
  root.style.setProperty('--accent', acc);
  root.style.setProperty('--accent2', lighten(acc, 0.15));
  root.style.setProperty('--accent3', hexToAlpha(acc, isDark ? 0.18 : 0.12));

  if (settings.compactMode) {
    root.style.setProperty('--topbar-height', '44px');
    root.classList.add('compact');
  } else {
    root.style.setProperty('--topbar-height', '56px');
    root.classList.remove('compact');
  }
}

// ── Zustand store ─────────────────────────────────────────────────────────────
interface SettingsStore {
  settings: AppSettings;
  loaded: boolean;
  saving: boolean;
  fetchSettings: () => Promise<void>;
  saveSettings: (patch: Partial<AppSettings>) => Promise<void>;
  applyNow: (patch: Partial<AppSettings>) => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  saving: false,

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const { settings } = await res.json();
        set({ settings, loaded: true });
        applySettingsToDOM(settings);
        return;
      } else {
        set({ loaded: true });
        applySettingsToDOM(DEFAULT_SETTINGS);
      }
    } catch {
      set({ loaded: true });
      applySettingsToDOM(DEFAULT_SETTINGS);
    }
  },

  saveSettings: async (patch) => {
    set({ saving: true });
    const next = { ...get().settings, ...patch };
    // Apply to DOM immediately for live preview
    set({ settings: next });
    applySettingsToDOM(next);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Save failed');
      const { settings: saved } = await res.json();
      set({ settings: saved });
    } catch {
      toast.error('Failed to save settings');
    }
    set({ saving: false });
  },

  applyNow: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    applySettingsToDOM(next);
  },
}));