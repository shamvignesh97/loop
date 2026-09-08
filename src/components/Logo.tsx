export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const font =
    size === 'lg' ? '2.75rem' : size === 'sm' ? '1.25rem' : '1.75rem'
  const ring =
    size === 'lg' ? 28 : size === 'sm' ? 12 : 18
  return (
    <div className="logo" style={{ fontSize: font }}>
      <span className="logo-word">
        L
        <span className="logo-oo">
          <span className="logo-ring" style={{ width: ring, height: ring }} />
          oo
        </span>
        p
      </span>
    </div>
  )
}

export function Wordmark({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div className="wordmark">
      <Logo size="lg" />
      {showTagline && <p className="tagline">Inbox, ranked.</p>}
    </div>
  )
}
