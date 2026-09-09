/** Firebase / Vite env helpers — never invent real keys. */

export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  messagingSenderId: string
  storageBucket: string
}

function read(key: keyof ImportMetaEnv): string {
  const v = import.meta.env[key]
  return typeof v === 'string' ? v.trim() : ''
}

export function getFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    appId: read('VITE_FIREBASE_APP_ID'),
    messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET'),
  }
}

/** True when the minimum set of Firebase web config values is present. */
export function isFirebaseConfigured(cfg = getFirebaseConfig()): boolean {
  return Boolean(
    cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.appId,
  )
}

/** Local-only bypass: only in Vite DEV when Firebase is not configured. */
export function allowDevBypass(): boolean {
  return Boolean(import.meta.env.DEV) && !isFirebaseConfigured()
}
