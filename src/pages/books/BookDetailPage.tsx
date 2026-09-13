import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getBook,
  getBookNodes,
  deleteBook,
  updateBookStatus,
  updateBookCover,
  createBookNodes,
  deleteBookNodes,
  getBookFileSignedUrl,
} from '@/services/books'
import { parsePdf } from '@/lib/pdf-parser'
import { parseEpub } from '@/lib/epub-parser'
import {
  getQuestionSetsWithProgress,
  parseQuestionSetDescription,
  type QuestionSetWithProgress,
} from '@/services/questions'
import { getReadingProgress } from '@/services/progress'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AccordionTree } from '@/components/ui/AccordionTree'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import type { Book, BookNode, ReadingProgress } from '@/types'

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [book, setBook] = useState<Book | null>(null)
  const [nodes, setNodes] = useState<BookNode[]>([])
  const [questionSets, setQuestionSets] = useState<QuestionSetWithProgress[]>([])
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chapters' | 'questions'>('chapters')
  const [nodeSearch, setNodeSearch] = useState('')
  const [nodeFilter, setNodeFilter] = useState<'all' | 'chapter' | 'section'>('all')
  const [reprocessing, setReprocessing] = useState(false)

  useEffect(() => {
    async function fetch() {
      if (!bookId) return
      try {
        const [bookData, nodesData, setsData] = await Promise.all([
          getBook(bookId),
          getBookNodes(bookId),
          getQuestionSetsWithProgress(bookId, user?.id),
        ])
        setBook(bookData)
        setNodes(nodesData)
        setQuestionSets(setsData)

        if (user) {
          const prog = await getReadingProgress(bookId, user.id)
          setProgress(prog)
        }
      } catch (err) {
        console.error('Error fetching book detail:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [bookId, user])

  const handleReprocess = async () => {
    if (!book || !user) return
    setReprocessing(true)
    try {
      const isPdf =
        book.file_type?.toLowerCase() === 'pdf' || book.file_path?.toLowerCase().endsWith('.pdf')
      const fileUrl = await getBookFileSignedUrl(book.file_path)

      // Clear old nodes before re-parsing
      await deleteBookNodes(book.id)

      if (isPdf) {
        const parsed = await parsePdf(fileUrl, book.id, user.id)
        if (parsed.nodes.length > 0) {
          await createBookNodes(parsed.nodes)
        }
        if (parsed.coverUrl) {
          await updateBookCover(book.id, parsed.coverUrl)
        }
      } else {
        const parsed = await parseEpub(fileUrl, book.id)
        if (parsed.nodes.length > 0) {
          await createBookNodes(parsed.nodes)
        }
        if (parsed.coverUrl) {
          await updateBookCover(book.id, parsed.coverUrl)
        }
      }
      await updateBookStatus(book.id, 'ready')
      const [updatedBook, updatedNodes] = await Promise.all([
        getBook(book.id),
        getBookNodes(book.id),
      ])
      setBook(updatedBook)
      setNodes(updatedNodes)
    } catch (err) {
      console.error('Reprocess error:', err)
      try {
        await createBookNodes([
          {
            book_id: book.id,
            parent_id: null,
            type: 'chapter',
            label: 'المحتوى الكامل',
            order_index: 0,
            content: null,
            href: '#page=1',
            start_position: 1,
            end_position: null,
          },
        ])
      } catch {}
      await updateBookStatus(book.id, 'ready')
      setBook({ ...book, status: 'ready' })
    } finally {
      setReprocessing(false)
    }
  }

  const handleDelete = async () => {
    if (!bookId) return
    try {
      await deleteBook(bookId)
      navigate('/books')
    } catch (err) {
      console.error('Delete book error:', err)
    }
  }

  const chapters = useMemo(() => nodes.filter((n) => n.type === 'chapter'), [nodes])
  const sections = useMemo(() => nodes.filter((n) => n.type === 'section'), [nodes])
  const isOwner = user?.id === book?.owner_id

  if (loading) {
    return (
      <div
        className="page-enter"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-5)',
          direction: 'rtl',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-7)', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '210px',
              aspectRatio: '3/4',
              background: 'rgba(0, 0, 0, 0.28)',
              borderRadius: 'var(--radius-lg)',
            }}
          />
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div
              style={{
                height: '34px',
                width: '65%',
                background: 'rgba(0, 0, 0, 0.28)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
              }}
            />
            <div
              style={{
                height: '20px',
                width: '40%',
                background: 'rgba(0, 0, 0, 0.28)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
              }}
            />
            <div
              style={{
                height: '52px',
                width: '100%',
                background: 'rgba(0, 0, 0, 0.28)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div
        className="page-enter"
        style={{ textAlign: 'center', padding: 'var(--space-12)', direction: 'rtl' }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.4rem',
            marginBottom: 'var(--space-4)',
            color: 'var(--text-primary)',
          }}
        >
          الكتاب غير موجود
        </h2>
        <Link to="/books">
          <Button variant="secondary">العودة لكتبي</Button>
        </Link>
      </div>
    )
  }

  return (
    <div
      className="page-enter"
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-5) var(--space-12) var(--space-5)',
        direction: 'rtl',
      }}
    >
      {/* ═══ Top Book Hero Section ═══ */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-7)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-9)',
          alignItems: 'flex-start',
        }}
      >
        {/* Book Cover */}
        <div
          style={{
            width: '210px',
            flexShrink: 0,
            aspectRatio: '3/4',
            background: book.cover_url
              ? `url(${book.cover_url}) center/cover`
              : 'linear-gradient(145deg, rgba(74, 11, 16, 0.7), rgba(15, 15, 15, 0.95))',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {!book.cover_url && (
            <span
              style={{
                fontFamily: 'var(--font-title)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: 'var(--space-4)',
                fontSize: '1.1rem',
              }}
            >
              {book.title}
            </span>
          )}
        </div>

        {/* Book Details & Actions */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          {/* Metadata Chips Row */}
          <div
            className="flex items-center flex-wrap"
            style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}
          >
            <span
              style={{
                fontSize: '0.74rem',
                fontFamily: 'var(--font-title)',
                padding: '3px 9px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {book.file_type?.toUpperCase() || 'PDF'}
            </span>

            {nodes.length > 0 && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-title)',
                  padding: '3px 9px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {chapters.length > 0 ? `${chapters.length} فصول` : ''}
                {chapters.length > 0 && sections.length > 0 ? ' • ' : ''}
                {sections.length > 0 ? `${sections.length} قسم` : ''}
              </span>
            )}

            {questionSets.length > 0 && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-title)',
                  padding: '3px 9px',
                  background: 'rgba(165, 30, 41, 0.22)',
                  color: 'var(--red-400)',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {questionSets.length} مجموعة أسئلة
              </span>
            )}

            {book.status !== 'ready' && (
              <Badge variant={book.status === 'processing' ? 'warning' : 'error'}>
                {book.status === 'processing' ? 'قيد المعالجة...' : 'فشل في المعالجة'}
              </Badge>
            )}
          </div>

          {/* Book Title */}
          <h1
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1.85rem',
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              marginBottom: 'var(--space-2)',
            }}
          >
            {book.title}
          </h1>

          {/* Author */}
          {book.author && (
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.08rem',
                fontFamily: 'var(--font-body)',
                marginBottom: 'var(--space-4)',
              }}
            >
              {book.author}
            </p>
          )}

          {/* Description */}
          {book.description && (
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.94rem',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.8,
              }}
            >
              {book.description}
            </p>
          )}

          {/* Reading Progress */}
          {progress && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.28)',
                padding: 'var(--space-4) var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    تقدم القراءة
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontSize: '0.82rem',
                      color: 'var(--red-400)',
                      background: 'rgba(165, 30, 41, 0.2)',
                      padding: '1px 8px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {Math.round(progress.percent)}%
                  </span>
                </div>
                {progress.position > 1 && (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-title)',
                    }}
                  >
                    الصفحة {progress.position}
                  </span>
                )}
              </div>

              {/* Progress Bar Track */}
              <div
                style={{
                  width: '100%',
                  height: '7px',
                  background: 'var(--surface-black-strong)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, progress.percent))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--red-700), var(--red-500))',
                    borderRadius: 'var(--radius-pill)',
                    transition: 'width 600ms var(--ease-standard)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-3)' }}>
            {/* Primary Action: Read / Continue */}
            <Link to={`/books/${book.id}/read`}>
              <Button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  paddingInline: 'var(--space-6)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span>{progress && progress.percent > 0 ? 'متابعة القراءة' : 'ابدأ القراءة'}</span>
              </Button>
            </Link>

            {/* Secondary Action: Questions Tab Switcher */}
            <Button
              variant="secondary"
              onClick={() => setActiveTab('questions')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>مجموعات الأسئلة ({questionSets.length})</span>
            </Button>

            {/* Owner Dropdown Menu for Management Actions */}
            {isOwner && (
              <DropdownMenu
                align="right"
                trigger={
                  <button
                    type="button"
                    className="cursor-pointer flex items-center justify-center"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-black)',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      transition: 'background var(--duration-fast), color var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-black-strong)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--surface-black)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                    title="خيارات إضافية"
                    aria-label="خيارات إضافية"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                      <circle cx="5" cy="12" r="1.5" />
                    </svg>
                  </button>
                }
                items={[
                  {
                    key: 'reprocess',
                    label: reprocessing ? 'جارٍ إعادة المعالجة...' : 'إعادة معالجة الفهرس والغلاف',
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    ),
                    onClick: handleReprocess,
                    disabled: reprocessing,
                  },
                  {
                    key: 'delete',
                    label: 'حذف الكتاب',
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    ),
                    onClick: () => setDeleteOpen(true),
                    danger: true,
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* ═══ Content Tabs ═══ */}
      <div
        className="flex items-center"
        style={{
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          paddingBottom: 'var(--space-3)',
        }}
      >
        <button
          onClick={() => setActiveTab('chapters')}
          className="cursor-pointer flex items-center"
          style={{
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            background: activeTab === 'chapters' ? 'var(--surface-red)' : 'transparent',
            color: activeTab === 'chapters' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.96rem',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'chapters') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'chapters') {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }
          }}
        >
          <span>فهرس المحتويات</span>
          <span
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '0.78rem',
              padding: '1px 8px',
              borderRadius: 'var(--radius-pill)',
              background: activeTab === 'chapters' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {nodes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className="cursor-pointer flex items-center"
          style={{
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            background: activeTab === 'questions' ? 'var(--surface-red)' : 'transparent',
            color: activeTab === 'questions' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.96rem',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'questions') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'questions') {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }
          }}
        >
          <span>مجموعات الأسئلة</span>
          <span
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '0.78rem',
              padding: '1px 8px',
              borderRadius: 'var(--radius-pill)',
              background: activeTab === 'questions' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {questionSets.length}
          </span>
        </button>
      </div>

      {/* ═══ Tab 1: Table of Contents (Accordion Tree) ═══ */}
      {activeTab === 'chapters' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Search & Filter Toolbar */}
          {nodes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.28)',
                padding: 'var(--space-4) var(--space-5)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {/* Search in Outline */}
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <input
                  type="text"
                  value={nodeSearch}
                  onChange={(e) => setNodeSearch(e.target.value)}
                  placeholder="ابحث في الفهرس والفصول..."
                  style={{
                    width: '100%',
                    background: 'var(--surface-black)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 16px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                {nodeSearch && (
                  <button
                    onClick={() => setNodeSearch('')}
                    className="cursor-pointer"
                    style={{
                      position: 'absolute',
                      insetInlineEnd: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                    title="مسح البحث"
                    aria-label="مسح البحث"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Node Type Filter using Select Component */}
              <div style={{ minWidth: '180px' }}>
                <Select
                  value={nodeFilter}
                  onChange={(val) => setNodeFilter(val as 'all' | 'chapter' | 'section')}
                  options={[
                    { value: 'all', label: `عرض الكل (${nodes.length})` },
                    { value: 'chapter', label: `الفصول فقط (${chapters.length})` },
                    { value: 'section', label: `الأقسام فقط (${sections.length})` },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Hierarchical Accordion Tree */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.28)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <AccordionTree
              nodes={nodes}
              searchQuery={nodeSearch}
              filterType={nodeFilter}
              onNodeSelect={(_node, page) => navigate(`/books/${book.id}/read?page=${page}`)}
            />
          </div>
        </div>
      ) : (
        /* ═══ Tab 2: Question Sets ═══ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Header Action */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.15rem',
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                مجموعات أسئلة الكتاب ({questionSets.length})
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                اختبر فهمك واستيعابك لفصول وأقسام الكتاب
              </p>
            </div>

            <Link to={`/books/${book.id}/question-sets`}>
              <Button
                size="sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  paddingInline: 'var(--space-4)',
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>إنشاء مجموعة أسئلة</span>
              </Button>
            </Link>
          </div>

          {/* Questions Cards */}
          {questionSets.length === 0 ? (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.28)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-10) var(--space-6)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4) auto',
                  color: 'var(--text-muted)',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h4
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.1rem',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                لا توجد مجموعات أسئلة لهذا الكتاب بعد
              </h4>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.88rem',
                  marginBottom: 'var(--space-6)',
                  maxWidth: '380px',
                  marginInline: 'auto',
                }}
              >
                كن أول من يضيف أسئلة تفاعلية ومراجعة لاختبار استيعاب القراء لهذا الكتاب.
              </p>
              <Link to={`/books/${book.id}/question-sets`}>
                <Button>إنشاء أول مجموعة أسئلة</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {questionSets.map((qs) => {
                const parsedDesc = parseQuestionSetDescription(qs.description)
                const totalQ = qs.total_questions || qs.questions_count || 0
                const userPercent =
                  qs.progress?.attempted_count && totalQ > 0
                    ? Math.round((qs.progress.attempted_count / totalQ) * 100)
                    : 0
                const isComplete = qs.progress?.status === 'completed' || userPercent >= 100

                return (
                  <div
                    key={qs.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-5)',
                      background: 'rgba(0, 0, 0, 0.28)',
                      borderRadius: 'var(--radius-lg)',
                      transition: 'background var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.42)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.28)')}
                  >
                    {/* Top Row: Title & Badges */}
                    <div
                      className="flex items-center justify-between flex-wrap"
                      style={{ gap: 'var(--space-3)' }}
                    >
                      <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-3)' }}>
                        <h4
                          style={{
                            fontFamily: 'var(--font-title)',
                            fontSize: '1.08rem',
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {qs.name}
                        </h4>

                        {parsedDesc.nodeLabel && (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              padding: '2px 9px',
                              background: 'rgba(165, 30, 41, 0.25)',
                              color: 'var(--red-400)',
                              borderRadius: 'var(--radius-sm)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            قسم: {parsedDesc.nodeLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                        <Badge variant={qs.visibility === 'public' ? 'info' : 'default'}>
                          {qs.visibility === 'public' ? 'عام' : 'خاص'}
                        </Badge>
                        <span
                          style={{
                            fontFamily: 'var(--font-title)',
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                          }}
                        >
                          {totalQ} سؤال
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {parsedDesc.cleanDescription && (
                      <p
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.88rem',
                          lineHeight: 1.65,
                          margin: 0,
                        }}
                      >
                        {parsedDesc.cleanDescription}
                      </p>
                    )}

                    {/* Footer: Creator & Actions */}
                    <div
                      className="flex items-center justify-between flex-wrap"
                      style={{
                        marginTop: 'var(--space-2)',
                        paddingTop: 'var(--space-3)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        gap: 'var(--space-3)',
                      }}
                    >
                      {/* Creator Profile */}
                      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                        <Avatar
                          src={(qs.creator as any)?.avatar_url}
                          fallback={(qs.creator as any)?.username}
                          size="xs"
                        />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {(qs.creator as any)?.username || 'مستخدم'}
                        </span>
                        {qs.progress && (
                          <>
                            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                            <span
                              style={{
                                fontSize: '0.78rem',
                                color: isComplete ? 'var(--green-400, #4ade80)' : 'var(--red-400)',
                              }}
                            >
                              {isComplete ? 'مكتملة' : `إنجاز ${userPercent}%`}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                        <Link to={`/question-sets/${qs.id}/play`}>
                          <Button size="sm" style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
                            {qs.progress ? 'متابعة الحل' : 'بدء الأسئلة'}
                          </Button>
                        </Link>
                        <Link to={`/books/${book.id}/question-sets/${qs.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                          >
                            التفاصيل
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="حذف الكتاب"
        maxWidth="420px"
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-6)',
            lineHeight: 1.6,
          }}
        >
          هل أنت متأكد من حذف "{book.title}"؟ سيتم حذف جميع الفصول والأقسام المرتبطة به نهائياً ولا
          يمكن التراجع عن هذا الإجراء.
        </p>
        {/* RTL Action Order: Primary/Destructive first on right, Secondary/Cancel to the left */}
        <div
          className="flex items-center"
          style={{ gap: 'var(--space-3)', direction: 'rtl', justifyContent: 'flex-start' }}
        >
          <Button variant="danger" onClick={handleDelete}>
            حذف الكتاب
          </Button>
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            إلغاء
          </Button>
        </div>
      </Modal>
    </div>
  )
}
