import { describe, expect, it } from 'vitest'
import { CAST } from '../data/cast'
import {
  applyAction,
  combinedScore,
  createEmptyTaste,
  mapLoopProbsToSignals,
  markReranked,
  rankContacts,
  scoreContact,
  shouldRerank,
  softmax,
} from './engine'
import {
  ACTIONS,
  IG_BLEND,
  IG_REELS,
  RERANK_EVERY,
  X_BLEND,
  X_WEIGHTS,
  type Action,
} from './types'

describe('softmax', () => {
  it('sums to 1', () => {
    const p = softmax([1, 2, 3])
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8)
  })
})

describe('combinedScore', () => {
  it('blends IG 55% and X 45%', () => {
    const preds = {
      watch: 0.2,
      send: 0.1,
      like: 0.3,
      save: 0.05,
      skip: 0.1,
      completion: 0.15,
      favorite: 0.3,
      reply: 0.2,
      retweet: 0,
      quote: 0,
      share: 0.1,
      share_via_dm: 0.05,
      share_via_copy_link: 0.02,
      follow_author: 0.1,
      report: 0,
      mute_author: 0,
      block_author: 0,
      not_interested: 0.1,
    }
    let ig = 0
    for (const k of Object.keys(IG_REELS) as (keyof typeof IG_REELS)[]) {
      ig += IG_REELS[k] * preds[k]
    }
    let x = 0
    for (const k of Object.keys(X_WEIGHTS) as (keyof typeof X_WEIGHTS)[]) {
      x += X_WEIGHTS[k] * preds[k]
    }
    const { score, ig: igOut, x: xOut } = combinedScore(preds)
    expect(igOut).toBeCloseTo(ig, 8)
    expect(xOut).toBeCloseTo(x, 8)
    expect(score).toBeCloseTo(IG_BLEND * ig + X_BLEND * x, 8)
  })

  it('penalizes not_interested / skip heavily on X side', () => {
    const mild = combinedScore({ not_interested: 0.1, skip: 0.1 })
    const harsh = combinedScore({ not_interested: 0.5, skip: 0.5 })
    expect(harsh.score).toBeLessThan(mild.score)
  })

  it('rewards share_via_copy_link strongly', () => {
    const base = combinedScore({ share: 0.2 })
    const copy = combinedScore({ share: 0.2, share_via_copy_link: 0.2 })
    expect(copy.score).toBeGreaterThan(base.score)
  })
})

describe('mapLoopProbsToSignals', () => {
  it('maps like→favorite/like, skip→not_interested, dwell→watch', () => {
    const zero = Object.fromEntries(ACTIONS.map((a) => [a, 0])) as Record<
      Action,
      number
    >
    const p = { ...zero, like: 0.4, dwell: 0.3, skip: 0.2, reply: 0.1 }
    const preds = mapLoopProbsToSignals(p)
    expect(preds.like).toBeCloseTo(0.4)
    expect(preds.favorite).toBeCloseTo(0.4)
    expect(preds.watch).toBeCloseTo(0.3)
    expect(preds.not_interested).toBeCloseTo(0.2)
    expect(preds.skip).toBeCloseTo(0.2)
    expect(preds.reply).toBeCloseTo(0.1)
  })
})

describe('scoreContact', () => {
  it('uses combined IG/X score from mapped action probs', () => {
    const taste = createEmptyTaste(['funny', 'looks'])
    const mira = CAST.find((c) => c.id === 'mira')!
    const scored = scoreContact(mira, taste)
    const preds = mapLoopProbsToSignals(scored.p)
    const { score, ig, x } = combinedScore(preds)
    expect(scored.score).toBeCloseTo(score, 8)
    expect(scored.breakdown.ig).toBeCloseTo(ig, 8)
    expect(scored.breakdown.x).toBeCloseTo(x, 8)
    expect(Object.keys(scored.p)).toEqual(ACTIONS)
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

  it('share_copy updates stronger than share', () => {
    const mira = CAST.find((c) => c.id === 'mira')!
    const afterShare = applyAction(createEmptyTaste(['funny']), mira, 'share')
    const afterCopy = applyAction(
      createEmptyTaste(['funny']),
      mira,
      'share_copy',
    )
    expect(afterCopy.authors.mira).toBeGreaterThan(afterShare.authors.mira)
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
