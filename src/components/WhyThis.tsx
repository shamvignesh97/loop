import { getContact } from '../data/cast'

/** User-facing “Why this chat?” sheet — no raw ranking scores. */
export function WhyThis({
  contactId,
  overlapTags,
  onClose,
  onGoTaste,
}: {
  contactId: string
  overlapTags: string[]
  onClose: () => void
  onGoTaste: () => void
}) {
  const contact = getContact(contactId)
  if (!contact) return null

  const topics =
    overlapTags.length > 0
      ? overlapTags
      : contact.tags.slice(0, 2)

  return (
    <div className="why-sheet-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="why-panel why-sheet"
        role="dialog"
        aria-label="Why this chat"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="why-header">
          <div>
            <h3>Why this appeared</h3>
            <p className="muted">{contact.name}</p>
          </div>
          <button type="button" className="ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className="why-plain">
          Loop noticed you enjoy topics that line up with this persona. You can
          reshape what shows up anytime in Taste.
        </p>

        <h4 className="why-sub">You enjoy</h4>
        <ul className="why-topic-list">
          {topics.map((t) => (
            <li key={t}>
              <span className="why-check" aria-hidden>
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>

        <p className="why-plain why-adjust-hint">
          Adjust interests, More/Less, or Mute in Taste — no scores, just what
          you want more of.
        </p>

        <button type="button" className="primary why-taste-cta" onClick={onGoTaste}>
          Go to Taste
        </button>
      </aside>
    </div>
  )
}
