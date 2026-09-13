interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const badgeStyles: Record<string, { bg: string; color: string }> = {
  default: { bg: 'var(--surface-black)', color: 'var(--text-secondary)' },
  success: { bg: 'rgba(34, 120, 69, 0.4)', color: 'rgba(130, 230, 160, 0.9)' },
  warning: { bg: 'rgba(160, 120, 20, 0.35)', color: 'rgba(240, 200, 80, 0.9)' },
  error: { bg: 'var(--surface-red)', color: 'var(--red-500)' },
  info: { bg: 'rgba(40, 80, 160, 0.35)', color: 'rgba(130, 180, 255, 0.9)' },
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const s = badgeStyles[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--space-1) var(--space-3)',
        background: s.bg,
        color: s.color,
        fontFamily: 'var(--font-body)',
        fontSize: '0.8rem',
        borderRadius: 'var(--radius-pill)',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
