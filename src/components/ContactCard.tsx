import { useEffect, useRef, useState } from 'react'
import type { Contact, ScoredCandidate } from '../ranking/types'
import { Avatar } from './Avatar'

type ChipAction = 'more' | 'less' | 'mute'

export function ContactCard({
  contact,
  scored,
  preview,
  reasonChip,
  highRelevance,
  exploratory,
  onSkip,
  onLike,
  onShare,
  onOpen,
  onWhy,
  onMoreLikeThis,
  onLessInFeed,
  onMuteTopic,
  onFeedbackToast,
}: {
  contact: Contact
  scored: ScoredCandidate
  preview?: string
  reasonChip?: string
  highRelevance?: boolean
  exploratory?: boolean
  onSkip?: () => void
  onLike?: () => void
  onShare?: () => void
  onOpen?: () => void
  onWhy?: () => void
  onMoreLikeThis?: () => void
  onLessInFeed?: () => void
  onMuteTopic?: () => void
  onFeedbackToast?: (kind: 'more' | 'less' | 'mute') => void
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState<'more' | 'less' | null>(null)
  const [chipOpen, setChipOpen] = useState(false)
  const [chipDone, setChipDone] = useState<ChipAction | null>(null)
  const startRef = useRef<{ x: number; y: number; axis: 'h' | 'v' | null } | null>(
    null,
  )
  const flashTimer = useRef<number | null>(null)
  const suppressOpen = useRef(false)

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  const triggerFlash = (kind: 'more' | 'less') => {
    setFlash(kind)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 420)
  }

  const runMore = () => {
    onMoreLikeThis?.()
    triggerFlash('more')
    setChipDone('more')
    onFeedbackToast?.('more')
  }

  const runLess = () => {
    onLessInFeed?.()
    triggerFlash('less')
    setChipDone('less')
    onFeedbackToast?.('less')
  }

  const runMute = () => {
    onMuteTopic?.()
    setChipDone('mute')
    onFeedbackToast?.('mute')
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (!onMoreLikeThis && !onLessInFeed) return
    const point = e.touches[0]
    if (!point) return
    startRef.current = { x: point.clientX, y: point.clientY, axis: null }
    setDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const start = startRef.current
    if (!start || !dragging) return
    const point = e.touches[0]
    if (!point) return
    const dx = point.clientX - start.x
    const dy = point.clientY - start.y
    if (!start.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      start.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      startRef.current = start
    }
    if (start.axis === 'v') return
    setOffsetX(Math.max(-120, Math.min(120, dx)))
  }

  const onTouchEnd = () => {
    const start = startRef.current
    startRef.current = null
    setDragging(false)
    if (!start || start.axis !== 'h') {
      setOffsetX(0)
      return
    }
    const dx = offsetX
    setOffsetX(0)
    if (Math.abs(dx) > 72) {
      suppressOpen.current = true
      window.setTimeout(() => {
        suppressOpen.current = false
      }, 280)
    }
    if (dx > 72) runMore()
    else if (dx < -72) runLess()
  }

  const openCard = () => {
    if (suppressOpen.current) return
    onOpen?.()
  }

  const classes = [
    'contact-card',
    highRelevance ? 'high-relevance' : '',
    exploratory ? 'exploratory' : '',
    flash === 'more' ? 'flash-more' : '',
    flash === 'less' ? 'flash-less' : '',
    dragging && Math.abs(offsetX) > 8 ? 'swiping' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={classes}
      style={
        offsetX
          ? { transform: `translateX(${offsetX}px)`, transition: 'none' }
          : undefined
      }
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {flash && (
        <div
          className={`swipe-flash ${flash === 'more' ? 'ok' : 'nope'}`}
          aria-hidden
        >
          {flash === 'more' ? '✓' : '✕'}
        </div>
      )}

      <div
        className="card-main"
        role="button"
        tabIndex={0}
        onClick={openCard}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openCard()
          }
        }}
      >
        <Avatar contact={contact} size={52} />
        <div className="card-body">
          <div className="card-top">
            <h3>{contact.name}</h3>
            {reasonChip && (
              <button
                type="button"
                className={`reason-chip${chipDone ? ' chip-done' : ''}${chipOpen ? ' chip-open' : ''}`}
                title="Why in your feed — tap for options"
                aria-expanded={chipOpen}
                onClick={(e) => {
                  e.stopPropagation()
                  setChipOpen((v) => !v)
                }}
              >
                {chipDone ? '✓ ' : ''}
                {reasonChip}
              </button>
            )}
          </div>
          <p className="preview">{preview ?? contact.opening}</p>
          <div className="tag-row">
            {contact.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            {scored.explored && <span className="tag explore">explore</span>}
          </div>
        </div>
      </div>

      {chipOpen && reasonChip && (
        <div className="chip-sheet" role="menu" aria-label="Reason actions">
          <button
            type="button"
            className="chip-sheet-row"
            role="menuitem"
            onClick={() => {
              runMore()
              setChipOpen(false)
            }}
          >
            More like this
          </button>
          <button
            type="button"
            className="chip-sheet-row"
            role="menuitem"
            onClick={() => {
              runLess()
              setChipOpen(false)
            }}
          >
            Less like this
          </button>
          <button
            type="button"
            className="chip-sheet-row mute"
            role="menuitem"
            onClick={() => {
              runMute()
              setChipOpen(false)
            }}
          >
            Mute this topic
          </button>
        </div>
      )}

      <div className="card-actions">
        {onMoreLikeThis && (
          <button
            type="button"
            className="act more-like"
            onClick={() => runMore()}
          >
            More like this
          </button>
        )}
        {onLessInFeed && (
          <button
            type="button"
            className="act less-feed"
            onClick={() => runLess()}
          >
            Less in feed
          </button>
        )}
        {onSkip && (
          <button type="button" className="act skip" onClick={onSkip}>
            Skip
          </button>
        )}
        {onLike && (
          <button type="button" className="act like" onClick={onLike}>
            Like
          </button>
        )}
        {onShare && (
          <button type="button" className="act share" onClick={onShare}>
            Share
          </button>
        )}
        {onWhy && (
          <button type="button" className="act why" onClick={onWhy}>
            Why
          </button>
        )}
      </div>
    </article>
  )
}
