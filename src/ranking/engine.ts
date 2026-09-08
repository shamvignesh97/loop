import {
  ACTIONS,
  AUTHOR_CLUSTERS,
  EXPLORE_EPSILON,
  IG_BLEND,
  IG_REELS,
  RERANK_EVERY,
  UPDATE,
  X_BLEND,
  X_WEIGHTS,
  type Action,
  type Contact,
  type IgSignal,
  type ScoredCandidate,
  type SignalPreds,
  type TasteState,
  type XSignal,
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

/** Base logit prior per Loop UX action before fit modifiers */
const ACTION_BIAS: Record<Action, number> = {
  like: 0.4,
  reply: 0.6,
  share: -0.2,
  share_copy: -0.45,
  rewatch: 0.1,
  dwell: 0.5,
  skip: 0.2,
}

/**
 * Map Loop action probabilities onto IG Reels + X signal preds.
 * like → favorite / like · reply → reply · share → share / send
 * share_copy → share_via_copy_link · dwell/open → watch / completion
 * skip → skip / not_interested · strong affinity proxies → follow_author
 */
export function mapLoopProbsToSignals(p: Record<Action, number>): SignalPreds {
  const shareMass = (p.share ?? 0) + (p.share_copy ?? 0)
  return {
    // IG Reels
    watch: p.dwell ?? 0,
    send: shareMass,
    like: p.like ?? 0,
    save: p.rewatch ?? 0,
    skip: p.skip ?? 0,
    completion: 0.55 * (p.dwell ?? 0) + 0.45 * (p.rewatch ?? 0),
    // X
    favorite: p.like ?? 0,
    reply: p.reply ?? 0,
    retweet: 0.35 * (p.share ?? 0),
    quote: 0.25 * (p.reply ?? 0),
    share: p.share ?? 0,
    share_via_dm: 0.5 * (p.share ?? 0),
    share_via_copy_link: p.share_copy ?? 0.12 * (p.share ?? 0),
    follow_author: 0.4 * (p.like ?? 0) + 0.6 * (p.reply ?? 0),
    report: 0,
    mute_author: 0,
    block_author: 0,
    not_interested: p.skip ?? 0,
  }
}

/** 0.55 · IG + 0.45 · X combined ranking score */
export function combinedScore(preds: SignalPreds): {
  score: number
  ig: number
  x: number
} {
  let ig = 0
  for (const k of Object.keys(IG_REELS) as IgSignal[]) {
    ig += IG_REELS[k] * (preds[k] ?? 0)
  }
  let x = 0
  for (const k of Object.keys(X_WEIGHTS) as XSignal[]) {
    x += X_WEIGHTS[k] * (preds[k] ?? 0)
  }
  return {
    score: IG_BLEND * ig + X_BLEND * x,
    ig,
    x,
  }
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
      const boost =
        a === 'reply' || a === 'share' || a === 'share_copy' ? 1.1 : 0.85
      logits[a] = ACTION_BIAS[a] + fit * boost
    }
  }

  const probs = softmax(ACTIONS.map((a) => logits[a]))
  const p = {} as Record<Action, number>
  ACTIONS.forEach((a, i) => {
    p[a] = probs[i]
  })

  const preds = mapLoopProbsToSignals(p)
  const { score, ig, x } = combinedScore(preds)

  return {
    id: contact.id,
    score,
    p,
    breakdown: {
      tagFit: tf,
      authorFit: af,
      boredom,
      fatigue,
      logits,
      ig,
      x,
      preds,
    },
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
    case 'share_copy':
      return 1.8
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

export {
  ACTIONS,
  EXPLORE_EPSILON,
  IG_BLEND,
  IG_REELS,
  RERANK_EVERY,
  X_BLEND,
  X_WEIGHTS,
}
