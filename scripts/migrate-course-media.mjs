#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import tcbModule from '@cloudbase/node-sdk'

const require = createRequire(import.meta.url)
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')
const SOURCE_ROOT = path.join(REPO_ROOT, 'docs', 'wechat-course-sources')
const MIGRATION_ROOT = path.join(SOURCE_ROOT, 'migration')
const MANIFEST_PATH = path.join(MIGRATION_ROOT, 'media-manifest.json')
const EVENTS_PATH = path.join(MIGRATION_ROOT, 'events.jsonl')
const DEFAULT_CACHE_ROOT = path.resolve(REPO_ROOT, '..', '..', 'cache', 'ChildEnglishLearning-course-media')
const runtimeProcess = globalThis.process
const runtimeArgv = Array.isArray(runtimeProcess?.argv) ? runtimeProcess.argv : []
const CACHE_ROOT = runtimeProcess?.env?.COURSE_MEDIA_CACHE_DIR || DEFAULT_CACHE_ROOT
const ENV_ID = 'cloud1-d8g5ssn6n94472f8a'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'

const tcb = tcbModule.default || tcbModule
let cloudApp

function now() {
  return new Date().toISOString()
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

async function writeJsonAtomic(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true })
  const temp = `${file}.tmp`
  await fsp.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await fsp.rename(temp, file)
}

async function appendEvent(type, details = {}) {
  await fsp.mkdir(MIGRATION_ROOT, { recursive: true })
  await fsp.appendFile(EVENTS_PATH, `${JSON.stringify({ at: now(), type, ...details })}\n`, 'utf8')
}

function cleanUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    parsed.searchParams.delete('poc_token')
    return parsed.toString()
  } catch {
    return url
  }
}

function safePart(value, fallback = 'media') {
  const result = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return result || fallback
}

function unitNumberFromLabel(label) {
  const text = String(label || '')
  if (/unit\s*0*\d+\s*[-–—~至]\s*(?:unit\s*)?0*\d+/i.test(text)) return null
  const match = text.match(/unit\s*0*(\d+)/i)
  return match ? Number(match[1]) : null
}

function unitFolder(unitNumber) {
  return unitNumber ? `unit-${String(unitNumber).padStart(2, '0')}` : 'extras'
}

function mediaCloudPath(item) {
  const base = `course-media/grade${item.grade}/${item.semester}/${unitFolder(item.unitNumber)}`
  if (item.mediaType === 'video') {
    const sequence = String(item.sequence || 1).padStart(2, '0')
    return `${base}/video/${sequence}-${safePart(item.mediaId)}.mp4`
  }
  const category = safePart(item.category, 'audio')
  const label = safePart(item.label, 'track').slice(0, 60)
  return `${base}/audio/${category}-${label}-${safePart(item.mediaId)}.mp3`
}

function localPathFor(item) {
  return path.join(CACHE_ROOT, ...item.cloudPath.split('/'))
}

function emptyTransferState() {
  return {
    status: 'pending',
    attempts: 0,
    bytes: null,
    sha256: null,
    contentType: null,
    completedAt: null,
    lastError: null
  }
}

function mergeTransferState(previous, fallback) {
  return previous ? { ...fallback, ...previous } : fallback
}

function mergeMediaItem(previous, next) {
  return {
    ...next,
    ...(previous || {}),
    source: { ...next.source, ...(previous?.source || {}) },
    download: mergeTransferState(previous?.download, next.download),
    upload: {
      status: 'pending',
      attempts: 0,
      cloudPath: next.cloudPath,
      fileID: null,
      verifiedAt: null,
      lastError: null,
      ...(previous?.upload || {})
    }
  }
}

function allFilesRecursive(root) {
  if (!fs.existsSync(root)) return []
  const result = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) result.push(...allFilesRecursive(full))
    else result.push(full)
  }
  return result
}

function collectVideoPages() {
  const root = path.join(SOURCE_ROOT, 'raw', 'pages', 'video')
  const pages = []
  for (const file of allFilesRecursive(root).filter(file => file.endsWith('.json')).sort()) {
    const document = readJson(file)
    for (const page of document.pages || []) {
      const unitNumber = unitNumberFromLabel(page.unitLabel || page.title)
      pages.push({
        id: `video-page-g${page.grade}-${page.semester}-u${String(unitNumber).padStart(2, '0')}`,
        grade: page.grade,
        semester: page.semester,
        unitNumber,
        label: page.unitLabel,
        title: page.title,
        articleUrl: cleanUrl(page.discoveredUrl || page.pageUrl),
        expectedMediaIds: (page.videos || []).map(video => video.mpvid),
        status: 'pending',
        attempts: 0,
        capturedAt: page.capturedAt || null,
        lastError: null
      })
    }
  }
  return pages
}

function collectAudioSources() {
  const catalog = readJson(path.join(SOURCE_ROOT, 'catalog', 'all-grades.json'))
  const sources = []
  for (const [gradeText, semesters] of Object.entries(catalog.grades)) {
    for (const [semester, data] of Object.entries(semesters)) {
      let sourceIndex = 0
      for (const resource of data.resources || []) {
        if (!resource.category?.includes('audio')) continue
        for (const item of resource.items || []) {
          sourceIndex += 1
          const unitNumber = unitNumberFromLabel(item.label)
          sources.push({
            id: `audio-source-g${gradeText}-${semester}-${safePart(resource.category)}-${String(sourceIndex).padStart(3, '0')}`,
            sourceId: resource.sourceId,
            category: resource.category,
            sectionName: resource.sectionName,
            grade: Number(gradeText),
            semester,
            unitNumber,
            label: item.label,
            articleUrl: cleanUrl(item.url),
            status: 'pending',
            attempts: 0,
            mediaIds: [],
            capturedAt: null,
            lastError: null
          })
        }
      }
    }
  }
  return sources
}

