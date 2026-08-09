import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const cloudbase = require('@cloudbase/node-sdk')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('ffprobe-static').path
const { asr } = require('tencentcloud-sdk-nodejs-asr')

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const subtitleRoot = path.join(repoRoot, 'docs', 'wechat-course-sources', 'subtitles')
const rawRoot = path.join(subtitleRoot, 'raw')
const mediaRawRoot = path.join(rawRoot, 'media')
const unitIndexRoot = path.join(rawRoot, 'unit-indexes')
const progressPath = path.join(subtitleRoot, 'progress.json')
const manifestPath = path.join(repoRoot, 'docs', 'wechat-course-sources', 'migration', 'media-manifest.json')
const ASR_DATA_LIMIT = 4.5 * 1024 * 1024
const CHUNK_DURATION_MS = 480000
const CHUNK_OVERLAP_MS = 2000

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : fallback
}

function hasArg(name) {
  return process.argv.includes(`--${name}`)
}

function unitKey(item) {
  const section = item.unitNumber == null ? 'extras' : `unit-${String(item.unitNumber).padStart(2, '0')}`
  return `grade${item.grade}-${item.semester}-${section}`
}

function mediaSort(a, b) {
  return a.grade - b.grade ||
    a.semester.localeCompare(b.semester) ||
    a.unitNumber - b.unitNumber ||
    a.mediaType.localeCompare(b.mediaType) ||
    (a.sequence || 0) - (b.sequence || 0) ||
    a.label.localeCompare(b.label, 'zh-CN')
}

function isLoopAudio(item) {
  return item.mediaType === 'audio' && /循环/.test(item.label)
}

function isSingleAudio(item) {
  return item.mediaType === 'audio' && /单次/.test(item.label)
}

async function exists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`${path.basename(command)} 退出码 ${code}: ${stderr.slice(-1200)}`))
    })
  })
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const credentials = require(path.join(repoRoot, 'config.js'))
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const cacheRoot = path.resolve(manifest.cacheRoot || path.join(repoRoot, '.cache', 'course-media'))
const allMode = hasArg('all')
const localAsrMode = hasArg('local-asr')
const grade = Number(readArg('grade', '1'))
const semester = readArg('semester', 'lower')
const selectedUnit = Number(readArg('unit', '1'))
const whisperRoot = path.join(cacheRoot, 'tools', 'whisper.cpp')
const whisperCliPath = path.join(whisperRoot, 'bin', 'Release', 'whisper-cli.exe')
const whisperModelPath = path.join(whisperRoot, 'ggml-small.en-q5_1.bin')

const mediaItems = manifest.media
  .filter(item =>
    (
      (item.upload?.status === 'verified' && item.upload.fileID) ||
      (
        item.mediaType === 'audio' &&
        item.download?.status === 'downloaded' &&
        item.cloudPath &&
        existsSync(path.join(cacheRoot, ...item.cloudPath.split('/')))
      )
    ) &&
    (allMode || (item.grade === grade && item.semester === semester && item.unitNumber === selectedUnit))
  )
  .sort(mediaSort)

if (!mediaItems.length) throw new Error('没有找到符合条件的已上传媒体')

await Promise.all([
  mkdir(cacheRoot, { recursive: true }),
  mkdir(mediaRawRoot, { recursive: true }),
  mkdir(unitIndexRoot, { recursive: true })
])

const cloud = cloudbase.init({
  env: manifest.environmentId,
  secretId: credentials.SECRET_ID,
  secretKey: credentials.SECRET_KEY
})

const AsrClient = asr.v20190614.Client
const asrClient = new AsrClient({
  credential: {
    secretId: credentials.SECRET_ID,
    secretKey: credentials.SECRET_KEY
  },
  region: 'ap-guangzhou',
  profile: { httpProfile: { endpoint: 'asr.tencentcloudapi.com' } }
})

