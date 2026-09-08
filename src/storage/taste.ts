import type { TasteState } from '../ranking/types'
import { createEmptyTaste } from '../ranking/engine'

export const STORAGE_KEY = 'loop-chat-v2'

export interface ThreadMessage {
  id: string
  from: 'me' | 'them'
  text: string
  at: number
}

export interface PersistedLoop {
  version: 2
  onboarded: boolean
  selectedTags: string[]
  taste: TasteState
  skippedIds: string[]
  likedIds: string[]
  sharedIds: string[]
  threads: Record<string, ThreadMessage[]>
  rankedIds: string[]
  lastWhyId: string | null
}

export function defaultPersisted(seedTags: string[] = []): PersistedLoop {
  return {
    version: 2,
    onboarded: false,
    selectedTags: seedTags,
    taste: createEmptyTaste(seedTags),
    skippedIds: [],
    likedIds: [],
    sharedIds: [],
    threads: {},
    rankedIds: [],
    lastWhyId: null,
  }
}

export function loadPersisted(): PersistedLoop {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersisted()
    const parsed = JSON.parse(raw) as PersistedLoop
    if (parsed.version !== 2) return defaultPersisted()
    return parsed
  } catch {
    return defaultPersisted()
  }
}

export function savePersisted(state: PersistedLoop): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearPersisted(): void {
  localStorage.removeItem(STORAGE_KEY)
}
