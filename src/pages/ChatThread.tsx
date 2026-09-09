import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchReply } from '../api/chat'
import { Avatar } from '../components/Avatar'
import { WhyThis } from '../components/WhyThis'
import { getContact } from '../data/cast'
import type { LoopStore } from '../hooks/useLoopStore'

type ThreadNavState = {
  fromForYou?: boolean
  elevateReason?: string
}

export function ChatThread({ store }: { store: LoopStore }) {
  const { id = '' } = useParams()
  const location = useLocation()
  const navState = (location.state ?? {}) as ThreadNavState
  const contact = getContact(id)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [why, setWhy] = useState(false)
  const [contextChip, setContextChip] = useState<string | null>(null)
  const [chipFading, setChipFading] = useState(false)

  useEffect(() => {
    if (!navState.fromForYou) return
    const label =
      navState.elevateReason?.trim() ||
      'Elevated from For You'
    const prefix =
      navState.elevateReason?.trim() &&
      !navState.elevateReason.startsWith('Elevated')
        ? `Elevated from For You · ${navState.elevateReason}`
        : label
    setContextChip(prefix)
    setChipFading(false)
    const fade = window.setTimeout(() => setChipFading(true), 2400)
    const hide = window.setTimeout(() => setContextChip(null), 3000)
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(hide)
    }
    // Only on mount / id change with this nav state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!contact) {
    return (
      <div className="page">
        <p>Unknown contact.</p>
        <Link to="/chats">Back</Link>
      </div>
    )
  }

  const msgs = store.state.threads[id] ?? []
  const scored = store.getScore(id) ?? null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setText('')
    try {
      const reply = await fetchReply(contact!, msgs, trimmed)
      store.sendMessage(id, trimmed, reply)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page thread">
      <header className="thread-head">
        <Link to="/chats" className="back">
          ←
        </Link>
        <Avatar contact={contact} size={40} />
        <div className="grow">
          <h2>{contact.name}</h2>
          <p className="muted">{contact.bio}</p>
        </div>
        <button type="button" className="act why" onClick={() => setWhy(true)}>
          Why
        </button>
      </header>

      {contextChip && (
        <div
          className={`thread-context-chip${chipFading ? ' fading' : ''}`}
          role="status"
        >
          <span>{contextChip}</span>
          <button
            type="button"
            className="chip-dismiss"
            aria-label="Dismiss"
            onClick={() => setContextChip(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="messages">
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.from}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="bubble them typing">…</div>}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${contact.name}`}
          disabled={busy}
        />
        <button type="submit" className="primary" disabled={busy || !text.trim()}>
          Send
        </button>
      </form>

      {why && <WhyThis scored={scored} onClose={() => setWhy(false)} />}
    </div>
  )
}
