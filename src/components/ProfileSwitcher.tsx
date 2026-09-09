import { useState } from 'react'
import { useAuth } from '../auth'
import type { LoopStore } from '../hooks/useLoopStore'
import { profileInitials } from '../storage/profiles'

type Props = {
  store: LoopStore
  /** Compact avatar button for the top shell */
  compact?: boolean
}

function accountLabel(auth: ReturnType<typeof useAuth>): string {
  const u = auth.user
  if (!u) return 'Signed out'
  if (u.email) return u.email
  if (u.phoneNumber) return u.phoneNumber
  if (u.isDevBypass) return 'Local dev session'
  return u.displayName
}

export function ProfileSwitcher({ store, compact }: Props) {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const label = accountLabel(auth)
  const name = auth.user?.displayName || store.activeProfileName
  const photo = auth.user?.photoURL
  const initials = profileInitials(name)

  async function onSignOut() {
    setOpen(false)
    await auth.signOut()
  }

  const avatar = photo ? (
    <img src={photo} alt="" className="profile-avatar-img" />
  ) : (
    <span className="profile-avatar" aria-hidden>
      {initials}
    </span>
  )

  if (compact) {
    return (
      <div className="profile-menu">
        <button
          type="button"
          className="profile-avatar-btn"
          aria-label={`Account: ${label}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {photo ? (
            <img src={photo} alt="" className="profile-avatar-img" />
          ) : (
            <span className="profile-avatar" aria-hidden>
              {initials}
            </span>
          )}
        </button>
        {open && (
          <>
            <button
              type="button"
              className="profile-backdrop"
              aria-label="Close profile menu"
              onClick={() => setOpen(false)}
            />
            <div className="profile-dropdown" role="menu">
              <p className="profile-signed">
                Signed in as <strong>{name}</strong>
              </p>
              <p className="muted profile-hint">{label}</p>
              <p className="muted profile-hint">
                Taste key{' '}
                <code>loop-chat-v2:uid:&lt;uid&gt;</code>
                {auth.user && !auth.user.isDevBypass
                  ? ' · synced when Firestore is available'
                  : ''}
              </p>
              <button
                type="button"
                className="ghost wide"
                role="menuitem"
                onClick={() => void onSignOut()}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <section className="pane profile-pane">
      <h3>Account</h3>
      <div className="profile-account-row">
        {avatar}
        <div>
          <p className="profile-signed" style={{ margin: 0 }}>
            <strong>{name}</strong>
          </p>
          <p className="muted profile-hint" style={{ margin: '4px 0 0' }}>
            {label}
          </p>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        Identity is your Google or phone account. Taste / follows are stored
        under <code>loop-chat-v2:uid:&lt;firebaseUid&gt;</code>
        {auth.user && !auth.user.isDevBypass
          ? ' and optionally synced to Firestore for multi-device.'
          : '.'}
      </p>
      <button type="button" className="ghost wide" onClick={() => void onSignOut()}>
        Sign out
      </button>
    </section>
  )
}
