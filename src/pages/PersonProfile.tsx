import { Link, useNavigate, useParams } from 'react-router-dom'
import { getClusterSiblings, getContact } from '../data/cast'
import { Avatar } from '../components/Avatar'
import { WhyThis } from '../components/WhyThis'
import type { LoopStore } from '../hooks/useLoopStore'
import { tasteOverlapTags } from '../ranking/reasons'
import { useState } from 'react'

export function PersonProfile({ store }: { store: LoopStore }) {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [whyOpen, setWhyOpen] = useState(false)
  const contact = getContact(id)

  if (!contact) {
    return (
      <div className="page">
        <p className="empty">
          Person not found. <Link to="/people">Back to People</Link>
        </p>
      </div>
    )
  }

  const scored = store.getScore(contact.id)
  const siblings = getClusterSiblings(contact.id)
  const followed = (store.state.followedIds ?? []).includes(contact.id)
  const muted = (store.state.mutedIds ?? []).includes(contact.id)
  const liked = store.state.likedIds.includes(contact.id)
  const thread = store.state.threads[contact.id] ?? []
  const preview = thread.length
    ? thread[thread.length - 1]?.text
    : null

  return (
    <div className="page person-profile">
      <header className="page-head person-head">
        <Link to="/people" className="back" aria-label="Back to People">
          ←
        </Link>
        <div className="grow">
          <h1>{contact.name}</h1>
          <p className="muted">{contact.bio}</p>
        </div>
      </header>

      <section className="pane person-hero">
        <Avatar contact={contact} size={88} />
        <div className="tag-row" style={{ marginTop: 14 }}>
          {contact.tags.map((t) => (
            <span key={t} className="tag on">
              {t}
            </span>
          ))}
        </div>
        {scored && (
          <p className="affinity-hint">
            Affinity {scored.score.toFixed(2)} · tag{' '}
            {scored.breakdown.tagFit.toFixed(2)} · author{' '}
            {scored.breakdown.authorFit.toFixed(2)}
          </p>
        )}
      </section>

      {siblings.length > 0 && (
        <section className="pane">
          <h3>Cluster siblings</h3>
          <div className="sibling-row">
            {siblings.map((sib) => (
              <button
                key={sib.id}
                type="button"
                className="sibling-chip"
                onClick={() => nav(`/people/${sib.id}`)}
              >
                <Avatar contact={sib} size={36} />
                <span>{sib.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="pane">
        <div className="why-inline-head">
          <h3>Why them</h3>
          <button
            type="button"
            className="act why"
            onClick={() => setWhyOpen(true)}
          >
            Full breakdown
          </button>
        </div>
        {scored ? (
          <p className="muted why-plain">
            Ranked from tag fit ({scored.breakdown.tagFit.toFixed(2)}) and
            author affinity ({scored.breakdown.authorFit.toFixed(2)})
            {followed ? ', boosted by Follow' : ''}
            {muted ? ', muted so they stay out of For You' : ''}. IG{' '}
            {scored.breakdown.ig.toFixed(2)} · X {scored.breakdown.x.toFixed(2)}.
          </p>
        ) : (
          <p className="muted">No score yet.</p>
        )}
      </section>

      <section className="pane">
        <h3>Recent thread</h3>
        {preview ? (
          <button
            type="button"
            className="thread-preview"
            onClick={() => {
              store.openChat(contact.id)
              nav(`/chats/${contact.id}`)
            }}
          >
            <p className="preview">{preview}</p>
            <span className="muted">{thread.length} messages · open chat</span>
          </button>
        ) : (
          <p className="muted">No thread yet — say hi.</p>
        )}
      </section>

      <div className="person-ctas card-actions">
        <button
          type="button"
          className="act primary-ish"
          onClick={() => {
            store.openChat(contact.id)
            nav(`/chats/${contact.id}`)
          }}
        >
          Message
        </button>
        <button
          type="button"
          className={`act like${liked ? ' on' : ''}`}
          onClick={() => store.consume(contact.id, 'like')}
        >
          Like
        </button>
        <button
          type="button"
          className={`act follow${followed ? ' on' : ''}`}
          onClick={() => store.toggleFollow(contact.id)}
        >
          {followed ? 'Following' : 'Follow'}
        </button>
        <button
          type="button"
          className={`act mute${muted ? ' on' : ''}`}
          onClick={() => store.toggleMute(contact.id)}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          className="act skip"
          onClick={() => {
            store.notInterested(contact.id)
            nav('/people')
          }}
        >
          Not interested
        </button>
      </div>

      {whyOpen && (
        <WhyThis
          contactId={contact.id}
          overlapTags={tasteOverlapTags(
            contact,
            store.state.taste,
            store.state.selectedTags,
          )}
          onClose={() => setWhyOpen(false)}
          onGoTaste={() => {
            setWhyOpen(false)
            nav('/taste')
          }}
        />
      )}
    </div>
  )
}
