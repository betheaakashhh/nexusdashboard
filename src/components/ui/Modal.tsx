'use client';
// src/components/ui/Modal.tsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, footer, width = 440 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', handler);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'flex-end',  /* bottom-sheet on mobile */
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '0',
          }}
        >
          {/* Desktop: centered modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="modal-desktop"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--r)',
              width: '100%',
              maxWidth: `${width}px`,
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'none', /* shown by CSS on desktop */
              margin: '20px',
            }}
          >
            <ModalContent title={title} onClose={onClose} footer={footer}>
              {children}
            </ModalContent>
          </motion.div>

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="modal-mobile"
            style={{
              background: 'var(--bg2)',
              borderRadius: '20px 20px 0 0',
              border: '1px solid var(--border2)',
              borderBottom: 'none',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'none', /* shown by CSS on mobile */
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Pull handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px', cursor: 'pointer' }} onClick={onClose}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border2)' }} />
            </div>
            <ModalContent title={title} onClose={onClose} footer={footer}>
              {children}
            </ModalContent>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .modal-desktop { display: block !important; }
          .modal-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
          .modal-desktop { display: none !important; }
          .modal-mobile { display: block !important; }
        }
      `}</style>
    </AnimatePresence>
  );
}

function ModalContent({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', fontWeight: 700 }}>{title}</div>
        <button
          onClick={onClose}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text2)', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >✕</button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>{children}</div>

      {/* Footer */}
      {footer && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {footer}
        </div>
      )}
    </>
  );
}