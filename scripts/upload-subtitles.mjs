import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const cloudbase = require('@cloudbase/node-sdk')
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const subtitleRoot = path.join(repoRoot, 'docs', 'wechat-course-sources', 'subtitles')
const unitRoot = path.join(subtitleRoot, 'units')
const manifestPath = path.join(subtitleRoot, 'subtitle-manifest.json')
const mediaManifest = JSON.parse(await readFile(path.join(repoRoot, 'docs', 'wechat-course-sources', 'migration', 'media-manifest.json'), 'utf8'))
const credentials = require(path.join(repoRoot, 'config.js'))

const cloud = cloudbase.init({
  env: mediaManifest.environmentId,
  secretId: credentials.SECRET_ID,
  secretKey: credentials.SECRET_KEY
})

let manifest = {
  schemaVersion: 1,
  environmentId: mediaManifest.environmentId,
  updatedAt: '',
  units: {}
}
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch {}

async function persist() {
  manifest.updatedAt = new Date().toISOString()
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function verify(fileID, unitId, expectedBytes) {
  const result = await cloud.getTempFileURL({ fileList: [fileID] })
  const url = result.fileList?.[0]?.tempFileURL
  if (!url) throw new Error(`云存储未返回临时地址: ${unitId}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`云端字幕验证失败 HTTP ${response.status}: ${unitId}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length !== expectedBytes) throw new Error(`云端字幕大小不一致: ${unitId}`)
  const data = JSON.parse(buffer.toString('utf8'))
  if (data.unitId !== unitId) throw new Error(`云端字幕 Unit 不匹配: ${unitId}`)
}

const files = (await readdir(unitRoot)).filter(name => name.endsWith('.json')).sort()
const failures = []
for (let index = 0; index < files.length; index += 1) {
  const file = files[index]
  const localPath = path.join(unitRoot, file)
  const content = await readFile(localPath)
  const data = JSON.parse(content.toString('utf8'))
  const sha256 = createHash('sha256').update(content).digest('hex')
  const current = manifest.units[data.unitId]
  console.log(`[${index + 1}/${files.length}] ${data.unitId}`)
  if (current?.sha256 === sha256 && current?.status === 'verified' && current.fileID) continue

  const match = data.unitId.match(/^grade(\d+)-(upper|lower)-(?:unit-(\d+)|extras)$/)
  if (!match) {
    failures.push({ unitId: data.unitId, message: 'Unit ID 格式无效' })
    continue
  }
  const section = match[3] ? `unit-${match[3]}` : 'extras'
  const cloudPath = `course-subtitles/grade${match[1]}/${match[2]}/${section}-${sha256.slice(0, 12)}.json`
  try {
    const result = await cloud.uploadFile({
      cloudPath,
      fileContent: fs.createReadStream(localPath)
    })
    if (!result.fileID) throw new Error('上传成功但未返回 fileID')
    const bytes = (await stat(localPath)).size
    await verify(result.fileID, data.unitId, bytes)
    manifest.units[data.unitId] = {
      status: 'verified',
      fileID: result.fileID,
      cloudPath,
      sha256,
      bytes,
      videoTracks: Object.keys(data.video || {}).length,
      audioTracks: Object.keys(data.audio || {}).length,
      videoLines: Object.values(data.video || {}).reduce((sum, lines) => sum + lines.length, 0),
      audioLines: Object.values(data.audio || {}).reduce((sum, lines) => sum + lines.length, 0),
      verifiedAt: new Date().toISOString()
    }
    await persist()
  } catch (error) {
    failures.push({ unitId: data.unitId, message: error.message })
    manifest.units[data.unitId] = {
      ...(manifest.units[data.unitId] || {}),
      status: 'failed',
      cloudPath,
      sha256,
      lastError: error.message
    }
    await persist()
  }
}

await persist()
console.log(JSON.stringify({ total: files.length, verified: Object.values(manifest.units).filter(item => item.status === 'verified').length, failed: failures.length }, null, 2))
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
}
