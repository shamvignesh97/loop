/* Loop app-shell service worker — caches shell for offline open */
const CACHE = 'loop-shell-v5'

function basePath() {
  try {
    return new URL('.', self.registration.scope).pathname
  } catch {
    return '/'
  }
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
})
