import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'

const XAI_MODELS = ['grok-4.5', 'grok-3', 'grok-2'] as const

function xaiChatPlugin(): Plugin {
  return {
    name: 'loop-xai-chat',
    configureServer(server) {
      server.middlewares.use('/api/chat', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c as Buffer))
        req.on('end', async () => {
          try {
            const env = loadEnv(server.config.mode, process.cwd(), '')
            const key = env.XAI_API_KEY || process.env.XAI_API_KEY
            const body = JSON.parse(
              Buffer.concat(chunks).toString('utf8') || '{}',
            ) as {
              systemPrompt?: string
              messages?: { role: string; content: string }[]
            }

            if (!key) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ fallback: true, reply: null }))
              return
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
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ reply, model }))
                  return
                }
              } catch (e) {
                lastErr = e
              }
            }

            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                fallback: true,
                error: String(lastErr ?? 'xAI unavailable'),
              }),
            )
          } catch (e) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  base: '/loop/',
  plugins: [react(), xaiChatPlugin()],
  server: {
    port: 8080,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: true,
  },
})
