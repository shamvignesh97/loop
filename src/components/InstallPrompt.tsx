import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const iOS = /iphone|ipad|ipod/.test(ua)
  const iPadOs =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOs
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [iosHint, setIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('loop-install-dismissed') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (isStandaloneDisplay()) return

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    if (isIosDevice()) setIosHint(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  if (dismissed || isStandaloneDisplay()) return null
  if (!deferred && !iosHint) return null

  function dismiss() {
    try {
      localStorage.setItem('loop-install-dismissed', '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <div className="install-banner" role="region" aria-label="Install Loop app">
      <div className="install-banner-copy">
        <strong>Install app</strong>
        {deferred ? (
          <span className="muted">Add Loop to your home screen for a full-screen inbox.</span>
        ) : (
          <span className="muted">
            On iPhone/iPad: tap Share → Add to Home Screen.
          </span>
        )}
      </div>
      <div className="install-banner-actions">
        {deferred && (
          <button type="button" className="primary install-btn" onClick={install}>
            Install app
          </button>
        )}
        <button type="button" className="ghost" onClick={dismiss} aria-label="Dismiss">
          Not now
        </button>
      </div>
    </div>
  )
}
