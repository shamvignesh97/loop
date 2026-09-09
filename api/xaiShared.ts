/** Shared xAI chat proxy logic for Vite middleware + Vercel serverless. */

export const XAI_MODELS = ['grok-4.5', 'grok-3', 'grok-2'] as const

export type ChatBody = {
  systemPrompt?: string
  messages?: { role: string; content: string }[]
}


export async function proxyXaiChat(
  key: string | undefined,
  body: ChatBody,
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (!key) {
    return { status: 200, json: { fallback: true, reply: null } }
  }

  let lastErr: unknown
  for (const model of XAI_MODELS) {
    try {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.85,
          max_tokens: 120,
          messages: [
            {
              role: 'system',
              content:
                (body.systemPrompt || 'You are a chat contact.') +
                ' Reply as a text message only. No quotes or labels.',
            },
            ...(body.messages || []),
          ],
        }),
      })
      if (!r.ok) {
        lastErr = await r.text()
        continue
      }
      const data = (await r.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      const reply = data.choices?.[0]?.message?.content?.trim()
      if (reply) {
        return { status: 200, json: { reply, model } }
      }
    } catch (e) {
      lastErr = e
    }
  }

  return {
    status: 502,
    json: {
      fallback: true,
      error: String(lastErr ?? 'xAI unavailable'),
    },
  }
}
