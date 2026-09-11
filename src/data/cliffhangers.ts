/** Static dramatic cliffhanger teasers per persona — no AI gen. */
const CLIFFHANGERS: Record<string, string> = {
  mira: "Don't tell anyone what happened after the drop…",
  jordan: 'Your taste just got exposed. Soft launch or damage control?',
  rafi: 'Jordan left a voicemail. The A-side is about you.',
  nico: 'I sketched something I was never supposed to show.',
  asha: 'The café ranked you. The receipt is… spicy.',
  priya: "Tess already briefed me. Your calendar isn't safe.",
  tess: 'Warm-up lied. The real set starts with a secret.',
  elena: 'Chapter margin note: you almost told the truth.',
  yumi: 'Prod is green. One commit still has your name on it.',
  kai: 'Mira changed the eight-count. You missed the cue.',
  sam: 'I plated the chaos. Someone else tasted first.',
  rio: 'Golden hour hit. Someone else was in the frame.',
  lex: 'Draft peer-reviewed. The footnote is about you.',
}

const READ_KEY = 'loop_cliffhangers_read_v1'

export function cliffhangerFor(personaId: string): string | null {
  return CLIFFHANGERS[personaId] ?? null
}

export function loadCliffhangersRead(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function isCliffhangerRead(personaId: string): boolean {
  return Boolean(loadCliffhangersRead()[personaId])
}

export function markCliffhangerRead(personaId: string): void {
  try {
    const next = { ...loadCliffhangersRead(), [personaId]: true }
    localStorage.setItem(READ_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota / private mode */
  }
}

export function cliffhangerPreview(
  personaId: string,
  fallback: string,
): { text: string; unread: boolean; isCliffhanger: boolean } {
  const cliff = cliffhangerFor(personaId)
  if (!cliff) {
    return {
      text: fallback || COPY_FALLBACK,
      unread: false,
      isCliffhanger: false,
    }
  }
  const unread = !isCliffhangerRead(personaId)
  return { text: cliff, unread, isCliffhanger: true }
}

const COPY_FALLBACK = 'Tap to resume conversation...'
