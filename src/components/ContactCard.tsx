import type { Contact, ScoredCandidate } from '../ranking/types'
import { Avatar } from './Avatar'

export function ContactCard({
  contact,
  scored,
  preview,
  reasonChip,
  highRelevance,
  onSkip,
  onLike,
  onShare,
  onOpen,
  onWhy,
  onMoreLikeThis,
  onLessInFeed,
}: {
  contact: Contact
  scored: ScoredCandidate
  preview?: string
  reasonChip?: string
  highRelevance?: boolean
  onSkip?: () => void
  onLike?: () => void
  onShare?: () => void
  onOpen?: () => void
  onWhy?: () => void
  onMoreLikeThis?: () => void
  onLessInFeed?: () => void
}) {
  return (
    <article
      className={`contact-card${highRelevance ? ' high-relevance' : ''}`}
    >
      <button className="card-main" onClick={onOpen} type="button">
        <Avatar contact={contact} size={52} />
        <div className="card-body">
          <div className="card-top">
            <h3>{contact.name}</h3>
            {reasonChip && (
              <span className="reason-chip" title="Why in your feed">
                {reasonChip}
              </span>
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
      </button>
      <div className="card-actions">
        {onMoreLikeThis && (
          <button
            type="button"
            className="act more-like"
            onClick={onMoreLikeThis}
          >
            More like this
          </button>
        )}
        {onLessInFeed && (
          <button
            type="button"
            className="act less-feed"
            onClick={onLessInFeed}
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
