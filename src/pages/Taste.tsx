import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AUTHOR_CLUSTERS } from '../ranking/types'
import type { LoopStore } from '../hooks/useLoopStore'
import { ALL_TAGS, getContact } from '../data/cast'
import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { tasteStorageKey } from '../storage/profiles'
import { recentlyAdjustedLines } from '../ranking/reasons'

const MIN_TAGS = 3
const MAX_TAGS = 5

export function Taste({ store }: { store: LoopStore }) {
  const { taste, selectedTags, likedIds, skippedIds, mutedIds } = store.state
  const muted = mutedIds ?? []
  const tagEntries = Object.entries(taste.tags).sort((a, b) => b[1] - a[1])
  const authorEntries = Object.entries(taste.authors).sort((a, b) => b[1] - a[1])
  const keyHint = tasteStorageKey(store.activeProfileId)
  const [editing, setEditing] = useState(false)
  const [draftTags, setDraftTags] = useState<string[]>(selectedTags)

  const interestChips = useMemo(() => {
    const fromSelected = selectedTags
    const boosted = Object.entries(taste.tags)
      .filter(([t, v]) => v >= 0.45 && !fromSelected.includes(t))
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 4)
    return [...fromSelected, ...boosted]
  }, [selectedTags, taste.tags])

  const adjusted = useMemo(
    () =>
      recentlyAdjustedLines({
        taste,
        likedIds,
        mutedIds: muted,
      }),
    [taste, likedIds, muted],
  )

  const startEdit = () => {
    setDraftTags(selectedTags)
    setEditing(true)
  }

  const toggleDraft = (tag: string) => {
    setDraftTags((prev) => {
      if (prev.includes(tag)) {
        if (prev.length <= MIN_TAGS) return prev
        return prev.filter((t) => t !== tag)
      }
      if (prev.length >= MAX_TAGS) return prev
      return [...prev, tag]
    })
  }

  const saveInterests = () => {
    if (draftTags.length < MIN_TAGS) return
    store.updateSelectedTags(draftTags)
    setEditing(false)
  }

  return (
    <div className="page taste">
      <header className="page-head">
        <div>
          <h1>Taste</h1>
          <p className="muted">
            Signed in as {store.activeProfileName} · {keyHint}
          </p>
        </div>
        <button type="button" className="ghost" onClick={store.resetAll}>
          Reset
        </button>
      </header>

      <ProfileSwitcher store={store} />

      <section className="pane taste-snapshot" aria-label="Your Loop taste">
        <h3>Your Loop taste</h3>
        <p className="muted snapshot-label">You enjoy</p>
        <div className="tag-row">
          {interestChips.length === 0 && (
            <span className="muted">Pick interests to calibrate Loop</span>
          )}
          {interestChips.map((t) => (
            <span key={t} className="tag on">
              {t}
            </span>
          ))}
        </div>

        {adjusted.length > 0 && (
          <>
            <p className="muted snapshot-label" style={{ marginTop: 14 }}>
              Recently adjusted
            </p>
            <ul className="recent-adjusted">
              {adjusted.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}

        {!editing ? (
          <button type="button" className="ghost snapshot-edit" onClick={startEdit}>
            Edit interests
          </button>
        ) : (
          <div className="snapshot-editor">
            <p className="muted">
              Pick {MIN_TAGS}–{MAX_TAGS} tags ({draftTags.length}/{MAX_TAGS})
            </p>
            <div className="tag-picker">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={draftTags.includes(tag) ? 'chip on' : 'chip'}
                  onClick={() => toggleDraft(tag)}
                  disabled={
                    !draftTags.includes(tag) && draftTags.length >= MAX_TAGS
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="snapshot-edit-actions">
              <button
                type="button"
                className="primary"
                disabled={draftTags.length < MIN_TAGS}
                onClick={saveInterests}
              >
                Save interests
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {taste.sessionActions === 0 && (
        <div className="empty-state pane-empty">
          <p className="empty-title">Taste is still cold</p>
          <p className="muted">
            Like, follow, or chat from For You to shape affinities.
          </p>
          <Link to="/foryou" className="primary empty-cta">
            Shape from For You
          </Link>
        </div>
      )}

      <section className="pane">
        <h3>Seed tags</h3>
        <div className="tag-row">
          {selectedTags.map((t) => (
            <span key={t} className="tag on">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="pane">
        <h3>Tag affinities</h3>
        <ul className="affinity-list">
          {(tagEntries.length ? tagEntries : ALL_TAGS.map((t) => [t, 0] as const)).map(
            ([tag, v]) => (
              <li key={tag}>
                <span>{tag}</span>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      width: `${Math.min(100, Math.abs(Number(v)) * 40)}%`,
                      opacity: Number(v) < 0 ? 0.4 : 1,
                    }}
                  />
                </div>
                <strong>{Number(v).toFixed(2)}</strong>
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="pane">
        <h3>Author affinities</h3>
        <ul className="affinity-list">
          {authorEntries.length === 0 && (
            <li className="muted">Like or reply to shape authors.</li>
          )}
          {authorEntries.map(([id, v]) => (
            <li key={id}>
              <span>{id}</span>
              <div className="bar-track">
                <div
                  className="bar"
                  style={{ width: `${Math.min(100, Math.abs(v) * 40)}%` }}
                />
              </div>
              <strong>{v.toFixed(2)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="pane">
        <h3>Boredom window</h3>
        <p className="muted">Recent authors</p>
        <div className="tag-row">
          {taste.recentAuthors.length === 0 && (
            <span className="muted">empty</span>
          )}
          {taste.recentAuthors.map((a, i) => (
            <span key={`${a}-${i}`} className="tag">
              {a}
            </span>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          Recent tags
        </p>
        <div className="tag-row">
          {taste.recentTags.length === 0 && <span className="muted">empty</span>}
          {taste.recentTags.map((t, i) => (
            <span key={`${t}-${i}`} className="tag">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="pane">
        <h3>Session</h3>
        <p>
          actions {taste.sessionActions} · since rerank{' '}
          {taste.consumedSinceRerank}/5 · fatigue{' '}
          {(-Math.min(1.2, taste.sessionActions * 0.035)).toFixed(3)}
        </p>
        <p className="muted">
          liked {likedIds.length} · skipped {skippedIds.length}
        </p>
      </section>

      <section className="pane">
        <h3>Author clusters</h3>
        <ul className="cluster-list">
          {AUTHOR_CLUSTERS.map((c) => (
            <li key={c.join('+')}>{c.join(' + ')}</li>
          ))}
        </ul>
      </section>

      {muted.length > 0 && (
        <section className="pane muted-section">
          <h3>Muted</h3>
          <div className="tag-row muted-chip-row">
            {muted.map((id) => {
              const contact = getContact(id)
              const label = contact?.name ?? id
              return (
                <button
                  key={id}
                  type="button"
                  className="tag muted-chip"
                  onClick={() => store.toggleMute(id)}
                  aria-label={`Unmute ${label}`}
                  title={`Unmute ${label}`}
                >
                  <span>{label}</span>
                  <span className="muted-chip-x" aria-hidden>
                    ×
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
