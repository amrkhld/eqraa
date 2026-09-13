import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname.startsWith(path)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinks = [
    { label: 'استكشف', path: '/explore' },
    { label: 'كتبي', path: '/books' },
  ]

  return (
    <nav
      className="relative z-50"
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.78), rgba(0,0,0,0.42))',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="max-w-[1280px] mx-auto flex items-center justify-between"
        style={{ padding: 'var(--space-4) var(--space-5)' }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}
        >
          اقرأ
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center" style={{ gap: 'var(--space-7)' }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="transition-opacity"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.05rem',
                color: isActive(link.path) ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: isActive(link.path) ? 1 : 0.8,
                transition: `opacity var(--duration-fast) var(--ease-standard)`,
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Search link */}
          <Link
            to="/search"
            style={{
              color: isActive('/search') ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: `opacity var(--duration-fast) var(--ease-standard)`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </div>

        {/* Desktop Profile */}
        <div className="hidden md:flex items-center" style={{ gap: 'var(--space-4)' }}>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center cursor-pointer"
                style={{
                  gap: 'var(--space-3)',
                  background: 'var(--surface-black)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  transition: `background var(--duration-fast) var(--ease-standard)`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-black-strong)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-black)')}
              >
                <div
                  className="flex items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: 'var(--surface-red)',
                    fontFamily: 'var(--font-title)',
                  }}
                >
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span>{profile?.username || 'المستخدم'}</span>
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                  <div
                    className="absolute left-0 top-full z-50 mt-2"
                    style={{
                      background: 'rgba(18, 18, 18, 0.95)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-2)',
                      minWidth: '180px',
                      animation: 'pageEnter 180ms var(--ease-standard) both',
                    }}
                  >
                    <Link
                      to={`/profile/${profile?.username}`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="block w-full text-right"
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                        transition: `background var(--duration-fast)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-black)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      الملف الشخصي
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block w-full text-right"
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                        transition: `background var(--duration-fast)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-black)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      الإعدادات
                    </Link>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: 'var(--space-2) var(--space-3)' }} />
                    <button
                      onClick={() => { setProfileMenuOpen(false); handleSignOut() }}
                      className="block w-full text-right cursor-pointer"
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--red-500)',
                        fontFamily: 'var(--font-body)',
                        background: 'none',
                        border: 'none',
                        transition: `background var(--duration-fast)`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                background: 'rgba(111, 16, 24, 0.72)',
                color: '#fff',
                padding: 'var(--space-2) var(--space-6)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                transition: `transform var(--duration-fast) var(--ease-standard), background var(--duration-fast)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.background = 'rgba(111, 16, 24, 0.85)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'rgba(111, 16, 24, 0.72)'
              }}
            >
              تسجيل الدخول
            </Link>
          )}
        </div>

        {/* Mobile: hamburger + search */}
        <div className="flex md:hidden items-center" style={{ gap: 'var(--space-3)' }}>
          <Link to="/search" style={{ color: 'var(--text-secondary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة"
            className="cursor-pointer"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              padding: 'var(--space-1)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            background: 'rgba(9, 9, 9, 0.96)',
            padding: 'var(--space-4) var(--space-5)',
            animation: 'pageEnter 220ms var(--ease-standard) both',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block"
              style={{
                padding: 'var(--space-3) var(--space-2)',
                color: isActive(link.path) ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                borderRadius: 'var(--radius-md)',
                transition: `background var(--duration-fast)`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-black)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: 'var(--space-3) 0' }} />
          {user ? (
            <>
              <Link
                to={`/profile/${profile?.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block"
                style={{
                  padding: 'var(--space-3) var(--space-2)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.1rem',
                }}
              >
                الملف الشخصي
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignOut() }}
                className="block w-full text-right cursor-pointer"
                style={{
                  padding: 'var(--space-3) var(--space-2)',
                  color: 'var(--red-500)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.1rem',
                  background: 'none',
                  border: 'none',
                }}
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block"
              style={{
                padding: 'var(--space-3) var(--space-2)',
                color: 'var(--red-500)',
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
              }}
            >
              تسجيل الدخول
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
