import type { ScoredCandidate, TasteState } from './types'
import { getContact } from '../data/cast'

/** Human-readable ranking cue — no numeric scores. */
export function rankingReasonChip(
  scored: ScoredCandidate,
  taste: TasteState,
  opts: { followedIds?: string[]; selectedTags?: string[] } = {},
): string {
  const contact = getContact(scored.id)
  const followed = opts.followedIds?.includes(scored.id) ?? false
  const selected = opts.selectedTags ?? Object.keys(taste.tags)

  if (scored.explored) return 'Exploring something new'

  if (followed || scored.breakdown.authorFit >= 0.55) {
    return 'Author you follow'
  }

  const topTag = contact?.tags
    .map((t) => ({ t, v: taste.tags[t] ?? 0 }))
    .sort((a, b) => b.v - a.v)[0]
  if (
    topTag &&
    topTag.v >= 0.35 &&
    scored.breakdown.tagFit >= 0.25 &&
    (selected.includes(topTag.t) || topTag.v >= 0.5)
  ) {
    return `Matches your ${topTag.t} taste`
  }

  const recent =
    taste.recentAuthors.includes(scored.id) ||
    (contact?.tags.some((t) => taste.recentTags.includes(t)) ?? false)
  if (!recent || scored.breakdown.boredom > -0.15) {
    return 'Fresh to your feed'
  }

  if ((scored.p.reply ?? 0) > 0.22) return 'Likely a good chat'
  if (scored.breakdown.tagFit >= 0.15) {
    const tag = contact?.tags[0]
    if (tag) return `Matches your ${tag} taste`
  }

  return 'Fresh to your feed'
}

/** Top-scoring cards get a soft accent — roughly top quartile / top 3. */
export function isHighRelevance(
  scored: ScoredCandidate,
  allScores: number[],
): boolean {
  if (allScores.length === 0) return false
  const sorted = [...allScores].sort((a, b) => b - a)
  const cutoffIdx = Math.max(0, Math.min(2, Math.floor(sorted.length * 0.25) - 1))
  const cutoff = sorted[cutoffIdx] ?? sorted[0]
  return scored.score >= cutoff - 1e-9
}

/** How many top cards count as “caught up” before exploratory picks. */
export function caughtUpCount(scores: number[]): number {
  if (scores.length <= 2) return scores.length
  const sortedAsc = [...scores].sort((a, b) => a - b)
  const median = sortedAsc[Math.floor(sortedAsc.length / 2)] ?? scores[0]
  let above = 0
  for (const s of scores) {
    if (s >= median - 1e-9) above++
    else break
  }
  const capped = Math.min(5, Math.max(3, above || 3))
  return Math.min(capped, scores.length - 1)
}

/** Qualitative People-row badge — never a percent or raw score. */
export function peopleOverlapBadge(
  contact: { tags: string[]; id: string },
  taste: TasteState,
  selectedTags: string[] = [],
): string {
  const selected = selectedTags.length > 0 ? selectedTags : Object.keys(taste.tags)
  const mutual = contact.tags.filter(
    (t) => selected.includes(t) || (taste.tags[t] ?? 0) >= 0.25,
  )
  const topTaste = contact.tags
    .map((t) => ({ t, v: taste.tags[t] ?? 0 }))
    .sort((a, b) => b.v - a.v)[0]

  if (topTaste && topTaste.v >= 0.4) {
    return `Similar taste in ${topTaste.t}`
  }
  if (mutual.length >= 2) {
    return `Mutual: ${mutual.length} topics`
  }
  if (mutual.length === 1) {
    return `Similar taste in ${mutual[0]}`
  }
  return 'New to Loop'
}
