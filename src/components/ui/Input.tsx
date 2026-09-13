import { type InputHTMLAttributes, type ReactNode, forwardRef, useState } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helpText?: string
  leadingIcon?: ReactNode
  trailingAction?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, leadingIcon, trailingAction, style, onFocus, onBlur, ...props }, ref) => {
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
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {leadingIcon && (
            <span
              style={{
                position: 'absolute',
                insetInlineStart: 'var(--space-4)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            style={{
              width: '100%',
              minHeight: '48px',
              paddingInline: leadingIcon ? 'calc(var(--space-4) + 24px) var(--space-4)' : 'var(--space-4)',
              paddingBlock: 'var(--space-3)',
              background: focused ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.30)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              outline: 'none',
              transition: `background var(--duration-fast) var(--ease-standard)`,
              lineHeight: 1.5,
              ...style,
            }}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            {...props}
          />
          {trailingAction && (
            <span
              style={{
                position: 'absolute',
                insetInlineEnd: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {trailingAction}
            </span>
          )}
        </div>
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

Input.displayName = 'Input'
