#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MINI_ROOT = path.join(ROOT, 'miniprogram')
const COURSE_ROOT = path.join(ROOT, 'docs', 'wechat-course-sources')
const catalog = require(path.join(MINI_ROOT, 'data', 'media-catalog.js'))
const mediaManifest = require(path.join(COURSE_ROOT, 'migration', 'media-manifest.json'))
const subtitleSample = require(path.join(MINI_ROOT, 'data', 'subtitles', 'grade1-lower-unit-01.js'))
const { VIDEO_SUBTITLE_LINGER_MS, findTimedLineIndex } = require(path.join(MINI_ROOT, 'utils', 'subtitle.js'))
const errors = []

function filesUnder(root) {
  const result = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name)
    if (entry.isDirectory()) result.push(...filesUnder(file))
    else result.push(file)
  }
  return result
}

for (const file of filesUnder(MINI_ROOT).filter(file => file.endsWith('.js'))) {
  try {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file })
  } catch (error) {
    errors.push(`JavaScript 语法错误 ${path.relative(ROOT, file)}: ${error.message}`)
  }
}

for (const file of filesUnder(MINI_ROOT).filter(file => file.endsWith('.json'))) {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    errors.push(`JSON 无法解析 ${path.relative(ROOT, file)}: ${error.message}`)
  }
}

for (const file of filesUnder(MINI_ROOT).filter(file => file.endsWith('.wxml'))) {
  const source = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const stack = []
  for (const match of source.matchAll(/<\/?([a-zA-Z][\w-]*)\b[^>]*>/g)) {
    const raw = match[0]
    const tag = match[1]
    if (raw.startsWith('</')) {
      const opening = stack.pop()
      if (opening !== tag) {
        errors.push(`WXML 标签不匹配 ${path.relative(ROOT, file)}: </${opening}> / </${tag}>`)
        break
      }
    } else if (!raw.endsWith('/>')) {
      stack.push(tag)
    }
  }
  if (stack.length) errors.push(`WXML 标签未闭合 ${path.relative(ROOT, file)}: ${stack.join(', ')}`)
}

