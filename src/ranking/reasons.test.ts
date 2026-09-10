import { describe, expect, it } from 'vitest'
import { CAST } from '../data/cast'
import { createEmptyTaste, scoreContact } from './engine'
import {
  caughtUpCount,
  isHighRelevance,
  peopleOverlapBadge,
  rankingReasonChip,
  recentlyAdjustedLines,
  tasteOverlapTags,
} from './reasons'

describe('rankingReasonChip', () => {
  it('labels explore swaps', () => {
    const taste = createEmptyTaste(['funny', 'looks', 'witty'])
    const scored = { ...scoreContact(CAST[0], taste), explored: true }
    expect(rankingReasonChip(scored, taste)).toBe('Exploring something new')
  })

  it('labels followed authors', () => {
    const taste = createEmptyTaste(['funny'])
    const scored = scoreContact(CAST[0], taste, {
      followedIds: [CAST[0].id],
    })
    expect(
      rankingReasonChip(scored, taste, { followedIds: [CAST[0].id] }),
    ).toBe('Author you follow')
  })

  it('labels tag taste matches', () => {
    const taste = createEmptyTaste(['funny', 'looks', 'witty'])
    taste.tags.funny = 1.2
    const mira = CAST.find((c) => c.id === 'mira')!
    const scored = scoreContact(mira, taste)
    const chip = rankingReasonChip(scored, taste, {
      selectedTags: ['funny', 'looks', 'witty'],
    })
    expect(chip).toMatch(/funny|Fresh|Matches/)
  })
})

describe('isHighRelevance', () => {
  it('marks top scores', () => {
    const taste = createEmptyTaste(['funny'])
    const scored = CAST.map((c) => scoreContact(c, taste))
    const scores = scored.map((s) => s.score)
    const top = [...scored].sort((a, b) => b.score - a.score)[0]
    expect(isHighRelevance(top, scores)).toBe(true)
  })
})

describe('caughtUpCount', () => {
  it('caps high-confidence prefix to 3–5 with room below', () => {
    const scores = [0.9, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2, 0.1]
    const n = caughtUpCount(scores)
    expect(n).toBeGreaterThanOrEqual(3)
    expect(n).toBeLessThanOrEqual(5)
    expect(n).toBeLessThan(scores.length)
  })

  it('returns full length for tiny feeds', () => {
    expect(caughtUpCount([0.5, 0.4])).toBe(2)
  })
})

describe('peopleOverlapBadge', () => {
  it('prefers similar taste language over percents', () => {
    const taste = createEmptyTaste(['funny', 'dance'])
    taste.tags.funny = 0.9
    const mira = CAST.find((c) => c.id === 'mira')!
    const badge = peopleOverlapBadge(mira, taste, ['funny', 'dance'])
    expect(badge).toMatch(/Similar taste|Mutual/)
    expect(badge).not.toMatch(/%/)
  })

  it('falls back to New to Loop', () => {
    const taste = createEmptyTaste([])
    const mira = CAST.find((c) => c.id === 'mira')!
    expect(peopleOverlapBadge(mira, taste, [])).toBe('New to Loop')
  })
})

describe('tasteOverlapTags', () => {
  it('returns overlapping interest tags without scores', () => {
    const taste = createEmptyTaste(['funny', 'dance', 'witty'])
    taste.tags.funny = 1.1
    const mira = CAST.find((c) => c.id === 'mira')!
    const tags = tasteOverlapTags(mira, taste, ['funny', 'dance', 'witty'])
    expect(tags.length).toBeGreaterThan(0)
    expect(tags.join(' ')).toMatch(/funny|dance|night/)
    expect(tags.join(' ')).not.toMatch(/%|\d\.\d/)
  })
})

describe('recentlyAdjustedLines', () => {
  it('derives More/Less/Mute copy from feedback signals', () => {
    const taste = createEmptyTaste(['funny'])
    taste.tags.funny = 1.0
    taste.tags.sports = -0.4
    const lines = recentlyAdjustedLines({
      taste,
      likedIds: ['mira'],
      mutedIds: ['jordan'],
    })
    expect(lines.some((l) => /More/.test(l))).toBe(true)
    expect(lines.some((l) => /Less sports|Muted Jordan/.test(l))).toBe(true)
    expect(lines.join(' ')).not.toMatch(/%/)
  })
})
