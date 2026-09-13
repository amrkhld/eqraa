import { useState, type ReactNode } from 'react'

export interface AccordionItemProps {
  id?: string
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  isOpen?: boolean
  onToggle?: (open: boolean) => void
  leadingIcon?: ReactNode
  style?: React.CSSProperties
}

export function AccordionItem({
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  leadingIcon,
  style,
}: AccordionItemProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const handleToggle = () => {
    const next = !open
    if (!isControlled) {
      setInternalOpen(next)
    }
    onToggle?.(next)
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-black)',
        overflow: 'hidden',
        transition: 'background var(--duration-fast)',
        ...style,
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="cursor-pointer w-full text-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          gap: 'var(--space-3)',
          transition: 'background-color var(--duration-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-black-strong)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-expanded={open}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
          {leadingIcon}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '0.98rem', color: 'var(--text-primary)' }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 'var(--space-2)', flexShrink: 0 }}>
          {badge}
          {/* RTL Chevron: points left when closed, rotates 90deg downward to bottom when open */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: 'var(--text-muted)',
              transform: open ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 200ms var(--ease-standard)',
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-4) var(--space-4) var(--space-4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            animation: 'pageEnter 180ms var(--ease-standard) both',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export interface AccordionProps {
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export function Accordion({ children, style, className = '' }: AccordionProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
