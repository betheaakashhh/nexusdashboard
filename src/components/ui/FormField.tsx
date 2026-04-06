'use client';
// src/components/ui/FormField.tsx
import React from 'react';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  fontFamily: 'var(--font-syne)',
  fontWeight: 600,
  marginBottom: '6px',
};

const baseInput: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r2)',
  padding: '9px 12px',
  color: 'var(--text)',
  fontSize: '13.5px',
  outline: 'none',
  transition: 'border-color 0.15s',
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{ ...baseInput, ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; props.onFocus?.(e); }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  props.onBlur?.(e);  }}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      style={{ ...baseInput, resize: 'vertical', minHeight: '80px', ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; props.onFocus?.(e); }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  props.onBlur?.(e);  }}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export function Select({ options, ...props }: SelectProps) {
  return (
    <select
      {...props}
      style={{ ...baseInput, cursor: 'pointer', ...props.style }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; props.onFocus?.(e); }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  props.onBlur?.(e);  }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: 'var(--bg2)' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}
export function Btn({ variant = 'ghost', size = 'md', children, style, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-dm-sans)',
    fontWeight: 500,
    transition: 'all 0.15s',
    borderRadius: 'var(--r2)',
    padding: size === 'sm' ? '5px 10px' : '8px 16px',
    fontSize: size === 'sm' ? '12px' : '13px',
    ...(variant === 'primary' && { background: 'var(--accent)', color: '#fff' }),
    ...(variant === 'ghost'   && { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }),
    ...(variant === 'danger'  && { background: 'rgba(255,77,106,0.15)', color: 'var(--red)', border: '1px solid rgba(255,77,106,0.3)' }),
    ...style,
  };

  return (
    <button
      {...props}
      style={base}
      onMouseEnter={(e) => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent2)';
        if (variant === 'ghost')   e.currentTarget.style.background = 'var(--bg4)';
        if (variant === 'danger')  e.currentTarget.style.background = 'rgba(255,77,106,0.25)';
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent)';
        if (variant === 'ghost')   e.currentTarget.style.background = 'var(--bg3)';
        if (variant === 'danger')  e.currentTarget.style.background = 'rgba(255,77,106,0.15)';
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}