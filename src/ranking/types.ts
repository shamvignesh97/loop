export type Action =
  | 'like'
  | 'reply'
  | 'share'
  | 'rewatch'
  | 'dwell'
  | 'skip'

export const ACTIONS: Action[] = [
  'like',
  'reply',
  'share',
  'rewatch',
  'dwell',
  'skip',
]

export const WEIGHTS: Record<Action, number> = {
  like: 0.5,
  reply: 2,
  share: 4,
  rewatch: 3,
  dwell: 1.5,
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