let unitCount = 0
let videoCount = 0
let audioCount = 0
let translatedTitleCount = 0
let unitWithAudioCount = 0
let appendixCount = 0
let availableAppendixCount = 0
let missingAppendixCount = 0
let appendixAudioCount = 0
for (const grade of catalog.grades) {
  for (const semester of ['upper', 'lower']) {
    const semesterData = grade.semesters[semester]
    for (const unit of semesterData.units) {
      unitCount += 1
      videoCount += unit.videos.length
      audioCount += unit.audios.length
      if (unit.audios.length) unitWithAudioCount += 1
      else errors.push(`单元缺少音频: ${unit.id}`)
      translatedTitleCount += unit.knowledge.filter(item => item.titleChinese).length
      if (!unit.subtitleFileID?.startsWith('cloud://cloud1-d8g5ssn6n94472f8a.636c-')) {
        errors.push(`字幕云文件缺失或环境不正确: ${unit.id}`)
      }
      for (const item of [...unit.videos, ...unit.audios]) {
        if (!item.fileID.startsWith('cloud://cloud1-d8g5ssn6n94472f8a.636c-')) {
          errors.push(`云文件环境不正确: ${item.fileID}`)
        }
      }

      const subtitlePath = path.join(COURSE_ROOT, 'subtitles', 'units', `${unit.id}.json`)
      if (!fs.existsSync(subtitlePath)) {
        errors.push(`本地字幕文件缺失: ${unit.id}`)
        continue
      }
      const tracks = JSON.parse(fs.readFileSync(subtitlePath, 'utf8'))
      for (const [mediaType, items] of [['video', unit.videos], ['audio', unit.audios]]) {
        const subtitleTracks = tracks[mediaType] || {}
        for (const item of items) {
          const lines = subtitleTracks[item.id]
          if (!Array.isArray(lines) || !lines.length) {
            errors.push(`${mediaType} 字幕轨缺失或为空: ${unit.id} / ${item.id}`)
            continue
          }
          lines.forEach((line, index) => {
            if (!line.english || !line.chinese) errors.push(`${mediaType} 字幕缺少双语文本: ${unit.id} / ${item.id} #${index + 1}`)
            if (!Number.isFinite(line.startMs) || !Number.isFinite(line.endMs) || line.startMs >= line.endMs) {
              errors.push(`${mediaType} 字幕时间无效: ${unit.id} / ${item.id} #${index + 1}`)
            }
          })
        }
      }
    }

    for (const appendix of semesterData.appendices || []) {
      appendixCount += 1
      appendixAudioCount += appendix.audios.length
      if (!appendix.title || !appendix.titleChinese || !appendix.categoryChinese || !appendix.mark) {
        errors.push(`附录显示信息不完整: ${appendix.id}`)
      }
      if (appendix.availability !== 'ready') {
        missingAppendixCount += 1
        if (appendix.audios.length) errors.push(`不可用附录不应包含音频: ${appendix.id}`)
        continue
      }

      availableAppendixCount += 1
      if (!appendix.subtitleFileID?.startsWith('cloud://cloud1-d8g5ssn6n94472f8a.636c-')) {
        errors.push(`附录字幕云文件缺失或环境不正确: ${appendix.id}`)
      }
      const subtitlePath = path.join(COURSE_ROOT, 'subtitles', 'units', `${appendix.mediaId}.json`)
      if (!fs.existsSync(subtitlePath)) {
        errors.push(`附录本地字幕文件缺失: ${appendix.id} / ${appendix.mediaId}`)
        continue
      }
      const tracks = JSON.parse(fs.readFileSync(subtitlePath, 'utf8')).audio || {}
      for (const item of appendix.audios) {
        if (!item.fileID.startsWith('cloud://cloud1-d8g5ssn6n94472f8a.636c-')) {
          errors.push(`附录云文件环境不正确: ${item.fileID}`)
        }
        const lines = tracks[item.id]
        if (!Array.isArray(lines) || !lines.length) {
          errors.push(`附录音频字幕轨缺失或为空: ${appendix.id} / ${item.id}`)
          continue
        }
        lines.forEach((line, index) => {
          if (!line.english || !line.chinese) errors.push(`附录字幕缺少双语文本: ${appendix.id} / ${item.id} #${index + 1}`)
          if (!Number.isFinite(line.startMs) || !Number.isFinite(line.endMs) || line.startMs >= line.endMs) {
            errors.push(`附录字幕时间无效: ${appendix.id} / ${item.id} #${index + 1}`)
          }
        })
      }
    }
  }
}

const appendixSourceMediaIds = new Set((mediaManifest.audioSources || [])
  .filter(source => !/^\s*unit\s*0*\d+\s*$/i.test(source.label || ''))
  .flatMap(source => source.mediaIds || []))
const expectedAudioCount = mediaManifest.media.filter(item =>
  item.mediaType === 'audio' && !appendixSourceMediaIds.has(item.mediaId) && item.upload?.status === 'verified'
).length
const expectedAppendixAudioCount = mediaManifest.media.filter(item =>
  item.mediaType === 'audio' && appendixSourceMediaIds.has(item.mediaId) && item.upload?.status === 'verified'
).length
const expectedAppendixCount = (mediaManifest.audioSources || []).filter(source => !/^\s*unit\s*0*\d+\s*$/i.test(source.label || '')).length
const expectedMissingAppendixCount = (mediaManifest.audioSources || []).filter(source =>
  !/^\s*unit\s*0*\d+\s*$/i.test(source.label || '') && source.status === 'empty'
).length
if (unitCount !== 104) errors.push(`Unit 数量应为 104，实际 ${unitCount}`)
if (videoCount !== 268) errors.push(`视频数量应为 268，实际 ${videoCount}`)
if (audioCount !== expectedAudioCount) errors.push(`音频数量应为 ${expectedAudioCount}，实际 ${audioCount}`)
if (unitWithAudioCount !== unitCount) errors.push(`音频覆盖 Unit 数量应为 ${unitCount}，实际 ${unitWithAudioCount}`)
if (appendixCount !== expectedAppendixCount) errors.push(`附录数量应为 ${expectedAppendixCount}，实际 ${appendixCount}`)
if (appendixAudioCount !== expectedAppendixAudioCount) errors.push(`附录音频数量应为 ${expectedAppendixAudioCount}，实际 ${appendixAudioCount}`)
if (missingAppendixCount !== expectedMissingAppendixCount) errors.push(`缺失附录数量应为 ${expectedMissingAppendixCount}，实际 ${missingAppendixCount}`)
if (!catalog.grades.some(grade => Object.values(grade.semesters).some(data => data.appendices.some(item => /^Project/i.test(item.title))))) {
  errors.push('附录目录缺少 Project 资源')
}
if (!catalog.grades.some(grade => Object.values(grade.semesters).some(data => data.appendices.some(item => /Word list|单词/i.test(item.title))))) {
  errors.push('附录目录缺少 Word list 资源')
}

