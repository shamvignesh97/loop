import { useEffect, useRef } from 'react'
import type { PersonaMemory } from '../../data/memories'
import { COPY_STRINGS } from '../../data/copy'

/** Read-only Persona Memory Bank bottom sheet. */
export function MemorySheet({
  personaName,
  memories,
  onClose,
}: {
  personaName: string
  memories: PersonaMemory[]
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="why-sheet-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="why-panel why-sheet memory-sheet"
        role="dialog"
        aria-label={COPY_STRINGS.MEMORY_SHEET_TITLE}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="why-header">
          <div>
            <h3>{COPY_STRINGS.MEMORY_SHEET_TITLE}</h3>
            <p className="muted">{personaName}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {memories.length === 0 ? (
          <p className="why-plain">{COPY_STRINGS.MEMORY_SHEET_EMPTY}</p>
        ) : (
          <ul className="memory-kv-list">
            {memories.map((m) => (
              <li key={m.id}>
                <span className="memory-key">{m.key}</span>
                <span className="memory-fact">{m.fact}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
