import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import type { QuestionSetWithProgress } from '@/services/questions'
import type { BookNode } from '@/types'

interface SectionQuestionSetsProps {
  bookId: string
  userId: string
  sectionNode?: BookNode | null
  questionSets: QuestionSetWithProgress[]
  loading: boolean
  onCreateClick: () => void
  onScrollToTop: () => void
}

export function SectionQuestionSets({
  bookId,
  userId,
  sectionNode,
  questionSets,
  loading,
  onCreateClick,
  onScrollToTop,
}: SectionQuestionSetsProps) {
  const [filter, setFilter] = useState<'section' | 'all'>('section')

  const sectionLabel = sectionNode?.label || ''

  // Filter sets matching the active section
  const sectionSets = useMemo(() => {
    if (!sectionNode) return questionSets
    return questionSets.filter((set) => {
      if (set.node_id && set.node_id === sectionNode.id) return true
      if (set.node_label && sectionLabel && set.node_label.toLowerCase() === sectionLabel.toLowerCase()) return true
      if (set.name.includes(sectionLabel) || (set.description && set.description.includes(sectionLabel))) return true
      return false
    })
  }, [questionSets, sectionNode, sectionLabel])

  const displayedSets = filter === 'section' && sectionLabel ? sectionSets : questionSets

  return (
    <div
      id="section-question-sets"
      className="page-enter"
      style={{
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-5) var(--space-10) var(--space-5)',
        direction: 'rtl',
      }}
    >
      {/* Visual atmospheric divider */}
      <div
        style={{
          width: '100%',
          height: '1px',
          background: 'linear-gradient(to left, transparent, rgba(111, 16, 24, 0.4), transparent)',
          marginBottom: 'var(--space-8)',
        }}
      />

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
        style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}
      >
        <div>
          <div className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(165, 30, 41, 0.25)',
                color: 'var(--red-400)',
                fontFamily: 'var(--font-title)',
              }}
            >
              مجموعات الأسئلة
            </span>
            {sectionLabel && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                • قسم: {sectionLabel}
              </span>
            )}
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1.45rem',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {sectionLabel ? `أسئلة حول "${sectionLabel}"` : 'مجموعات أسئلة الكتاب'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            اختبر فهمك واستيعابك للنصوص، أو أنشئ مجموعة أسئلتك الخاصة وشاركها
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <button
            onClick={onScrollToTop}
            className="cursor-pointer flex items-center"
            style={{
              background: 'var(--surface-black)',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.82rem',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              transition: 'transform 180ms ease, background-color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.background = 'var(--surface-black-strong)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.background = 'var(--surface-black)'
            }}
            title="العودة لأعلى الصفحة ومتابعة القراءة"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span>العودة للقراءة ↑</span>
          </button>

          <Button size="sm" onClick={onCreateClick}>
            + إضافة مجموعة أسئلة
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      {sectionLabel && (
        <div className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <button
            onClick={() => setFilter('section')}
            className="cursor-pointer"
            style={{
              background: filter === 'section' ? 'var(--surface-red)' : 'var(--surface-black)',
              color: filter === 'section' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              transition: 'background var(--duration-fast)',
            }}
          >
            هذا القسم ({sectionSets.length})
          </button>

          <button
            onClick={() => setFilter('all')}
            className="cursor-pointer"
            style={{
              background: filter === 'all' ? 'var(--surface-red)' : 'var(--surface-black)',
              color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              transition: 'background var(--duration-fast)',
            }}
          >
            جميع مجموعات الكتاب ({questionSets.length})
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: '110px',
                background: 'var(--surface-black)',
                borderRadius: 'var(--radius-lg)',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : displayedSets.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: 'var(--surface-black)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8) var(--space-6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(111, 16, 24, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--red-400)',
              marginBottom: 'var(--space-1)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            {filter === 'section' && sectionLabel
              ? `لا توجد مجموعات أسئلة لقسم "${sectionLabel}" حتى الآن`
              : 'لا توجد مجموعات أسئلة لهذا الكتاب حتى الآن'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.6 }}>
            كن أول من يشارك أسئلته حول هذا الجزء من الكتاب ليتمكن القراء الآخرون من اختبار فهمهم!
          </p>

          <Button onClick={onCreateClick} style={{ marginTop: 'var(--space-2)' }}>
            + إنشاء أول مجموعة أسئلة لهذا القسم
          </Button>
        </div>
      ) : (
        /* Question Sets List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {displayedSets.map((qs) => {
            const isCreator = qs.creator_id === userId
            const totalQuestions = qs.questions_count || qs.total_questions || 0
            const progress = qs.progress

            let statusLabel = 'لم تبدأ بعد'
            let statusColor = 'var(--text-muted)'
            let statusBg = 'rgba(255, 255, 255, 0.06)'
            let progressPercent = 0

            if (progress) {
              if (progress.status === 'completed' || (totalQuestions > 0 && progress.attempted_count >= totalQuestions)) {
                statusLabel = 'مكتملة ✓'
                statusColor = 'rgba(130, 230, 160, 0.95)'
                statusBg = 'rgba(34, 120, 69, 0.22)'
                progressPercent = 100
              } else if (progress.attempted_count > 0) {
                statusLabel = 'قيد التقدم'
                statusColor = 'var(--red-400)'
                statusBg = 'rgba(165, 30, 41, 0.25)'
                progressPercent = totalQuestions > 0 ? Math.round((progress.attempted_count / totalQuestions) * 100) : 0
              }
            }

            const scorePercent =
              progress && progress.attempted_count > 0
                ? Math.round((progress.correct_count / progress.attempted_count) * 100)
                : null

            return (
              <div
                key={qs.id}
                style={{
                  background: 'rgba(18, 18, 18, 0.78)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5) var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                  transition: 'transform 180ms ease, background-color 180ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = 'rgba(24, 24, 24, 0.88)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'rgba(18, 18, 18, 0.78)'
                }}
              >
                {/* Card Top: Title, Section badge, Visibility */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: 'var(--space-2)' }}>
                  <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                    <h4
                      style={{
                        fontFamily: 'var(--font-title)',
                        fontSize: '1.15rem',
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {qs.name}
                    </h4>

                    {qs.node_label && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(165, 30, 41, 0.22)',
                          color: 'var(--red-400)',
                        }}
                      >
                        {qs.node_label}
                      </span>
                    )}

                    {qs.visibility === 'private' && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        خاصة
                      </span>
                    )}
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                    <Avatar
                      src={qs.creator?.avatar_url}
                      alt={qs.creator?.username || 'مستخدم'}
                      fallback={qs.creator?.username || 'م'}
                      size="sm"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        بواسطة {qs.creator?.username || 'قارئ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {qs.clean_description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                    {qs.clean_description}
                  </p>
                )}

                {/* Progress & Stats Row */}
                <div
                  style={{
                    background: 'var(--surface-black)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ fontSize: '0.82rem' }}>
                    {/* Left: Questions Count */}
                    <div className="flex items-center" style={{ gap: '6px', color: 'var(--text-secondary)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>{totalQuestions} سؤال</span>
                    </div>

                    {/* Right: Progress Status Badge & Score */}
                    <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                      {scorePercent !== null && (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          النتيجة: <strong style={{ color: 'var(--text-primary)' }}>{scorePercent}%</strong>
                        </span>
                      )}
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: statusBg,
                          color: statusColor,
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-title)',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-pill)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(to left, var(--red-700), var(--red-500))',
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 300ms ease',
                      }}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end" style={{ gap: 'var(--space-3)' }}>
                  {isCreator && (
                    <Link to={`/books/${bookId}/question-sets/${qs.id}/manage`}>
                      <button
                        className="cursor-pointer"
                        style={{
                          background: 'var(--surface-black)',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.84rem',
                          fontFamily: 'var(--font-body)',
                          transition: 'background var(--duration-fast)',
                        }}
                      >
                        إدارة الأسئلة
                      </button>
                    </Link>
                  )}

                  {totalQuestions > 0 ? (
                    <Link to={`/books/${bookId}/question-sets/${qs.id}/take`}>
                      <Button size="sm">
                        {progress?.status === 'completed'
                          ? 'إعادة المحاولة'
                          : progress && progress.attempted_count > 0
                          ? 'متابعة الأسئلة'
                          : 'بدء الأسئلة'}
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/books/${bookId}/question-sets/${qs.id}/manage`}>
                      <Button size="sm" variant="secondary">
                        + إضافة أسئلة للمجموعة
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