const sampleUnit = catalog.grades.find(item => item.grade === 1)?.semesters.lower.units[0]
const sampleVideoIds = new Set((sampleUnit?.videos || []).map(item => item.id))
for (const [mediaId, lines] of Object.entries(subtitleSample.video)) {
  if (!sampleVideoIds.has(mediaId)) errors.push(`字幕轨未匹配一年级下册 Unit 1 视频: ${mediaId}`)
  lines.forEach((line, index) => {
    if (!line.english || !line.chinese) errors.push(`字幕缺少双语文本: ${mediaId} #${index + 1}`)
    if (!Number.isFinite(line.startMs) || !Number.isFinite(line.endMs) || line.startMs >= line.endMs) {
      errors.push(`字幕时间无效: ${mediaId} #${index + 1}`)
    }
    if (index > 0 && line.startMs < lines[index - 1].endMs) {
      errors.push(`字幕时间重叠: ${mediaId} #${index} / #${index + 1}`)
    }
  })
}
if (Object.keys(subtitleSample.video).length !== sampleVideoIds.size) {
  errors.push(`一年级下册 Unit 1 字幕轨数量不完整: ${Object.keys(subtitleSample.video).length}/${sampleVideoIds.size}`)
}

const timingFixture = [
  { startMs: 0, endMs: 1000 },
  { startMs: 2000, endMs: 2500 }
]
if (findTimedLineIndex(timingFixture, 1900, VIDEO_SUBTITLE_LINGER_MS) !== 0) {
  errors.push('视频字幕没有按预期延长停留时间')
}
if (findTimedLineIndex(timingFixture, 2000, VIDEO_SUBTITLE_LINGER_MS) !== 1) {
  errors.push('新视频字幕没有立即替换旧字幕')
}
if (findTimedLineIndex(timingFixture, 4400, VIDEO_SUBTITLE_LINGER_MS) !== -1) {
  errors.push('视频字幕超过延长时间后仍未消失')
}

const grade1LowerExtras = JSON.parse(fs.readFileSync(
  path.join(COURSE_ROOT, 'subtitles', 'units', 'grade1-lower-extras.json'),
  'utf8'
))
const grade1LowerUnit2WordList = grade1LowerExtras.audio?.MzI2MTIxOTUxMl8yNjUwNTA0ODM2 || []
const expectedGrade1LowerUnit2Words = [
  'Unit 2',
  'window window',
  'blackboard blackboard',
  'door door',
  'desk desk',
  'chair chair',
  'school bag school bag'
]
if (
  grade1LowerUnit2WordList.length !== expectedGrade1LowerUnit2Words.length ||
  grade1LowerUnit2WordList.some((line, index) => line.english !== expectedGrade1LowerUnit2Words[index])
) {
  errors.push('一年级下册 Word list 的 Unit 2 单词没有逐项拆分')
}

