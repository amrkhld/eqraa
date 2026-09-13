import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantStyles: Record<ButtonVariant, { bg: string; hoverBg: string; color: string }> = {
  primary: {
    bg: 'rgba(111, 16, 24, 0.72)',
    hoverBg: 'rgba(111, 16, 24, 0.88)',
    color: '#fff',
  },
  secondary: {
    bg: 'rgba(0, 0, 0, 0.40)',
    hoverBg: 'rgba(0, 0, 0, 0.55)',
    color: 'rgba(255,255,255,0.90)',
  },
  ghost: {
    bg: 'transparent',
    hoverBg: 'rgba(0, 0, 0, 0.25)',
    color: 'rgba(255,255,255,0.80)',
  },
  danger: {
    bg: 'rgba(139, 23, 32, 0.55)',
    hoverBg: 'rgba(139, 23, 32, 0.75)',
    color: '#fff',
  },
}

const sizeStyles: Record<ButtonSize, { padding: string; fontSize: string; minHeight: string; iconSize: string }> = {
  sm: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: '0.88rem',
    minHeight: '36px',
    iconSize: '16px',
  },
  md: {
    padding: 'var(--space-3) var(--space-6)',
    fontSize: '0.95rem',
    minHeight: '44px',
    iconSize: '18px',
  },
  lg: {
    padding: 'var(--space-4) var(--space-7)',
    fontSize: '1.05rem',
    minHeight: '52px',
    iconSize: '20px',
  },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, disabled, style, ...props }, ref) => {
    const v = variantStyles[variant]
    const s = sizeStyles[size]
    const isIconOnly = icon && !children

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          background: v.bg,
          color: v.color,
          fontFamily: 'var(--font-body)',
          fontSize: s.fontSize,
          padding: isIconOnly ? s.padding.split(' ')[0] : s.padding,
          minHeight: s.minHeight,
          minWidth: isIconOnly ? s.minHeight : undefined,
          borderRadius: isIconOnly ? 'var(--radius-md)' : 'var(--radius-md)',
          border: 'none',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: `transform var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)`,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !loading) {
            e.currentTarget.style.background = v.hoverBg
            e.currentTarget.style.transform = 'translateY(-1px)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = v.bg
          e.currentTarget.style.transform = 'translateY(0)'
        }}
        onMouseDown={(e) => {
          if (!disabled && !loading) {
            e.currentTarget.style.transform = 'translateY(1px)'
          }
        }}
        onMouseUp={(e) => {
          if (!disabled && !loading) {
            e.currentTarget.style.transform = 'translateY(-1px)'
          }
        }}
        {...props}
      >
        {loading ? (
          <div
            className="animate-spin rounded-full"
            style={{
              width: s.iconSize,
              height: s.iconSize,
              border: '2px solid rgba(255,255,255,0.25)',
              borderTopColor: 'rgba(255,255,255,0.8)',
            }}
          />
        ) : icon ? (
          <span style={{ width: s.iconSize, height: s.iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
