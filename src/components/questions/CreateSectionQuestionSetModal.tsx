import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { createQuestionSet } from '@/services/questions'
import type { BookNode, QuestionSet } from '@/types'

interface CreateSectionQuestionSetModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: string
  userId: string
  sectionNode?: BookNode | null
  onSuccess: (newSet: QuestionSet) => void
}

export function CreateSectionQuestionSetModal({
  isOpen,
  onClose,
  bookId,
  userId,
  sectionNode,
  onSuccess,
}: CreateSectionQuestionSetModalProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectToManage, setRedirectToManage] = useState(true)

  const sectionLabel = sectionNode?.label || ''

  useEffect(() => {
    if (isOpen) {
      setName(sectionLabel ? `أسئلة مراجعة — ${sectionLabel}` : 'مجموعة أسئلة جديدة')
      setDescription('')
      setVisibility('public')
      setError(null)
      setRedirectToManage(true)
    }
  }, [isOpen, sectionLabel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('يرجى كتابة اسم لمجموعة الأسئلة')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Encode section tag in description for clean cross-page association
      const sectionTag = sectionLabel ? `[قسم: ${sectionLabel}] ` : ''
      const finalDescription = `${sectionTag}${description.trim()}`.trim() || undefined

      const newSet = await createQuestionSet({
        book_id: bookId,
        creator_id: userId,
        name: name.trim(),
        description: finalDescription,
        visibility,
      })

      onSuccess(newSet)
      onClose()

      if (redirectToManage) {
        const queryParams = sectionNode?.id ? `?nodeId=${sectionNode.id}` : ''
        navigate(`/books/${bookId}/question-sets/${newSet.id}/manage${queryParams}`)
      }
    } catch (err: any) {
      console.error('Error creating section question set:', err)
      setError(err?.message || 'تعذر إنشاء مجموعة الأسئلة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`إنشاء مجموعة أسئلة${sectionLabel ? ` — ${sectionLabel}` : ''}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(111, 16, 24, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--red-400)',
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        {sectionLabel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-black)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(165, 30, 41, 0.3)',
                color: 'var(--red-400)',
                fontFamily: 'var(--font-title)',
              }}
            >
              القسم الحالي
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {sectionLabel}
            </span>
          </div>
        )}

        <Input
          label="اسم مجموعة الأسئلة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: أسئلة فهم الفصل الأول..."
          required
        />

        <Textarea
          label="الوصف (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="اكتب نبذة مختصرة عن محتوى هذه الأسئلة ومستوى صعوبتها..."
          style={{ minHeight: '85px' }}
        />

        {/* Visibility selection */}
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            مستوى الخصوصية
          </label>
          <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
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

        {/* Checkbox: redirect to manage questions right away */}
        <label
          className="flex items-center cursor-pointer"
          style={{ gap: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}
        >
          <input
            type="checkbox"
            checked={redirectToManage}
            onChange={(e) => setRedirectToManage(e.target.checked)}
            style={{ accentColor: 'var(--red-600)' }}
          />
          <span>الانتقال مباشرة لصفحة إضافة الأسئلة بعد الإنشاء</span>
        </label>

        {/* Modal Actions */}
        <div className="flex items-center justify-end" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <Button type="submit" disabled={loading}>
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
