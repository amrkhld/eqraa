import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react'
import { type ReactNode, useMemo } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
  description?: string
  disabled?: boolean
}

export interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  style?: React.CSSProperties
  className?: string
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'اختر من القائمة...',
  disabled = false,
  required = false,
  error,
  style,
  className = '',
}: SelectProps) {
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        direction: 'rtl',
        ...style,
      }}
    >
      {label && (
        <label
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{label}</span>
          {required && <span style={{ color: 'var(--red-500)' }}>*</span>}
        </label>
      )}

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div style={{ position: 'relative' }}>
            <ListboxButton
              className="cursor-pointer w-full text-right"
              style={{
                minHeight: '44px',
                padding: 'var(--space-2) var(--space-4)',
                background: open ? 'var(--surface-black-strong)' : 'rgba(0, 0, 0, 0.32)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                outline: 'none',
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background var(--duration-fast), transform 160ms ease',
              }}
            >
              <div className="flex items-center" style={{ gap: 'var(--space-2)', minWidth: 0, flex: 1 }}>
                {selectedOption?.icon}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
              </div>

              {/* Trailing chevron: rotates when open */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  color: 'var(--text-muted)',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms var(--ease-standard)',
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </ListboxButton>

            <ListboxOptions
              transition
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                maxHeight: '260px',
                overflowY: 'auto',
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
              {options.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  لا توجد خيارات متاحة
                </div>
              ) : (
                options.map((opt) => (
                  <ListboxOption
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="cursor-pointer rounded-md transition-colors select-none"
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                      color: opt.value === value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: opt.value === value ? 'var(--surface-red)' : 'transparent',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.88rem',
                      opacity: opt.disabled ? 0.35 : 1,
                    }}
                  >
                    {({ focus, selected }) => (
                      <div
                        className="flex items-center justify-between w-full"
                        style={{
                          background: focus && !selected ? 'var(--surface-black-strong)' : undefined,
                          padding: '2px 4px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div className="flex items-center" style={{ gap: 'var(--space-2)', minWidth: 0 }}>
                          {opt.icon}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{opt.label}</span>
                            {opt.description && (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {selected && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--red-400)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </ListboxOption>
                ))
              )}
            </ListboxOptions>
          </div>
        )}
      </Listbox>

      {error && (
        <span style={{ color: 'var(--red-400)', fontSize: '0.8rem', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  )
}
