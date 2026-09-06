#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path

const ROOT = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(ROOT, 'output', 'imagegen', 'chess-pieces')
const OUTPUT_DIR = path.join(SOURCE_DIR, 'final')
const PIECES = [
  ['king', 'k'],
  ['queen', 'q'],
  ['rook', 'r'],
  ['bishop', 'b'],
  ['knight', 'n'],
  ['pawn', 'p']
]
const COLOR_KEY_FILTER = 'colorkey=0xF209F1:0.22:0.07,format=rgba,scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=0x00000000'

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

for (const [name, code] of PIECES) {
  const input = path.join(SOURCE_DIR, `${name}-pair-metal.png`)
  if (!fs.existsSync(input)) throw new Error(`缺少金银配对原图: ${input}`)
  for (const side of [
    { color: 'w', x: 0 },
    { color: 'b', x: 768 }
  ]) {
    const output = path.join(OUTPUT_DIR, `${side.color}${code}.png`)
    execFileSync(ffmpegPath, [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', input,
      '-vf', `crop=768:1024:${side.x}:0,${COLOR_KEY_FILTER}`,
      '-frames:v', '1', output
    ], { stdio: 'inherit' })
    console.log(`${path.basename(output)} ready`)
  }
}
