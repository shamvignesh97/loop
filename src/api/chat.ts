import type { Contact } from '../ranking/types'
import type { ThreadMessage } from '../storage/taste'

export async function fetchReply(
  contact: Contact,
  history: ThreadMessage[],
  userText: string,
): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: contact.id,
        systemPrompt: contact.systemPrompt,
        messages: [
          ...history.slice(-8).map((m) => ({
            role: m.from === 'me' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: userText },
        ],
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { reply?: string; fallback?: boolean }
      if (data.reply) return data.reply
    }
  } catch {
    // offline / no key
  }
  return pickFallback(contact, userText)
}

function pickFallback(contact: Contact, userText: string): string {
  const lines = contact.fallbackReplies
  const idx =
    Math.abs(hash(userText + contact.id + String(Date.now() % 7))) %
    lines.length
  return lines[idx]
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