async function downloadFile(item, destination) {
  if (await exists(destination)) {
    const current = await stat(destination)
    if (!item.download?.bytes || current.size === item.download.bytes) return
  }

  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await cloud.getTempFileURL({ fileList: [item.upload.fileID] })
      const tempUrl = result.fileList?.[0]?.tempFileURL
      if (!tempUrl) throw new Error(`无法取得临时地址: ${item.upload.fileID}`)
      const response = await fetch(tempUrl, { signal: AbortSignal.timeout(300000) })
      if (!response.ok) throw new Error(`下载失败 HTTP ${response.status}: ${item.mediaId}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      if (item.download?.bytes && buffer.length !== item.download.bytes) {
        throw new Error(`下载大小不一致: ${buffer.length}/${item.download.bytes}`)
      }
      await writeFile(destination, buffer)
      return
    } catch (error) {
      lastError = error
      if (attempt === 3) break
      console.warn(`  下载重试 ${attempt}/3: ${error.message}`)
      await wait(attempt * 2000)
    }
  }
  throw lastError
}

async function getDurationMs(mediaPath) {
  const output = await run(ffprobePath, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    mediaPath
  ])
  const durationMs = Math.round(Number(output.trim()) * 1000)
  if (!Number.isFinite(durationMs)) throw new Error(`无法读取媒体时长: ${mediaPath}`)
  return durationMs
}

async function extractAudio(mediaPath, audioPath) {
  if (await exists(audioPath) && (await stat(audioPath)).size > 0) return
  await mkdir(path.dirname(audioPath), { recursive: true })
  await run(ffmpegPath, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', mediaPath,
    '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k',
    audioPath
  ])
}

async function extractChunk(audioPath, chunkPath, startMs, durationMs) {
  if (await exists(chunkPath) && (await stat(chunkPath)).size > 0) return
  await mkdir(path.dirname(chunkPath), { recursive: true })
  await run(ffmpegPath, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(startMs / 1000),
    '-t', String(durationMs / 1000),
    '-i', audioPath,
    '-ac', '1', '-ar', '16000', '-b:a', '32k',
    chunkPath
  ])
}

async function recognizeBuffer(audio, label) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const created = await asrClient.CreateRecTask({
        EngineModelType: '16k_en',
        ChannelNum: 1,
        ResTextFormat: 3,
        SourceType: 1,
        Data: audio.toString('base64'),
        DataLen: audio.length
      })
      const taskId = created.Data?.TaskId
      if (!taskId) throw new Error('腾讯云 ASR 未返回任务 ID')

      for (let poll = 0; poll < 120; poll += 1) {
        await wait(2000)
        const response = await asrClient.DescribeTaskStatus({ TaskId: taskId })
        if (response.Data?.Status === 2) return response
        if (response.Data?.Status === 3) throw new Error(response.Data.ErrorMsg || `ASR 任务 ${taskId} 失败`)
      }
      throw new Error(`ASR 任务超时: ${label}`)
    } catch (error) {
      if (attempt === 3) throw error
      console.warn(`  ASR 重试 ${attempt}/3: ${error.message}`)
      await wait(attempt * 2000)
    }
  }
}

function cleanEnglish(value) {
  return String(value || '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeResponse(response, offsetMs = 0) {
  return (response.Data?.ResultDetail || [])
    .filter(item => item.FinalSentence && Number.isFinite(item.StartMs) && Number.isFinite(item.EndMs))
    .map(item => {
      const words = (item.Words || []).filter(word => Number.isFinite(word.OffsetStartMs) && Number.isFinite(word.OffsetEndMs))
      const firstWord = words.find(word => /[\p{L}\p{N}]/u.test(word.Word || '')) || words[0]
      const lastWord = [...words].reverse().find(word => /[\p{L}\p{N}]/u.test(word.Word || '')) || words.at(-1)
      return {
        startMs: offsetMs + (firstWord ? item.StartMs + firstWord.OffsetStartMs : item.StartMs),
        endMs: offsetMs + (lastWord ? item.StartMs + lastWord.OffsetEndMs : item.EndMs),
        english: cleanEnglish(item.FinalSentence),
        chinese: ''
      }
    })
    .filter(item => item.english)
}

function normalizeWhisper(raw) {
  return (raw.transcription || [])
    .map(item => {
      const startMs = Number(item.offsets?.from)
      const rawEndMs = Number(item.offsets?.to)
      return {
        startMs,
        endMs: Number.isFinite(rawEndMs) && rawEndMs > startMs ? rawEndMs : startMs + 800,
        english: cleanEnglish(item.text),
        chinese: ''
      }
    })
    .filter(item => Number.isFinite(item.startMs) && Number.isFinite(item.endMs) && item.english)
}

function normalizeRecognition(raw) {
  if (raw?.engine === 'whisper.cpp') return normalizeWhisper(raw)
  if (!raw?.chunks) return normalizeResponse(raw)
  const merged = []
  raw.chunks.forEach((chunk, index) => {
    const lines = normalizeResponse(chunk.response, chunk.offsetMs)
    for (const line of lines) {
      if (index > 0 && line.startMs < chunk.offsetMs + CHUNK_OVERLAP_MS) continue
      const previous = merged.at(-1)
      if (previous && previous.english === line.english && Math.abs(previous.startMs - line.startMs) < 2500) continue
      merged.push(line)
    }
  })
  return merged
}

async function recognizeLocal(item, audioPath) {
  if (!await exists(whisperCliPath)) throw new Error(`本地 Whisper 程序不存在: ${whisperCliPath}`)
  if (!await exists(whisperModelPath)) throw new Error(`本地 Whisper 模型不存在: ${whisperModelPath}`)

  const outputRoot = path.join(cacheRoot, 'local-asr')
  const outputBase = path.join(outputRoot, item.mediaId)
  await mkdir(outputRoot, { recursive: true })
  console.log(`  本地 Whisper: ${item.mediaId}`)
  await run(whisperCliPath, [
    '-m', whisperModelPath,
    '-f', audioPath,
    '-l', 'en',
    '-t', '12',
    '-ml', '72',
    '-sow',
    '-ojf',
    '-of', outputBase,
    '-np',
    '-ng'
  ])

  const whisper = JSON.parse(await readFile(`${outputBase}.json`, 'utf8'))
  const raw = {
    schemaVersion: 3,
    engine: 'whisper.cpp',
    model: 'small.en-q5_1',
    mediaId: item.mediaId,
    complete: true,
    transcription: whisper.transcription || []
  }
  await writeJson(path.join(mediaRawRoot, `${item.mediaId}.json`), raw)
  return normalizeWhisper(raw)
}

async function recognizeAudio(item, audioPath, durationMs) {
  const primaryRawPath = path.join(mediaRawRoot, `${item.mediaId}.json`)
  const legacyRawPath = path.join(rawRoot, `${item.mediaId}.json`)
  const existingPath = await exists(primaryRawPath) ? primaryRawPath : (await exists(legacyRawPath) ? legacyRawPath : '')
  if (existingPath) {
    const raw = JSON.parse(await readFile(existingPath, 'utf8'))
    if (!raw.chunks || raw.complete !== false) return normalizeRecognition(raw)
  }

  if (localAsrMode) return recognizeLocal(item, audioPath)

  const audioSize = (await stat(audioPath)).size
  if (audioSize <= ASR_DATA_LIMIT) {
    const response = await recognizeBuffer(await readFile(audioPath), item.mediaId)
    await writeJson(primaryRawPath, response)
    return normalizeResponse(response)
  }

  let raw = { schemaVersion: 2, mediaId: item.mediaId, complete: false, chunks: [] }
  if (await exists(primaryRawPath)) raw = JSON.parse(await readFile(primaryRawPath, 'utf8'))
  const chunkRoot = path.join(cacheRoot, 'asr-chunks', item.mediaId)
  for (let startMs = 0, index = 0; startMs < durationMs; startMs += CHUNK_DURATION_MS - CHUNK_OVERLAP_MS, index += 1) {
    const chunkDurationMs = Math.min(CHUNK_DURATION_MS, durationMs - startMs)
    const known = raw.chunks.find(chunk => chunk.offsetMs === startMs)
    if (!known) {
      const chunkPath = path.join(chunkRoot, `${String(index).padStart(3, '0')}.mp3`)
      await extractChunk(audioPath, chunkPath, startMs, chunkDurationMs)
      const response = await recognizeBuffer(await readFile(chunkPath), `${item.mediaId}#${index}`)
      raw.chunks.push({ offsetMs: startMs, durationMs: chunkDurationMs, response })
      raw.chunks.sort((a, b) => a.offsetMs - b.offsetMs)
      await writeJson(primaryRawPath, raw)
    }
    if (startMs + chunkDurationMs >= durationMs) break
  }
  raw.complete = true
  await writeJson(primaryRawPath, raw)
  return normalizeRecognition(raw)
}

