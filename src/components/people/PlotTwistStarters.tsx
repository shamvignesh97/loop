import type { PlotTwistStarter } from '../../data/plotTwists'
import { COPY_STRINGS } from '../../data/copy'

/** Horizontal dramatic action chips under People cards. */
export function PlotTwistStarters({
  starters,
  onPick,
  sendingLabel,
}: {
  starters: PlotTwistStarter[]
  onPick: (starter: PlotTwistStarter) => void
  sendingLabel?: string | null
}) {
  if (starters.length === 0) return null

  return (
    <div className="plot-twist-starters" aria-label="Plot twist starters">
      <p className="plot-twist-label">{COPY_STRINGS.STARTER_LABEL_PREFIX}</p>
      <div className="plot-twist-row">
        {starters.map((s) => {
          const sending = sendingLabel === s.label
          return (
            <button
              key={s.label}
              type="button"
              className={`plot-twist-chip${sending ? ' sending' : ''}`}
              disabled={Boolean(sendingLabel)}
              onClick={(e) => {
                e.stopPropagation()
                onPick(s)
              }}
            >
              {sending ? COPY_STRINGS.STARTER_SENDING : s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
