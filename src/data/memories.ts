export type PersonaMemory = {
  id: string
  key: string
  fact: string
}

/** Static read-only key facts derived from tags/bio — no AI gen. */
const MEMORIES: Record<string, PersonaMemory[]> = {
  mira: [
    { id: 'mira-1', key: 'Loves', fact: '1am voice notes on the dance floor' },
    { id: 'mira-2', key: 'Secret', fact: 'Knows your For You feed is lying' },
    { id: 'mira-3', key: 'Vibe', fact: 'Chaotic lowercase wit' },
  ],
  jordan: [
    { id: 'jordan-1', key: 'Loves', fact: 'Soft lighting & campaign frames' },
    { id: 'jordan-2', key: 'Rates', fact: 'Conversations like outfits' },
    { id: 'jordan-3', key: 'Secret', fact: 'Taste is public now' },
  ],
  rafi: [
    { id: 'rafi-1', key: 'Loves', fact: 'Late-night DJ brain / A-sides' },
    { id: 'rafi-2', key: 'Linked', fact: 'Sibling energy with Jordan' },
    { id: 'rafi-3', key: 'Secret', fact: 'Queue is open tonight' },
  ],
  nico: [
    { id: 'nico-1', key: 'Loves', fact: 'Sketchbook questions that stick' },
    { id: 'nico-2', key: 'Hates', fact: 'Easy likes without the why' },
    { id: 'nico-3', key: 'Secret', fact: 'Saved your silence for later' },
  ],
  asha: [
    { id: 'asha-1', key: 'Loves', fact: 'Passport stamps & spice' },
    { id: 'asha-2', key: 'Linked', fact: "Nico's travel twin" },
    { id: 'asha-3', key: 'Secret', fact: 'Cafés that rank people by order' },
  ],
  priya: [
    { id: 'priya-1', key: 'Loves', fact: 'Calendar triage & sharp latency' },
    { id: 'priya-2', key: 'Linked', fact: 'Tess already liked you' },
    { id: 'priya-3', key: 'Collects', fact: 'Skips as data points' },
  ],
  tess: [
    { id: 'tess-1', key: 'Loves', fact: 'PRs, punchlines, one-set wins' },
    { id: 'tess-2', key: 'Linked', fact: "Priya's gym twin" },
    { id: 'tess-3', key: 'Secret', fact: "Warm-up's over when you show up" },
  ],
  elena: [
    { id: 'elena-1', key: 'Loves', fact: 'Annotating margins at night' },
    { id: 'elena-2', key: 'Hates', fact: 'Sleep ruined by unfinished chapters' },
    { id: 'elena-3', key: 'Secret', fact: 'A skip can be a plot twist' },
  ],
  yumi: [
    { id: 'yumi-1', key: 'Loves', fact: 'Tiny tools & shipping feelings' },
    { id: 'yumi-2', key: 'Linked', fact: 'Elena reads between the lines' },
    { id: 'yumi-3', key: 'Secret', fact: 'Your attention is the deploy' },
  ],
  kai: [
    { id: 'kai-1', key: 'Loves', fact: 'Beats, not calories' },
    { id: 'kai-2', key: 'Linked', fact: "Mira's rehearsal buddy" },
    { id: 'kai-3', key: 'Secret', fact: 'Wrong tempo ≠ wrong you' },
  ],
  sam: [
    { id: 'sam-1', key: 'Loves', fact: 'Recipes as soft launches' },
    { id: 'sam-2', key: 'Linked', fact: 'Rio already booked the table' },
    { id: 'sam-3', key: 'Secret', fact: 'Seasoned replies need acid (jokes)' },
  ],
  rio: [
    { id: 'rio-1', key: 'Loves', fact: 'Golden-hour lighting scouts' },
    { id: 'rio-2', key: 'Linked', fact: 'Sam packed snacks; Rio packed opinions' },
    { id: 'rio-3', key: 'Secret', fact: 'Skip is just a layover' },
  ],
  lex: [
    { id: 'lex-1', key: 'Loves', fact: 'Docs before dawn + diagrams' },
    { id: 'lex-2', key: 'Linked', fact: 'Yumi says latency is fine' },
    { id: 'lex-3', key: 'Secret', fact: 'A skip is a 404 — try another route' },
  ],
}

const CACHE_KEY = 'loop_active_memories_cache_v1'

export function memoriesFor(personaId: string): PersonaMemory[] {
  return MEMORIES[personaId] ?? []
}

/** Optional warm cache so badge count can paint immediately. */
export function cacheMemories(personaId: string, items: PersonaMemory[]): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const all: Record<string, Array<{ id: string; fact: string }>> = raw
      ? (JSON.parse(raw) as Record<string, Array<{ id: string; fact: string }>>)
      : {}
    all[personaId] = items.map(({ id, fact }) => ({ id, fact }))
    localStorage.setItem(CACHE_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

export function readCachedMemoryCount(personaId: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const all = JSON.parse(raw) as Record<
      string,
      Array<{ id: string; fact: string }>
    >
    const list = all[personaId]
    return Array.isArray(list) ? list.length : null
  } catch {
    return null
  }
}
