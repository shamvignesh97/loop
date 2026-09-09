import { useEffect, useState } from 'react'

/** Auto-applies a waiting service worker and briefly shows “Updating…”. */
export function UpdatePrompt() {
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

    let cancelled = false
    let intervalId = 0
    let reloading = false
    // First install: controller was null — do not reload on controllerchange
    const hadControllerAtStart = !!navigator.serviceWorker.controller

    const activateWaiting = (worker: ServiceWorker | null | undefined) => {
      if (!worker || cancelled) return
      setUpdating(true)
      worker.postMessage({ type: 'SKIP_WAITING' })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => undefined)
        })
      }
    }
    const onFocus = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => undefined)
      })
    }
    const onPageShow = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => undefined)
      })
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)

    let removeUpdateFound: (() => void) | undefined

    const track = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        activateWaiting(reg.waiting)
      }

      const onUpdateFound = () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (
            nw.state === 'installed' &&
            navigator.serviceWorker.controller &&
            !cancelled
          ) {
            activateWaiting(nw)
          }
        })
      }
      reg.addEventListener('updatefound', onUpdateFound)
      removeUpdateFound = () => reg.removeEventListener('updatefound', onUpdateFound)

      intervalId = window.setInterval(() => {
        reg.update().catch(() => undefined)
      }, 30_000)
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelled) return
      track(reg)
    })

    const onControllerChange = () => {
      if (!hadControllerAtStart || reloading || cancelled) return
      reloading = true
      setUpdating(true)
      window.setTimeout(() => window.location.reload(), 500)
    }
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    )

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      removeUpdateFound?.()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      )
    }
  }, [])

  if (!updating) return null

  return (
    <div className="update-toast" role="status">
      <span>Updating…</span>
    </div>
  )
}
