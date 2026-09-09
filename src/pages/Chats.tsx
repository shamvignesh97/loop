import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import type { LoopStore } from '../hooks/useLoopStore'

export function Chats({ store }: { store: LoopStore }) {
  const nav = useNavigate()

  const threads = store.rankedContacts.filter(
    ({ contact }) => store.state.threads[contact.id]?.length,
  )

  return (
    <div className="page chats">
      <header className="page-head">
        <div>
          <h1>Chats</h1>
          <p className="muted">Ranked inbox · reorders as taste moves</p>
        </div>
      </header>

      <div className="inbox-list">
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
                <div>
                  <div className="card-top">
                    <h3>{contact.name}</h3>
                  </div>
                  <p className="preview">{last?.text ?? contact.opening}</p>
                </div>
              </button>
            </div>
          )
        })}
        {threads.length === 0 && (
          <p className="empty">
            No threads yet.{' '}
            <Link to="/foryou">Open someone from For You</Link>.
          </p>
        )}
      </div>
    </div>
  )
}