const expectedSplitWordListTracks = {
  MzI2MTIxOTUxMl8yNjUwNTA0ODQw: [
    'Unit 4', 'spring', 'spring', 'warm', 'warm', 'summer', 'summer', 'hot', 'hot',
    'autumn', 'autumn', 'cool', 'cool', 'winter', 'winter', 'cold', 'cold'
  ],
  MzI2MTIxOTUxMl8yNjUwNTA0ODQx: [
    'Unit 5', 'lemon', 'lemon', 'banana', 'banana', 'apple', 'apple',
    'watermelon', 'watermelon', 'pear', 'pear', 'pineapple', 'pineapple',
    'peach', 'peach', 'orange', 'orange'
  ],
  MzI2MTIxOTUxMl8yNjUwNTA0ODQy: [
    'Unit 6', 'tadpole', 'tadpole', 'frog', 'frog', 'butterfly', 'butterfly',
    'goldfish', 'goldfish', 'duck', 'duck', 'tortoise', 'tortoise'
  ]
}
for (const [mediaId, expectedLines] of Object.entries(expectedSplitWordListTracks)) {
  const actualLines = grade1LowerExtras.audio?.[mediaId] || []
  if (
    actualLines.length !== expectedLines.length ||
    actualLines.some((line, index) => line.english !== expectedLines[index])
  ) {
    errors.push(`一年级下册 Word list 字幕没有逐次拆分: ${mediaId}`)
  }
}

const grade2UpperExtras = JSON.parse(fs.readFileSync(
  path.join(COURSE_ROOT, 'subtitles', 'units', 'grade2-upper-extras.json'),
  'utf8'
))
const expectedGrade2UpperWordListTracks = {
  MzI2MTIxOTUxMl8yNjUwNDk4MzM5: [
    'Unit 1', 'feel', 'feel', 'see', 'see', 'smell', 'smell', 'hear', 'hear', 'taste', 'taste'
  ],
  MzI2MTIxOTUxMl8yNjUwNDk4MzM4: [
    'Unit 2', 'uncle', 'uncle', 'aunt', 'aunt', 'cousin', 'cousin',
    'old', 'old', 'young', 'young', 'cute', 'cute'
  ],
  MzI2MTIxOTUxMl8yNjUwNDk4MzQw: [
    'Unit 3', 'doll', 'doll', 'toy plane', 'toy plane', 'toy bear', 'toy bear',
    'ball', 'ball', 'robot', 'robot', 'jigsaw puzzle', 'jigsaw puzzle'
  ],
  MzI2MTIxOTUxMl8yNjUwNDk4MzQy: [
    'Unit 5', 'cow', 'cow', 'sheep', 'sheep', 'duck', 'duck',
    'chick', 'chick', 'chicken', 'chicken', 'pig', 'pig'
  ],
  MzI2MTIxOTUxMl8yNjUwNDk4MzQz: [
    'Unit 6', 'play with lanterns', 'play with lanterns', 'eat mooncakes', 'eat mooncakes',
    'solve riddles', 'solve riddles', 'look at the moon', 'look at the moon'
  ]
}
for (const [mediaId, expectedLines] of Object.entries(expectedGrade2UpperWordListTracks)) {
  const actualLines = grade2UpperExtras.audio?.[mediaId] || []
  if (
    actualLines.length !== expectedLines.length ||
    actualLines.some((line, index) => line.english !== expectedLines[index])
  ) {
    errors.push(`二年级上册 Word list 字幕没有逐次拆分: ${mediaId}`)
  }
}
if ((grade2UpperExtras.audio?.MzI2MTIxOTUxMl8yNjUwNDk4MzQx || []).length !== 13) {
  errors.push('二年级上册 Word list 的 Unit 4 被意外修改')
}

const learnWxml = fs.readFileSync(path.join(MINI_ROOT, 'pages', 'learn', 'learn.wxml'), 'utf8')
if (!learnWxml.includes('<view class="audio-row" data-index="{{index}}" bindtap="onToggleAudio">')) {
  errors.push('音频列表项没有绑定播放/暂停操作')
}
if (/<view class="audio-button"[^>]*bindtap=/.test(learnWxml)) {
  errors.push('音频播放操作仍然只绑定在播放按钮上')
}
if (!/<view class="audio-progress-row"[^>]*catchtap="onIgnoreAudioTap"/.test(learnWxml)) {
  errors.push('音频进度条没有阻止列表项点击事件')
}

