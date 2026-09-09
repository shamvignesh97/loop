import { describe, expect, it } from 'vitest'
import { CAST } from '../data/cast'
import { createEmptyTaste, scoreContact } from './engine'
import { isHighRelevance, rankingReasonChip } from './reasons'

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