function makeVideoItem(page, video, sequence) {
  const item = {
    id: `video-${video.mpvid}`,
    mediaType: 'video',
    mediaId: video.mpvid,
    grade: page.grade,
    semester: page.semester,
    unitNumber: unitNumberFromLabel(page.unitLabel),
    category: 'textbook-video',
    label: (video.labels || []).join(' / ') || `${page.unitLabel} video ${sequence}`,
    sequence,
    durationSeconds: video.durationSeconds || null,
    source: {
      articleUrl: cleanUrl(page.discoveredUrl || page.pageUrl),
      playerTemplateUrl: video.playerTemplateUrl || null,
      lastRefreshedAt: null
    },
    download: emptyTransferState()
  }
  item.cloudPath = mediaCloudPath(item)
  return item
}

function makeAudioItem(context, audio) {
  const mediaId = audio.voiceEncodeFileId
  const item = {
    id: `audio-${mediaId}`,
    mediaType: 'audio',
    mediaId,
    grade: context.grade,
    semester: context.semester,
    unitNumber: context.unitNumber ?? unitNumberFromLabel(context.label || context.item || audio.name),
    category: context.category || 'textbook-audio',
    label: audio.name || context.label || context.item || 'audio',
    sequence: null,
    durationSeconds: audio.durationSeconds || (audio.playLengthMs ? Math.round(audio.playLengthMs / 1000) : null),
    listenId: audio.listenId || null,
    source: {
      articleUrl: cleanUrl(context.articleUrl || context.discoveredUrl || context.pageUrl),
      sourcePageId: context.id || null,
      stableMediaUrl: `https://res.wx.qq.com/voice/getvoice?mediaid=${encodeURIComponent(mediaId)}`,
      lastRefreshedAt: null
    },
    download: emptyTransferState()
  }
  item.cloudPath = mediaCloudPath(item)
  return item
}

function collectKnownAudioItems(audioSources) {
  const items = []
  const sourceByUrl = new Map(audioSources.map(source => [cleanUrl(source.articleUrl), source]))
  const videoRoot = path.join(SOURCE_ROOT, 'raw', 'pages', 'video')
  for (const file of allFilesRecursive(videoRoot).filter(file => file.endsWith('.json')).sort()) {
    const document = readJson(file)
    for (const page of document.pages || []) {
      const context = {
        grade: page.grade,
        semester: page.semester,
        unitNumber: unitNumberFromLabel(page.unitLabel),
        category: 'textbook-audio',
        label: page.unitLabel,
        articleUrl: page.discoveredUrl || page.pageUrl
      }
      for (const audio of page.audioPlayers || []) {
        if (audio.voiceEncodeFileId) items.push(makeAudioItem(context, audio))
      }
    }
  }
  const audioRoot = path.join(SOURCE_ROOT, 'raw', 'pages', 'audio')
  for (const file of allFilesRecursive(audioRoot).filter(file => file.endsWith('.json')).sort()) {
    const document = readJson(file)
    const matchingSource = sourceByUrl.get(cleanUrl(document.discoveredUrl || document.pageUrl))
    const context = matchingSource || {
      grade: document.grade,
      semester: document.semester,
      unitNumber: unitNumberFromLabel(document.item),
      category: 'textbook-audio',
      label: document.item,
      articleUrl: document.discoveredUrl || document.pageUrl
    }
    for (const audio of document.audioItems || document.audioPlayers || []) {
      if (audio.voiceEncodeFileId) items.push(makeAudioItem(context, audio))
    }
  }
  return items
}

