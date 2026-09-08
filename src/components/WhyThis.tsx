import { WEIGHTS, ACTIONS, type Action, type ScoredCandidate } from '../ranking/types'
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

      <p className="eq">
        score = Σ p(action) × weight
      </p>
      <p className="score-big">{scored.score.toFixed(3)}</p>
      {scored.explored && (
        <p className="explore-badge">ε-greedy explore swap</p>
      )}

      <div className="why-grid">
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

      <table className="why-table">
        <thead>
          <tr>
            <th>action</th>
            <th>p</th>
            <th>w</th>
            <th>p×w</th>
          </tr>
        </thead>
        <tbody>
          {ACTIONS.map((a: Action) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{scored.p[a].toFixed(3)}</td>
              <td>{WEIGHTS[a]}</td>
              <td>{(scored.p[a] * WEIGHTS[a]).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  )
}
