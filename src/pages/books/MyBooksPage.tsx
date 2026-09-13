import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getMyBooks, uploadBook, updateBookStatus, updateBookCover, createBookNodes } from '@/services/books'
import { parseEpub } from '@/lib/epub-parser'
import { parsePdf } from '@/lib/pdf-parser'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import type { Book } from '@/types'

export function MyBooksPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchBooks = useCallback(async () => {
    if (!user) return
    try {
      const data = await getMyBooks(user.id)
      setBooks(data)
    } catch (err) {
      console.error('Error fetching books:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  return (
    <div className="page-enter" style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-7)' }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem' }}>كتبي</h1>
        <Button onClick={() => setUploadOpen(true)}>
          رفع كتاب
        </Button>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface-black)',
                borderRadius: 'var(--radius-lg)',
                aspectRatio: '3/4',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-11) var(--space-6)',
          }}
        >
          <svg
            width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ margin: '0 auto var(--space-5)' }}
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', marginBottom: 'var(--space-3)' }}>
            لا توجد كتب بعد
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            ارفع كتابك الأول وابدأ القراءة
          </p>
          <Button onClick={() => setUploadOpen(true)}>رفع كتاب</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadBookModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          setUploadOpen(false)
          fetchBooks()
        }}
      />
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const statusBadge: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
    ready: { label: 'جاهز', variant: 'success' },
    processing: { label: 'قيد المعالجة', variant: 'warning' },
    failed: { label: 'فشل', variant: 'error' },
  }

  const badge = statusBadge[book.status] || statusBadge.processing

  return (
    <Link
      to={`/books/${book.id}`}
      style={{
        display: 'block',
        background: 'var(--surface-black)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: `transform var(--duration-fast) var(--ease-standard), background var(--duration-fast)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.background = 'var(--surface-black-strong)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.background = 'var(--surface-black)'
      }}
    >
      {/* Cover */}
      <div
        style={{
          aspectRatio: '3/4',
          background: book.cover_url
            ? `url(${book.cover_url}) center/cover`
            : 'linear-gradient(135deg, var(--red-900), var(--black-800))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!book.cover_url && (
          <span style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: 'var(--space-4)',
            lineHeight: 1.4,
          }}>
            {book.title}
          </span>
        )}
        <div style={{ position: 'absolute', top: 'var(--space-3)', insetInlineStart: 'var(--space-3)' }}>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 'var(--space-4)' }}>
        <h3 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '0.98rem',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {book.title}
        </h3>
        {book.author && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {book.author}
          </p>
        )}
      </div>
    </Link>
  )
}

function UploadBookModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!file || !user || !title) return
    setError(null)
    setUploading(true)

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'

    try {
      // 1. Upload file and create book record
      const book = await uploadBook(file, user.id, { title, author })

      // 2. Process Book
      setUploading(false)
      setProcessing(true)

      try {
        if (isPdf) {
          const parsed = await parsePdf(file, book.id, user.id)

          if (!author && parsed.author) {
            setAuthor(parsed.author)
          }

          if (parsed.nodes.length > 0) {
            await createBookNodes(parsed.nodes)
          }

          if (parsed.coverUrl) {
            await updateBookCover(book.id, parsed.coverUrl)
          }

          await updateBookStatus(book.id, 'ready')
        } else {
          const parsed = await parseEpub(file, book.id)

          if (!author && parsed.author) {
            setAuthor(parsed.author)
          }

          if (parsed.nodes.length > 0) {
            await createBookNodes(parsed.nodes)
          }

          if (parsed.coverUrl) {
            await updateBookCover(book.id, parsed.coverUrl)
          }

          await updateBookStatus(book.id, 'ready')
        }
        resetState()
        onSuccess()
      } catch (parseErr) {
        console.error('Book parsing error:', parseErr)
        // Fallback: create default node and mark ready so user can still open the book
        try {
          await createBookNodes([{
            book_id: book.id,
            parent_id: null,
            type: 'chapter',
            label: 'المحتوى الكامل',
            order_index: 0,
            content: null,
            href: isPdf ? '#page=1' : null,
            start_position: 1,
            end_position: null,
          }])
        } catch {}
        await updateBookStatus(book.id, 'ready')
        resetState()
        onSuccess()
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('حدث خطأ أثناء رفع الكتاب. يرجى المحاولة مرة أخرى.')
    } finally {
      setUploading(false)
      setProcessing(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setTitle('')
    setAuthor('')
    setUploading(false)
    setProcessing(false)
    setError(null)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!uploading && !processing) {
          resetState()
          onClose()
        }
      }}
      title="رفع كتاب جديد"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <FileUpload
          accept=".epub,.pdf,application/pdf,application/epub+zip"
          maxSize={50}
          onFileSelect={(f) => {
            setFile(f)
            // Auto-fill title from filename
            if (!title) {
              const name = f.name.replace(/\.(epub|pdf)$/i, '').replace(/[_-]/g, ' ')
              setTitle(name)
            }
          }}
          uploading={uploading}
          processing={processing}
          error={error}
          label="اختر كتاب EPUB أو PDF"
          helpText="اسحب الملف هنا أو اضغط للاختيار (EPUB أو PDF, حد أقصى 50MB)"
        />

        <Input
          label="عنوان الكتاب"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="أدخل عنوان الكتاب"
          required
          disabled={uploading || processing}
        />

        <Input
          label="المؤلف"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="اسم المؤلف (اختياري)"
          disabled={uploading || processing}
        />

        <div className="flex items-center justify-end" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            onClick={() => { resetState(); onClose() }}
            disabled={uploading || processing}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !title || uploading || processing}
            loading={uploading || processing}
          >
            رفع الكتاب
          </Button>
        </div>
      </div>
    </Modal>
  )
}
