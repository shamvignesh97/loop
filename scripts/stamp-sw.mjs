#!/usr/bin/env node
/**
 * Stamp dist/sw.js with a unique build id so browsers always see a new SW file.
 * Prefer git short sha; fall back to Date.now().
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const swPath = join(root, 'dist', 'sw.js')
const indexPath = join(root, 'dist', 'index.html')
const notFoundPath = join(root, 'dist', '404.html')

if (!existsSync(swPath)) {
  console.error('stamp-sw: dist/sw.js missing — run vite build first')
  process.exit(1)
}

let buildId
try {
  buildId = execSync('git rev-parse --short HEAD', {
    cwd: root,
    encoding: 'utf8',
  }).trim()
} catch {
  buildId = String(Date.now())
}
buildId = `${buildId}-${Date.now()}`

let sw = readFileSync(swPath, 'utf8')
if (!sw.includes('__LOOP_BUILD_ID__')) {
  console.warn('stamp-sw: placeholder __LOOP_BUILD_ID__ not found; appending BUILD const')
  sw = `const BUILD = '${buildId}'\n` + sw
} else {
  sw = sw.replaceAll('__LOOP_BUILD_ID__', buildId)
}
writeFileSync(swPath, sw)

if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath)
}

console.log(`stamp-sw: CACHE build id = ${buildId}`)
