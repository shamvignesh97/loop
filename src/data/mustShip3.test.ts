import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CAST } from './cast'
import {
  cliffhangerFor,
  isCliffhangerRead,
  markCliffhangerRead,
  loadCliffhangersRead,
} from './cliffhangers'
import { COPY_STRINGS } from './copy'
import {
  cacheMemories,
  memoriesFor,
  readCachedMemoryCount,
} from './memories'
import {
  consumeDraftStarter,
  plotTwistsFor,
  saveDraftStarter,
} from './plotTwists'

function installMemoryLocalStorage() {
  const store = new Map<string, string>()
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v))
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: ls,
    configurable: true,
  })
}

beforeEach(() => {
  installMemoryLocalStorage()
})

afterEach(() => {
  localStorage.clear()
})

describe('cliffhangers', () => {
  it('provides a teaser for every cast member', () => {
    for (const c of CAST) {
      expect(cliffhangerFor(c.id)).toBeTruthy()
      expect(cliffhangerFor(c.id)!.length).toBeGreaterThan(8)
    }
  })

  it('marks read in loop_cliffhangers_read_v1', () => {
    expect(isCliffhangerRead('mira')).toBe(false)
    markCliffhangerRead('mira')
    expect(isCliffhangerRead('mira')).toBe(true)
    expect(loadCliffhangersRead().mira).toBe(true)
  })

  it('falls back null for unknown ids', () => {
    expect(cliffhangerFor('nobody')).toBeNull()
  })
})

describe('plotTwists', () => {
  it('returns exactly two dramatic starters per persona', () => {
    for (const c of CAST) {
      const starters = plotTwistsFor(c.id)
      expect(starters).toHaveLength(2)
      for (const s of starters) {
        expect(s.label.length).toBeGreaterThan(2)
        expect(s.payload.length).toBeGreaterThan(10)
      }
    }
  })

  it('persists and consumes draft starters', () => {
    saveDraftStarter('mira', 'hello plot')
    expect(consumeDraftStarter('mira')).toBe('hello plot')
    expect(consumeDraftStarter('mira')).toBeNull()
  })
})

describe('memories', () => {
  it('exposes key/value memories for cast', () => {
    for (const c of CAST) {
      const mems = memoriesFor(c.id)
      expect(mems.length).toBeGreaterThan(0)
      for (const m of mems) {
        expect(m.key).toBeTruthy()
        expect(m.fact).toBeTruthy()
      }
    }
  })

  it('caches count for badge warm paint', () => {
    const mems = memoriesFor('jordan')
    cacheMemories('jordan', mems)
    expect(readCachedMemoryCount('jordan')).toBe(mems.length)
  })

  it('copy strings cover chip labels', () => {
    expect(COPY_STRINGS.MEMORY_CHIP_SINGULAR).toBe('1 Memory')
    expect(COPY_STRINGS.MEMORY_CHIP_PLURAL(3)).toBe('3 Memories')
    expect(COPY_STRINGS.MEMORY_SHEET_TITLE).toBe('Persona Memory Bank')
  })
})
