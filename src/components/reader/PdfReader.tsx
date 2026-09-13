import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { pdfjsLib, getPdfJsDocumentParams } from '@/lib/pdf-config'
import { upsertReadingProgress, getReadingProgress } from '@/services/progress'
import { getQuestionSetsWithProgress, type QuestionSetWithProgress } from '@/services/questions'
import { SectionQuestionSets } from '@/components/questions/SectionQuestionSets'
import { CreateSectionQuestionSetModal } from '@/components/questions/CreateSectionQuestionSetModal'
import { AccordionTree } from '@/components/ui/AccordionTree'
import type { Book, BookNode, QuestionSet } from '@/types'

interface PdfReaderProps {
  book: Book
  nodes: BookNode[]
  fileUrl: string
  userId: string
}

export function PdfReader({ book, nodes, fileUrl, userId }: PdfReaderProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<any>(null)
  const pdfDocRef = useRef<any>(null)
  const loadedUrlRef = useRef<string | null>(null)
  const initialPageResolvedRef = useRef<boolean>(false)
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const lastWheelTimeRef = useRef<number>(0)
  const isScrubbingRef = useRef<boolean>(false)
  const activeChapterRef = useRef<HTMLButtonElement | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })
  const questionSetsRef = useRef<HTMLDivElement>(null)

  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [zoom, setZoom] = useState<number>(1.0)
  const [fitMode, setFitMode] = useState<'page' | 'width'>('page')
  const [darkMode, setDarkMode] = useState<boolean>(true)
  const [pageLoading, setPageLoading] = useState<boolean>(true)
  const [docError, setDocError] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [pageInput, setPageInput] = useState<string>('1')
  const [sidebarSearch, setSidebarSearch] = useState<string>('')
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'chapter' | 'section'>('all')
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Timeline hover state
  const [timelineHover, setTimelineHover] = useState<{
    page: number
    percent: number
    x: number
    label: string
  } | null>(null)

  const chapters = useMemo(() => nodes.filter((n) => n.type === 'chapter'), [nodes])

  // Find active chapter or section based on current page
  const currentNode = useMemo(() => {
    return nodes
      .filter((ch) => ch.start_position && ch.start_position <= currentPage)
      .sort((a, b) => (b.start_position || 0) - (a.start_position || 0))[0]
  }, [nodes, currentPage])

  const currentChapter = currentNode?.label || ''

  // Question sets for active section & book
  const [questionsOpen, setQuestionsOpen] = useState<boolean>(false)
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [questionSets, setQuestionSets] = useState<QuestionSetWithProgress[]>([])
  const [questionSetsLoading, setQuestionSetsLoading] = useState<boolean>(false)

  const fetchQuestionSets = useCallback(async () => {
    if (!book?.id) return
    setQuestionSetsLoading(true)
    try {
      const sets = await getQuestionSetsWithProgress(book.id, userId)
      setQuestionSets(sets)
    } catch (err) {
      console.error('Failed to load question sets:', err)
    } finally {
      setQuestionSetsLoading(false)
    }
  }, [book?.id, userId])

  useEffect(() => {
    fetchQuestionSets()
  }, [fetchQuestionSets])

  const sectionQuestionSetsCount = useMemo(() => {
    if (!currentNode) return 0
    const label = currentNode.label || ''
    return questionSets.filter((set) => {
      if (set.node_id && set.node_id === currentNode.id) return true
      if (set.node_label && label && set.node_label.toLowerCase() === label.toLowerCase()) return true
      if (set.name.includes(label) || (set.description && set.description.includes(label))) return true
      return false
    }).length
  }, [questionSets, currentNode])

  const handleToggleQuestions = useCallback(() => {
    if (!questionsOpen) {
      setQuestionsOpen(true)
      setTimeout(() => {
        if (questionSetsRef.current) {
          questionSetsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
    } else {
      setQuestionsOpen(false)
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [questionsOpen])

  const handleScrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setTimeout(() => {
      setQuestionsOpen(false)
    }, 350)
  }, [])

  // Load PDF Document - protected against re-fetching on window focus / tab switch
  useEffect(() => {
    let active = true

    async function loadPdf() {
      // If already loaded this fileUrl, don't re-parse document
      if (loadedUrlRef.current === fileUrl && pdfDocRef.current) {
        return
      }

      try {
        setPageLoading(true)
        setDocError(null)
        const loadingTask = pdfjsLib.getDocument(getPdfJsDocumentParams({ url: fileUrl }))
        const pdf = await loadingTask.promise
        if (!active) return

        pdfDocRef.current = pdf
        loadedUrlRef.current = fileUrl
        setNumPages(pdf.numPages)

        // Resolve initial page target once
        if (!initialPageResolvedRef.current) {
          initialPageResolvedRef.current = true

          let targetPage: number | null = null
          const paramPage = searchParams.get('page')
          if (paramPage) {
            const parsed = parseInt(paramPage, 10)
            if (!isNaN(parsed) && parsed >= 1 && parsed <= pdf.numPages) {
              targetPage = parsed
            }
          } else if (location.hash && location.hash.startsWith('#page=')) {
            const parsed = parseInt(location.hash.replace('#page=', ''), 10)
            if (!isNaN(parsed) && parsed >= 1 && parsed <= pdf.numPages) {
              targetPage = parsed
            }
          }

          if (targetPage !== null) {
            setCurrentPage(targetPage)
            setPageInput(targetPage.toString())
          } else {
            // Resume reading position from database
            try {
              const progress = await getReadingProgress(book.id, userId)
              if (active && progress && progress.position > 0 && progress.position <= pdf.numPages) {
                setCurrentPage(progress.position)
                setPageInput(progress.position.toString())
              }
            } catch {
              // ignore progress read errors
            }
          }
        }
      } catch (err: any) {
        console.error('Error loading PDF document:', err)
        if (active) {
          setDocError(err?.message || 'تعذر تحميل مستند PDF')
        }
      } finally {
        if (active) setPageLoading(false)
      }
    }

    loadPdf()

    return () => {
      active = false
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [fileUrl, book.id, userId])

  // Render current page onto canvas
  const renderPage = useCallback(
    async (pageNum: number, showSpinner = true) => {
      const pdf = pdfDocRef.current
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!pdf || !canvas || !container) return

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      try {
        if (showSpinner) setPageLoading(true)
        setRenderError(null)
        const page = await pdf.getPage(pageNum)
        const unscaledViewport = page.getViewport({ scale: 1.0 })

        // Smart scale calculation based on fit mode
        let baseScale = 1.0
        if (fitMode === 'page') {
          // Fit Page: entire page fits inside both width AND height
          const paddingX = 48
          const paddingY = 28
          const availableWidth = Math.max(200, container.clientWidth - paddingX)
          const availableHeight = Math.max(200, container.clientHeight - paddingY)
          const scaleX = availableWidth / unscaledViewport.width
          const scaleY = availableHeight / unscaledViewport.height
          baseScale = Math.min(scaleX, scaleY)
        } else {
          // Fit Width: page fills container width
          const paddingX = 40
          const availableWidth = Math.max(300, Math.min(container.clientWidth - paddingX, 1100))
          baseScale = availableWidth / unscaledViewport.width
        }

        const finalScale = Math.max(0.35, Math.min(4.0, baseScale * zoom))

        const viewport = page.getViewport({ scale: finalScale })
        const dpr = window.devicePixelRatio || 1

        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, viewport.width, viewport.height)

        const renderContext = {
          canvasContext: ctx,
          viewport,
        }

        const task = page.render(renderContext)
        renderTaskRef.current = task

        await task.promise
        renderTaskRef.current = null
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF Page render error:', err)
          setRenderError('تعذر عرض هذه الصفحة بشكل كامل.')
        }
      } finally {
        if (showSpinner) setPageLoading(false)
      }
    },
    [zoom, fitMode]
  )

  // Trigger render when page, zoom, or fitMode changes
  useEffect(() => {
    if (numPages > 0) {
      renderPage(currentPage, true)
    }
  }, [currentPage, zoom, fitMode, numPages, renderPage])

  // Debounced auto-resize listener - only re-render if dimensions actually changed
  useEffect(() => {
    let timeoutId: any
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const container = containerRef.current
        if (!container) return
        const w = container.clientWidth
        const h = container.clientHeight
        if (Math.abs(w - lastDimensionsRef.current.w) > 8 || Math.abs(h - lastDimensionsRef.current.h) > 8) {
          lastDimensionsRef.current = { w, h }
          if (numPages > 0 && currentPage > 0) {
            renderPage(currentPage, false)
          }
        }
      }, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [currentPage, numPages, renderPage])

  // Save reading progress whenever currentPage changes
  useEffect(() => {
    if (numPages > 0 && currentPage > 0) {
      const pct = Math.round((currentPage / numPages) * 100)
      upsertReadingProgress({
        book_id: book.id,
        user_id: userId,
        position: currentPage,
        percent: pct,
        completed: currentPage >= numPages,
      }).catch(console.error)
    }
  }, [currentPage, numPages, book.id, userId])

  // Auto-scroll active chapter into view when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      const timer = setTimeout(() => {
        activeChapterRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [sidebarOpen])

  // Navigation handlers
  const goToPage = useCallback(
    (page: number) => {
      const target = Math.max(1, Math.min(page, numPages || 1))
      setCurrentPage(target)
      setPageInput(target.toString())
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
        containerRef.current.scrollLeft = 0
      }
    },
    [numPages]
  )

  const goNext = useCallback(() => {
    if (currentPage < numPages) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, numPages, goToPage])

  const goPrev = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err)
      })
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen error:', err)
      })
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Keyboard navigation & Panning
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      // When zoomed in, arrow keys pan around the page
      if (zoom > 1.05) {
        const container = containerRef.current
        if (container) {
          const step = 80
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            container.scrollTop += step
            return
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            container.scrollTop -= step
            return
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            container.scrollLeft -= step
            return
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            container.scrollLeft += step
            return
          }
        }
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goNext() // RTL: left arrow flips to next page
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goPrev() // RTL: right arrow flips to previous page
      } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault()
        goNext()
      } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goToPage(1)
      } else if (e.key === 'End') {
        e.preventDefault()
        goToPage(numPages)
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setZoom((z) => Math.min(3.0, +(z + 0.15).toFixed(2)))
      } else if (e.key === '-') {
        e.preventDefault()
        setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))
      } else if (e.key === '0') {
        e.preventDefault()
        setZoom(1.0)
        setFitMode('page')
        if (containerRef.current) {
          containerRef.current.scrollTop = 0
          containerRef.current.scrollLeft = 0
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, goToPage, numPages, toggleFullscreen, zoom])

  // Mouse Wheel: Ctrl+Wheel zoom, or page flip when at normal scale (disabled when sidebar open)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // If sidebar is open, never intercept or flip pages
      if (sidebarOpen) return

      // If questions panel is open or container is scrolled down, let native scroll work
      if (questionsOpen || (containerRef.current && containerRef.current.scrollTop > 30)) {
        return
      }

      // Ctrl+Wheel or Meta+Wheel: Zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(3.0, +(z + 0.15).toFixed(2)))
        } else if (e.deltaY > 0) {
          setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))
        }
        return
      }

      // Page flip only in Fit Page mode when zoom is 1.0
      if (fitMode === 'page' && zoom <= 1.05) {
        const now = Date.now()
        if (now - lastWheelTimeRef.current > 360) {
          if (e.deltaY > 25) {
            e.preventDefault()
            goNext()
            lastWheelTimeRef.current = now
          } else if (e.deltaY < -25) {
            e.preventDefault()
            goPrev()
            lastWheelTimeRef.current = now
          }
        }
        return
      }

      // When zoomed in (zoom > 1.05 or fitMode === 'width'), let native scroll handle it!
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [fitMode, zoom, goNext, goPrev, sidebarOpen, questionsOpen])

  // Drag to pan handlers (Global listeners for smooth 360-degree panning)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, input, a, form, .sidebar-drawer')) return
    const container = containerRef.current
    if (!container) return

    // Allow dragging if content exceeds container or zoomed
    const canScrollX = container.scrollWidth > container.clientWidth
    const canScrollY = container.scrollHeight > container.clientHeight
    if (!canScrollX && !canScrollY && zoom <= 1.05 && fitMode === 'page') return

    isDraggingRef.current = true
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    }
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      e.preventDefault()
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx
      containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
      }
    }

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  // Timeline scrub helpers
  const getPageFromTimelineEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || numPages === 0) return null
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    // RTL: right edge = page 1, left edge = last page
    const fractionFromRight = Math.max(0, Math.min(1, (rect.right - e.clientX) / rect.width))
    const page = Math.max(1, Math.min(numPages, Math.round(fractionFromRight * (numPages - 1)) + 1))
    return { page, x: clickX }
  }

  const handleTimelineMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const res = getPageFromTimelineEvent(e)
    if (!res) return
    const { page, x } = res
    const node = nodes
      .filter((n) => n.start_position && n.start_position <= page)
      .sort((a, b) => (b.start_position || 0) - (a.start_position || 0))[0]

    setTimelineHover({
      page,
      percent: Math.round((page / numPages) * 100),
      x,
      label: node?.label || '',
    })

    if (isScrubbingRef.current) {
      goToPage(page)
    }
  }

  const handleTimelineDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isScrubbingRef.current = true
    const res = getPageFromTimelineEvent(e)
    if (res) goToPage(res.page)
  }

  const handleTimelineUp = () => {
    isScrubbingRef.current = false
  }

  const percent = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0

  // ─── Error state ───
  if (docError) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          height: '100vh',
          background: 'var(--black-950)',
          padding: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.4rem',
            color: 'var(--red-500)',
            marginBottom: 'var(--space-3)',
          }}
        >
          تعذر فتح ملف PDF
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)', maxWidth: '420px', lineHeight: 1.6 }}>
          {docError}
        </p>
        <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer"
            style={{
              background: 'var(--surface-red)',
              color: 'var(--text-primary)',
              border: 'none',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => navigate(`/books/${book.id}`)}
            className="cursor-pointer"
            style={{
              background: 'var(--surface-black)',
              color: 'var(--text-secondary)',
              border: 'none',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
          >
            العودة لتفاصيل الكتاب
          </button>
        </div>
      </div>
    )
  }

  // ─── Main Reader UI ───
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--black-950)',
        overflow: 'hidden',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* ═══ Top Header Bar ═══ */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-3) var(--space-5)',
          background: 'rgba(9, 9, 9, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Right side (RTL start): Back button, Title & TOC button */}
        <div className="flex items-center" style={{ gap: 'var(--space-3)', minWidth: 0 }}>
          {/* Back button with right arrow (>) for RTL */}
          <button
            onClick={() => navigate(`/books/${book.id}`)}
            className="cursor-pointer flex items-center"
            style={{
              background: 'var(--surface-black)',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              gap: '6px',
              transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-black)'
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            aria-label="العودة لتفاصيل الكتاب"
            title="العودة لتفاصيل الكتاب"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)' }} className="hidden sm:inline">
              العودة
            </span>
          </button>

          {/* Book Title & Chapter info */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <p
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: '0.98rem',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {book.title}
            </p>
            {currentChapter && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {currentChapter}
              </p>
            )}
          </div>

          {/* Outline / Chapters Button positioned right next to book info */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="cursor-pointer flex items-center"
            style={{
              background: sidebarOpen ? 'var(--surface-red)' : 'var(--surface-black)',
              border: 'none',
              color: sidebarOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
              marginInlineStart: 'var(--space-2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = sidebarOpen ? 'var(--surface-red)' : 'var(--surface-black)'
              e.currentTarget.style.color = sidebarOpen ? 'var(--text-primary)' : 'var(--text-secondary)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            aria-label="الفهرس"
            title="فهرس الكتاب والفصول"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="12" x2="9" y2="12" />
              <line x1="21" y1="18" x2="6" y2="18" />
            </svg>
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>الفهرس</span>
            {nodes.length > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-muted)',
                }}
              >
                {nodes.length}
              </span>
            )}
          </button>

          {/* Section Questions Toggle Button */}
          <button
            onClick={handleToggleQuestions}
            className="cursor-pointer flex items-center"
            style={{
              background: questionsOpen ? 'var(--surface-red)' : 'var(--surface-black)',
              border: 'none',
              color: questionsOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = questionsOpen ? 'var(--surface-red)' : 'var(--surface-black)'
              e.currentTarget.style.color = questionsOpen ? 'var(--text-primary)' : 'var(--text-secondary)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            aria-label="عرض أسئلة هذا القسم"
            title={currentNode ? `عرض أسئلة: ${currentNode.label}` : 'عرض الأسئلة المتاحة لهذا القسم'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>الأسئلة</span>
            {sectionQuestionSetsCount > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: questionsOpen ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {sectionQuestionSetsCount}
              </span>
            )}
          </button>

          {/* Add Question Set for Current Section Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="cursor-pointer flex items-center"
            style={{
              background: 'var(--surface-black)',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-black)'
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            aria-label="إضافة مجموعة أسئلة لهذا القسم"
            title={currentNode ? `إضافة مجموعة أسئلة لقسم: ${currentNode.label}` : 'إضافة مجموعة أسئلة'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>إضافة أسئلة</span>
          </button>
        </div>

        {/* Left side (RTL end): Reading Controls */}
        <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
          {/* Page Jump Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const p = parseInt(pageInput, 10)
              if (!isNaN(p)) goToPage(p)
            }}
            className="flex items-center"
            style={{
              background: 'var(--surface-black)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 10px',
              gap: '4px',
            }}
          >
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              style={{
                width: '34px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                textAlign: 'center',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-title)',
                outline: 'none',
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>/ {numPages}</span>
          </form>

          {/* Zoom controls */}
          <div
            className="hidden md:flex items-center"
            style={{
              background: 'var(--surface-black)',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              padding: '3px 8px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '1.05rem',
                lineHeight: 1,
              }}
              title="تصغير (-)"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(1.0)
                setFitMode('page')
                if (containerRef.current) {
                  containerRef.current.scrollTop = 0
                  containerRef.current.scrollLeft = 0
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: zoom === 1.0 ? 'var(--text-primary)' : 'var(--red-400)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                minWidth: '40px',
                textAlign: 'center',
                fontFamily: 'var(--font-title)',
              }}
              title="إعادة ضبط الحجم (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.15).toFixed(2)))}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '1.05rem',
                lineHeight: 1,
              }}
              title="تكبير (+)"
            >
              +
            </button>
          </div>

          {/* Fit Mode Switcher */}
          <button
            onClick={() => {
              setFitMode((m) => (m === 'page' ? 'width' : 'page'))
              setZoom(1.0)
              if (containerRef.current) {
                containerRef.current.scrollTop = 0
                containerRef.current.scrollLeft = 0
              }
            }}
            className="cursor-pointer hidden sm:flex items-center"
            style={{
              background: fitMode === 'page' ? 'var(--surface-red)' : 'var(--surface-black)',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
              gap: '6px',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            title={fitMode === 'page' ? 'التبديل إلى ملء العرض' : 'التبديل إلى احتواء كامل'}
          >
            {fitMode === 'page' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>احتواء كامل</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                <span>ملء العرض</span>
              </>
            )}
          </button>

          {/* Dark Reading Filter Toggle */}
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="cursor-pointer flex items-center"
            style={{
              background: darkMode ? 'var(--surface-red)' : 'var(--surface-black)',
              border: 'none',
              color: darkMode ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
              gap: '6px',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            title={darkMode ? 'الوضع الأصلي' : 'الوضع الليلي'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {darkMode ? (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </>
              )}
            </svg>
            <span className="hidden md:inline">{darkMode ? 'وضع القراءة' : 'الأصل'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="cursor-pointer flex items-center justify-center"
            style={{
              background: isFullscreen ? 'var(--surface-red)' : 'var(--surface-black)',
              border: 'none',
              color: isFullscreen ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '7px 10px',
              borderRadius: 'var(--radius-md)',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            title={isFullscreen ? 'الخروج من ملء الشاشة (F)' : 'ملء الشاشة (F)'}
            aria-label="ملء الشاشة"
          >
            {isFullscreen ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8V5a2 2 0 0 1 2-2h3m11 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ═══ Reader Viewport Area (Fixed overlay chevrons + scrollable container) ═══ */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Floating Side Chevron: Next Page (Left in RTL, advances forward in book) */}
        <button
          onClick={goNext}
          disabled={currentPage >= numPages}
          style={{
            position: 'absolute',
            top: '50%',
            left: '18px',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(18, 18, 18, 0.72)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            color: currentPage >= numPages ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
            zIndex: 25,
            transition: 'transform 180ms ease, background-color 180ms ease',
          }}
          onMouseEnter={(e) => {
            if (currentPage < numPages) {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.06)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(18, 18, 18, 0.72)'
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
          }}
          title="الصفحة التالية"
          aria-label="الصفحة التالية"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Floating Side Chevron: Prev Page (Right in RTL, returns back in book) */}
        <button
          onClick={goPrev}
          disabled={currentPage <= 1}
          style={{
            position: 'absolute',
            top: '50%',
            right: '18px',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(18, 18, 18, 0.72)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            color: currentPage <= 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            zIndex: 25,
            transition: 'transform 180ms ease, background-color 180ms ease',
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.06)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(18, 18, 18, 0.72)'
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
          }}
          title="الصفحة السابقة"
          aria-label="الصفحة السابقة"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {pageLoading && (
          <div
            style={{
              position: 'absolute',
              top: 'var(--space-4)',
              insetInlineEnd: 'var(--space-6)',
              zIndex: 20,
            }}
          >
            <div
              className="animate-spin rounded-full"
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid rgba(165,30,41,0.25)',
                borderTopColor: 'var(--red-500)',
              }}
            />
          </div>
        )}

        {/* ═══ Scrollable Container (Allows full 360-degree panning and scroll) ═══ */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          style={{
            flex: 1,
            height: '100%',
            overflow: fitMode === 'page' && zoom <= 1.05 && !questionsOpen ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: fitMode === 'page' && zoom <= 1.05 && !questionsOpen ? '12px 20px' : '28px 28px',
            position: 'relative',
            cursor: isDragging
              ? 'grabbing'
              : zoom > 1.05 || fitMode === 'width'
              ? 'grab'
              : 'default',
          }}
        >
          {renderError && (
            <div
              style={{
                background: 'rgba(111, 16, 24, 0.35)',
                border: 'none',
                color: 'var(--red-400)',
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                maxWidth: '900px',
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <span>{renderError}</span>
              <button
                onClick={() => renderPage(currentPage, true)}
                className="cursor-pointer"
                style={{
                  background: 'var(--surface-red)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '0.82rem',
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* PDF Page Canvas - centered via margin: auto, without clipping or data-loss */}
          <div
            style={{
              margin: questionsOpen ? '20px auto 0 auto' : 'auto',
              display: 'flex',
              flexShrink: 0,
              transition: 'filter 200ms ease',
              borderRadius: 'var(--radius-sm)',
              filter: darkMode
                ? 'invert(0.92) hue-rotate(180deg) contrast(1.05) brightness(0.95)'
                : 'none',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>

          {/* Question Sets Section (smooth scroll destination) */}
          {questionsOpen && (
            <div
              ref={questionSetsRef}
              style={{
                width: '100%',
                flexShrink: 0,
                marginTop: 'var(--space-8)',
                paddingBottom: 'var(--space-10)',
              }}
            >
              <SectionQuestionSets
                bookId={book.id}
                userId={userId}
                sectionNode={currentNode}
                questionSets={questionSets}
                loading={questionSetsLoading}
                onCreateClick={() => setCreateModalOpen(true)}
                onScrollToTop={handleScrollToTop}
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom Timeline & Navigation Bar ═══ */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-5)',
          background: 'rgba(9, 9, 9, 0.88)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
          {/* Previous Page (RTL start: right button goes prev) */}
          <button
            onClick={goPrev}
            disabled={currentPage <= 1}
            className="cursor-pointer flex items-center justify-center"
            style={{
              background: 'var(--surface-black)',
              border: 'none',
              color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              opacity: currentPage <= 1 ? 0.35 : 1,
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.88rem',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
            onMouseEnter={(e) => {
              if (currentPage > 1) {
                e.currentTarget.style.background = 'var(--surface-black-strong)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-black)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            aria-label="الصفحة السابقة"
            title="الصفحة السابقة (→)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="hidden sm:inline">السابق</span>
          </button>

          {/* Interactive Scrubbable Progress Timeline */}
          <div
            ref={timelineRef}
            onClick={handleTimelineDown}
            onMouseMove={handleTimelineMove}
            onMouseLeave={() => {
              setTimelineHover(null)
              isScrubbingRef.current = false
            }}
            onMouseDown={handleTimelineDown}
            onMouseUp={handleTimelineUp}
            style={{
              flex: 1,
              position: 'relative',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            {/* Hover preview tooltip (sleek, no box shadow per skill.md) */}
            {timelineHover && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '32px',
                  left: `${timelineHover.x}px`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(18, 18, 18, 0.96)',
                  border: '1px solid rgba(111, 16, 24, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  pointerEvents: 'none',
                  zIndex: 60,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                  صفحة {timelineHover.page} من {numPages} ({timelineHover.percent}%)
                </div>
                {timelineHover.label && (
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--red-400)',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {timelineHover.label}
                  </div>
                )}
              </div>
            )}

            {/* Track */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-pill)',
                position: 'relative',
              }}
            >
              {/* Progress fill from right (RTL) */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${percent}%`,
                  background: 'linear-gradient(to left, var(--red-700), var(--red-500))',
                  borderRadius: 'var(--radius-pill)',
                  transition: isScrubbingRef.current ? 'none' : 'width 200ms ease',
                }}
              >
                {/* Thumb without box shadow */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '14px',
                    height: '14px',
                    background: '#ffffff',
                    border: '2px solid var(--red-500)',
                    borderRadius: '50%',
                  }}
                />
              </div>

              {/* Chapter Markers */}
              {chapters.length > 1 && numPages > 0 && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {chapters.map((ch, i) => {
                    const p = ch.start_position || 1
                    const pos = ((p - 1) / (numPages - 1 || 1)) * 100
                    return (
                      <div
                        key={ch.id || i}
                        title={ch.label}
                        style={{
                          position: 'absolute',
                          right: `${pos}%`,
                          top: '50%',
                          transform: 'translate(50%, -50%)',
                          width: '3px',
                          height: '10px',
                          background: 'rgba(255,255,255,0.25)',
                          borderRadius: '2px',
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            {percent}%
          </span>

          {/* Next Page (RTL end: left button goes next) */}
          <button
            onClick={goNext}
            disabled={currentPage >= numPages}
            className="cursor-pointer flex items-center justify-center"
            style={{
              background: 'var(--surface-red)',
              border: 'none',
              color: currentPage >= numPages ? 'var(--text-muted)' : 'var(--text-primary)',
              opacity: currentPage >= numPages ? 0.35 : 1,
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.88rem',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
            onMouseEnter={(e) => {
              if (currentPage < numPages) {
                e.currentTarget.style.background = 'var(--surface-red-strong)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-red)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            aria-label="الصفحة التالية"
            title="الصفحة التالية (←)"
          >
            <span className="hidden sm:inline">التالي</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ Outline / Chapters Sidebar Drawer (Rendered outside container for independent scrolling) ═══ */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            onWheel={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              right: 0,
              width: '460px',
              maxWidth: '92vw',
              height: '100vh',
              background: 'rgba(12, 12, 12, 0.98)',
              backdropFilter: 'blur(20px)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'pageEnter 220ms var(--ease-standard) both',
              borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Pinned Header (Does not scroll away) */}
            <div
              style={{
                flexShrink: 0,
                padding: 'var(--space-5) var(--space-6) var(--space-4) var(--space-6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontSize: '1.2rem',
                      color: 'var(--text-primary)',
                      marginBottom: '3px',
                    }}
                  >
                    فهرس الكتاب ({nodes.length})
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    انقر للانتقال مباشرة إلى الصفحة المطلوبة
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="cursor-pointer"
                  style={{
                    background: 'var(--surface-black)',
                    border: 'none',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1.1rem',
                    padding: '6px 12px',
                    transition: 'color 180ms ease, background-color 180ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.background = 'var(--surface-red)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'var(--surface-black)'
                  }}
                  aria-label="إغلاق الفهرس"
                >
                  ✕
                </button>
              </div>

              {/* Search in sidebar */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="ابحث في الفهرس والفصول..."
                  style={{
                    width: '100%',
                    background: 'var(--surface-black)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '11px 16px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center" style={{ gap: '10px' }}>
                {(['all', 'chapter', 'section'] as const).map((filter) => {
                  const label =
                    filter === 'all'
                      ? `الكل (${nodes.length})`
                      : filter === 'chapter'
                      ? `فصول (${nodes.filter((n) => n.type === 'chapter').length})`
                      : `أقسام (${nodes.filter((n) => n.type === 'section').length})`
                  const isAct = sidebarFilter === filter
                  return (
                    <button
                      key={filter}
                      onClick={() => setSidebarFilter(filter)}
                      className="cursor-pointer"
                      style={{
                        background: isAct ? 'var(--surface-red)' : 'var(--surface-black)',
                        color: isAct ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        padding: '5px 14px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-body)',
                        transition: 'background var(--duration-fast)',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Scrollable Node List with Accordion Tree */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                padding: 'var(--space-4) var(--space-6) var(--space-8) var(--space-6)',
              }}
            >
              {nodes.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 'var(--space-6)' }}>
                  لا يوجد فهرس مسجل لهذا الكتاب
                </p>
              ) : (
                <AccordionTree
                  nodes={nodes}
                  activeNodeId={currentNode?.id}
                  currentPage={currentPage}
                  searchQuery={sidebarSearch}
                  filterType={sidebarFilter}
                  onNodeSelect={(_node, pageNum) => {
                    goToPage(pageNum)
                    setSidebarOpen(false)
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
      {/* Create Question Set Modal for Section */}
      <CreateSectionQuestionSetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        bookId={book.id}
        userId={userId}
        sectionNode={currentNode}
        onSuccess={() => {
          fetchQuestionSets()
          setQuestionsOpen(true)
          setTimeout(() => {
            if (questionSetsRef.current) {
              questionSetsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 120)
        }}
      />
    </div>
  )
}
