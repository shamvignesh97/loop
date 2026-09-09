import { useState } from 'react'
import { Wordmark } from '../components/Logo'
import { useAuth } from './AuthProvider'

export function AuthScreen() {
  const auth = useAuth()
  const [mode, setMode] = useState<'choose' | 'phone'>('choose')
  const [phone, setPhone] = useState('+')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const showSetup =
    auth.status === 'unconfigured' && !auth.allowBypass && !auth.configured

  async function onGoogle() {
    setBusy(true)
    try {
      await auth.signInGoogle()
    } finally {
      setBusy(false)
    }
  }

  async function onSendCode() {
    setBusy(true)
    try {
      await auth.startPhone(phone)
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmCode() {
    setBusy(true)
    try {
      await auth.confirmPhone(code)
    } finally {
      setBusy(false)
    }
  }

  if (auth.status === 'loading') {
    return (
      <div className="page auth-screen">
        <div className="auth-card">
          <Wordmark />
          <p className="muted auth-loading">Checking session…</p>
        </div>
      </div>
    )
  }

  if (showSetup || (auth.status === 'unconfigured' && !auth.allowBypass)) {
    return (
      <div className="page auth-screen">
        <div className="auth-card">
          <Wordmark />
          <h2>Firebase setup required</h2>
          <p className="muted">
            Loop needs Firebase Authentication (Google + Phone). Add the{' '}
            <code>VITE_FIREBASE_*</code> variables in Vercel (and locally in{' '}
            <code>.env.local</code>), enable Google and Phone providers, and add
            authorized domains <code>localhost</code> and{' '}
            <code>loop-seven-opal.vercel.app</code>. See the README for steps.
          </p>
          {auth.initError && (
            <p className="auth-error" role="alert">
              {auth.initError}
            </p>
          )}
          <ul className="auth-setup-list muted">
            <li>VITE_FIREBASE_API_KEY</li>
            <li>VITE_FIREBASE_AUTH_DOMAIN</li>
            <li>VITE_FIREBASE_PROJECT_ID</li>
            <li>VITE_FIREBASE_APP_ID</li>
            <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>VITE_FIREBASE_STORAGE_BUCKET</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="page auth-screen">
      <div className="hero-brand auth-hero">
        <img
          src={`${import.meta.env.BASE_URL}brand.jpg`}
          alt=""
          className="brand-bg"
        />
        <div className="hero-overlay">
          <Wordmark />
        </div>
      </div>

      <section className="auth-card onboard-panel">
        <h2>Sign in to Loop</h2>
        <p className="muted">
          Your taste and follows stay with your account across devices.
        </p>

        {auth.error && (
          <p className="auth-error" role="alert">
            {auth.error}{' '}
            <button type="button" className="linkish" onClick={auth.clearError}>
              Dismiss
            </button>
          </p>
        )}

        {mode === 'choose' && auth.phoneStep === 'idle' && (
          <div className="onboard-actions">
            <button
              type="button"
              className="primary auth-google"
              disabled={busy || !auth.configured}
              onClick={() => void onGoogle()}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="ghost wide"
              disabled={busy || !auth.configured}
              onClick={() => setMode('phone')}
            >
              Continue with phone
            </button>
            {auth.allowBypass && (
              <button
                type="button"
                className="ghost wide auth-dev"
                disabled={busy}
                onClick={auth.continueAsDev}
              >
                Continue locally (dev)
              </button>
            )}
            {!auth.configured && auth.allowBypass && (
              <p className="muted auth-hint">
                Firebase env vars are missing — local bypass is available in
                development only.
              </p>
            )}
          </div>
        )}

        {(mode === 'phone' || auth.phoneStep === 'code') && (
          <div className="auth-phone">
            {auth.phoneStep === 'idle' ? (
              <>
                <label className="auth-label" htmlFor="loop-phone">
                  Phone number
                </label>
                <input
                  id="loop-phone"
                  className="auth-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155552671"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <p className="muted auth-hint">Use E.164 with country code.</p>
                <div className="onboard-actions">
                  <button
                    type="button"
                    className="primary"
                    disabled={busy || phone.length < 8}
                    onClick={() => void onSendCode()}
                  >
                    Send code
                  </button>
                  <button
                    type="button"
                    className="ghost wide"
                    disabled={busy}
                    onClick={() => {
                      setMode('choose')
                      auth.cancelPhone()
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="auth-label" htmlFor="loop-otp">
                  SMS code
                </label>
                <input
                  id="loop-otp"
                  className="auth-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <div className="onboard-actions">
                  <button
                    type="button"
                    className="primary"
                    disabled={busy || code.trim().length < 4}
                    onClick={() => void onConfirmCode()}
                  >
                    Verify &amp; continue
                  </button>
                  <button
                    type="button"
                    className="ghost wide"
                    disabled={busy}
                    onClick={() => {
                      auth.cancelPhone()
                      setCode('')
                    }}
                  >
                    Resend / change number
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div id="loop-recaptcha" />
      </section>
    </div>
  )
}
