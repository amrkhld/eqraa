import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = '480px' }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          transition: 'opacity 220ms var(--ease-standard)',
        }}
        className="data-closed:opacity-0"
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-5)',
        }}
      >
        <DialogPanel
          transition
          style={{
            width: '100%',
            maxWidth,
            background: 'rgba(18, 18, 18, 0.96)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-7)',
            maxHeight: '90vh',
            overflowY: 'auto',
            transition: 'opacity 220ms var(--ease-standard), transform 220ms var(--ease-standard)',
          }}
          className="data-closed:opacity-0 data-closed:scale-[0.98]"
        >
          {title && (
            <DialogTitle
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: '1.3rem',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-6)',
              }}
            >
              {title}
            </DialogTitle>
          )}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
