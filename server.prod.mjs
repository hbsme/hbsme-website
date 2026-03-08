/**
 * HBSME — Serveur de production
 * Wrapper Node.js HTTP autour du fetch handler TanStack Start buildé.
 * Lance avec: node server.prod.mjs
 */
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { config as dotenvConfig } from 'dotenv'

// Charger les variables d'environnement depuis .env
dotenvConfig()

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3010

// Importer le bundle SSR buildé
const mod = await import(join(__dirname, 'dist/server/server.js'))
const handler = mod.default?.fetch || mod.fetch

if (!handler) {
  console.error('❌ Impossible de trouver le fetch handler dans dist/server/server.js')
  process.exit(1)
}

const server = createServer(async (req, res) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = chunks.length ? Buffer.concat(chunks) : null

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v[0] : v)
  }

  const url = `http://localhost:${PORT}${req.url}`
  const webReq = new Request(url, {
    method: req.method,
    headers,
    body: body?.length ? body : undefined,
  })

  try {
    const webRes = await handler(webReq)
    const resHeaders = {}
    webRes.headers.forEach((v, k) => { resHeaders[k] = v })
    res.writeHead(webRes.status, resHeaders)
    if (webRes.body) {
      Readable.fromWeb(webRes.body).pipe(res)
    } else {
      res.end()
    }
  } catch (e) {
    console.error('[HBSME] Erreur handler:', e)
    res.writeHead(500)
    res.end('Server error')
  }
})

server.listen(PORT, () => {
  console.log(`✅ HBSME prod — http://localhost:${PORT}`)
})
