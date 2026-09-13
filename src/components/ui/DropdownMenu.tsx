import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from '@headlessui/react'
import { type ReactNode } from 'react'

export interface DropdownMenuItemData {
  key: string
  label: string
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
}

export interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownMenuItemData[]
  align?: 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className = '',
  style,
}: DropdownMenuProps) {
  return (
    <Menu as="div" className={`relative inline-block text-right ${className}`} style={{ direction: 'rtl', ...style }}>
      <MenuButton as="div" className="cursor-pointer inline-flex items-center">
        {trigger}
      </MenuButton>

      <MenuItems
        transition
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          [align === 'right' ? 'right' : 'left']: 0,
          minWidth: '180px',
          background: 'rgba(18, 18, 18, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '4px',
          zIndex: 50,
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          transition: 'opacity 180ms var(--ease-standard), transform 180ms var(--ease-standard)',
        }}
        className="data-closed:opacity-0 data-closed:scale-95"
      >
        {items.map((item) => (
          <MenuItem key={item.key} disabled={item.disabled}>
            {({ focus }) => (
              <button
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className="cursor-pointer w-full text-right flex items-center"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: focus
                    ? item.danger
                      ? 'rgba(165, 30, 41, 0.35)'
                      : 'var(--surface-black-strong)'
                    : 'transparent',
                  color: item.danger
                    ? 'var(--red-400)'
                    : item.disabled
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                  fontSize: '0.86rem',
                  fontFamily: 'var(--font-body)',
                  gap: 'var(--space-2)',
                  opacity: item.disabled ? 0.4 : 1,
                  transition: 'background var(--duration-fast)',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
