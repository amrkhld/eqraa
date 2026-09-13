import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getBook, getBookNodes, getBookFileSignedUrl } from '@/services/books'
import { EpubReader } from '@/components/reader/EpubReader'
import { PdfReader } from '@/components/reader/PdfReader'
import { Button } from '@/components/ui/Button'
import type { Book, BookNode } from '@/types'

export function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const { user } = useAuth()
  const userId = user?.id
  const navigate = useNavigate()

  const [book, setBook] = useState<Book | null>(null)
  const [nodes, setNodes] = useState<BookNode[]>([])
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedBookIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadBookData() {
      if (!bookId || !userId) return
      // If we already loaded this book, don't show loading spinner or re-fetch
      if (loadedBookIdRef.current === bookId && book && fileUrl) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [bookData, nodesData] = await Promise.all([
          getBook(bookId),
          getBookNodes(bookId),
        ])

        if (!active) return
        setBook(bookData)
        setNodes(nodesData)

        // Get signed URL for the book file
        const url = await getBookFileSignedUrl(bookData.file_path)
        if (!active) return
        setFileUrl(url)
        loadedBookIdRef.current = bookId
      } catch (err: any) {
        console.error('Error loading reader:', err)
        if (active) setError(err?.message || 'تعذر تحميل الكتاب')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBookData()

    return () => {
      active = false
    }
  }, [bookId, userId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '100vh', background: 'var(--black-950)', gap: 'var(--space-4)' }}>
        <div
          className="animate-spin rounded-full"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(111,16,24,0.3)',
            borderTopColor: 'var(--red-500)',
          }}
        />
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          جاري تجهيز الكتاب...
        </p>
      </div>
    )
  }

  if (error || !book || !fileUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: '100vh', background: 'var(--black-950)', padding: 'var(--space-6)', textAlign: 'center' }}
      >
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', color: 'var(--red-500)', marginBottom: 'var(--space-3)' }}>
          تعذر فتح الكتاب
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)', maxWidth: '400px' }}>
          {error || 'لم نتمكن من العثور على ملف الكتاب أو انتهت صلاحية الرابط.'}
        </p>
        <Button variant="secondary" onClick={() => navigate(bookId ? `/books/${bookId}` : '/books')}>
          العودة لتفاصيل الكتاب
        </Button>
      </div>
    )
  }

  const isPdf = book.file_type?.toLowerCase() === 'pdf' || book.file_path?.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    return <PdfReader book={book} nodes={nodes} fileUrl={fileUrl} userId={user!.id} />
  }

  return <EpubReader book={book} nodes={nodes} fileUrl={fileUrl} userId={user!.id} />
}