export async function ensureManifest() {
  const previous = fs.existsSync(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : null
  const previousMedia = new Map((previous?.media || []).map(item => [item.id, item]))
  const previousAudioSources = new Map((previous?.audioSources || []).map(item => [item.id, item]))
  const previousVideoPages = new Map((previous?.videoPages || []).map(item => [item.id, item]))
  const audioSources = collectAudioSources().map(source => ({ ...source, ...(previousAudioSources.get(source.id) || {}) }))
  const mediaMap = new Map()

  const videoRoot = path.join(SOURCE_ROOT, 'raw', 'pages', 'video')
  for (const file of allFilesRecursive(videoRoot).filter(file => file.endsWith('.json')).sort()) {
    const document = readJson(file)
    for (const page of document.pages || []) {
      for (const [index, video] of (page.videos || []).entries()) {
        const item = makeVideoItem(page, video, index + 1)
        mediaMap.set(item.id, mergeMediaItem(previousMedia.get(item.id), item))
      }
    }
  }
  for (const item of collectKnownAudioItems(audioSources)) {
    const existing = mediaMap.get(item.id) || previousMedia.get(item.id)
    mediaMap.set(item.id, mergeMediaItem(existing, item))
  }
  for (const previousItem of previous?.media || []) {
    if (!mediaMap.has(previousItem.id)) mediaMap.set(previousItem.id, previousItem)
  }

  const manifest = {
    schemaVersion: 1,
    updatedAt: now(),
    environmentId: ENV_ID,
    cacheRoot: CACHE_ROOT,
    sourceRoot: path.relative(REPO_ROOT, SOURCE_ROOT).replaceAll('\\', '/'),
    audioSources,
    videoPages: collectVideoPages().map(page => ({ ...page, ...(previousVideoPages.get(page.id) || {}) })),
    media: [...mediaMap.values()].sort((a, b) => a.id.localeCompare(b.id))
  }
  await writeJsonAtomic(MANIFEST_PATH, manifest)
  await appendEvent('manifest-initialized', summarizeManifest(manifest))
  return manifest
}

function summarizeManifest(manifest) {
  const count = type => manifest.media.filter(item => item.mediaType === type).length
  const uploaded = type => manifest.media.filter(item => item.mediaType === type && item.upload?.status === 'verified').length
  const downloaded = type => manifest.media.filter(item => item.mediaType === type && item.download?.status === 'downloaded').length
  const cached = type => manifest.media.filter(item => item.mediaType === type && fs.existsSync(localPathFor(item))).length
  return {
    audioSources: manifest.audioSources.length,
    audioSourcesCaptured: manifest.audioSources.filter(item => item.status === 'captured').length,
    videoPages: manifest.videoPages.length,
    videoPagesCaptured: manifest.videoPages.filter(item => item.status === 'captured').length,
    audioItems: count('audio'),
    videoItems: count('video'),
    audioDownloaded: downloaded('audio'),
    videoDownloaded: downloaded('video'),
    audioCached: cached('audio'),
    videoCached: cached('video'),
    audioUploaded: uploaded('audio'),
    videoUploaded: uploaded('video')
  }
}

function getCloudApp() {
  if (cloudApp) return cloudApp
  const config = require(path.join(REPO_ROOT, 'config.js'))
  if (!config.SECRET_ID || !config.SECRET_KEY) throw new Error('config.js 缺少 SECRET_ID 或 SECRET_KEY')
  cloudApp = tcb.init({
    env: ENV_ID,
    secretId: config.SECRET_ID,
    secretKey: config.SECRET_KEY
  })
  return cloudApp
}

async function downloadItem(item, sourceUrl) {
  const destination = localPathFor(item)
  const part = `${destination}.part`
  await fsp.mkdir(path.dirname(destination), { recursive: true })
  const response = await fetch(sourceUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: item.mediaType === 'audio' ? 'audio/mpeg,audio/*;q=0.9,*/*;q=0.1' : 'video/mp4,video/*;q=0.9,*/*;q=0.1',
      Referer: item.source?.articleUrl || 'https://mp.weixin.qq.com/'
    }
  })
  if (!response.ok || !response.body) throw new Error(`下载失败 HTTP ${response.status}`)
  const contentType = (response.headers.get('content-type') || '').split(';')[0]
  const hash = crypto.createHash('sha256')
  let bytes = 0
  const meter = new Transform({
    transform(chunk, encoding, callback) {
      bytes += chunk.length
      hash.update(chunk)
      callback(null, chunk)
    }
  })
  try {
    await pipeline(Readable.fromWeb(response.body), meter, fs.createWriteStream(part))
    if (bytes < 1024) throw new Error(`媒体文件异常小: ${bytes} bytes`)
    const header = Buffer.alloc(16)
    const handle = await fsp.open(part, 'r')
    await handle.read(header, 0, header.length, 0)
    await handle.close()
    const looksLikeMp3 = header.subarray(0, 3).toString('ascii') === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0)
    const looksLikeMp4 = header.subarray(4, 8).toString('ascii') === 'ftyp'
    if (item.mediaType === 'audio' && !looksLikeMp3 && !contentType.startsWith('audio/')) throw new Error(`不是有效音频: ${contentType || 'unknown'}`)
    if (item.mediaType === 'video' && !looksLikeMp4 && !contentType.startsWith('video/')) throw new Error(`不是有效视频: ${contentType || 'unknown'}`)
    await fsp.rm(destination, { force: true })
    await fsp.rename(part, destination)
    return { destination, bytes, sha256: hash.digest('hex'), contentType }
  } catch (error) {
    await fsp.rm(part, { force: true })
    throw error
  }
}

async function verifyCloudFile(fileID, expectedBytes) {
  const app = getCloudApp()
  const result = await app.getTempFileURL({ fileList: [fileID] })
  const entry = result.fileList?.[0]
  if (!entry?.tempFileURL) throw new Error(entry?.code || '云存储未返回临时访问地址')
  const response = await fetch(entry.tempFileURL, { headers: { Range: 'bytes=0-0' } })
  if (![200, 206].includes(response.status)) throw new Error(`云端抽检失败 HTTP ${response.status}`)
  const contentRange = response.headers.get('content-range')
  const remoteBytes = contentRange ? Number(contentRange.split('/').pop()) : Number(response.headers.get('content-length'))
  if (Number.isFinite(remoteBytes) && response.status === 200 && expectedBytes && remoteBytes !== expectedBytes) {
    throw new Error(`云端大小不一致: ${remoteBytes} != ${expectedBytes}`)
  }
  return { tempFileURL: entry.tempFileURL, remoteBytes: Number.isFinite(remoteBytes) ? remoteBytes : null }
}

async function persistManifest(manifest) {
  manifest.updatedAt = now()
  await writeJsonAtomic(MANIFEST_PATH, manifest)
}

