export type Action =
  | 'like'
  | 'reply'
  | 'share'
  | 'share_copy'
  | 'rewatch'
  | 'dwell'
  | 'skip'

export const ACTIONS: Action[] = [
  'like',
  'reply',
  'share',
  'share_copy',
  'rewatch',
  'dwell',
  'skip',
]

/** Instagram Reels–style engagement weights (Mosseri-inspired) */
export const IG_REELS = {
  watch: 4.5,
  send: 3.8,
  like: 0.8,
  save: 1.2,
  skip: -2.0,
  completion: 2.5,
} as const

/** X / Twitter–style engagement weights */
export const X_WEIGHTS = {
  favorite: 0.5,
  reply: 5.0,
  retweet: 1.0,
  quote: 5.0,
  share: 2.0,
  share_via_dm: 5.0,
  share_via_copy_link: 20.0,
  follow_author: 4.0,
  report: -234.0,
  mute_author: -58.8,
  block_author: -31.2,
  not_interested: -43.2,
} as const

export const IG_BLEND = 0.55
export const X_BLEND = 0.45

export type IgSignal = keyof typeof IG_REELS
export type XSignal = keyof typeof X_WEIGHTS

export type SignalPreds = Partial<Record<IgSignal | XSignal, number>>

/**
 * Legacy Loop action weights — kept as documentation of UX mapping only.
 * Ranking uses combinedScore(IG∪X) instead.
 */
export const WEIGHTS: Record<Action, number> = {
  like: 0.5,
  reply: 5,
  share: 2,
  share_copy: 20,
  rewatch: 2.5,
  dwell: 4.5,
  skip: -2,
}

export const UPDATE = {
  tag: 0.15,
  author: 0.08,
} as const

export const EXPLORE_EPSILON = 0.08
export const RERANK_EVERY = 5

/** Same-author affinity clusters */
export const AUTHOR_CLUSTERS: string[][] = [
  ['jordan', 'rafi'],
  ['nico', 'asha'],
  ['priya', 'tess'],
  ['elena', 'yumi'],
]

export interface TasteState {
  tags: Record<string, number>
  authors: Record<string, number>
  /** Recent author ids for boredom window */
  recentAuthors: string[]
  /** Recent tag ids for boredom */
  recentTags: string[]
  sessionActions: number
  consumedSinceRerank: number
}

export interface ScoredCandidate {
  id: string
  score: number
  p: Record<Action, number>
  breakdown: {
    tagFit: number
    authorFit: number
    boredom: number
    fatigue: number
    logits: Record<Action, number>
    ig: number
    x: number
    preds: SignalPreds
  }
  explored?: boolean
}

export interface Contact {
  id: string
  name: string
  bio: string
  tags: string[]
  opening: string
  avatar?: string
  color: string
  fallbackReplies: string[]
  systemPrompt: string
}