const audioSessionPath = path.join(MINI_ROOT, 'utils', 'audio.js')
let configuredAudioOptions
globalThis.wx = {
  setInnerAudioOption(options) {
    configuredAudioOptions = options
    options.success()
  },
  createInnerAudioContext() {
    return {}
  }
}
try {
  delete require.cache[require.resolve(audioSessionPath)]
  const audioSession = require(audioSessionPath)
  await audioSession.configure(true)
  const audioContext = audioSession.createContext()
  if (
    configuredAudioOptions?.obeyMuteSwitch !== false ||
    configuredAudioOptions?.speakerOn !== true ||
    configuredAudioOptions?.mixWithOther !== false
  ) {
    errors.push('iOS 全局音频播放选项配置不完整')
  }
  if (audioContext.obeyMuteSwitch !== false || audioContext.volume !== 1) {
    errors.push('音频上下文缺少 iOS 静音键或音量兜底配置')
  }
} catch (error) {
  errors.push(`iOS 音频播放选项校验失败: ${error.message}`)
} finally {
  delete globalThis.wx
}

const learnPagePath = path.join(MINI_ROOT, 'pages', 'learn', 'learn.js')
const mediaUtils = require(path.join(MINI_ROOT, 'utils', 'media.js'))
const originalGetTempUrl = mediaUtils.getTempUrl
let learnPageDefinition
let videoPauseCount = 0
let audioCreateCount = 0
let audioPauseCount = 0

function createAudioContextMock() {
  const listeners = {}
  return {
    duration: 10,
    currentTime: 0,
    onPlay(listener) { listeners.play = listener },
    onPause(listener) { listeners.pause = listener },
    onTimeUpdate(listener) { listeners.timeUpdate = listener },
    onEnded(listener) { listeners.ended = listener },
    onError(listener) { listeners.error = listener },
    play() { listeners.play?.() },
    pause() {
      audioPauseCount += 1
      listeners.pause?.()
    },
    seek() {},
    stop() {},
    destroy() {}
  }
}

function createLearnPageForMediaTest() {
  return {
    ...learnPageDefinition,
    data: {
      ...learnPageDefinition.data,
      videos: [{ id: 'video-test' }],
      audios: [{ id: 'audio-test', fileID: 'cloud://test/audio.mp3', durationSeconds: 10 }],
      subtitleTracks: { video: {}, audio: {} }
    },
    setData(updates) {
      Object.assign(this.data, updates)
    },
    recordLearning() {}
  }
}

globalThis.getApp = () => ({ globalData: {} })
globalThis.Page = definition => { learnPageDefinition = definition }
globalThis.wx = {
  createVideoContext(id) {
    if (id !== 'lesson-video') errors.push(`视频上下文 ID 不正确: ${id}`)
    return { pause() { videoPauseCount += 1 } }
  },
  createInnerAudioContext() {
    audioCreateCount += 1
    return createAudioContextMock()
  },
  showToast() {}
}

try {
  mediaUtils.getTempUrl = () => Promise.resolve('https://example.test/audio.mp3')
  delete require.cache[require.resolve(learnPagePath)]
  require(learnPagePath)

  const mutualExclusionPage = createLearnPageForMediaTest()
  await mutualExclusionPage.onToggleAudio({ currentTarget: { dataset: { index: 0 } } })
  if (videoPauseCount < 1) errors.push('开始播放音频时没有暂停视频')
  mutualExclusionPage.onVideoPlay()
  if (audioPauseCount !== 1 || !mutualExclusionPage.data.audioPaused) {
    errors.push('开始播放视频时没有暂停音频')
  }

  let resolveAudioUrl
  mediaUtils.getTempUrl = () => new Promise(resolve => { resolveAudioUrl = resolve })
  const racePage = createLearnPageForMediaTest()
  const pendingAudio = racePage.onToggleAudio({ currentTarget: { dataset: { index: 0 } } })
  racePage.onVideoPlay()
  const audioCountBeforeResolve = audioCreateCount
  resolveAudioUrl('https://example.test/audio.mp3')
  await pendingAudio
  if (audioCreateCount !== audioCountBeforeResolve || racePage.data.audioLoadingId) {
    errors.push('视频开始播放后，过期的音频加载请求仍然继续播放')
  }
} catch (error) {
  errors.push(`音视频互斥播放校验失败: ${error.message}`)
} finally {
  mediaUtils.getTempUrl = originalGetTempUrl
  delete require.cache[require.resolve(learnPagePath)]
  delete globalThis.getApp
  delete globalThis.Page
  delete globalThis.wx
}