function repeatTrack(singleLines, singleDurationMs, loopDurationMs, repeatCount) {
  const cycleDurationMs = loopDurationMs / repeatCount
  const scale = cycleDurationMs / singleDurationMs
  const result = []
  for (let repeat = 0; repeat < repeatCount; repeat += 1) {
    for (const line of singleLines) {
      result.push({
        ...line,
        startMs: Math.round(repeat * cycleDurationMs + line.startMs * scale),
        endMs: Math.round(repeat * cycleDurationMs + line.endMs * scale)
      })
    }
  }
  return result
}

const progress = {
  schemaVersion: 1,
  mode: allMode ? 'all' : `${grade}-${semester}-${selectedUnit}`,
  total: mediaItems.length,
  completed: 0,
  failed: 0,
  errors: [],
  updatedAt: new Date().toISOString()
}
const processed = new Map()
let manifestChanged = false

for (let index = 0; index < mediaItems.length; index += 1) {
  const item = mediaItems[index]
  const key = unitKey(item)
  const extension = item.mediaType === 'video' ? '.mp4' : '.mp3'
  const section = item.unitNumber == null ? 'extras' : `unit-${String(item.unitNumber).padStart(2, '0')}`
  const unitCache = path.join(cacheRoot, `grade${item.grade}`, item.semester, section)
  const archivedSource = item.cloudPath ? path.join(cacheRoot, ...item.cloudPath.split('/')) : ''
  const preferredSource = path.join(unitCache, item.mediaType, `${item.mediaId}${extension}`)
  const legacySource = path.join(unitCache, `${item.mediaId}${extension}`)
  const sourcePath = archivedSource && await exists(archivedSource)
    ? archivedSource
    : (await exists(legacySource) ? legacySource : preferredSource)
  console.log(`[${index + 1}/${mediaItems.length}] ${key} ${item.mediaType} ${item.label}`)

  try {
    await mkdir(path.dirname(sourcePath), { recursive: true })
    await downloadFile(item, sourcePath)
    const durationMs = await getDurationMs(sourcePath)
    const durationSeconds = Math.round(durationMs / 1000)
    if (item.durationSeconds !== durationSeconds) {
      item.durationSeconds = durationSeconds
      manifestChanged = true
    }

    let segments = []
    let deferredLoop = false
    if (isLoopAudio(item)) {
      const single = mediaItems.find(candidate =>
        isSingleAudio(candidate) &&
        candidate.grade === item.grade &&
        candidate.semester === item.semester &&
        candidate.unitNumber === item.unitNumber
      )
      deferredLoop = Boolean(single)
    }

    if (!deferredLoop) {
      const audioPath = path.join(unitCache, 'asr', `${item.mediaId}.mp3`)
      await extractAudio(sourcePath, audioPath)
      segments = await recognizeAudio(item, audioPath, durationMs)
    }

    processed.set(item.mediaId, {
      id: item.mediaId,
      mediaType: item.mediaType,
      label: item.label,
      durationMs,
      sha256: item.download?.sha256 || '',
      unitId: key,
      deferredLoop,
      segments
    })
    progress.completed += 1
  } catch (error) {
    console.error(`  失败: ${error.message}`)
    progress.failed += 1
    progress.errors.push({ mediaId: item.mediaId, unitId: key, message: error.message })
  }
  progress.updatedAt = new Date().toISOString()
  await writeJson(progressPath, progress)
}

