import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ePub from 'epubjs'
import { upsertReadingProgress, getReadingProgress } from '@/services/progress'
import type { Book, BookNode } from '@/types'

interface EpubReaderProps {
  book: Book
  nodes: BookNode[]
  fileUrl: string
  userId: string
}

export function EpubReader({ book, nodes, fileUrl, userId }: EpubReaderProps) {
  const navigate = useNavigate()
  const viewerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<any>(null)
  const bookRef = useRef<any>(null)

  const [percent, setPercent] = useState(0)
  const [currentChapter, setCurrentChapter] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Initialize EPUB reader
  useEffect(() => {
    let active = true
    const epubBook = ePub(fileUrl)
    bookRef.current = epubBook

    if (viewerRef.current) {
      const rendition = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'scrolled-doc',
      })
      renditionRef.current = rendition

      // Style the reader content
      rendition.themes.default({
        body: {
          'font-family': "'Amiri', serif !important",
          'color': 'rgba(255, 255, 255, 0.92) !important',
          'background': 'transparent !important',
          'line-height': '1.9 !important',
          'font-size': '1.1rem !important',
          'direction': 'rtl !important',
          'padding': '0 16px !important',
        },
        'p': {
          'margin-bottom': '1em !important',
        },
        'h1, h2, h3, h4, h5, h6': {
          'font-family': "'Reem Kufi', sans-serif !important",
          'color': 'rgba(255, 255, 255, 0.96) !important',
        },
        'a': {
          'color': '#a51e29 !important',
        },
        'img': {
          'max-width': '100% !important',
          'border-radius': '12px !important',
        },
      })

      // Resume from saved position
      getReadingProgress(book.id, userId).then((savedProgress) => {
        if (!active) return
        if (savedProgress && savedProgress.position > 0) {
          rendition.display(savedProgress.position.toString())
        } else {
          rendition.display()
        }
      }).catch(() => {
        if (active) rendition.display()
      })

      // Track location changes
      rendition.on('relocated', (location: any) => {
        if (!active) return
        const currentPercent = Math.round((location.start?.percentage || 0) * 100)
        setPercent(currentPercent)

        // Save progress
        upsertReadingProgress({
          book_id: book.id,
          user_id: userId,
          position: location.start?.index || 0,
          percent: currentPercent,
          completed: currentPercent >= 98,
        }).catch(console.error)

        // Update current chapter label
        if (location.start?.href) {
          const node = nodes.find((n) => n.href && location.start.href.includes(n.href))
          if (node) setCurrentChapter(node.label)
        }
      })
    }

    return () => {
      active = false
      if (bookRef.current) {
        bookRef.current.destroy()
      }
    }
  }, [fileUrl, book.id, userId, nodes])

  const goNext = useCallback(() => {
    renditionRef.current?.next()
  }, [])

  const goPrev = useCallback(() => {
    renditionRef.current?.prev()
  }, [])

  const goToChapter = useCallback((href: string) => {
    renditionRef.current?.display(href)
    setSidebarOpen(false)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goNext()
      if (e.key === 'ArrowRight') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  const chapters = nodes.filter((n) => n.type === 'chapter')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black-950)' }}>
      {/* Top Bar */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-3) var(--space-5)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
          <button
            onClick={() => navigate(`/books/${book.id}`)}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: 'var(--space-1)', display: 'flex' }}
            aria-label="العودة"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {book.title}
            </p>
            {currentChapter && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentChapter}</p>
            )}
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {percent}%
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: 'var(--space-1)', display: 'flex' }}
            aria-label="الفصول"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reader Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* EPUB Viewer */}
        <div
          ref={viewerRef}
          style={{
            flex: 1,
            overflow: 'auto',
            maxWidth: '720px',
            margin: '0 auto',
            padding: 'var(--space-6) var(--space-4)',
          }}
        />

        {/* Chapter Sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-30 md:hidden"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                background: 'rgba(12, 12, 12, 0.96)',
                backdropFilter: 'blur(16px)',
                overflowY: 'auto',
                padding: 'var(--space-5)',
                zIndex: 40,
                animation: 'pageEnter 220ms var(--ease-standard) both',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: 'var(--space-5)', color: 'var(--text-primary)' }}>
                الفصول
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => ch.href && goToChapter(ch.href)}
                    className="cursor-pointer text-right"
                    style={{
                      background: currentChapter === ch.label ? 'var(--surface-red)' : 'transparent',
                      color: currentChapter === ch.label ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.92rem',
                      transition: `background var(--duration-fast)`,
                      width: '100%',
                    }}
                    onMouseEnter={(e) => { if (currentChapter !== ch.label) e.currentTarget.style.background = 'var(--surface-black)' }}
                    onMouseLeave={(e) => { if (currentChapter !== ch.label) e.currentTarget.style.background = 'transparent' }}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Timeline */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-5)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
          {/* Prev */}
          <button
            onClick={goPrev}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 'var(--space-1)' }}
            aria-label="السابق"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Progress bar / timeline */}
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-black-strong)', borderRadius: 'var(--radius-pill)' }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: 'var(--red-600)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 400ms var(--ease-standard)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '12px',
                    height: '12px',
                    background: 'var(--red-500)',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
            {/* Chapter markers */}
            {chapters.length > 1 && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {chapters.map((_, i) => {
                  const pos = ((i + 1) / chapters.length) * 100
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        right: `${pos}%`,
                        top: '50%',
                        transform: 'translate(50%, -50%)',
                        width: '3px',
                        height: '10px',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '2px',
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 'var(--space-1)' }}
            aria-label="التالي"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
