import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchReply } from '../api/chat'
import { Avatar } from '../components/Avatar'
import { WhyThis } from '../components/WhyThis'
import { getContact } from '../data/cast'
import { startersForContact } from '../data/starters'
import type { LoopStore } from '../hooks/useLoopStore'

const DISCLOSURE_KEY = 'loop-persona-disclosure-seen'

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
  const [showDisclosure, setShowDisclosure] = useState(() => {
    try {
      return localStorage.getItem(DISCLOSURE_KEY) !== '1'
    } catch {
      return true
    }
  })

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
  const hasUserMessage = msgs.some((m) => m.from === 'me')
  const isFresh = !hasUserMessage
  const starters = isFresh ? startersForContact(contact) : []

  async function sendUserText(trimmed: string) {
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await sendUserText(text.trim())
  }

  function dismissDisclosure() {
    try {
      localStorage.setItem(DISCLOSURE_KEY, '1')
    } catch {
      /* ignore */
    }
    setShowDisclosure(false)
  }

  return (
    <div className="page thread">
      <header className="thread-head">
        <Link to="/chats" className="back">
          ←
        </Link>
        <Avatar contact={contact} size={40} />
        <div className="grow">
          <div className="thread-name-row">
            <h2>{contact.name}</h2>
            <span className="persona-badge">Persona</span>
          </div>
          <p className="muted">{contact.bio}</p>
        </div>
        <button type="button" className="act why" onClick={() => setWhy(true)}>
          Why
        </button>
      </header>

      {showDisclosure && (
        <div className="persona-disclosure" role="status">
          <p>
            {contact.name} is an AI persona, not a real person.
          </p>
          <button type="button" className="disclosure-got-it" onClick={dismissDisclosure}>
            Got it
          </button>
        </div>
      )}

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
        {isFresh && (
          <div className="persona-intro">
            <div className="persona-intro-meta">
              <Avatar contact={contact} size={36} />
              <div>
                <div className="persona-intro-name">
                  {contact.name}
                  <span className="persona-badge">Persona</span>
                </div>
                <p className="persona-intro-bio">{contact.bio}</p>
              </div>
            </div>
            <div className="bubble them intro">{contact.opening}</div>
          </div>
        )}

        {msgs.map((m) => {
          // Avoid duplicating the auto-seeded opening while intro card is shown
          if (
            isFresh &&
            m.from === 'them' &&
            m.text === contact.opening &&
            (m.id === `${id}-open` || msgs.indexOf(m) === 0)
          ) {
            return null
          }
          return (
            <div key={m.id} className={`bubble ${m.from}`}>
              {m.text}
            </div>
          )
        })}
        {busy && <div className="bubble them typing">…</div>}

        {isFresh && starters.length > 0 && !busy && (
          <div className="starter-pills" aria-label="Conversation starters">
            <p className="starter-label">Start a conversation</p>
            <div className="starter-row">
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="starter-pill"
                  disabled={busy}
                  onClick={() => void sendUserText(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Reply to ${contact.name}…`}
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
