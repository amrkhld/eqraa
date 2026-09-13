import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
      return
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)
    const { data, error: authError } = await signUp(email, password, username)

    if (authError) {
      setError(authError.message || 'حدث خطأ أثناء إنشاء الحساب')
      setLoading(false)
    } else if (data?.session === null) {
      setError('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب (قد تحتاج إلى التحقق من مجلد الرسائل المزعجة).')
      setLoading(false)
    } else {
      navigate('/books')
    }
  }

  return (
    <div
      className="page-enter flex items-center justify-center"
      style={{ minHeight: 'calc(100vh - 64px)', padding: 'var(--space-5)' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--surface-black)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8) var(--space-7)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.8rem',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: 'var(--space-2)',
          }}
        >
          إنشاء حساب
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: 'var(--space-7)',
            fontSize: '0.95rem',
          }}
        >
          أنشئ حسابك الجديد في اقرأ
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <Input
            label="اسم المستخدم"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
            required
            autoComplete="username"
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
            style={{ direction: 'ltr', textAlign: 'right' }}
          />

          <PasswordInput
            label="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 أحرف على الأقل"
            required
            autoComplete="new-password"
          />

          {error && (
            <p
              style={{
                color: 'var(--red-500)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                textAlign: 'center',
                background: 'var(--surface-red)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            إنشاء حساب
          </Button>
        </form>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 'var(--space-6)',
            fontSize: '0.92rem',
          }}
        >
          لديك حساب بالفعل؟{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--red-500)',
              transition: `opacity var(--duration-fast)`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
