import { type TextareaHTMLAttributes, forwardRef, useState } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helpText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {label && (
          <label
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
            {props.required && <span style={{ color: 'var(--red-500)', marginInlineStart: '4px' }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: 'var(--space-3) var(--space-4)',
            background: focused ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.30)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.7,
            transition: `background var(--duration-fast) var(--ease-standard)`,
            ...style,
          }}
          onFocus={(e) => { setFocused(true); onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); onBlur?.(e) }}
          {...props}
        />
        {error && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--red-500)' }}>
            {error}
          </span>
        )}
        {helpText && !error && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {helpText}
          </span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
