import { proxyXaiChat, type ChatBody } from './xaiShared.js'

declare const process: { env: Record<string, string | undefined> }

type Req = {
  method?: string
  body?: unknown
}

type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
}

/**
 * Vercel serverless: POST /api/chat
 * Reads XAI_API_KEY from project env. Falls back gracefully when unset.
 */
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    const raw = req.body
    const body = (
      typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
    ) as ChatBody

    const key = process.env.XAI_API_KEY
    const result = await proxyXaiChat(key, body)
    res.status(result.status).json(result.json)
  } catch (e) {
    res.status(400).json({ error: String(e) })
  }
}
