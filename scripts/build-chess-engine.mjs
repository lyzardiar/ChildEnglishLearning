#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const vendorOutput = path.join(root, 'miniprogram', 'vendor', 'js-chess-engine.js')
const workerOutput = path.join(root, 'miniprogram', 'workers', 'chess-ai.js')

await build({
  entryPoints: [path.join(scriptDir, 'chess-engine-entry.js')],
  outfile: vendorOutput,
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'cjs',
  target: ['es2018'],
  legalComments: 'none',
  banner: {
    js: '/* js-chess-engine 2.4.6 | MIT License | bundled for WeChat Mini Program */'
  }
})

await build({
  entryPoints: [path.join(scriptDir, 'chess-worker-entry.js')],
  outfile: workerOutput,
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2018'],
  legalComments: 'none',
  banner: {
    js: '/* js-chess-engine 2.4.6 | MIT License | standalone WeChat Worker */'
  }
})

console.log(JSON.stringify({
  outputs: [path.relative(root, vendorOutput), path.relative(root, workerOutput)]
}, null, 2))
