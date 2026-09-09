import { useState } from 'react'
import type { LoopStore } from '../hooks/useLoopStore'
import { profileInitials } from '../storage/profiles'

type Props = {
  store: LoopStore
  /** Compact avatar button for the top shell */
  compact?: boolean
}

export function ProfileSwitcher({ store, compact }: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const initials = profileInitials(store.activeProfileName)

  function submitCreate() {
    const n = name.trim()
    if (!n) return
    store.addProfile(n)
    setName('')
    setCreating(false)
    setOpen(false)
  }

  if (compact) {
    return (
      <div className="profile-menu">
        <button
          type="button"
          className="profile-avatar-btn"
          aria-label={`Signed in locally as ${store.activeProfileName}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="profile-avatar" aria-hidden>
            {initials}
          </span>
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
                Signed in locally as <strong>{store.activeProfileName}</strong>
              </p>
              <p className="muted profile-hint">
                On-device only — other visitors keep their own browser storage.
              </p>
              <ul className="profile-list">
                {store.profiles.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={
                        p.id === store.activeProfileId
                          ? 'profile-item active'
                          : 'profile-item'
                      }
                      role="menuitem"
                      onClick={() => {
                        store.switchProfile(p.id)
                        setOpen(false)
                      }}
                    >
                      <span className="profile-avatar sm" aria-hidden>
                        {profileInitials(p.name)}
                      </span>
                      <span>{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {creating ? (
                <div className="profile-create">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Display name"
                    maxLength={32}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCreate()
                      if (e.key === 'Escape') setCreating(false)
                    }}
                  />
                  <button type="button" className="primary" onClick={submitCreate}>
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="ghost wide"
                  onClick={() => setCreating(true)}
                >
                  New profile
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <section className="pane profile-pane">
      <h3>Local profiles</h3>
      <p className="muted">
        Signed in locally as <strong>{store.activeProfileName}</strong>. Taste
        is stored in this browser under{' '}
        <code>loop-chat-v2:&lt;profileId&gt;</code> — not on a shared server.
        Many people can use the same live URL; each device (and profile) stays
        independent.
      </p>
      <ul className="profile-list roomy">
        {store.profiles.map((p) => (
          <li key={p.id} className="profile-row">
            <button
              type="button"
              className={
                p.id === store.activeProfileId
                  ? 'profile-item active'
                  : 'profile-item'
              }
              onClick={() => store.switchProfile(p.id)}
            >
              <span className="profile-avatar sm" aria-hidden>
                {profileInitials(p.name)}
              </span>
              <span>{p.name}</span>
              {p.id === store.activeProfileId && (
                <span className="profile-badge">active</span>
              )}
            </button>
            {store.profiles.length > 1 && (
              <button
                type="button"
                className="ghost profile-delete"
                aria-label={`Delete ${p.name}`}
                onClick={() => store.removeProfile(p.id)}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="profile-create">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New display name"
          maxLength={32}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitCreate()
          }}
        />
        <button type="button" className="primary" onClick={submitCreate}>
          Create profile
        </button>
      </div>
    </section>
  )
}
