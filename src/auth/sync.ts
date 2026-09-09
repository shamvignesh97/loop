import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { PersistedLoop } from '../storage/taste'
import { getFirebaseDb } from './firebase'

const WRITE_DEBOUNCE_MS = 800

let writeTimer: ReturnType<typeof setTimeout> | null = null
let pending: { uid: string; data: PersistedLoop } | null = null

function loopDoc(uid: string) {
  const db = getFirebaseDb()
  if (!db) return null
  return doc(db, 'users', uid, 'data', 'loop')
}

/** Load cloud taste if Firestore is available; returns null on miss/error. */
export async function loadFromFirestore(
  uid: string,
): Promise<PersistedLoop | null> {
  const ref = loopDoc(uid)
  if (!ref) return null
  try {
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data() as PersistedLoop
    if (data?.version !== 2) return null
    return data
  } catch {
    return null
  }
}

async function flushWrite(): Promise<void> {
  if (!pending) return
  const { uid, data } = pending
  pending = null
  const ref = loopDoc(uid)
  if (!ref) return
  try {
    await setDoc(ref, data, { merge: true })
  } catch {
    /* rules/offline — localStorage remains source of truth */
  }
}

/** Debounced write of taste JSON to users/{uid}/data/loop. */
export function scheduleFirestoreSave(uid: string, data: PersistedLoop): void {
  if (!getFirebaseDb()) return
  pending = { uid, data }
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    void flushWrite()
  }, WRITE_DEBOUNCE_MS)
}

export function cancelPendingFirestoreSave(): void {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  pending = null
}
