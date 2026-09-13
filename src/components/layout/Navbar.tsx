import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

type NavItem = {
  label: string
  path: string
  icon: 'compass' | 'books' | 'search'
}

const navItems: NavItem[] = [
  { label: 'استكشف', path: '/explore', icon: 'compass' },
  { label: 'كتبي', path: '/books', icon: 'books' },
  { label: 'البحث', path: '/search', icon: 'search' },
]

function NavIcon({ name }: { name: NavItem['icon'] }) {
  if (name === 'compass') return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m15.2 8.8-2.1 4.3-4.3 2.1 2.1-4.3 4.3-2.1Z" /></svg>
  if (name === 'books') return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h4a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H6a2.5 2.5 0 0 0-2.5 2v-14.5Z" /><path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-4a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h4a2.5 2.5 0 0 1 2.5 2v-14.5Z" /></svg>
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
}

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path || (path !== '/search' && location.pathname.startsWith(`${path}/`))
  const closeMenu = () => setMobileMenuOpen(false)
  const handleSignOut = async () => {
    closeMenu()
    await signOut()
    navigate('/login')
  }

  const navigation = (mobile = false) => (
    <div className={mobile ? 'mobile-nav-links' : 'sidebar-nav-links'}>
      {navItems.map((item) => (
        <Link key={item.path} to={item.path} onClick={mobile ? closeMenu : undefined} className={`navigation-link${isActive(item.path) ? ' is-active' : ''}`} aria-current={isActive(item.path) ? 'page' : undefined}>
          <span className="navigation-icon"><NavIcon name={item.icon} /></span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )

  const profileArea = (mobile = false) => (
    <div className={mobile ? 'mobile-profile-area' : 'sidebar-profile-area'}>
      {user ? (
        <>
          <Link to={`/profile/${profile?.username}`} onClick={mobile ? closeMenu : undefined} className="profile-link">
            <span className="profile-avatar">{profile?.username?.[0]?.toUpperCase() || 'م'}</span>
            <span className="profile-copy"><strong>{profile?.username || 'المستخدم'}</strong><small>الملف الشخصي</small></span>
          </Link>
          <button type="button" onClick={handleSignOut} className="sidebar-sign-out">تسجيل الخروج</button>
        </>
      ) : <Link to="/login" onClick={mobile ? closeMenu : undefined} className="sidebar-login">تسجيل الدخول</Link>}
    </div>
  )

  return (
    <>
      <aside className="app-sidebar" aria-label="التنقل الرئيسي">
        <Link to="/explore" className="app-wordmark">اقرأ<span>.</span></Link>
        {navigation()}
        {profileArea()}
      </aside>

      <header className="mobile-header">
        <Link to="/explore" className="app-wordmark">اقرأ<span>.</span></Link>
        <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="mobile-menu-button" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}><span /><span /><span /></button>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu-layer">
          <button type="button" className="mobile-menu-backdrop" aria-label="إغلاق القائمة" onClick={closeMenu} />
          <aside id="mobile-navigation" className="mobile-drawer" aria-label="التنقل الرئيسي">
            <div className="mobile-drawer-header"><span>التنقل</span><button type="button" onClick={closeMenu} aria-label="إغلاق القائمة">×</button></div>
            {navigation(true)}
            {profileArea(true)}
          </aside>
        </div>
      )}
    </>
  )
}