export async function stageMediaItem(manifest, item, sourceUrl, options = {}) {
  if (item.upload?.status === 'verified' && !options.forceLocal) return { skipped: true, item }
  item.download = mergeTransferState(item.download, emptyTransferState())
  item.upload = { status: 'pending', attempts: 0, cloudPath: item.cloudPath, fileID: null, verifiedAt: null, lastError: null, ...(item.upload || {}) }
  const existing = localPathFor(item)
  if (fs.existsSync(existing) && item.download.sha256 && item.download.bytes) {
    item.download.status = 'downloaded'
    return { skipped: false, item, destination: existing }
  }
  item.download.attempts += 1
  item.download.status = 'downloading'
  item.download.lastError = null
  if (item.mediaType === 'video') item.source.lastRefreshedAt = now()
  await persistManifest(manifest)
  try {
    const downloaded = await downloadItem(item, sourceUrl)
    Object.assign(item.download, {
      status: 'downloaded',
      bytes: downloaded.bytes,
      sha256: downloaded.sha256,
      contentType: downloaded.contentType,
      completedAt: now(),
      lastError: null
    })
    await persistManifest(manifest)
    await appendEvent('media-downloaded', { id: item.id, mediaType: item.mediaType, bytes: downloaded.bytes, sha256: downloaded.sha256 })
    return { skipped: false, item, destination: downloaded.destination }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    item.download.status = 'failed'
    item.download.lastError = message
    await persistManifest(manifest)
    await appendEvent('media-download-failed', { id: item.id, mediaType: item.mediaType, error: message })
    throw error
  }
}

export async function uploadStagedMediaItem(manifest, item, options = {}) {
  if (item.upload?.status === 'verified') return { skipped: true, item }
  const destination = localPathFor(item)
  if (!fs.existsSync(destination)) throw new Error(`本地待上传文件不存在: ${destination}`)
  item.upload = { status: 'pending', attempts: 0, cloudPath: item.cloudPath, fileID: null, verifiedAt: null, lastError: null, ...(item.upload || {}) }
  try {
    item.upload.attempts += 1
    item.upload.status = 'uploading'
    await persistManifest(manifest)
    const app = getCloudApp()
    const result = await app.uploadFile({
      cloudPath: item.cloudPath,
      fileContent: fs.createReadStream(destination)
    })
    const fileID = result.fileID
    if (!fileID) throw new Error('上传成功但未返回 fileID')
    await verifyCloudFile(fileID, item.download.bytes)
    Object.assign(item.upload, {
      status: 'verified',
      fileID,
      verifiedAt: now(),
      lastError: null
    })
    await persistManifest(manifest)
    await appendEvent('media-uploaded', { id: item.id, mediaType: item.mediaType, bytes: item.download.bytes, sha256: item.download.sha256, cloudPath: item.cloudPath, fileID })
    if (options.cleanup !== false) await fsp.rm(destination, { force: true })
    return { skipped: false, item }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    item.upload.status = 'failed'
    item.upload.lastError = message
    await persistManifest(manifest)
    await appendEvent('media-upload-failed', { id: item.id, mediaType: item.mediaType, error: message })
    throw error
  }
}

export async function transferMediaItem(manifest, item, sourceUrl, options = {}) {
  if (item.upload?.status === 'verified') return { skipped: true, item }
  await stageMediaItem(manifest, item, sourceUrl)
  return uploadStagedMediaItem(manifest, item, options)
}

export async function transferKnownAudio(options = {}) {
  const manifest = await ensureManifest()
  const pending = manifest.media.filter(item => item.mediaType === 'audio' && item.upload?.status !== 'verified')
  const selected = pending.slice(0, options.limit ?? pending.length)
  const results = []
  for (const item of selected) {
    try {
      const result = await transferMediaItem(manifest, item, item.source.stableMediaUrl, options)
      results.push({ id: item.id, ok: true, fileID: result.item.upload.fileID })
    } catch (error) {
      results.push({ id: item.id, ok: false, error: error instanceof Error ? error.message : String(error) })
      if (options.stopOnError !== false) break
    }
  }
  return { ...summarizeManifest(manifest), processed: results }
}

export async function downloadKnownAudio(options = {}) {
  const manifest = await ensureManifest()
  const pending = manifest.media.filter(item => {
    if (item.mediaType !== 'audio') return false
    if (options.ensureLocal) return !fs.existsSync(localPathFor(item))
    return item.upload?.status !== 'verified'
  })
  const selected = pending.slice(0, options.limit ?? pending.length)
  const results = []
  const startedAt = Date.now()
  for (const item of selected) {
    try {
      const result = await stageMediaItem(manifest, item, item.source.stableMediaUrl, { forceLocal: options.ensureLocal })
      results.push({ id: item.id, ok: true, skipped: result.skipped, bytes: item.download.bytes })
    } catch (error) {
      results.push({ id: item.id, ok: false, error: error instanceof Error ? error.message : String(error) })
      if (options.stopOnError !== false) break
    }
  }
  const elapsedMs = Date.now() - startedAt
  const averageMs = results.length ? Math.round(elapsedMs / results.length) : 0
  return {
    ...summarizeManifest(manifest),
    processed: results,
    elapsedMs,
    averageMs,
    estimatedRemainingMs: averageMs * Math.max(0, pending.length - results.length)
  }
}

export async function uploadStagedAudio(options = {}) {
  const manifest = await ensureManifest()
  const staged = manifest.media.filter(item => {
    if (item.mediaType !== 'audio' || item.upload?.status === 'verified') return false
    return item.download?.status === 'downloaded' && fs.existsSync(localPathFor(item))
  })
  const selected = staged.slice(0, options.limit ?? staged.length)
  const results = []
  const startedAt = Date.now()
  for (const item of selected) {
    try {
      const result = await uploadStagedMediaItem(manifest, item, options)
      results.push({ id: item.id, ok: true, skipped: result.skipped, fileID: item.upload.fileID })
    } catch (error) {
      results.push({ id: item.id, ok: false, error: error instanceof Error ? error.message : String(error) })
      if (options.stopOnError !== false) break
    }
  }
  const elapsedMs = Date.now() - startedAt
  const averageMs = results.length ? Math.round(elapsedMs / results.length) : 0
  return {
    ...summarizeManifest(manifest),
    staged: staged.length,
    processed: results,
    elapsedMs,
    averageMs,
    estimatedRemainingMs: averageMs * Math.max(0, staged.length - results.length)
  }
}

