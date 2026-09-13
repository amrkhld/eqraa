import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await signIn(email, password)

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setError('يرجى التحقق من بريدك الإلكتروني وتفعيل حسابك أولاً')
      } else {
        setError('بيانات الدخول غير صحيحة')
      }
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
          تسجيل الدخول
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
          أدخل بياناتك للمتابعة
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
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
            دخول
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
          ليس لديك حساب؟{' '}
          <Link
            to="/signup"
            style={{
              color: 'var(--red-500)',
              transition: `opacity var(--duration-fast)`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  )
}
