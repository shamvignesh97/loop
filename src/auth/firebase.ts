import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFirebaseConfig, isFirebaseConfigured } from './config'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let initError: string | null = null

export function getInitError(): string | null {
  return initError
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app
  if (!isFirebaseConfigured()) return null
  try {
    const cfg = getFirebaseConfig()
    app = getApps().length ? getApps()[0]! : initializeApp(cfg)
    return app
  } catch (e) {
    initError = e instanceof Error ? e.message : String(e)
    return null
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth
  const a = getFirebaseApp()
  if (!a) return null
  try {
    auth = getAuth(a)
    void setPersistence(auth, browserLocalPersistence)
    return auth
  } catch (e) {
    initError = e instanceof Error ? e.message : String(e)
    return null
  }
}

export function getFirebaseDb(): Firestore | null {
  if (db) return db
  const a = getFirebaseApp()
  if (!a) return null
  try {
    db = getFirestore(a)
    return db
  } catch {
    return null
  }
}

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