export async function recordAudioCapture(sourceId, capture) {
  const manifest = await ensureManifest()
  const source = manifest.audioSources.find(item => item.id === sourceId)
  if (!source) throw new Error(`未知音频入口: ${sourceId}`)
  const previousMedia = new Map(manifest.media.map(item => [item.id, item]))
  const mediaIds = []
  for (const audio of capture.audioItems || []) {
    if (!audio.voiceEncodeFileId) continue
    const item = makeAudioItem(source, audio)
    const existingIndex = manifest.media.findIndex(entry => entry.id === item.id)
    const merged = mergeMediaItem(previousMedia.get(item.id), item)
    if (existingIndex >= 0) manifest.media[existingIndex] = merged
    else manifest.media.push(merged)
    mediaIds.push(item.mediaId)
  }
  Object.assign(source, {
    status: mediaIds.length ? 'captured' : 'empty',
    attempts: (source.attempts || 0) + 1,
    mediaIds,
    capturedAt: now(),
    pageTitle: capture.title || null,
    pageUrl: cleanUrl(capture.url),
    lastError: mediaIds.length ? null : '页面中未发现音频媒体 ID'
  })
  manifest.media.sort((a, b) => a.id.localeCompare(b.id))
  await persistManifest(manifest)
  await appendEvent('audio-source-captured', { sourceId, mediaIds })
  return { source, mediaIds, manifest }
}

export async function recordBlockedPage(kind, id, pageUrl, reason = '微信页面验证') {
  const manifest = await ensureManifest()
  const collection = kind === 'audio' ? manifest.audioSources : manifest.videoPages
  const page = collection.find(item => item.id === id)
  if (page) {
    page.status = 'blocked'
    page.attempts = (page.attempts || 0) + 1
    page.lastError = reason
    page.pageUrl = pageUrl
  }
  await persistManifest(manifest)
  await appendEvent('page-blocked', { kind, id, pageUrl, reason })
  return page
}

export async function recordVideoPageCapture(pageId, capture, options = {}) {
  const manifest = await ensureManifest()
  const page = manifest.videoPages.find(item => item.id === pageId)
  if (!page) throw new Error(`未知视频页面: ${pageId}`)
  const byMediaId = new Map(manifest.media.filter(item => item.mediaType === 'video').map(item => [item.mediaId, item]))
  const capturedIds = []
  const failures = []
  for (const asset of capture.videos || []) {
    const item = byMediaId.get(asset.mpvid)
    if (!item || !asset.url) continue
    capturedIds.push(asset.mpvid)
    try {
      await transferMediaItem(manifest, item, asset.url, options)
    } catch (error) {
      failures.push({ mediaId: asset.mpvid, error: error instanceof Error ? error.message : String(error) })
      if (options.stopOnError !== false) break
    }
  }
  const missing = page.expectedMediaIds.filter(id => !capturedIds.includes(id) && byMediaId.get(id)?.upload?.status !== 'verified')
  Object.assign(page, {
    status: failures.length ? 'failed' : missing.length ? 'partial' : 'captured',
    attempts: (page.attempts || 0) + 1,
    capturedAt: now(),
    capturedMediaIds: capturedIds,
    missingMediaIds: missing,
    lastError: failures.length ? failures.map(item => `${item.mediaId}: ${item.error}`).join('; ') : missing.length ? `缺少媒体: ${missing.join(', ')}` : null
  })
  await persistManifest(manifest)
  await appendEvent('video-page-captured', { pageId, capturedIds, missing, failures })
  return { page, capturedIds, missing, failures, manifest }
}

export async function extractAudioCapture(tab) {
  return tab.playwright.evaluate(() => {
    const toAttributes = element => [...element.attributes].reduce((result, attribute) => {
      result[attribute.name] = attribute.value
      return result
    }, {})
    const numberValue = value => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    const candidates = []
    for (const element of document.querySelectorAll('mp-common-mpaudio,[voice_encode_fileid],[voice-encode-file-id],audio')) {
      const attributes = toAttributes(element)
      const sourceUrl = element.currentSrc || element.src || attributes.src || ''
      let mediaId = attributes.voice_encode_fileid || attributes['voice-encode-file-id'] || attributes.voiceencodefileid
      if (!mediaId && sourceUrl) {
        try {
          mediaId = new URL(sourceUrl, location.href).searchParams.get('mediaid')
        } catch {
          mediaId = null
        }
      }
      if (!mediaId) continue
      const playLengthMs = numberValue(attributes.play_length || attributes.playlength || attributes['play-length'])
      candidates.push({
        voiceEncodeFileId: mediaId,
        name: attributes.name || attributes.title || element.getAttribute('aria-label') || document.title,
        author: attributes.author || null,
        listenId: attributes.listen_id || attributes.listenid || null,
        playLengthMs,
        durationSeconds: playLengthMs ? Math.round(playLengthMs / 1000) : numberValue(attributes.duration),
        lowSizeKiB: numberValue(attributes.low_size || attributes.size),
        highSizeKiB: numberValue(attributes.high_size)
      })
    }
    const html = document.documentElement.innerHTML
    const patterns = [
      /voice_encode_fileid=["']([^"']+)["']/g,
      /voiceEncodeFileId["']?\s*[:=]\s*["']([^"']+)["']/g,
      /getvoice\?mediaid=([^&"'<>\\]+)/g
    ]
    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        candidates.push({ voiceEncodeFileId: match[1], name: document.title })
      }
    }
    const audioItems = [...new Map(candidates.map(item => [item.voiceEncodeFileId, item])).values()]
    return {
      title: document.title,
      url: location.href,
      bodyText: (document.body?.innerText || '').slice(0, 10000),
      audioItems
    }
  })
}

