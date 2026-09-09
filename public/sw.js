/* Loop app-shell service worker — caches shell for offline open */
/* BUILD_ID is replaced at build time so every deploy changes SW bytes */
const BUILD = '__LOOP_BUILD_ID__'
const CACHE = 'loop-shell-v6-' + BUILD

function basePath() {
  try {
    return new URL('.', self.registration.scope).pathname
  } catch {
    return '/'
  }
}

function isAsset(url) {
  const p = url.pathname
  return (
    p.includes('/assets/') ||
    p.endsWith('.js') ||
    p.endsWith('.mjs') ||
    p.endsWith('.css') ||
    p.endsWith('.module.css')
  )
}

function isImageOrIcon(url) {
  const p = url.pathname
  return (
    /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(p) ||
    p.includes('icon-') ||
    p.endsWith('favicon.svg') ||
    p.endsWith('brand.jpg')
  )
}

self.addEventListener('install', (event) => {
  const base = basePath()
  const shell = [
    base,
    base + 'index.html',
    base + 'manifest.webmanifest',
    base + 'icon-192.png',
    base + 'icon-512.png',
    base + 'favicon.svg',
    base + 'brand.jpg',
  ]
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(shell).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Never cache the API
  if (url.pathname.includes('/api/')) return

  // Navigations: network-first, cache only as offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(async () => {
          const cached =
            (await caches.match(req)) ||
            (await caches.match(basePath() + 'index.html')) ||
            (await caches.match(basePath()))
          return cached || Response.error()
        }),
    )
    return
  }

  // JS/CSS/modules: network-first — never prefer stale hashed bundles when online
  if (isAsset(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          return cached || Response.error()
        }),
    )
    return
  }

  // Images/icons: stale-while-revalidate
  if (isImageOrIcon(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          })
          .catch(() => cached)
        return cached || fetched
      }),
    )
    return
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(req)
        return cached || Response.error()
      }),
  )
})
