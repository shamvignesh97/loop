import { useEffect, useState } from 'react'
import { ALL_TAGS } from '../data/cast'
import { Wordmark } from '../components/Logo'

const MIN_TAGS = 3
const MAX_TAGS = 5
const QUICK_START = ['funny', 'looks', 'witty']

export function Onboarding({
  onDone,
}: {
  onDone: (tags: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [phase, setPhase] = useState<'pick' | 'calibrating'>('pick')
  const [pendingTags, setPendingTags] = useState<string[] | null>(null)

  function toggle(tag: string) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag)
      if (prev.length >= MAX_TAGS) return prev
      return [...prev, tag]
    })
  }

  function startCalibration(tags: string[]) {
    const clipped = tags.slice(0, MAX_TAGS)
    if (clipped.length < MIN_TAGS) return
    setPendingTags(clipped)
    setPhase('calibrating')
  }

  useEffect(() => {
    if (phase !== 'calibrating' || !pendingTags) return
    const t = window.setTimeout(() => {
      onDone(pendingTags)
    }, 1400)
    return () => window.clearTimeout(t)
  }, [phase, pendingTags, onDone])

  if (phase === 'calibrating') {
    return (
      <div className="page onboarding calibrating">
        <div className="calibrate-panel">
          <Wordmark />
          <div className="calibrate-pulse" aria-hidden />
          <h2>Calibrating your feed</h2>
          <p className="muted">
            Ranking contacts from your {pendingTags?.length ?? 0} taste tags…
          </p>
          <div className="tag-row calibrate-tags">
            {(pendingTags ?? []).map((t) => (
              <span key={t} className="tag on">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page onboarding">
      <div className="hero-brand">
        <img
          src={`${import.meta.env.BASE_URL}brand.jpg`}
          alt=""
          className="brand-bg"
        />
        <div className="hero-overlay">
          <Wordmark />
        </div>
      </div>

      <section className="onboard-panel">
        <h2>What should rise?</h2>
        <p className="muted">
          Pick {MIN_TAGS}–{MAX_TAGS} interest tags so Loop can calibrate your For
          You feed. ({selected.length}/{MAX_TAGS})
        </p>

        <div className="tag-picker">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={selected.includes(tag) ? 'chip on' : 'chip'}
              onClick={() => toggle(tag)}
              disabled={
                !selected.includes(tag) && selected.length >= MAX_TAGS
              }
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="onboard-actions">
          <button
            type="button"
            className="primary"
            disabled={selected.length < MIN_TAGS}
            onClick={() => startCalibration(selected)}
          >
            Calibrate feed
          </button>
          <button
            type="button"
            className="ghost wide"
            onClick={() => startCalibration(QUICK_START)}
          >
            Funny + looks + witty
          </button>
        </div>
      </section>
    </div>
  )
}
