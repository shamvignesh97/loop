export type AuthProviderKind = 'google' | 'phone' | 'dev'

export interface LoopAuthUser {
  uid: string
  displayName: string
  email: string | null
  phoneNumber: string | null
  photoURL: string | null
  provider: AuthProviderKind
  /** True when signed in via local DEV bypass (no Firebase). */
  isDevBypass: boolean
}

export function storageUidKey(uid: string): string {
  return `uid:${uid}`
}

export function tasteKeyForUid(uid: string): string {
  return `loop-chat-v2:uid:${uid}`
}
