import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Book, QuestionSet } from '@/types'

type SearchResults = {
  books: Book[]
  questionSets: (QuestionSet & { book_title?: string })[]
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ books: [], questionSets: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    try {
      const searchTerm = `%${query.trim()}%`

      const [booksRes, setsRes] = await Promise.all([
        supabase
          .from('books')
          .select('*')
          .eq('status', 'ready')
          .or(`title.ilike.%${query.trim()}%,author.ilike.%${query.trim()}%`)
          .limit(20),
        supabase
          .from('question_sets')
          .select('*, books(title)')
          .eq('visibility', 'public')
          .ilike('name', searchTerm)
          .limit(20),
      ])

      setResults({
        books: booksRes.data || [],
        questionSets: (setsRes.data || []).map((s: any) => ({ ...s, book_title: s.books?.title })),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
      <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: 'var(--space-6)' }}>البحث</h1>

      {/* Search Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch() }}
        className="flex items-center" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-7)' }}
      >
        <div style={{ flex: 1 }}>
          <Input
            placeholder="ابحث عن كتاب، مؤلف، أو مجموعة أسئلة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leadingIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
        <Button type="submit" loading={loading}>بحث</Button>
      </form>

      {/* Results */}
      {searched && (
        <div>
          {/* Books */}
          {results.books.length > 0 && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>
                الكتب ({results.books.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {results.books.map((book) => (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    className="flex items-center"
                    style={{
                      gap: 'var(--space-4)',
                      padding: 'var(--space-4)',
                      background: 'var(--surface-black)',
                      borderRadius: 'var(--radius-md)',
                      transition: `background var(--duration-fast)`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-black-strong)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-black)')}
                  >
                    <div style={{
                      width: '48px',
                      height: '64px',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                      background: book.cover_url ? `url(${book.cover_url}) center/cover` : 'linear-gradient(135deg, var(--red-900), var(--black-800))',
                    }} />
                    <div>
                      <p style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem' }}>{book.title}</p>
                      {book.author && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{book.author}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Question Sets */}
          {results.questionSets.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>
                مجموعات الأسئلة ({results.questionSets.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {results.questionSets.map((qs) => (
                  <Link
                    key={qs.id}
                    to={`/books/${qs.book_id}/question-sets/${qs.id}`}
                    style={{
                      padding: 'var(--space-4) var(--space-5)',
                      background: 'var(--surface-black)',
                      borderRadius: 'var(--radius-md)',
                      transition: `background var(--duration-fast)`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-black-strong)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-black)')}
                  >
                    <p style={{ fontFamily: 'var(--font-title)', fontSize: '0.95rem', marginBottom: 'var(--space-1)' }}>{qs.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {qs.total_questions} سؤال{qs.book_title ? ` • ${qs.book_title}` : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.books.length === 0 && results.questionSets.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-10)' }}>
              لا توجد نتائج لـ "{query}"
            </p>
          )}
        </div>
      )}
    </div>
  )
}
