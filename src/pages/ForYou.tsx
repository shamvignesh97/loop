import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ContactCard } from '../components/ContactCard'
import { WhyThis } from '../components/WhyThis'
import type { LoopStore } from '../hooks/useLoopStore'
import {
  caughtUpCount,
  isHighRelevance,
  rankingReasonChip,
  tasteOverlapTags,
} from '../ranking/reasons'
import { getContact } from '../data/cast'
import {
  cliffhangerFor,
  isCliffhangerRead,
  markCliffhangerRead,
} from '../data/cliffhangers'
import type { PersistedLoop } from '../storage/taste'

type UndoToast = {
  kind: 'more' | 'less'
  snapshot: PersistedLoop
}

export function ForYou({ store }: { store: LoopStore }) {
  const nav = useNavigate()
  const [whyId, setWhyId] = useState<string | null>(null)
  const [muteToast, setMuteToast] = useState<string | null>(null)
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null)
  const [cliffTick, setCliffTick] = useState(0)
  const toastTimer = useRef<number | null>(null)
  const pendingSnap = useRef<PersistedLoop | null>(null)

  const muted = store.state.mutedIds ?? []
  const feed = store.rankedContacts.filter(
    ({ contact }) =>
      !store.state.skippedIds.includes(contact.id) &&
      !muted.includes(contact.id),
  )

  const feedScores = useMemo(
    () => feed.map(({ scored }) => scored.score),
    [feed],
  )

  const caughtN = useMemo(() => caughtUpCount(feedScores), [feedScores])
  const showDivider = feed.length > caughtN && caughtN > 0

  const whyOverlap = whyId
    ? tasteOverlapTags(
        getContact(whyId) ?? { tags: [] },
        store.state.taste,
        store.state.selectedTags,
      )
    : []

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  const clearToastTimer = () => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current)
      toastTimer.current = null
    }
  }

  const showMuteToast = (message: string) => {
    setUndoToast(null)
    setMuteToast(message)
    clearToastTimer()
    toastTimer.current = window.setTimeout(() => setMuteToast(null), 2200)
  }

  const showUndoToast = (kind: 'more' | 'less', snapshot: PersistedLoop) => {
    setMuteToast(null)
    setUndoToast({ kind, snapshot })
    clearToastTimer()
    toastTimer.current = window.setTimeout(() => {
      setUndoToast(null)
      toastTimer.current = null
    }, 4000)
  }

  const beginFeedback = (contactId: string, kind: 'more' | 'less') => {
    pendingSnap.current = structuredClone(store.state)
    if (kind === 'more') store.moreLikeThis(contactId)
    else store.lessLikeThis(contactId)
  }

  const onFeedbackToast = (kind: 'more' | 'less' | 'mute') => {
    if (kind === 'mute') {
      pendingSnap.current = null
      showMuteToast('Got it, muted this topic')
      return
    }
    const snap = pendingSnap.current
    pendingSnap.current = null
    if (snap) showUndoToast(kind, snap)
  }

  const undoFeedback = () => {
    if (!undoToast) return
    clearToastTimer()
    store.restoreState(undoToast.snapshot)
    setUndoToast(null)
  }

  return (
    <div className="page foryou">
      <header className="page-head">
        <div>
          <h1>For You</h1>
          <p className="muted">
            Contacts scored like clips · rerank every 5 actions ·{' '}
            {store.state.taste.consumedSinceRerank}/5
          </p>
        </div>
      </header>

      <div className="card-list">
        {feed.map(({ contact, scored }, index) => {
          const reason = rankingReasonChip(scored, store.state.taste, {
            followedIds: store.state.followedIds,
            selectedTags: store.state.selectedTags,
          })
          const exploratory = showDivider && index >= caughtN
          return (
            <div key={contact.id}>
              {showDivider && index === caughtN && (
                <div className="caught-up-divider" role="separator">
                  <span className="caught-up-line" aria-hidden />
                  <p className="caught-up-copy">
                    You&apos;re caught up — older &amp; exploratory picks below
                  </p>
                  <span className="caught-up-line" aria-hidden />
                </div>
              )}
              <ContactCard
                contact={contact}
                scored={scored}
                cliffhangerText={cliffhangerFor(contact.id)}
                cliffhangerUnread={
                  // cliffTick forces re-read after mark
                  cliffTick >= 0 &&
                  Boolean(cliffhangerFor(contact.id)) &&
                  !isCliffhangerRead(contact.id)
                }
                becauseTags={tasteOverlapTags(
                  contact,
                  store.state.taste,
                  store.state.selectedTags,
                )}
                reasonChip={reason}
                highRelevance={isHighRelevance(scored, feedScores)}
                exploratory={exploratory}
                openLabel={
                  (store.state.threads[contact.id] ?? []).some((m) => m.from === 'me')
                    ? 'Open chat'
                    : 'Start chat'
                }
                onMoreLikeThis={() => beginFeedback(contact.id, 'more')}
                onLessInFeed={() => beginFeedback(contact.id, 'less')}
                onMuteTopic={() => store.notInterested(contact.id)}
                onFeedbackToast={onFeedbackToast}
                onShare={() => {
                  const invite = `${window.location.origin}${import.meta.env.BASE_URL}foryou`
                  const payload = {
                    title: `Loop · ${contact.name}`,
                    text: contact.opening,
                    url: invite,
                  }
                  if (navigator.share) {
                    store.consume(contact.id, 'share')
                    void navigator.share(payload).catch(() => {})
                  } else if (navigator.clipboard?.writeText) {
                    store.consume(contact.id, 'share_copy')
                    void navigator.clipboard.writeText(invite).catch(() => {})
                  } else {
                    store.consume(contact.id, 'share')
                  }
                }}
                onOpen={() => {
                  markCliffhangerRead(contact.id)
                  setCliffTick((n) => n + 1)
                  store.openChat(contact.id)
                  nav(`/chats/${contact.id}`, {
                    state: {
                      fromForYou: true,
                      elevateReason: reason,
                    },
                  })
                }}
                onWhy={() => setWhyId(contact.id)}
              />
            </div>
          )
        })}
        {feed.length === 0 && (
          <div className="empty-state">
            <p className="empty-title">Feed cleared</p>
            <p className="muted">
              Everyone was skipped or muted. Reset taste to refill, or browse
              People.
            </p>
            <Link to="/people" className="primary empty-cta">
              Browse People
            </Link>
          </div>
        )}
      </div>

      {undoToast && (
        <div
          className={`loop-toast undo-toast accent-${undoToast.kind}`}
          role="status"
          aria-live="polite"
        >
          <span>
            {undoToast.kind === 'more'
              ? 'Marked as more like this'
              : 'Marked as less like this'}
          </span>
          <span className="undo-sep" aria-hidden>
            ·
          </span>
          <button type="button" className="undo-btn" onClick={undoFeedback}>
            Undo
          </button>
        </div>
      )}

      {muteToast && !undoToast && (
        <div className="loop-toast" role="status" aria-live="polite">
          {muteToast}
        </div>
      )}

      {whyId && (
        <WhyThis
          contactId={whyId}
          overlapTags={whyOverlap}
          onClose={() => setWhyId(null)}
          onGoTaste={() => {
            setWhyId(null)
            nav('/taste')
          }}
        />
      )}
    </div>
  )
}