const remoteFixture = {
  unitId: 'grade2-upper-unit-01',
  video: {
    remote_video: [{ startMs: 0, endMs: 1000, english: 'Hello.', chinese: '你好。' }]
  },
  audio: {}
}
let remoteRequestCount = 0
let remoteDownloadCount = 0
globalThis.wx = {
  cloud: {
    getTempFileURL() {
      return Promise.resolve({ fileList: [{ tempFileURL: 'https://example.test/subtitle.json' }] })
    },
    downloadFile() {
      remoteDownloadCount += 1
      return Promise.reject(new Error('downloadFile should not be needed'))
    }
  },
  request(options) {
    remoteRequestCount += 1
    options.success({ statusCode: 200, data: JSON.stringify(remoteFixture) })
  }
}
try {
  const subtitleCatalog = require(path.join(MINI_ROOT, 'data', 'subtitle-catalog.js'))
  const remoteTracks = await subtitleCatalog.loadUnitTracks({
    id: remoteFixture.unitId,
    subtitleFileID: 'cloud://test/subtitle.json'
  })
  if (remoteTracks.video.remote_video?.[0]?.chinese !== '你好。') {
    errors.push('非 Unit 1 远程字幕没有正确加载')
  }
  if (remoteRequestCount !== 1 || remoteDownloadCount !== 0) {
    errors.push(`远程字幕没有优先使用临时 URL: request=${remoteRequestCount}, download=${remoteDownloadCount}`)
  }

  const legacyTracks = await subtitleCatalog.loadUnitTracks({
    id: 'unit-01',
    mediaId: remoteFixture.unitId,
    subtitleFileID: 'cloud://test/subtitle.json'
  })
  if (legacyTracks.video.remote_video?.[0]?.english !== 'Hello.') {
    errors.push('一年级上册旧 Unit ID 没有映射到远程字幕 ID')
  }

  const fallbackFixture = { unitId: 'fallback-unit', video: {}, audio: {} }
  globalThis.wx.request = options => options.fail({ errMsg: 'request:fail test' })
  globalThis.wx.cloud.downloadFile = () => {
    remoteDownloadCount += 1
    return Promise.resolve({ tempFilePath: 'fallback-subtitle.json' })
  }
  globalThis.wx.getFileSystemManager = () => ({
    readFile(options) {
      options.success({ data: JSON.stringify(fallbackFixture) })
    }
  })
  const media = require(path.join(MINI_ROOT, 'utils', 'media.js'))
  const fallbackData = await media.getJson('cloud://test/fallback-subtitle.json')
  if (fallbackData.unitId !== fallbackFixture.unitId || remoteDownloadCount !== 1) {
    errors.push('临时 URL 请求失败后没有通过云下载读取字幕')
  }
} catch (error) {
  errors.push(`非 Unit 1 远程字幕加载失败: ${error.message}`)
} finally {
  delete globalThis.wx
}

const packageBytes = filesUnder(MINI_ROOT).reduce((sum, file) => sum + fs.statSync(file).size, 0)
if (packageBytes > 2 * 1024 * 1024) errors.push(`小程序包超过 2MB: ${packageBytes} bytes`)

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'ok',
  units: unitCount,
  videos: videoCount,
  audios: audioCount,
  appendices: appendixCount,
  availableAppendices: availableAppendixCount,
  missingAppendices: missingAppendixCount,
  appendixAudios: appendixAudioCount,
  translatedKnowledgeTitles: translatedTitleCount,
  packageBytes
}, null, 2))