export async function extractVideoCapture(tab) {
  return tab.playwright.evaluate(() => {
    const videos = []
    for (const element of document.querySelectorAll('video')) {
      const url = element.currentSrc || element.src || element.getAttribute('src')
      if (!url || !url.includes('mpvideo.qpic.cn')) continue
      let mpvid = null
      try {
        mpvid = new URL(url, location.href).searchParams.get('vid')
      } catch {
        mpvid = null
      }
      mpvid ||= element.closest('[data-mpvid],[vid]')?.getAttribute('data-mpvid') || element.closest('[data-mpvid],[vid]')?.getAttribute('vid')
      if (mpvid) videos.push({ mpvid, url })
    }
    return {
      title: document.title,
      url: location.href,
      bodyText: (document.body?.innerText || '').slice(0, 10000),
      videos: [...new Map(videos.map(item => [item.mpvid, item])).values()]
    }
  })
}

function isVerificationPage(capture) {
  return /\/mp\/wappoc_appmsgcaptcha/.test(capture.url || '') || /验证码|拖动滑块|完成拼图|访问过于频繁/.test(capture.bodyText || '')
}

export async function cacheAudioCapture(source, capture) {
  const file = path.join(SOURCE_ROOT, 'raw', 'pages', 'audio', `${source.id}.json`)
  await writeJsonAtomic(file, {
    schemaVersion: 1,
    sourceId: source.sourceId,
    sourceEntryId: source.id,
    grade: source.grade,
    semester: source.semester,
    category: source.category,
    item: source.label,
    discoveredUrl: source.articleUrl,
    capturedAt: now(),
    pageUrl: capture.url,
    title: capture.title,
    bodyText: capture.bodyText,
    audioItems: capture.audioItems
  })
  return file
}

export async function crawlAudioSources(tab, options = {}) {
  let manifest = await ensureManifest()
  const pending = manifest.audioSources.filter(source => !['captured', 'empty'].includes(source.status))
  const selected = pending.slice(0, options.limit ?? pending.length)
  const results = []
  const startedAt = Date.now()
  for (const source of selected) {
    await tab.goto(source.articleUrl)
    await tab.playwright.waitForTimeout(options.pageWaitMs ?? 1200)
    let capture = await extractAudioCapture(tab)
    const waitDeadline = Date.now() + (options.mediaWaitMs ?? 10000)
    while (!isVerificationPage(capture) && capture.audioItems.length === 0 && Date.now() < waitDeadline) {
      await tab.playwright.waitForTimeout(750)
      capture = await extractAudioCapture(tab)
    }
    if (isVerificationPage(capture) && options.waitForVerification) {
      const verificationDeadline = Date.now() + (options.verificationWaitMs ?? 300000)
      while (isVerificationPage(capture) && Date.now() < verificationDeadline) {
        await tab.playwright.waitForTimeout(options.verificationPollMs ?? 2000)
        capture = await extractAudioCapture(tab)
      }
      if (!isVerificationPage(capture)) {
        const mediaDeadline = Date.now() + (options.mediaWaitMs ?? 10000)
        while (capture.audioItems.length === 0 && Date.now() < mediaDeadline) {
          await tab.playwright.waitForTimeout(750)
          capture = await extractAudioCapture(tab)
        }
      }
    }
    if (isVerificationPage(capture)) {
      await recordBlockedPage('audio', source.id, capture.url)
      const elapsedMs = Date.now() - startedAt
      const averageMs = results.length ? Math.round(elapsedMs / results.length) : 0
      return {
        halted: true,
        blocked: { sourceId: source.id, url: capture.url },
        results,
        remainingSources: manifest.audioSources.filter(item => !['captured', 'empty'].includes(item.status)).length,
        elapsedMs,
        estimatedRemainingMs: averageMs * Math.max(0, pending.length - results.length)
      }
    }
    await cacheAudioCapture(source, capture)
    const recorded = await recordAudioCapture(source.id, capture)
    const transferResults = []
    if (options.downloadOnly) {
      manifest = recorded.manifest
      for (const mediaId of recorded.mediaIds) {
        const item = manifest.media.find(entry => entry.mediaType === 'audio' && entry.mediaId === mediaId)
        if (!item || item.upload?.status === 'verified') continue
        try {
          await stageMediaItem(manifest, item, item.source.stableMediaUrl)
          transferResults.push({ mediaId, ok: true, bytes: item.download.bytes })
        } catch (error) {
          transferResults.push({ mediaId, ok: false, error: error instanceof Error ? error.message : String(error) })
          if (options.stopOnError !== false) break
        }
      }
    } else if (options.transfer !== false) {
      manifest = recorded.manifest
      for (const mediaId of recorded.mediaIds) {
        const item = manifest.media.find(entry => entry.mediaType === 'audio' && entry.mediaId === mediaId)
        if (!item || item.upload?.status === 'verified') continue
        try {
          await transferMediaItem(manifest, item, item.source.stableMediaUrl, options)
          transferResults.push({ mediaId, ok: true, fileID: item.upload.fileID })
        } catch (error) {
          transferResults.push({ mediaId, ok: false, error: error instanceof Error ? error.message : String(error) })
          if (options.stopOnError !== false) break
        }
      }
    }
    results.push({ sourceId: source.id, mediaIds: recorded.mediaIds, transfers: transferResults })
    await tab.playwright.waitForTimeout(options.betweenPagesMs ?? 500)
  }
  const elapsedMs = Date.now() - startedAt
  const averageMs = results.length ? Math.round(elapsedMs / results.length) : 0
  return {
    halted: false,
    results,
    remainingSources: manifest.audioSources.filter(item => !['captured', 'empty'].includes(item.status)).length,
    elapsedMs,
    estimatedRemainingMs: averageMs * Math.max(0, pending.length - results.length)
  }
}

