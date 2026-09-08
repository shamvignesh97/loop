import { useState } from 'react'
import { ALL_TAGS } from '../data/cast'
import { Wordmark } from '../components/Logo'

export function Onboarding({
  onDone,
}: {
  onDone: (tags: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function quickStart() {
    onDone(['funny', 'looks'])
  }

  return (
    <div className="page onboarding">
      <div className="hero-brand">
        <img src="/brand.jpg" alt="" className="brand-bg" />
        <div className="hero-overlay">
          <Wordmark />
        </div>
      </div>

      <section className="onboard-panel">
        <h2>What should rise?</h2>
        <p className="muted">
          Pick two or more tags. Loop ranks contacts like a For You feed.
        </p>

        <div className="tag-picker">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={selected.includes(tag) ? 'chip on' : 'chip'}
              onClick={() => toggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="onboard-actions">
          <button
            type="button"
            className="primary"
            disabled={selected.length < 2}
            onClick={() => onDone(selected)}
          >
            Enter Loop
          </button>
          <button type="button" className="ghost wide" onClick={quickStart}>
            Funny + looks
          </button>
        </div>
      </section>
    </div>
  )
}
