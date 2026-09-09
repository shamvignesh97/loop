import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_TAGS, CAST } from '../data/cast'
import { Avatar } from '../components/Avatar'
import type { LoopStore } from '../hooks/useLoopStore'
import { peopleOverlapBadge } from '../ranking/reasons'

export function People({ store }: { store: LoopStore }) {
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [followingOnly, setFollowingOnly] = useState(false)

  const followed = store.state.followedIds ?? []
  const muted = store.state.mutedIds ?? []

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.rankedContacts
      .filter(({ contact }) => {
        if (followingOnly && !followed.includes(contact.id)) return false
        if (tag && !contact.tags.includes(tag)) return false
        if (q && !contact.name.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        const am = muted.includes(a.contact.id) ? 1 : 0
        const bm = muted.includes(b.contact.id) ? 1 : 0
        if (am !== bm) return am - bm
        return b.scored.score - a.scored.score
      })
  }, [store.rankedContacts, query, tag, followingOnly, followed, muted])

  const usedTags = useMemo(() => {
    const set = new Set<string>()
    for (const c of CAST) for (const t of c.tags) set.add(t)
    return ALL_TAGS.filter((t) => set.has(t))
  }, [])

  return (
    <div className="page people">
      <header className="page-head">
        <div>
          <h1>People</h1>
          <p className="muted">
            Directory · {CAST.length} contacts ·{' '}
            {followed.length} following
          </p>
        </div>
      </header>

      <div className="people-search">
        <input
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search people"
        />
      </div>

      <div className="people-filters tag-picker">
        <button
          type="button"
          className={followingOnly ? 'chip on' : 'chip'}
          onClick={() => setFollowingOnly((v) => !v)}
        >
          Following
        </button>
        <button
          type="button"
          className={tag === null && !followingOnly ? 'chip on' : 'chip'}
          onClick={() => {
            setTag(null)
            setFollowingOnly(false)
          }}
        >
          All
        </button>
        {usedTags.map((t) => (
          <button
            key={t}
            type="button"
            className={tag === t ? 'chip on' : 'chip'}
            onClick={() => {
              setFollowingOnly(false)
              setTag((cur) => (cur === t ? null : t))
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="people-list">
        {rows.map(({ contact }) => {
          const isFollowed = followed.includes(contact.id)
          const isMuted = muted.includes(contact.id)
          const isLiked = store.state.likedIds.includes(contact.id)
          const badge = peopleOverlapBadge(
            contact,
            store.state.taste,
            store.state.selectedTags,
          )
          return (
            <article
              key={contact.id}
              className={`people-row${isMuted ? ' muted-row' : ''}`}
            >
              <button
                type="button"
                className="people-main"
                onClick={() => nav(`/people/${contact.id}`)}
              >
                <Avatar contact={contact} size={48} />
                <div className="card-body">
                  <div className="card-top">
                    <div className="people-title">
                      <h3 className="people-name">{contact.name}</h3>
                      {isFollowed && (
                        <span className="follow-badge">following</span>
                      )}
                      {isMuted && <span className="mute-badge">muted</span>}
                    </div>
                    <span className="persona-badge">Persona</span>
                  </div>
                  <p className="people-overlap">{badge}</p>
                  <p className="preview">{contact.bio}</p>
                  <div className="tag-row">
                    {contact.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              <div className="card-actions">
                <button
                  type="button"
                  className="act"
                  onClick={() => {
                    store.openChat(contact.id)
                    nav(`/chats/${contact.id}`)
                  }}
                >
                  Open chat
                </button>
                <button
                  type="button"
                  className={`act like${isLiked ? ' on' : ''}`}
                  onClick={() => store.consume(contact.id, 'like')}
                >
                  Like
                </button>
                <button
                  type="button"
                  className={`act follow${isFollowed ? ' on' : ''}`}
                  onClick={() => store.toggleFollow(contact.id)}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
                <button
                  type="button"
                  className={`act mute${isMuted ? ' on' : ''}`}
                  onClick={() => store.toggleMute(contact.id)}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            </article>
          )
        })}
        {rows.length === 0 && (
          <div className="empty-state">
            <p className="empty-title">No people match</p>
            <p className="muted">
              Clear filters or jump to For You to discover ranked contacts.
            </p>
            <button
              type="button"
              className="primary empty-cta"
              onClick={() => {
                setQuery('')
                setTag(null)
                setFollowingOnly(false)
                nav('/foryou')
              }}
            >
              Open For You
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
