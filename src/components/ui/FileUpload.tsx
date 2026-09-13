import { useCallback, useState, useRef } from 'react'

interface FileUploadProps {
  accept?: string
  maxSize?: number // in MB
  onFileSelect: (file: File) => void
  label?: string
  helpText?: string
  uploading?: boolean
  progress?: number
  processing?: boolean
  error?: string | null
}

export function FileUpload({
  accept = '.epub,.pdf,application/pdf,application/epub+zip',
  maxSize = 50,
  onFileSelect,
  label = 'اختر كتاباً',
  helpText,
  uploading = false,
  progress,
  processing = false,
  error = null,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        return
      }
      setFileName(file.name)
      onFileSelect(file)
    },
    [maxSize, onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const isActive = uploading || processing

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div
        onClick={() => !isActive && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          background: dragActive
            ? 'var(--surface-red)'
            : 'var(--surface-black)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8) var(--space-6)',
          textAlign: 'center',
          cursor: isActive ? 'wait' : 'pointer',
          transition: `background var(--duration-fast) var(--ease-standard)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              className="animate-spin rounded-full"
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(111,16,24,0.3)',
                borderTopColor: 'var(--red-500)',
              }}
            />
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              جاري الرفع...{progress !== undefined ? ` ${Math.round(progress)}%` : ''}
            </p>
            {progress !== undefined && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  height: '4px',
                  background: 'var(--surface-black-strong)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--red-600)',
                    borderRadius: 'var(--radius-pill)',
                    transition: 'width 300ms var(--ease-standard)',
                  }}
                />
              </div>
            )}
          </div>
        ) : processing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              className="animate-spin rounded-full"
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(111,16,24,0.3)',
                borderTopColor: 'var(--red-500)',
              }}
            />
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              جاري معالجة الكتاب...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              {label}
            </p>
            {fileName ? (
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--red-500)', fontSize: '0.9rem' }}>
                {fileName}
              </p>
            ) : (
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {helpText || `اسحب الملف هنا أو اضغط للاختيار (${accept}, حد أقصى ${maxSize}MB)`}
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.88rem',
            color: 'var(--red-500)',
            background: 'var(--surface-red)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
