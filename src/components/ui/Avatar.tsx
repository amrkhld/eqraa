interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizes: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
}

export function Avatar({ src, alt, fallback, size = 'md' }: AvatarProps) {
  const px = sizes[size]
  const fontSize = px * 0.4

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'صورة المستخدم'}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: 'var(--surface-red)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-title)',
        fontSize,
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}
    >
      {fallback?.[0]?.toUpperCase() || '?'}
    </div>
  )
}
