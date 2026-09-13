import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getQuestionSetsWithProgress, createQuestionSet, deleteQuestionSet, type QuestionSetWithProgress } from '@/services/questions'
import { getBook, getBookNodes } from '@/services/books'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import type { Book, BookNode } from '@/types'

export function QuestionSetsPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [sets, setSets] = useState<QuestionSetWithProgress[]>([])
  const [nodes, setNodes] = useState<BookNode[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchSets = async () => {
    if (!bookId) return
    try {
      const [bookData, setsData, nodesData] = await Promise.all([
        getBook(bookId),
        getQuestionSetsWithProgress(bookId, user?.id),
        getBookNodes(bookId),
      ])
      setBook(bookData)
      setSets(setsData)
      setNodes(nodesData)
    } catch (err) {
      console.error('Failed to load question sets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSets()
  }, [bookId, user?.id])

  const handleCreate = async (
    name: string,
    description: string,
    visibility: 'public' | 'private',
    nodeId?: string
  ) => {
    if (!bookId || !user) return
    try {
      const selectedNode = nodes.find((n) => n.id === nodeId)
      const sectionTag = selectedNode?.label ? `[قسم: ${selectedNode.label}] ` : ''
      const finalDescription = `${sectionTag}${description.trim()}`.trim() || undefined

      const newSet = await createQuestionSet({
        book_id: bookId,
        creator_id: user.id,
        name,
        description: finalDescription,
        visibility,
      })
      navigate(`/books/${bookId}/question-sets/${newSet.id}/manage${nodeId ? `?nodeId=${nodeId}` : ''}`)
    } catch (err) {
      console.error('Failed to create question set:', err)
    }
  }

  const handleDelete = async (setId: string) => {
    try {
      await deleteQuestionSet(setId)
      setSets((prev) => prev.filter((s) => s.id !== setId))
    } catch (err) {
      console.error('Failed to delete question set:', err)
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ maxWidth: '840px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: '110px', background: 'var(--surface-black)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ maxWidth: '840px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link
          to={`/books/${bookId}`}
          className="cursor-pointer"
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
            transition: 'color var(--duration-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {/* RTL back chevron pointing right */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {book?.title || 'العودة لتفاصيل الكتاب'}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: 'var(--text-primary)', margin: 0 }}>
              مجموعات الأسئلة
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              اختبر فهمك للكتاب أو تصفح مجموعات أسئلة مجتمع القراء
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>إنشاء مجموعة</Button>
        </div>
      </div>

      {/* Question Sets List */}
      {sets.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-11) var(--space-6)',
            background: 'var(--surface-black)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto var(--space-5)', opacity: 0.6 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>
            لا توجد مجموعات أسئلة بعد
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)', maxWidth: '420px', marginInline: 'auto' }}>
            كن أول من ينشئ مجموعة أسئلة لهذا الكتاب وشاركها مع القراء
          </p>
          <Button onClick={() => setCreateOpen(true)}>إنشاء مجموعة أسئلة</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {sets.map((qs) => {
            const progress = qs.progress
            const totalQuestions = qs.questions_count || qs.total_questions || 0
            const hasStarted = (progress?.attempted_count || 0) > 0
            const isCompleted =
              progress?.status === 'completed' ||
              (totalQuestions > 0 && (progress?.attempted_count || 0) >= totalQuestions)
            const progressPercent =
              totalQuestions > 0 && progress
                ? Math.min(100, Math.round(((progress.attempted_count || 0) / totalQuestions) * 100))
                : 0
            const scorePercent =
              progress && progress.attempted_count > 0
                ? Math.round((progress.correct_count / progress.attempted_count) * 100)
                : null

            return (
              <div
                key={qs.id}
                style={{
                  background: 'var(--surface-black)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  transition: 'background-color var(--duration-fast), transform 180ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-black-strong)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface-black)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Header: Title & Badges */}
                <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-2)', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-2)', marginBottom: '4px' }}>
                      <h3
                        style={{
                          fontFamily: 'var(--font-title)',
                          fontSize: '1.1rem',
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {qs.name}
                      </h3>
                      {qs.node_label && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(165,30,41,0.25)',
                            color: 'var(--red-400)',
                            fontWeight: 600,
                          }}
                        >
                          قسم: {qs.node_label}
                        </span>
                      )}
                    </div>
                    {qs.clean_description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                        {qs.clean_description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                    <Badge variant={qs.visibility === 'public' ? 'info' : 'default'}>
                      {qs.visibility === 'public' ? 'عام' : 'خاص'}
                    </Badge>
                  </div>
                </div>

                {/* Creator and Meta */}
                <div
                  className="flex items-center justify-between flex-wrap"
                  style={{ gap: 'var(--space-3)', color: 'var(--text-muted)', fontSize: '0.84rem', marginBlock: 'var(--space-3)' }}
                >
                  <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                    <Avatar
                      src={qs.creator?.avatar_url}
                      alt={qs.creator?.username || 'مستخدم'}
                      fallback={qs.creator?.username || 'م'}
                      size="xs"
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      بواسطة {qs.creator?.username || 'قارئ'}
                    </span>
                    <span>•</span>
                    <span>{totalQuestions} أسئلة</span>
                  </div>

                  {/* Progress Status Badge */}
                  {progress && (
                    <span
                      style={{
                        fontSize: '0.76rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: isCompleted
                          ? 'rgba(34, 120, 69, 0.25)'
                          : hasStarted
                          ? 'rgba(165, 30, 41, 0.25)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isCompleted
                          ? 'var(--green-400, #4ade80)'
                          : hasStarted
                          ? 'var(--red-400)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {isCompleted ? '✓ مكتملة' : hasStarted ? 'قيد الحل' : 'لم تبدأ بعد'}
                    </span>
                  )}
                </div>

                {/* Progress Bar & Score */}
                {progress && totalQuestions > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'var(--space-4)' }}>
                    <div className="flex items-center justify-between" style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        تقدمك: {progress.attempted_count} من {totalQuestions}
                        {scorePercent !== null && ` (النتيجة: ${scorePercent}%)`}
                      </span>
                      <span style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {progressPercent}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-pill)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: isCompleted
                            ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                            : 'linear-gradient(90deg, var(--red-700), var(--red-500))',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-3)' }}>
                  <Link to={`/books/${bookId}/question-sets/${qs.id}/take`}>
                    <Button size="sm">
                      {isCompleted ? 'إعادة الاختبار' : hasStarted ? 'متابعة الأسئلة' : 'بدء الاختبار'}
                    </Button>
                  </Link>

                  {user?.id === qs.creator_id && (
                    <>
                      <Link to={`/books/${bookId}/question-sets/${qs.id}/manage`}>
                        <Button size="sm" variant="secondary">إدارة الأسئلة</Button>
                      </Link>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(qs.id)}>حذف</Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateSetModal
        open={createOpen}
        nodes={nodes}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

function CreateSetModal({
  open,
  nodes,
  onClose,
  onCreate,
}: {
  open: boolean
  nodes: BookNode[]
  onClose: () => void
  onCreate: (name: string, desc: string, visibility: 'public' | 'private', nodeId?: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [selectedNodeId, setSelectedNodeId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onCreate(name.trim(), description.trim(), visibility, selectedNodeId || undefined)
      setName('')
      setDescription('')
      setVisibility('public')
      setSelectedNodeId('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="مجموعة أسئلة جديدة" maxWidth="460px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', direction: 'rtl' }}>
        <Input
          label="اسم المجموعة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: مراجعة الفصل الأول"
          required
        />

        {/* Section Selection */}
        {nodes.length > 0 && (
          <Select
            label="القسم أو الفصل المرتبط (اختياري)"
            value={selectedNodeId}
            onChange={(val) => setSelectedNodeId(val)}
            placeholder="كامل الكتاب (بدون قسم محدد)"
            options={[
              { value: '', label: 'كامل الكتاب (بدون قسم محدد)' },
              ...nodes.map((node) => ({
                value: node.id,
                label: `${node.type === 'chapter' ? 'فصل: ' : 'قسم: '}${node.label}${node.start_position ? ` (ص ${node.start_position})` : ''}`,
              })),
            ]}
          />
        )}

        <Textarea
          label="الوصف (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف مختصر لموضوع الأسئلة والهدف منها..."
          style={{ minHeight: '80px' }}
        />

        {/* Visibility Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            الخصوصية
          </label>
          <div className="flex" style={{ gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className="cursor-pointer flex-1"
              style={{
                background: visibility === 'public' ? 'var(--surface-red)' : 'var(--surface-black)',
                color: visibility === 'public' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
                transition: 'background var(--duration-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>عامة (متاحة للجميع)</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className="cursor-pointer flex-1"
              style={{
                background: visibility === 'private' ? 'var(--surface-red)' : 'var(--surface-black)',
                color: visibility === 'private' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
                transition: 'background var(--duration-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>خاصة (لي فقط)</span>
            </button>
          </div>
        </div>

        {/* Modal Actions - RTL Order: Primary action first (right), Secondary next (left) */}
        <div
          className="flex items-center justify-end"
          style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}
        >
          <Button type="submit" disabled={!name.trim() || loading}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  )
}
