import type { Contact } from '../ranking/types'

export function Avatar({
  contact,
  size = 44,
}: {
  contact: Contact
  size?: number
}) {
  const initials = contact.name.slice(0, 1)
  if (contact.avatar) {
    return (
      <img
        className="avatar"
        src={contact.avatar}
        alt={contact.name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="avatar avatar-fallback"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${contact.color}55, ${contact.color})`,
        fontSize: size * 0.4,
      }}
      aria-label={contact.name}
    >
      {initials}
    </div>
  )
}
