import { useEffect, useState } from 'react'

/** Toast when a new service worker is waiting after a deploy. */
export function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

    let cancelled = false
    let intervalId = 0

    const track = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) setWaiting(reg.waiting)

      const onUpdateFound = () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (
            nw.state === 'installed' &&
            navigator.serviceWorker.controller &&
            !cancelled
          ) {
            setWaiting(nw)
          }
        })
      }
      reg.addEventListener('updatefound', onUpdateFound)

      intervalId = window.setInterval(() => {
        reg.update().catch(() => undefined)
      }, 60_000)
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelled) return
      track(reg)
    })

    const onControllerChange = () => {
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    )

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      )
    }
  }, [])

  if (!waiting) return null

  function refresh() {
    waiting?.postMessage({ type: 'SKIP_WAITING' })
    window.setTimeout(() => window.location.reload(), 350)
  }

  return (
    <div className="update-toast" role="status">
      <span>Update available — Refresh</span>
      <button type="button" className="primary install-btn" onClick={refresh}>
        Refresh
      </button>
    </div>
  )
}
