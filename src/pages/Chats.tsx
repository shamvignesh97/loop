import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import type { LoopStore } from '../hooks/useLoopStore'

export function Chats({ store }: { store: LoopStore }) {
  const nav = useNavigate()

  const threads = store.rankedContacts.filter(
    ({ contact }) => store.state.threads[contact.id]?.length,
  )

  const continueItem = (() => {
    if (threads.length === 0) return null
    let best: (typeof threads)[0] | null = null
    let bestAt = -1
    for (const row of threads) {
      const msgs = store.state.threads[row.contact.id] ?? []
      const last = msgs[msgs.length - 1]
      const at = last?.at ?? 0
      if (at >= bestAt) {
        bestAt = at
        best = row
      }
    }
    return best
  })()

  const continueMsgs = continueItem
    ? store.state.threads[continueItem.contact.id] ?? []
    : []
  const continueLast = continueMsgs[continueMsgs.length - 1]

  return (
    <div className="page chats">
      <header className="page-head">
        <div>
          <h1>Chats</h1>
          <p className="muted">Ranked inbox · reorders as taste moves</p>
        </div>
      </header>

      {continueItem && (
        <section className="continue-card" aria-label="Continue a conversation">
          <p className="continue-eyebrow">Continue a conversation</p>
          <div className="continue-body">
            <Avatar contact={continueItem.contact} size={48} />
            <div className="card-body">
              <div className="card-top">
                <h3 className="inbox-name">{continueItem.contact.name}</h3>
                <span className="persona-badge">Persona</span>
              </div>
              <p className="preview">
                {continueLast?.text ?? continueItem.contact.opening}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="primary continue-cta"
            onClick={() => {
              store.openChat(continueItem.contact.id)
              nav(`/chats/${continueItem.contact.id}`)
            }}
          >
            Continue
          </button>
        </section>
      )}

      <div className="inbox-list">
        {threads.length > 0 && (
          <h2 className="chats-section-label">All chats</h2>
        )}
        {threads.map(({ contact }) => {
          const msgs = store.state.threads[contact.id] ?? []
          const last = msgs[msgs.length - 1]
          return (
            <div key={contact.id} className="inbox-row">
              <button
                type="button"
                className="inbox-main"
                onClick={() => {
                  store.openChat(contact.id)
                  nav(`/chats/${contact.id}`)
                }}
              >
                <Avatar contact={contact} size={48} />
                <div className="card-body">
                  <div className="card-top">
                    <h3 className="inbox-name">{contact.name}</h3>
                    <span className="persona-badge">Persona</span>
                  </div>
                  <p className="preview">{last?.text ?? contact.opening}</p>
                </div>
              </button>
            </div>
          )
        })}
        {threads.length === 0 && (
          <div className="empty-state">
            <p className="empty-title">No chats yet</p>
            <p className="muted">
              Open someone from For You to start a ranked thread.
            </p>
            <Link to="/foryou" className="primary empty-cta">
              Open For You
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
