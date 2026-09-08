import { describe, expect, it } from 'vitest'
import { CAST } from '../data/cast'
import {
  applyAction,
  createEmptyTaste,
  rankContacts,
  scoreContact,
  shouldRerank,
  softmax,
  markReranked,
} from './engine'
import { RERANK_EVERY, WEIGHTS } from './types'

describe('softmax', () => {
  it('sums to 1', () => {
    const p = softmax([1, 2, 3])
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8)
  })
})

describe('scoreContact', () => {
  it('produces weighted score from action probs', () => {
    const taste = createEmptyTaste(['funny', 'looks'])
    const mira = CAST.find((c) => c.id === 'mira')!
    const scored = scoreContact(mira, taste)
    let recon = 0
    for (const a of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
      recon += scored.p[a] * WEIGHTS[a]
    }
    expect(scored.score).toBeCloseTo(recon, 8)
  })
})

describe('applyAction + clusters', () => {
  it('lifts sibling author on like', () => {
    const taste = createEmptyTaste(['looks'])
    const jordan = CAST.find((c) => c.id === 'jordan')!
    const next = applyAction(taste, jordan, 'like')
    expect(next.authors.jordan).toBeGreaterThan(0)
    expect(next.authors.rafi).toBeGreaterThan(0)
  })

  it('reranks every 5 consumed items', () => {
    let taste = createEmptyTaste(['funny'])
    const mira = CAST.find((c) => c.id === 'mira')!
    for (let i = 0; i < RERANK_EVERY - 1; i++) {
      taste = applyAction(taste, mira, 'dwell')
      expect(shouldRerank(taste)).toBe(false)
    }
    taste = applyAction(taste, mira, 'like')
    expect(shouldRerank(taste)).toBe(true)
    taste = markReranked(taste)
    expect(shouldRerank(taste)).toBe(false)
  })
})

describe('rankContacts', () => {
  it('returns all cast members sorted by score (no explore)', () => {
    const taste = createEmptyTaste(['funny', 'looks'])
    const ranked = rankContacts(CAST, taste, () => 0.99)
    expect(ranked).toHaveLength(CAST.length)
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score)
    }
  })

  it('can epsilon-swap top with nearby', () => {
    const taste = createEmptyTaste(['funny', 'looks'])
    const ranked = rankContacts(CAST, taste, () => 0.01)
    expect(ranked[0].explored).toBe(true)
  })
})
