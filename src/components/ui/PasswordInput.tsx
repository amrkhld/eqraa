import { forwardRef, useState } from 'react'
import { Input } from './Input'

interface PasswordInputProps {
  label?: string
  error?: string
  helpText?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  name?: string
  autoComplete?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        label={label}
        trailingAction={
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 'var(--space-1)',
              display: 'flex',
              alignItems: 'center',
              transition: `color var(--duration-fast)`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {visible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        }
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