for (const item of mediaItems.filter(isLoopAudio)) {
  const target = processed.get(item.mediaId)
  if (!target?.deferredLoop) continue
  const singleItem = mediaItems.find(candidate =>
    isSingleAudio(candidate) &&
    candidate.grade === item.grade &&
    candidate.semester === item.semester &&
    candidate.unitNumber === item.unitNumber
  )
  const source = singleItem && processed.get(singleItem.mediaId)
  if (!source?.segments.length) {
    progress.failed += 1
    progress.errors.push({ mediaId: item.mediaId, unitId: target.unitId, message: '循环音频缺少可用的单次版时间轴' })
    continue
  }
  const repeatCount = Number(item.label.match(/(\d+)次/)?.[1]) || 6
  target.segments = repeatTrack(source.segments, source.durationMs, target.durationMs, repeatCount)
}

const units = new Map()
for (const item of processed.values()) {
  if (!units.has(item.unitId)) {
    units.set(item.unitId, {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      unitId: item.unitId,
      items: []
    })
  }
  units.get(item.unitId).items.push({
    id: item.id,
    mediaType: item.mediaType,
    label: item.label,
    durationMs: item.durationMs,
    sha256: item.sha256,
    segments: item.segments
  })
}

for (const [key, value] of units) {
  value.items.sort((a, b) => a.mediaType.localeCompare(b.mediaType) || a.label.localeCompare(b.label, 'zh-CN'))
  await writeJson(path.join(unitIndexRoot, `${key}.json`), value)
}

if (manifestChanged) {
  manifest.updatedAt = new Date().toISOString()
  await writeJson(manifestPath, manifest)
}

progress.updatedAt = new Date().toISOString()
await writeJson(progressPath, progress)
console.log(JSON.stringify({
  total: progress.total,
  completed: progress.completed,
  failed: progress.failed,
  unitIndexes: units.size,
  cacheRoot
}, null, 2))
if (progress.failed) process.exitCode = 1
