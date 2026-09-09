import type { Contact } from '../ranking/types'

/** Tag-based first-message starters — no API calls. */
const TAG_STARTERS: Record<string, string[]> = {
  dance: ['Show me a move for my week', 'Challenge my rhythm'],
  funny: ['Make me laugh about my day', 'Roast my routine gently'],
  night: ['What should I do with tonight?', 'Late-night hot take?'],
  looks: ['Rate my vibe from this chat', 'Give me a style challenge'],
  style: ['Outfit idea for my mood', 'What am I signaling?'],
  art: ['Ask me something that sticks', 'Describe my day as a sketch'],
  music: ['Queue something for my mood', 'Rank my last three listens'],
  witty: ['Challenge my thinking', 'Ask me a difficult question'],
  deep: ['Ask me something real', 'What am I avoiding?'],
  books: ['Recommend a chapter for me', 'What should I underline next?'],
  travel: ['Where should I go next?', 'Start a city ranking'],
  food: ['Pick my next craving', 'Food take — go'],
  career: ['Help me triage this week', 'What is worth optimizing?'],
  fitness: ['Warm-up challenge', 'Give me a one-set win'],
  tech: ['Debug my attention', 'Ship me a tiny idea'],
}

const FALLBACK = [
  'Help me improve my routine',
  'Ask me a difficult question',
  'Give me a new idea',
  'Challenge my thinking',
]

/** 3–4 persona-tag-based starter prompts for empty chats. */
export function startersForContact(contact: Contact, count = 4): string[] {
  const picked: string[] = []
  const seen = new Set<string>()
  for (const tag of contact.tags) {
    const pool = TAG_STARTERS[tag] ?? []
    for (const s of pool) {
      if (seen.has(s)) continue
      seen.add(s)
      picked.push(s)
      if (picked.length >= count) return picked
    }
  }
  for (const s of FALLBACK) {
    if (seen.has(s)) continue
    seen.add(s)
    picked.push(s)
    if (picked.length >= count) break
  }
  return picked.slice(0, count)
}
