import type { Contact, ScoredCandidate } from '../ranking/types'
import { Avatar } from './Avatar'

export function ContactCard({
  contact,
  scored,
  preview,
  onSkip,
  onLike,
  onShare,
  onOpen,
  onWhy,
}: {
  contact: Contact
  scored: ScoredCandidate
  preview?: string
  onSkip?: () => void
  onLike?: () => void
  onShare?: () => void
  onOpen?: () => void
  onWhy?: () => void
}) {
  return (
    <article className="contact-card">
      <button className="card-main" onClick={onOpen} type="button">
        <Avatar contact={contact} size={52} />
        <div className="card-body">
          <div className="card-top">
            <h3>{contact.name}</h3>
            <span className="score-pill" title="Rank score">
              {scored.score.toFixed(2)}
            </span>
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
