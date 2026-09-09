import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import { proxyXaiChat, type ChatBody } from './api/xaiShared.ts'

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
            ) as ChatBody

            const result = await proxyXaiChat(key, body)
            res.statusCode = result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.json))
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
  base: process.env.VITE_BASE || '/',
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
