import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ContactCard } from '../components/ContactCard'
import { WhyThis } from '../components/WhyThis'
import type { LoopStore } from '../hooks/useLoopStore'
import {
  isHighRelevance,
  rankingReasonChip,
} from '../ranking/reasons'

export function ForYou({ store }: { store: LoopStore }) {
  const nav = useNavigate()
  const [whyId, setWhyId] = useState<string | null>(null)

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
        {feed.map(({ contact, scored }) => {
          const reason = rankingReasonChip(scored, store.state.taste, {
            followedIds: store.state.followedIds,
            selectedTags: store.state.selectedTags,
          })
          return (
            <ContactCard
              key={contact.id}
              contact={contact}
              scored={scored}
              reasonChip={reason}
              highRelevance={isHighRelevance(scored, feedScores)}
              onMoreLikeThis={() => store.moreLikeThis(contact.id)}
              onLessInFeed={() => store.notInterested(contact.id)}
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
                nav(`/chats/${contact.id}`, {
                  state: {
                    fromForYou: true,
                    elevateReason: reason,
                  },
                })
              }}
              onWhy={() => setWhyId(contact.id)}
            />
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

      {whyId && (
        <WhyThis scored={whyScored} onClose={() => setWhyId(null)} />
      )}
    </div>
  )
}
