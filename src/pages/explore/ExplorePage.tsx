import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllBooks } from '@/services/books'
import { Input } from '@/components/ui/Input'
import type { Book } from '@/types'

export function ExplorePage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getAllBooks()
        setBooks(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = searchQuery
    ? books.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : books

  return (
    <div className="page-enter" style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-9)', paddingTop: 'var(--space-7)' }}>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          marginBottom: 'var(--space-4)',
          background: 'linear-gradient(135deg, var(--text-primary), var(--red-500))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          استكشف الكتب
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto var(--space-7)', lineHeight: 1.8 }}>
          اقرأ الكتب واختبر فهمك مع مجموعات الأسئلة المجتمعية
        </p>

        {/* Search */}
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Input
            placeholder="ابحث عن كتاب أو مؤلف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leadingIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-5)' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ aspectRatio: '3/4', background: 'var(--surface-black)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد كتب بعد'}
          </p>
        </div>
      ) : (
        <>
          {!searchQuery && (
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', marginBottom: 'var(--space-5)' }}>
              أحدث الكتب
            </h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-5)' }}>
            {filtered.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                style={{
                  display: 'block',
                  background: 'var(--surface-black)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  transition: `transform var(--duration-fast) var(--ease-standard), background var(--duration-fast)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.background = 'var(--surface-black-strong)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'var(--surface-black)'
                }}
              >
                <div
                  style={{
                    aspectRatio: '3/4',
                    background: book.cover_url
                      ? `url(${book.cover_url}) center/cover`
                      : 'linear-gradient(135deg, var(--red-900), var(--black-800))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!book.cover_url && (
                    <span style={{
                      fontFamily: 'var(--font-title)',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: 'var(--space-3)',
                      fontSize: '0.95rem',
                    }}>
                      {book.title}
                    </span>
                  )}
                </div>
                <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 'var(--space-1)',
                  }}>
                    {book.title}
                  </h3>
                  {book.author && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.author}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
