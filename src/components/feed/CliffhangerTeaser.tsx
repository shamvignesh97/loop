import { COPY_STRINGS } from '../../data/copy'

/** Italic accent teaser under persona name on For You cards. */
export function CliffhangerTeaser({
  text,
  unread,
  isCliffhanger,
}: {
  text: string
  unread?: boolean
  isCliffhanger?: boolean
}) {
  const display = text.trim() || COPY_STRINGS.CLIFFHANGER_FALLBACK
  const classes = [
    'cliffhanger-teaser',
    isCliffhanger ? 'is-cliffhanger' : 'is-fallback',
    unread && isCliffhanger ? 'unread' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <p className={classes} title={display}>
      {unread && isCliffhanger && (
        <span className="cliffhanger-pulse" aria-hidden />
      )}
      <span className="cliffhanger-text">{display}</span>
    </p>
  )
}
