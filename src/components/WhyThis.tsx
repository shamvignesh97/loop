import {
  ACTIONS,
  IG_BLEND,
  IG_REELS,
  X_BLEND,
  X_WEIGHTS,
  type Action,
  type IgSignal,
  type ScoredCandidate,
  type XSignal,
} from '../ranking/types'
import { getContact } from '../data/cast'

export function WhyThis({
  scored,
  onClose,
}: {
  scored: ScoredCandidate | null
  onClose: () => void
}) {
  if (!scored) return null
  const contact = getContact(scored.id)
  if (!contact) return null

  const { ig, x, preds } = scored.breakdown
  const igKeys = Object.keys(IG_REELS) as IgSignal[]
  const xKeys = Object.keys(X_WEIGHTS) as XSignal[]

  return (
    <aside className="why-panel" role="dialog" aria-label="Why this ranking">
      <header className="why-header">
        <div>
          <h3>Why this</h3>
          <p className="muted">{contact.name}</p>
        </div>
        <button className="ghost" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>

      <p className="eq">score = 0.55 · IG + 0.45 · X</p>
      <p className="score-big">{scored.score.toFixed(3)}</p>
      {scored.explored && (
        <p className="explore-badge">ε-greedy explore swap</p>
      )}

      <p className="why-plain">
        We predict how likely you are to watch, like, reply, share, or skip —
        then blend Instagram-style dwell signals ({Math.round(IG_BLEND * 100)}%)
        with X-style conversation signals ({Math.round(X_BLEND * 100)}%).
      </p>

      <div className="why-grid">
        <div>
          <span className="muted">IG Reels (55%)</span>
          <strong>{ig.toFixed(3)}</strong>
        </div>
        <div>
          <span className="muted">X blend (45%)</span>
          <strong>{x.toFixed(3)}</strong>
        </div>
        <div>
          <span className="muted">tag fit</span>
          <strong>{scored.breakdown.tagFit.toFixed(3)}</strong>
        </div>
        <div>
          <span className="muted">author fit</span>
          <strong>{scored.breakdown.authorFit.toFixed(3)}</strong>
        </div>
        <div>
          <span className="muted">boredom</span>
          <strong>{scored.breakdown.boredom.toFixed(3)}</strong>
        </div>
        <div>
          <span className="muted">fatigue</span>
          <strong>{scored.breakdown.fatigue.toFixed(3)}</strong>
        </div>
      </div>

      <h4 className="why-sub">Loop action probs</h4>
      <table className="why-table">
        <thead>
          <tr>
            <th>action</th>
            <th>p</th>
          </tr>
        </thead>
        <tbody>
          {ACTIONS.map((a: Action) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{scored.p[a].toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="why-sub">IG weights × preds</h4>
      <table className="why-table">
        <thead>
          <tr>
            <th>signal</th>
            <th>p</th>
            <th>w</th>
            <th>p×w</th>
          </tr>
        </thead>
        <tbody>
          {igKeys.map((k) => {
            const pk = preds[k] ?? 0
            return (
              <tr key={k}>
                <td>{k}</td>
                <td>{pk.toFixed(3)}</td>
                <td>{IG_REELS[k]}</td>
                <td>{(pk * IG_REELS[k]).toFixed(3)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h4 className="why-sub">X weights × preds</h4>
      <table className="why-table">
        <thead>
          <tr>
            <th>signal</th>
            <th>p</th>
            <th>w</th>
            <th>p×w</th>
          </tr>
        </thead>
        <tbody>
          {xKeys
            .filter((k) => (preds[k] ?? 0) !== 0 || X_WEIGHTS[k] > -50)
            .map((k) => {
              const pk = preds[k] ?? 0
              return (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{pk.toFixed(3)}</td>
                  <td>{X_WEIGHTS[k]}</td>
                  <td>{(pk * X_WEIGHTS[k]).toFixed(3)}</td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </aside>
  )
}
