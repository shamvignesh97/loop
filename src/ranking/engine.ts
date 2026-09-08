import {
  ACTIONS,
  AUTHOR_CLUSTERS,
  EXPLORE_EPSILON,
  RERANK_EVERY,
  UPDATE,
  WEIGHTS,
  type Action,
  type Contact,
  type ScoredCandidate,
  type TasteState,
} from './types'

export function createEmptyTaste(seedTags: string[] = []): TasteState {
  const tags: Record<string, number> = {}
  for (const t of seedTags) tags[t] = 0.6
  return {
    tags,
    authors: {},
    recentAuthors: [],
    recentTags: [],
    sessionActions: 0,
    consumedSinceRerank: 0,
  }
}

export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export function tagFit(contact: Contact, taste: TasteState): number {
  if (!contact.tags.length) return 0
  let sum = 0
  for (const t of contact.tags) sum += taste.tags[t] ?? 0
  return sum / contact.tags.length
}

export function authorFit(contact: Contact, taste: TasteState): number {
  const direct = taste.authors[contact.id] ?? 0
  let sibling = 0
  for (const cluster of AUTHOR_CLUSTERS) {
    if (cluster.includes(contact.id)) {
      for (const sib of cluster) {
        if (sib !== contact.id) sibling += (taste.authors[sib] ?? 0) * 0.5
      }
    }
  }
  return direct + sibling
}

/** Penalize recently seen authors/tags (boredom window ~ last 4) */
export function boredomPenalty(contact: Contact, taste: TasteState): number {
  const authorHits = taste.recentAuthors.filter((a) => a === contact.id).length
  let tagHits = 0
  for (const t of contact.tags) {
    tagHits += taste.recentTags.filter((x) => x === t).length
  }
  return -(authorHits * 0.45 + tagHits * 0.12)
}

/** Session fatigue grows with actions; softens engagement logits */
export function fatiguePenalty(taste: TasteState): number {
  return -Math.min(1.2, taste.sessionActions * 0.035)
}

/** Base logit prior per action before fit modifiers */
const ACTION_BIAS: Record<Action, number> = {
  like: 0.4,
  reply: 0.6,
  share: -0.2,
  rewatch: 0.1,
  dwell: 0.5,
  skip: 0.2,
}

export function scoreContact(
  contact: Contact,
  taste: TasteState,
): ScoredCandidate {
  const tf = tagFit(contact, taste)
  const af = authorFit(contact, taste)
  const boredom = boredomPenalty(contact, taste)
  const fatigue = fatiguePenalty(taste)
  const fit = tf + af + boredom + fatigue

  const logits = {} as Record<Action, number>
  for (const a of ACTIONS) {
    if (a === 'skip') {
      logits[a] = ACTION_BIAS[a] - fit * 0.9
    } else {
      logits[a] =
        ACTION_BIAS[a] +
        fit * (a === 'reply' || a === 'share' ? 1.1 : 0.85)
    }
  }

  const probs = softmax(ACTIONS.map((a) => logits[a]))
  const p = {} as Record<Action, number>
  ACTIONS.forEach((a, i) => {
    p[a] = probs[i]
  })

  let score = 0
  for (const a of ACTIONS) score += p[a] * WEIGHTS[a]

  return {
    id: contact.id,
    score,
    p,
    breakdown: { tagFit: tf, authorFit: af, boredom, fatigue, logits },
  }
}

export function rankContacts(
  contacts: Contact[],
  taste: TasteState,
  rng: () => number = Math.random,
): ScoredCandidate[] {
  const scored = contacts.map((c) => scoreContact(c, taste))
  scored.sort((a, b) => b.score - a.score)

  if (scored.length > 1 && rng() < EXPLORE_EPSILON) {
    const nearby = 1 + Math.floor(rng() * Math.min(3, scored.length - 1))
    const tmp = scored[0]
    scored[0] = { ...scored[nearby], explored: true }
    scored[nearby] = tmp
  }

  return scored
}

export function actionStrength(action: Action): number {
  switch (action) {
    case 'share':
      return 1.4
    case 'reply':
      return 1.2
    case 'rewatch':
      return 1.0
    case 'like':
      return 0.8
    case 'dwell':
      return 0.5
    case 'skip':
      return -0.9
  }
}

export function applyAction(
  taste: TasteState,
  contact: Contact,
  action: Action,
): TasteState {
  const strength = actionStrength(action)
  const tags = { ...taste.tags }
  const authors = { ...taste.authors }

  for (const t of contact.tags) {
    tags[t] = (tags[t] ?? 0) + UPDATE.tag * strength
    tags[t] = Math.max(-1.5, Math.min(2.5, tags[t]))
  }

  authors[contact.id] = (authors[contact.id] ?? 0) + UPDATE.author * strength
  authors[contact.id] = Math.max(-1.5, Math.min(2.5, authors[contact.id]))

  for (const cluster of AUTHOR_CLUSTERS) {
    if (cluster.includes(contact.id)) {
      for (const sib of cluster) {
        if (sib !== contact.id) {
          authors[sib] = (authors[sib] ?? 0) + UPDATE.author * strength * 0.45
          authors[sib] = Math.max(-1.5, Math.min(2.5, authors[sib]))
        }
      }
    }
  }

  const recentAuthors = [contact.id, ...taste.recentAuthors].slice(0, 4)
  const recentTags = [...contact.tags, ...taste.recentTags].slice(0, 12)

  return {
    tags,
    authors,
    recentAuthors,
    recentTags,
    sessionActions: taste.sessionActions + 1,
    consumedSinceRerank: taste.consumedSinceRerank + 1,
  }
}

export function shouldRerank(taste: TasteState): boolean {
  return taste.consumedSinceRerank >= RERANK_EVERY
}

export function markReranked(taste: TasteState): TasteState {
  return { ...taste, consumedSinceRerank: 0 }
}

export { WEIGHTS, ACTIONS, RERANK_EVERY, EXPLORE_EPSILON }
