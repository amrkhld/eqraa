import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getQuestionSet, getQuestionsForSet, createQuestion, deleteQuestion, updateQuestionSet } from '@/services/questions'
import { getBookNodes } from '@/services/books'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import type { QuestionSet, Question, BookNode, QuestionType } from '@/types'

export function ManageQuestionSetPage() {
  const { bookId, setId } = useParams<{ bookId: string; setId: string }>()
  const [searchParams] = useSearchParams()
  const defaultNodeId = searchParams.get('nodeId') || ''
  const { user } = useAuth()
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [nodes, setNodes] = useState<BookNode[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    if (defaultNodeId) {
      setAddOpen(true)
    }
  }, [defaultNodeId])

  useEffect(() => {
    async function fetch() {
      if (!setId || !bookId) return
      try {
        const [setData, questionsData, nodesData] = await Promise.all([
          getQuestionSet(setId),
          getQuestionsForSet(setId),
          getBookNodes(bookId),
        ])
        setQuestionSet(setData)
        setQuestions(questionsData)
        setNodes(nodesData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [setId, bookId])

  const handleAddQuestion = async (data: {
    type: QuestionType
    prompt: string
    options: string[]
    correct_answer: string | string[]
    explanation: string
    book_node_id: string
  }) => {
    if (!setId) return
    try {
      const newQ = await createQuestion({
        question_set_id: setId,
        book_node_id: data.book_node_id || undefined,
        type: data.type,
        prompt: data.prompt,
        options: data.options,
        correct_answer: data.correct_answer,
        explanation: data.explanation || undefined,
        order_index: questions.length,
      })
      setQuestions((prev) => [...prev, newQ])
      // Update total count
      if (questionSet) {
        const newTotal = questions.length + 1
        await updateQuestionSet(setId, { total_questions: newTotal } as any)
        setQuestionSet({ ...questionSet, total_questions: newTotal })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await deleteQuestion(qId)
      setQuestions((prev) => prev.filter((q) => q.id !== qId))
      if (questionSet && setId) {
        const newTotal = Math.max(0, questions.length - 1)
        await updateQuestionSet(setId, { total_questions: newTotal } as any)
        setQuestionSet({ ...questionSet, total_questions: newTotal })
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
        <div style={{ height: '28px', width: '50%', background: 'var(--surface-black)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: '100px', background: 'var(--surface-black)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }} />
        ))}
      </div>
    )
  }

  const chapters = nodes.filter(n => n.type === 'chapter')

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to={`/books/${bookId}/question-sets`} style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          مجموعات الأسئلة
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem' }}>{questionSet?.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 'var(--space-1)' }}>{questions.length} سؤال</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>إضافة سؤال</Button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>لا توجد أسئلة بعد. أضف سؤالك الأول.</p>
          <Button onClick={() => setAddOpen(true)}>إضافة سؤال</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                background: 'var(--surface-black)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                  <span style={{ fontFamily: 'var(--font-title)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{i + 1}</span>
                  <span style={{
                    background: 'var(--surface-red)',
                    color: 'var(--red-500)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                  }}>
                    {q.type === 'multiple_choice' ? 'اختيار متعدد' : q.type === 'true_false' ? 'صح/خطأ' : 'إجابات متعددة'}
                  </span>
                </div>
                {user?.id === questionSet?.creator_id && (
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="cursor-pointer"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 'var(--space-1)' }}
                    aria-label="حذف السؤال"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                {q.prompt}
              </p>
              {q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {(q.options as string[]).map((opt, j) => {
                    const isCorrect = Array.isArray(q.correct_answer)
                      ? q.correct_answer.includes(opt)
                      : q.correct_answer === opt
                    return (
                      <div
                        key={j}
                        style={{
                          padding: 'var(--space-2) var(--space-4)',
                          background: isCorrect ? 'rgba(34, 120, 69, 0.2)' : 'var(--surface-black)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.9rem',
                          color: isCorrect ? 'rgba(130, 230, 160, 0.9)' : 'var(--text-secondary)',
                        }}
                      >
                        {String.fromCharCode(1571 + j)}. {opt}
                        {isCorrect && ' ✓'}
                      </div>
                    )
                  })}
                </div>
              )}
              {q.explanation && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'var(--space-3)', fontStyle: 'italic' }}>
                  {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      <AddQuestionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddQuestion}
        chapters={nodes}
        defaultNodeId={defaultNodeId}
      />
    </div>
  )
}

function AddQuestionModal({
  open,
  onClose,
  onAdd,
  chapters,
  defaultNodeId = '',
}: {
  open: boolean
  onClose: () => void
  onAdd: (data: any) => void
  chapters: BookNode[]
  defaultNodeId?: string
}) {
  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState<string>('')
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [explanation, setExplanation] = useState('')
  const [nodeId, setNodeId] = useState(defaultNodeId)
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string>('true')

  useEffect(() => {
    if (open && defaultNodeId) {
      setNodeId(defaultNodeId)
    }
  }, [open, defaultNodeId])

  const resetForm = () => {
    setType('multiple_choice')
    setPrompt('')
    setOptions(['', '', '', ''])
    setCorrectAnswer('')
    setCorrectAnswers([])
    setExplanation('')
    setNodeId(defaultNodeId)
    setTrueFalseAnswer('true')
  }

  const handleSubmit = () => {
    if (!prompt.trim()) return

    let finalOptions: string[] = []
    let finalCorrectAnswer: string | string[] = ''

    if (type === 'multiple_choice') {
      finalOptions = options.filter(o => o.trim())
      finalCorrectAnswer = correctAnswer
    } else if (type === 'true_false') {
      finalOptions = ['صحيح', 'خاطئ']
      finalCorrectAnswer = trueFalseAnswer === 'true' ? 'صحيح' : 'خاطئ'
    } else if (type === 'multiple_correct') {
      finalOptions = options.filter(o => o.trim())
      finalCorrectAnswer = correctAnswers
    }

    onAdd({
      type,
      prompt: prompt.trim(),
      options: finalOptions,
      correct_answer: finalCorrectAnswer,
      explanation: explanation.trim(),
      book_node_id: nodeId || '',
    })

    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose() }} title="إضافة سؤال" maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxHeight: '65vh', overflowY: 'auto' }}>
        {/* Question Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>نوع السؤال</label>
          <div className="flex flex-wrap" style={{ gap: 'var(--space-2)' }}>
            {([
              { value: 'multiple_choice', label: 'اختيار متعدد' },
              { value: 'true_false', label: 'صح / خطأ' },
              { value: 'multiple_correct', label: 'إجابات متعددة' },
            ] as const).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className="cursor-pointer"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: type === t.value ? 'var(--surface-red-strong)' : 'var(--surface-black)',
                  color: type === t.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  transition: `background var(--duration-fast)`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter / Section selection */}
        {chapters.length > 0 && (
          <Select
            label="الفصل أو القسم (اختياري)"
            value={nodeId}
            onChange={(val) => setNodeId(val)}
            placeholder="بدون موضع محدد"
            options={[
              { value: '', label: 'بدون موضع محدد' },
              ...chapters.map((ch) => ({
                value: ch.id,
                label: `${ch.type === 'chapter' ? '📖 فصل: ' : '📑 قسم: '}${ch.label}${ch.start_position ? ` (ص ${ch.start_position})` : ''}`,
              })),
            ]}
          />
        )}

        {/* Prompt */}
        <Textarea
          label="نص السؤال"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب نص السؤال هنا..."
          required
          style={{ minHeight: '80px' }}
        />

        {/* Options */}
        {type === 'multiple_choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>الخيارات</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(opt)}
                  className="cursor-pointer flex-shrink-0"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: correctAnswer === opt && opt ? 'rgba(34,120,69,0.6)' : 'var(--surface-black)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.7rem',
                  }}
                  title="تحديد كإجابة صحيحة"
                >
                  {correctAnswer === opt && opt ? '✓' : ''}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options]
                    newOpts[i] = e.target.value
                    setOptions(newOpts)
                  }}
                  placeholder={`الخيار ${String.fromCharCode(1571 + i)}`}
                />
              </div>
            ))}
          </div>
        )}

        {type === 'true_false' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>الإجابة الصحيحة</label>
            <div className="flex" style={{ gap: 'var(--space-3)' }}>
              {[{ value: 'true', label: 'صحيح' }, { value: 'false', label: 'خاطئ' }].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTrueFalseAnswer(t.value)}
                  className="cursor-pointer"
                  style={{
                    flex: 1,
                    padding: 'var(--space-3) var(--space-5)',
                    background: trueFalseAnswer === t.value ? 'rgba(34,120,69,0.4)' : 'var(--surface-black)',
                    color: trueFalseAnswer === t.value ? 'rgba(130,230,160,0.9)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    transition: `background var(--duration-fast)`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'multiple_correct' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>الخيارات (اختر الإجابات الصحيحة)</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (opt && correctAnswers.includes(opt)) {
                      setCorrectAnswers(prev => prev.filter(a => a !== opt))
                    } else if (opt) {
                      setCorrectAnswers(prev => [...prev, opt])
                    }
                  }}
                  className="cursor-pointer flex-shrink-0"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: correctAnswers.includes(opt) && opt ? 'rgba(34,120,69,0.6)' : 'var(--surface-black)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.7rem',
                  }}
                >
                  {correctAnswers.includes(opt) && opt ? '✓' : ''}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options]
                    newOpts[i] = e.target.value
                    setOptions(newOpts)
                  }}
                  placeholder={`الخيار ${String.fromCharCode(1571 + i)}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Explanation */}
        <Textarea
          label="التوضيح (اختياري)"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="اشرح الإجابة..."
          style={{ minHeight: '60px' }}
        />

        {/* Actions */}
        <div className="flex items-center justify-end" style={{ gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => { resetForm(); onClose() }}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!prompt.trim()}>إضافة السؤال</Button>
        </div>
      </div>
    </Modal>
  )
}
