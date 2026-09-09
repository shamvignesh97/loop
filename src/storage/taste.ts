import type { TasteState } from '../ranking/types'
import { createEmptyTaste } from '../ranking/engine'
import {
  ensureProfiles,
  getActiveProfileId,
  tasteStorageKey,
} from './profiles'

/** @deprecated Prefer tasteStorageKey(profileId). Kept for docs / migration notes. */
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
  followedIds: string[]
  mutedIds: string[]
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
    followedIds: [],
    mutedIds: [],
    threads: {},
    rankedIds: [],
    lastWhyId: null,
  }
}

export function normalizePersisted(parsed: PersistedLoop): PersistedLoop {
  return {
    ...defaultPersisted(),
    ...parsed,
    followedIds: parsed.followedIds ?? [],
    mutedIds: parsed.mutedIds ?? [],
    likedIds: parsed.likedIds ?? [],
    sharedIds: parsed.sharedIds ?? [],
    skippedIds: parsed.skippedIds ?? [],
    threads: parsed.threads ?? {},
    rankedIds: parsed.rankedIds ?? [],
  }
}

export function loadPersisted(profileId?: string): PersistedLoop {
  ensureProfiles()
  const id = profileId ?? getActiveProfileId()
  try {
    const raw = localStorage.getItem(tasteStorageKey(id))
    if (!raw) return defaultPersisted()
    const parsed = JSON.parse(raw) as PersistedLoop
    if (parsed.version !== 2) return defaultPersisted()
    return normalizePersisted(parsed)
  } catch {
    return defaultPersisted()
  }
}

export function savePersisted(
  state: PersistedLoop,
  profileId?: string,
): void {
  ensureProfiles()
  const id = profileId ?? getActiveProfileId()
  localStorage.setItem(tasteStorageKey(id), JSON.stringify(state))
}

export function clearPersisted(profileId?: string): void {
  ensureProfiles()
  const id = profileId ?? getActiveProfileId()
  localStorage.removeItem(tasteStorageKey(id))
}
