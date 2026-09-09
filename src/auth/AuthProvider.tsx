import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth'
import { allowDevBypass, isFirebaseConfigured } from './config'
import { getFirebaseAuth, getInitError, googleProvider } from './firebase'
import type { AuthProviderKind, LoopAuthUser } from './types'

const DEV_BYPASS_KEY = 'loop-dev-bypass-v1'

type AuthStatus =
  | 'loading'
  | 'ready'
  | 'unconfigured'
  | 'signedOut'
  | 'signedIn'

type AuthContextValue = {
  status: AuthStatus
  user: LoopAuthUser | null
  configured: boolean
  initError: string | null
  allowBypass: boolean
  error: string | null
  clearError: () => void
  signInGoogle: () => Promise<void>
  startPhone: (e164: string) => Promise<void>
  confirmPhone: (code: string) => Promise<void>
  cancelPhone: () => void
  phoneStep: 'idle' | 'code'
  signOut: () => Promise<void>
  continueAsDev: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: User): LoopAuthUser {
  const providerId = user.providerData[0]?.providerId ?? ''
  let provider: AuthProviderKind = 'google'
  if (providerId.includes('phone') || user.phoneNumber) provider = 'phone'
  else if (providerId.includes('google') || user.email) provider = 'google'

  const displayName =
    user.displayName ||
    user.email ||
    user.phoneNumber ||
    'Loop user'

  return {
    uid: user.uid,
    displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    provider,
    isDevBypass: false,
  }
}

function readDevBypass(): LoopAuthUser | null {
  if (!allowDevBypass()) return null
  try {
    const raw = localStorage.getItem(DEV_BYPASS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LoopAuthUser
    if (parsed?.uid && parsed.isDevBypass) return parsed
  } catch {
    /* ignore */
  }
  return null
}

function writeDevBypass(user: LoopAuthUser | null): void {
  try {
    if (!user) localStorage.removeItem(DEV_BYPASS_KEY)
    else localStorage.setItem(DEV_BYPASS_KEY, JSON.stringify(user))
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const allowBypass = allowDevBypass()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<LoopAuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneStep, setPhoneStep] = useState<'idle' | 'code'>('idle')
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const initError = getInitError()

  useEffect(() => {
    if (!configured) {
      const bypass = readDevBypass()
      if (bypass) {
        setUser(bypass)
        setStatus('signedIn')
      } else {
        setStatus('unconfigured')
      }
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setStatus('unconfigured')
      return
    }

    let cancelled = false

    void getRedirectResult(auth).catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (cancelled) return
      if (fbUser) {
        writeDevBypass(null)
        setUser(mapUser(fbUser))
        setStatus('signedIn')
        setPhoneStep('idle')
        confirmationRef.current = null
      } else {
        setUser(null)
        setStatus('signedOut')
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [configured, allowBypass])

  const clearError = useCallback(() => setError(null), [])

  const ensureRecaptcha = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase Auth is not ready')
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear()
      } catch {
        /* ignore */
      }
      recaptchaRef.current = null
    }
    const el = document.getElementById('loop-recaptcha')
    if (!el) throw new Error('reCAPTCHA container missing')
    const verifier = new RecaptchaVerifier(auth, 'loop-recaptcha', {
      size: 'invisible',
    })
    recaptchaRef.current = verifier
    await verifier.render()
    return verifier
  }, [])

  const signInGoogle = useCallback(async () => {
    setError(null)
    const auth = getFirebaseAuth()
    if (!auth) {
      setError('Firebase is not configured')
      return
    }
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (
        msg.includes('popup') ||
        msg.includes('blocked') ||
        msg.includes('cancelled')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : String(e2))
          return
        }
      }
      setError(msg)
    }
  }, [])

  const startPhone = useCallback(
    async (e164: string) => {
      setError(null)
      const auth = getFirebaseAuth()
      if (!auth) {
        setError('Firebase is not configured')
        return
      }
      const phone = e164.trim()
      if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
        setError('Use E.164 format, e.g. +14155552671')
        return
      }
      try {
        const verifier = await ensureRecaptcha()
        const conf = await signInWithPhoneNumber(auth, phone, verifier)
        confirmationRef.current = conf
        setPhoneStep('code')
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        try {
          recaptchaRef.current?.clear()
        } catch {
          /* ignore */
        }
        recaptchaRef.current = null
      }
    },
    [ensureRecaptcha],
  )

  const confirmPhone = useCallback(async (code: string) => {
    setError(null)
    const conf = confirmationRef.current
    if (!conf) {
      setError('Request a new code first')
      return
    }
    try {
      await conf.confirm(code.trim())
      setPhoneStep('idle')
      confirmationRef.current = null
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const cancelPhone = useCallback(() => {
    setPhoneStep('idle')
    confirmationRef.current = null
    setError(null)
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    writeDevBypass(null)
    const auth = getFirebaseAuth()
    if (auth) {
      try {
        await firebaseSignOut(auth)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    setUser(null)
    setStatus(configured ? 'signedOut' : 'unconfigured')
    setPhoneStep('idle')
  }, [configured])

  const continueAsDev = useCallback(() => {
    if (!allowDevBypass()) return
    const bypass: LoopAuthUser = {
      uid: 'dev-local',
      displayName: 'Dev user',
      email: null,
      phoneNumber: null,
      photoURL: null,
      provider: 'dev',
      isDevBypass: true,
    }
    writeDevBypass(bypass)
    setUser(bypass)
    setStatus('signedIn')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      configured,
      initError,
      allowBypass,
      error,
      clearError,
      signInGoogle,
      startPhone,
      confirmPhone,
      cancelPhone,
      phoneStep,
      signOut,
      continueAsDev,
    }),
    [
      status,
      user,
      configured,
      initError,
      allowBypass,
      error,
      clearError,
      signInGoogle,
      startPhone,
      confirmPhone,
      cancelPhone,
      phoneStep,
      signOut,
      continueAsDev,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
