import { storageUidKey, tasteKeyForUid } from '../auth/types'

export const PROFILES_KEY = 'loop-profiles-v1'
export const LEGACY_TASTE_KEY = 'loop-chat-v2'
export const AUTH_MIGRATE_FLAG = 'loop-auth-migrated-v1'

export interface ProfileMeta {
  id: string
  name: string
  createdAt: number
}

export interface ProfilesState {
  version: 1
  activeId: string
  profiles: ProfileMeta[]
}

export function tasteStorageKey(profileId: string): string {
  if (profileId.startsWith('uid:')) {
    return `loop-chat-v2:${profileId}`
  }
  return `loop-chat-v2:${profileId}`
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function writeProfiles(state: ProfilesState): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(state))
}

/** Ensure a profile list exists; migrate legacy `loop-chat-v2` into the default profile. */
export function ensureProfiles(): ProfilesState {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ProfilesState
      if (
        parsed?.version === 1 &&
        Array.isArray(parsed.profiles) &&
        parsed.profiles.length > 0 &&
        parsed.activeId
      ) {
        const activeOk = parsed.profiles.some((p) => p.id === parsed.activeId)
        if (!activeOk) {
          parsed.activeId = parsed.profiles[0].id
          writeProfiles(parsed)
        }
        return parsed
      }
    }
  } catch {
    /* fall through and recreate */
  }

  const id = newId()
  const state: ProfilesState = {
    version: 1,
    activeId: id,
    profiles: [{ id, name: 'You', createdAt: Date.now() }],
  }

  try {
    const legacy = localStorage.getItem(LEGACY_TASTE_KEY)
    if (legacy) {
      localStorage.setItem(tasteStorageKey(id), legacy)
      localStorage.removeItem(LEGACY_TASTE_KEY)
    }
  } catch {
    /* ignore migration errors */
  }

  writeProfiles(state)
  return state
}

export function listProfiles(): ProfileMeta[] {
  return ensureProfiles().profiles
}

export function getActiveProfileId(): string {
  return ensureProfiles().activeId
}

export function getActiveProfile(): ProfileMeta {
  const state = ensureProfiles()
  return (
    state.profiles.find((p) => p.id === state.activeId) ?? state.profiles[0]
  )
}

export function setActiveProfileId(id: string): ProfilesState {
  const state = ensureProfiles()
  if (!state.profiles.some((p) => p.id === id)) return state
  const next = { ...state, activeId: id }
  writeProfiles(next)
  return next
}

export function createProfile(name: string): ProfileMeta {
  const state = ensureProfiles()
  const trimmed = name.trim() || 'Guest'
  const profile: ProfileMeta = {
    id: newId(),
    name: trimmed.slice(0, 32),
    createdAt: Date.now(),
  }
  const next: ProfilesState = {
    ...state,
    activeId: profile.id,
    profiles: [...state.profiles, profile],
  }
  writeProfiles(next)
  return profile
}

export function renameProfile(id: string, name: string): ProfilesState {
  const state = ensureProfiles()
  const trimmed = name.trim().slice(0, 32)
  if (!trimmed) return state
  const next: ProfilesState = {
    ...state,
    profiles: state.profiles.map((p) =>
      p.id === id ? { ...p, name: trimmed } : p,
    ),
  }
  writeProfiles(next)
  return next
}

/** Delete a profile and its taste key. Keeps at least one profile. */
export function deleteProfile(id: string): ProfilesState {
  const state = ensureProfiles()
  if (state.profiles.length <= 1) return state
  const profiles = state.profiles.filter((p) => p.id !== id)
  const activeId =
    state.activeId === id ? profiles[0].id : state.activeId
  try {
    localStorage.removeItem(tasteStorageKey(id))
  } catch {
    /* ignore */
  }
  const next: ProfilesState = { version: 1, activeId, profiles }
  writeProfiles(next)
  return next
}

export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * One-time migrate anonymous local taste into the authenticated uid bucket
 * when the uid key is empty.
 */
export function migrateAnonymousIntoUid(firebaseUid: string): void {
  const uidKey = tasteKeyForUid(firebaseUid)
  try {
    if (localStorage.getItem(uidKey)) return
    const flag = `${AUTH_MIGRATE_FLAG}:${firebaseUid}`
    if (localStorage.getItem(flag)) return

    // Prefer active local profile taste, then any profile, then legacy key.
    ensureProfiles()
    const activeId = getActiveProfileId()
    let source =
      localStorage.getItem(tasteStorageKey(activeId)) ||
      localStorage.getItem(LEGACY_TASTE_KEY)

    if (!source) {
      for (const p of listProfiles()) {
        const raw = localStorage.getItem(tasteStorageKey(p.id))
        if (raw) {
          source = raw
          break
        }
      }
    }

    if (source) {
      localStorage.setItem(uidKey, source)
    }
    localStorage.setItem(flag, '1')
  } catch {
    /* ignore */
  }
}

export function authProfileId(firebaseUid: string): string {
  return storageUidKey(firebaseUid)
}

export { tasteKeyForUid }