export async function crawlVideoPages(tab, options = {}) {
  const manifest = await ensureManifest()
  const uploadedIds = new Set(manifest.media.filter(item => item.mediaType === 'video' && item.upload?.status === 'verified').map(item => item.mediaId))
  const pending = manifest.videoPages.filter(page => page.expectedMediaIds.some(id => !uploadedIds.has(id)))
  const selected = pending.slice(0, options.limit ?? pending.length)
  const results = []
  for (const page of selected) {
    await tab.goto(page.articleUrl)
    await tab.playwright.waitForTimeout(options.pageWaitMs ?? 1300)
    let capture = await extractVideoCapture(tab)
    const waitDeadline = Date.now() + (options.mediaWaitMs ?? 10000)
    while (!isVerificationPage(capture) && capture.videos.length === 0 && Date.now() < waitDeadline) {
      await tab.playwright.waitForTimeout(750)
      capture = await extractVideoCapture(tab)
    }
    if (isVerificationPage(capture) && options.waitForVerification) {
      const verificationDeadline = Date.now() + (options.verificationWaitMs ?? 300000)
      while (isVerificationPage(capture) && Date.now() < verificationDeadline) {
        await tab.playwright.waitForTimeout(options.verificationPollMs ?? 2000)
        capture = await extractVideoCapture(tab)
      }
      if (!isVerificationPage(capture)) {
        const mediaDeadline = Date.now() + (options.mediaWaitMs ?? 10000)
        while (capture.videos.length === 0 && Date.now() < mediaDeadline) {
          await tab.playwright.waitForTimeout(750)
          capture = await extractVideoCapture(tab)
        }
      }
    }
    if (isVerificationPage(capture)) {
      await recordBlockedPage('video', page.id, capture.url)
      return { halted: true, blocked: { pageId: page.id, url: capture.url }, results }
    }
    const recorded = await recordVideoPageCapture(page.id, capture, options)
    results.push({ pageId: page.id, capturedIds: recorded.capturedIds, missing: recorded.missing, failures: recorded.failures })
    await tab.playwright.waitForTimeout(options.betweenPagesMs ?? 500)
  }
  return { halted: false, results }
}

