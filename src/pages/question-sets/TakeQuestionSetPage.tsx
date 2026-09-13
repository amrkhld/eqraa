import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getQuestionSet, getQuestionsForSet, submitAnswer, getSetProgress, upsertSetProgress } from '@/services/questions'
import { Button } from '@/components/ui/Button'
import type { QuestionSet, Question } from '@/types'

export function TakeQuestionSetPage() {
  const { bookId, setId } = useParams<{ bookId: string; setId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [attemptedCount, setAttemptedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    async function fetch() {
      if (!setId || !user) return
      try {
        const [setData, questionsData] = await Promise.all([
          getQuestionSet(setId),
          getQuestionsForSet(setId),
        ])
        setQuestionSet(setData)
        setQuestions(questionsData)

        // Resume from saved progress
        const progress = await getSetProgress(setId, user.id)
        if (progress) {
          setCurrentIndex(Math.min(progress.current_question, questionsData.length - 1))
          setCorrectCount(progress.correct_count)
          setAttemptedCount(progress.attempted_count)
          if (progress.status === 'completed') {
            setCompleted(true)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [setId, user])

  const currentQuestion = questions[currentIndex]

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !user || !setId) return

    let correct = false
    if (currentQuestion.type === 'multiple_correct') {
      const selectedArr = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer]
      const correctArr = Array.isArray(currentQuestion.correct_answer) ? currentQuestion.correct_answer : [currentQuestion.correct_answer]
      correct = selectedArr.length === correctArr.length && selectedArr.every(a => correctArr.includes(a))
    } else {
      const ans = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer
      const correctAns = Array.isArray(currentQuestion.correct_answer) ? currentQuestion.correct_answer[0] : currentQuestion.correct_answer
      correct = ans === correctAns
    }

    setIsCorrect(correct)
    setShowResult(true)

    const newCorrect = correctCount + (correct ? 1 : 0)
    const newAttempted = attemptedCount + 1
    setCorrectCount(newCorrect)
    setAttemptedCount(newAttempted)

    // Save attempt
    try {
      await submitAnswer({
        question_id: currentQuestion.id,
        user_id: user.id,
        answer: selectedAnswer,
        is_correct: correct,
      })

      const isLast = currentIndex >= questions.length - 1
      await upsertSetProgress({
        question_set_id: setId,
        user_id: user.id,
        current_question: isLast ? currentIndex : currentIndex + 1,
        attempted_count: newAttempted,
        correct_count: newCorrect,
        status: isLast ? 'completed' : 'in_progress',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      setCompleted(true)
      return
    }
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer('')
    setShowResult(false)
    setIsCorrect(false)
  }

  const handleRestart = async () => {
    if (!setId || !user) return
    setCurrentIndex(0)
    setSelectedAnswer('')
    setShowResult(false)
    setIsCorrect(false)
    setCorrectCount(0)
    setAttemptedCount(0)
    setCompleted(false)

    await upsertSetProgress({
      question_set_id: setId,
      user_id: user.id,
      current_question: 0,
      attempted_count: 0,
      correct_count: 0,
      status: 'not_started',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="animate-spin rounded-full" style={{ width: '40px', height: '40px', border: '3px solid rgba(111,16,24,0.3)', borderTopColor: 'var(--red-500)' }} />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="page-enter" style={{ textAlign: 'center', padding: 'var(--space-11)' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', marginBottom: 'var(--space-4)' }}>لا توجد أسئلة في هذه المجموعة</h2>
        <Link to={`/books/${bookId}/question-sets`}><Button variant="secondary">العودة</Button></Link>
      </div>
    )
  }

  // Completion screen
  if (completed) {
    const scorePercent = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0

    return (
      <div className="page-enter flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', padding: 'var(--space-5)' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: scorePercent >= 70 ? 'rgba(34,120,69,0.3)' : 'var(--surface-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-6)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-title)', fontSize: '2.2rem', color: scorePercent >= 70 ? 'rgba(130,230,160,0.9)' : 'var(--red-500)' }}>
              {scorePercent}%
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: 'var(--space-3)' }}>
            {scorePercent >= 90 ? 'ممتاز! 🎉' : scorePercent >= 70 ? 'جيد جداً!' : scorePercent >= 50 ? 'جيد، حاول مرة أخرى' : 'تحتاج مراجعة'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            {questionSet?.name}
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-7)' }}>
            {correctCount} إجابة صحيحة من {attemptedCount}
          </p>

          <div className="flex items-center justify-center flex-wrap" style={{ gap: 'var(--space-3)' }}>
            <Button onClick={handleRestart} variant="secondary">إعادة المحاولة</Button>
            <Link to={`/books/${bookId}`}>
              <Button>العودة للكتاب</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ maxWidth: '680px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
      {/* Progress Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
          <Link to={`/books/${bookId}/question-sets`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            خروج
          </Link>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--surface-black-strong)', borderRadius: 'var(--radius-pill)' }}>
          <div
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              height: '100%',
              background: 'var(--red-600)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 400ms var(--ease-standard)',
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div
        style={{
          background: 'var(--surface-black)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-7)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.15rem',
          lineHeight: 1.8,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-6)',
        }}>
          {currentQuestion.prompt}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {currentQuestion.options && (currentQuestion.options as string[]).map((opt, i) => {
            const isSelected = currentQuestion.type === 'multiple_correct'
              ? (Array.isArray(selectedAnswer) && selectedAnswer.includes(opt))
              : selectedAnswer === opt

            let optBg = 'var(--surface-black)'
            let optColor = 'var(--text-secondary)'

            if (showResult) {
              const correctAns = currentQuestion.correct_answer
              const optIsCorrect = Array.isArray(correctAns) ? correctAns.includes(opt) : correctAns === opt
              if (optIsCorrect) {
                optBg = 'rgba(34, 120, 69, 0.35)'
                optColor = 'rgba(130, 230, 160, 0.95)'
              } else if (isSelected && !optIsCorrect) {
                optBg = 'rgba(139, 23, 32, 0.35)'
                optColor = 'var(--red-500)'
              }
            } else if (isSelected) {
              optBg = 'var(--surface-red)'
              optColor = 'var(--text-primary)'
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (showResult) return
                  if (currentQuestion.type === 'multiple_correct') {
                    const arr = Array.isArray(selectedAnswer) ? selectedAnswer : []
                    setSelectedAnswer(arr.includes(opt) ? arr.filter(a => a !== opt) : [...arr, opt])
                  } else {
                    setSelectedAnswer(opt)
                  }
                }}
                disabled={showResult}
                className="cursor-pointer text-right"
                style={{
                  background: optBg,
                  color: optColor,
                  padding: 'var(--space-4) var(--space-5)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  transition: `background var(--duration-fast) var(--ease-standard), color var(--duration-fast)`,
                  width: '100%',
                }}
              >
                {String.fromCharCode(1571 + i)}. {opt}
              </button>
            )
          })}
        </div>

        {/* Result Feedback */}
        {showResult && (
          <div
            style={{
              marginTop: 'var(--space-5)',
              padding: 'var(--space-4) var(--space-5)',
              background: isCorrect ? 'rgba(34,120,69,0.2)' : 'rgba(139,23,32,0.2)',
              borderRadius: 'var(--radius-md)',
              animation: 'pageEnter 220ms var(--ease-standard) both',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1rem',
              color: isCorrect ? 'rgba(130,230,160,0.95)' : 'var(--red-500)',
              marginBottom: currentQuestion.explanation ? 'var(--space-2)' : 0,
            }}>
              {isCorrect ? '✓ إجابة صحيحة!' : '✗ إجابة خاطئة'}
            </p>
            {currentQuestion.explanation && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end" style={{ gap: 'var(--space-3)' }}>
        {!showResult ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)}
          >
            تأكيد الإجابة
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex >= questions.length - 1 ? 'عرض النتيجة' : 'السؤال التالي'}
          </Button>
        )}
      </div>
    </div>
  )
}
