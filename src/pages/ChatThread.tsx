import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchReply } from '../api/chat'
import { Avatar } from '../components/Avatar'
import { MemoryHeaderChip } from '../components/chat/MemoryHeaderChip'
import { MemorySheet } from '../components/chat/MemorySheet'
import { WhyThis } from '../components/WhyThis'
import { getContact } from '../data/cast'
import { markCliffhangerRead } from '../data/cliffhangers'
import {
  cacheMemories,
  memoriesFor,
  readCachedMemoryCount,
} from '../data/memories'
import { consumeDraftStarter } from '../data/plotTwists'
import { startersForContact } from '../data/starters'
import type { LoopStore } from '../hooks/useLoopStore'
import { tasteOverlapTags } from '../ranking/reasons'

const DISCLOSURE_KEY = 'loop-persona-disclosure-seen'

type ThreadNavState = {
  fromForYou?: boolean
  elevateReason?: string
  autoSend?: string
  fromPlotTwist?: boolean
}

export function ChatThread({ store }: { store: LoopStore }) {
  const { id = '' } = useParams()
  const location = useLocation()
  const nav = useNavigate()
  const navState = (location.state ?? {}) as ThreadNavState
  const contact = getContact(id)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [why, setWhy] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [contextChip, setContextChip] = useState<string | null>(null)
  const [chipFading, setChipFading] = useState(false)
  const [showDisclosure, setShowDisclosure] = useState(() => {
    try {
      return localStorage.getItem(DISCLOSURE_KEY) !== '1'
    } catch {
      return true
    }
  })
  const composerRef = useRef<HTMLInputElement>(null)
  const autoSentRef = useRef<string | null>(null)
  const busyRef = useRef(false)

  const memories = contact ? memoriesFor(contact.id) : []
  const cachedCount = contact ? readCachedMemoryCount(contact.id) : null
  const memoryCount = memories.length || cachedCount || 0

  useEffect(() => {
    if (!contact) return
    markCliffhangerRead(contact.id)
    cacheMemories(contact.id, memoriesFor(contact.id))
  }, [contact])

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

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  // Auto-send plot-twist starter once per navigation payload / draft
  useEffect(() => {
    if (!contact || !id) return
    const fromState = navState.autoSend?.trim() || null
    const lockKey = `loop_autosend_lock_${id}`
    let locked = false
    try {
      locked = sessionStorage.getItem(lockKey) === '1'
    } catch {
      locked = false
    }
    if (locked && !fromState) {
      // Draft may still exist after StrictMode remount — consume without sending again
      consumeDraftStarter(id)
      return
    }

    const fromDraft = fromState ? null : consumeDraftStarter(id)
    const payload = fromState || fromDraft
    if (!payload) return
    if (autoSentRef.current === payload) return
    autoSentRef.current = payload

    try {
      sessionStorage.setItem(lockKey, '1')
    } catch {
      /* ignore */
    }
    if (fromState) {
      // Also clear draft twin so remounts don't double-fire
      consumeDraftStarter(id)
      nav(location.pathname, { replace: true, state: {} })
    }

    void (async () => {
      if (busyRef.current) return
      setBusy(true)
      setText('')
      try {
        const msgs = store.state.threads[id] ?? []
        const reply = await fetchReply(contact, msgs, payload)
        store.sendMessage(id, payload, reply)
      } finally {
        setBusy(false)
        window.setTimeout(() => {
          try {
            sessionStorage.removeItem(lockKey)
          } catch {
            /* ignore */
          }
        }, 1500)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contact])

  if (!contact) {
    return (
      <div className="page">
        <p>Unknown contact.</p>
        <Link to="/chats">Back</Link>
      </div>
    )
  }

  const msgs = store.state.threads[id] ?? []
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

  function closeMemorySheet() {
    setMemoryOpen(false)
    window.setTimeout(() => composerRef.current?.focus(), 0)
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
          <div className="thread-sub-row">
            <MemoryHeaderChip
              count={memoryCount}
              onOpen={() => setMemoryOpen(true)}
            />
            <p className="muted thread-bio-snip">{contact.bio}</p>
          </div>
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
          ref={composerRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Reply to ${contact.name}…`}
          disabled={busy}
        />
        <button type="submit" className="primary" disabled={busy || !text.trim()}>
          Send
        </button>
      </form>

      {why && (
        <WhyThis
          contactId={id}
          overlapTags={tasteOverlapTags(
            contact,
            store.state.taste,
            store.state.selectedTags,
          )}
          onClose={() => setWhy(false)}
          onGoTaste={() => {
            setWhy(false)
            nav('/taste')
          }}
        />
      )}

      {memoryOpen && (
        <MemorySheet
          personaName={contact.name}
          memories={memories}
          onClose={closeMemorySheet}
        />
      )}
    </div>
  )
}