export async function crawlVideoPagesSeparated(tab, options = {}) {
  const manifest = await ensureManifest()
  const uploadedIds = new Set(manifest.media.filter(item => item.mediaType === 'video' && item.upload?.status === 'verified').map(item => item.mediaId))
  const pending = manifest.videoPages.filter(page => page.expectedMediaIds.some(id => !uploadedIds.has(id)))
  const selected = pending.slice(0, options.limit ?? pending.length)
  const mediaById = new Map(manifest.media.filter(item => item.mediaType === 'video').map(item => [item.mediaId, item]))
  const stagedIds = new Set()
  const results = []
  let blocked = null

  // Phase 1: navigate and download. No cloud uploads happen in this loop.
  for (const page of selected) {
    await tab.goto(page.articleUrl)
    await tab.playwright.waitForTimeout(options.pageWaitMs ?? 1300)
    let capture = await extractVideoCapture(tab)
    const waitDeadline = Date.now() + (options.mediaWaitMs ?? 10000)
    while (!isVerificationPage(capture) && capture.videos.length === 0 && Date.now() < waitDeadline) {
      await tab.playwright.waitForTimeout(750)
      capture = await extractVideoCapture(tab)
    }
    if (isVerificationPage(capture) && options.waitForVerification) {
      const verificationDeadline = Date.now() + (options.verificationWaitMs ?? 300000)
      while (isVerificationPage(capture) && Date.now() < verificationDeadline) {
        await tab.playwright.waitForTimeout(options.verificationPollMs ?? 2000)
        capture = await extractVideoCapture(tab)
      }
      if (!isVerificationPage(capture)) {
        const mediaDeadline = Date.now() + (options.mediaWaitMs ?? 10000)
        while (capture.videos.length === 0 && Date.now() < mediaDeadline) {
          await tab.playwright.waitForTimeout(750)
          capture = await extractVideoCapture(tab)
        }
      }
    }
    if (isVerificationPage(capture)) {
      Object.assign(page, {
        status: 'blocked',
        attempts: (page.attempts || 0) + 1,
        lastError: '微信页面验证',
        pageUrl: capture.url
      })
      blocked = { pageId: page.id, url: capture.url }
      await persistManifest(manifest)
      await appendEvent('page-blocked', { kind: 'video', id: page.id, pageUrl: capture.url, reason: '微信页面验证' })
      break
    }

    const capturedIds = []
    const downloadFailures = []
    for (const asset of capture.videos || []) {
      const item = mediaById.get(asset.mpvid)
      if (!item || !asset.url) continue
      capturedIds.push(asset.mpvid)
      if (item.upload?.status === 'verified') continue
      try {
        await stageMediaItem(manifest, item, asset.url)
        stagedIds.add(item.mediaId)
      } catch (error) {
        downloadFailures.push({ mediaId: asset.mpvid, error: error instanceof Error ? error.message : String(error) })
        if (options.stopOnError !== false) break
      }
    }
    const missing = page.expectedMediaIds.filter(id => !capturedIds.includes(id) && mediaById.get(id)?.upload?.status !== 'verified')
    Object.assign(page, {
      status: downloadFailures.length ? 'download-failed' : missing.length ? 'partial' : 'downloaded',
      attempts: (page.attempts || 0) + 1,
      capturedAt: now(),
      capturedMediaIds: capturedIds,
      missingMediaIds: missing,
      lastError: downloadFailures.length ? downloadFailures.map(item => `${item.mediaId}: ${item.error}`).join('; ') : missing.length ? `缺少媒体: ${missing.join(', ')}` : null
    })
    results.push({ pageId: page.id, capturedIds, missing, downloadFailures, uploadFailures: [] })
    await persistManifest(manifest)
    await tab.playwright.waitForTimeout(options.betweenPagesMs ?? 500)
  }

  // Phase 2: upload only after the whole browser/download phase has ended.
  const uploadResults = []
  for (const mediaId of stagedIds) {
    const item = mediaById.get(mediaId)
    if (!item || item.upload?.status === 'verified') continue
    try {
      await uploadStagedMediaItem(manifest, item, options)
      uploadResults.push({ mediaId, ok: true, fileID: item.upload.fileID })
    } catch (error) {
      const failure = { mediaId, ok: false, error: error instanceof Error ? error.message : String(error) }
      uploadResults.push(failure)
      const pageResult = results.find(result => result.capturedIds.includes(mediaId))
      if (pageResult) pageResult.uploadFailures.push(failure)
      if (options.stopOnError !== false) break
    }
  }

  for (const result of results) {
    const page = manifest.videoPages.find(entry => entry.id === result.pageId)
    if (!page) continue
    const complete = page.expectedMediaIds.every(id => mediaById.get(id)?.upload?.status === 'verified')
    page.status = complete ? 'captured' : result.uploadFailures.length ? 'upload-failed' : page.status
    page.lastError = complete ? null : page.lastError
  }
  await persistManifest(manifest)
  return { halted: Boolean(blocked), blocked, results, stagedCount: stagedIds.size, uploadResults }
}

export async function getMigrationStatus() {
  const manifest = await ensureManifest()
  return { manifestPath: MANIFEST_PATH, cacheRoot: CACHE_ROOT, ...summarizeManifest(manifest) }
}

function optionValue(name) {
  const direct = runtimeArgv.find(arg => arg.startsWith(`--${name}=`))
  if (direct) return direct.slice(name.length + 3)
  const index = runtimeArgv.indexOf(`--${name}`)
  return index >= 0 ? runtimeArgv[index + 1] : null
}

async function main() {
  const command = runtimeArgv[2] || 'status'
  if (command === 'init') {
    const manifest = await ensureManifest()
    console.log(JSON.stringify({ manifestPath: MANIFEST_PATH, cacheRoot: CACHE_ROOT, ...summarizeManifest(manifest) }, null, 2))
    return
  }
  if (command === 'status') {
    console.log(JSON.stringify(await getMigrationStatus(), null, 2))
    return
  }
  if (command === 'transfer-audio') {
    const limit = Number(optionValue('limit') || 0) || undefined
    console.log(JSON.stringify(await transferKnownAudio({
      limit,
      cleanup: !runtimeArgv.includes('--keep-local'),
      stopOnError: !runtimeArgv.includes('--continue-on-error')
    }), null, 2))
    return
  }
  if (command === 'download-audio') {
    const limit = Number(optionValue('limit') || 0) || undefined
    console.log(JSON.stringify(await downloadKnownAudio({
      limit,
      ensureLocal: runtimeArgv.includes('--all-local'),
      stopOnError: !runtimeArgv.includes('--continue-on-error')
    }), null, 2))
    return
  }
  if (command === 'upload-staged-audio') {
    const limit = Number(optionValue('limit') || 0) || undefined
    console.log(JSON.stringify(await uploadStagedAudio({
      limit,
      cleanup: runtimeArgv.includes('--cleanup-local'),
      stopOnError: !runtimeArgv.includes('--continue-on-error')
    }), null, 2))
    return
  }
  if (command === 'transfer') {
    const id = optionValue('id')
    if (!id) throw new Error('transfer 命令需要 --id')
    const manifest = await ensureManifest()
    const item = manifest.media.find(entry => entry.id === id)
    if (!item) throw new Error(`未知媒体: ${id}`)
    const sourceUrl = optionValue('url') || item.source?.stableMediaUrl
    if (!sourceUrl) throw new Error('视频迁移需要通过 --url 提供刚刷新的临时地址')
    const result = await transferMediaItem(manifest, item, sourceUrl, { cleanup: !runtimeArgv.includes('--keep-local') })
    console.log(JSON.stringify({ id: item.id, skipped: result.skipped, upload: item.upload, download: item.download }, null, 2))
    return
  }
  throw new Error(`未知命令: ${command}`)
}

const invokedDirectly = runtimeArgv[1] && path.resolve(runtimeArgv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  main().catch(error => {
    console.error(error instanceof Error ? error.stack : String(error))
    runtimeProcess.exitCode = 1
  })
}
