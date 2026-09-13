import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import type { Profile } from '@/types'

export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [stats, setStats] = useState({ books: 0, sets: 0 })

  const isOwnProfile = myProfile?.username === username

  useEffect(() => {
    async function fetch() {
      if (!username) return
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()

        if (profileData) {
          setProfile(profileData)

          // Get stats
          const [booksRes, setsRes] = await Promise.all([
            supabase.from('books').select('id', { count: 'exact', head: true }).eq('owner_id', profileData.id),
            supabase.from('question_sets').select('id', { count: 'exact', head: true }).eq('creator_id', profileData.id),
          ])
          setStats({
            books: booksRes.count || 0,
            sets: setsRes.count || 0,
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [username])

  if (loading) {
    return (
      <div className="page-enter" style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
        <div className="flex items-center" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-7)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-black)' }} />
          <div>
            <div style={{ width: '150px', height: '24px', background: 'var(--surface-black)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }} />
            <div style={{ width: '100px', height: '16px', background: 'var(--surface-black)', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-enter" style={{ textAlign: 'center', padding: 'var(--space-11)' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem' }}>المستخدم غير موجود</h2>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-7) var(--space-5)' }}>
      {/* Profile Header */}
      <div className="flex items-center" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-7)' }}>
        <Avatar src={profile.avatar_url} fallback={profile.username} size="xl" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', marginBottom: 'var(--space-1)' }}>
            {profile.username}
          </h1>
          {profile.bio && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
              {profile.bio}
            </p>
          )}
          {isOwnProfile && (
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)} style={{ marginTop: 'var(--space-3)' }}>
              تعديل الملف الشخصي
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-7)' }}>
        <div
          style={{
            flex: 1,
            background: 'var(--surface-black)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>{stats.books}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>كتاب</p>
        </div>
        <div
          style={{
            flex: 1,
            background: 'var(--surface-black)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>{stats.sets}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>مجموعة أسئلة</p>
        </div>
      </div>

      {/* Edit Modal */}
      {isOwnProfile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSave={async (updates) => {
            try {
              await supabase.from('profiles').update(updates).eq('id', profile.id)
              setProfile({ ...profile, ...updates })
              await refreshProfile()
              setEditOpen(false)
            } catch (err) {
              console.error(err)
            }
          }}
        />
      )}
    </div>
  )
}

function EditProfileModal({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean
  onClose: () => void
  profile: Profile
  onSave: (updates: Partial<Profile>) => void
}) {
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio || '')

  return (
    <Modal open={open} onClose={onClose} title="تعديل الملف الشخصي" maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Input label="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Textarea label="النبذة" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب شيئاً عن نفسك..." style={{ minHeight: '80px' }} />
        <div className="flex items-center justify-end" style={{ gap: 'var(--space-3)' }}>
          <Button onClick={() => onSave({ username, bio: bio || null })} disabled={!username.trim()}>حفظ</Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </Modal>
  )
}
