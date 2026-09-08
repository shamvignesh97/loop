import { useNavigate } from 'react-router-dom'
import { ContactCard } from '../components/ContactCard'
import { WhyThis } from '../components/WhyThis'
import type { LoopStore } from '../hooks/useLoopStore'
import { useState } from 'react'

export function ForYou({ store }: { store: LoopStore }) {
  const nav = useNavigate()
  const [whyId, setWhyId] = useState<string | null>(null)

  const feed = store.rankedContacts.filter(
    ({ contact }) => !store.state.skippedIds.includes(contact.id),
  )

  const whyScored = whyId ? store.getScore(whyId) ?? null : null

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
        {feed.map(({ contact, scored }) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            scored={scored}
            onSkip={() => store.consume(contact.id, 'skip')}
            onLike={() => store.consume(contact.id, 'like')}
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
              store.openChat(contact.id)
              nav(`/chats/${contact.id}`)
            }}
            onWhy={() => setWhyId(contact.id)}
          />
        ))}
        {feed.length === 0 && (
          <p className="empty">Everyone skipped. Reset taste to refill.</p>
        )}
      </div>

      {whyId && (
        <WhyThis scored={whyScored} onClose={() => setWhyId(null)} />
      )}
    </div>
  )
}
