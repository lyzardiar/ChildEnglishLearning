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
const grade1Lower = require(path.join(MINI_ROOT, 'data', 'grade1-lower.js'))
const bookData = require(path.join(MINI_ROOT, 'data', 'index.js'))
const mediaManifest = require(path.join(COURSE_ROOT, 'migration', 'media-manifest.json'))
const subtitleSample = require(path.join(MINI_ROOT, 'data', 'subtitles', 'grade1-lower-unit-01.js'))
const { VIDEO_SUBTITLE_LINGER_MS, findTimedLineIndex } = require(path.join(MINI_ROOT, 'utils', 'subtitle.js'))
const chessRules = require(path.join(MINI_ROOT, 'data', 'chess-rules.js'))
const { PIECE_IMAGES } = require(path.join(MINI_ROOT, 'data', 'chess-assets.js'))
const {
  Chess,
  DIFFICULTIES,
  getDrawState,
  getTerminalState,
  legalMovesFrom,
  capturedSquare,
  createBoardSquares
} = require(path.join(MINI_ROOT, 'utils', 'chess-game.js'))
const { calculateRobotMove } = require(path.join(MINI_ROOT, 'utils', 'chess-ai.js'))
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
  setNavigationBarTitle() {},
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

  const textbookPage = {
    ...learnPageDefinition,
    data: {
      ...learnPageDefinition.data,
      grade: 1,
      semester: 'lower',
      unitIndex: 0,
      isAppendix: false
    },
    setData(updates) {
      Object.assign(this.data, updates)
    },
    prepareVideo() {},
    loadSubtitleTracks() {}
  }
  textbookPage.loadUnitData()
  if (
    textbookPage.data.unitTitle !== grade1Lower.units[0].title ||
    textbookPage.data.readyChant.lines.length !== grade1Lower.units[0].readyChant.lines.length ||
    textbookPage.data.communication.title !== grade1Lower.units[0].communication.title ||
    textbookPage.data.extendTitle !== grade1Lower.units[0].extendTitle
  ) {
    errors.push('学习页没有完整装载一年级下册的歌谣、交流活动或拓展标题')
  }
  if (!textbookPage.data.letters[0].chant.length || /\bfor\b/i.test(textbookPage.data.letters[0].speechText)) {
    errors.push('学习页仍用拼接短句代替一年级下册正式字母歌谣')
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

const expectedGrade1LowerUnits = [
  {
    title: 'What food do you like?',
    subtitle: '你喜欢什么食物？',
    words: ['noodles', 'baozi', 'rice', 'carrot', 'tomato', 'bread', 'egg', 'milk'],
    audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0Nzgy'
  },
  {
    title: 'What do we do in the classroom?',
    subtitle: '我们在教室里做什么？',
    words: ['window', 'blackboard', 'door', 'desk', 'chair', 'schoolbag'],
    audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0Nzkw'
  },
  {
    title: 'How do we play?',
    subtitle: '我们怎么玩？',
    words: ['ride a bike', 'ride a scooter', 'rollerblade', 'play football', 'skateboard'],
    audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0Nzk5'
  },
  {
    title: 'Which season do you like?',
    subtitle: '你喜欢哪个季节？',
    words: ['spring', 'warm', 'summer', 'hot', 'autumn', 'cool', 'winter', 'cold'],
    audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0ODA4'
  },
  {
    title: 'What do you know about fruit?',
    subtitle: '你对水果了解多少？',
    words: ['lemon', 'banana', 'apple', 'watermelon', 'pear', 'pineapple', 'peach', 'orange'],
    audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0ODE3'
  },
  {
    title: 'How do animals grow?',
    subtitle: '动物是怎样长大的？',
    words: ['tadpole', 'frog', 'butterfly', 'goldfish', 'duck', 'tortoise'],
    audioTrackId: 'MzI2MTIxOTUxMl8yNjUwNTA0ODI4'
  }
]

if (grade1Lower.contentStatus !== 'textbook-verified' || grade1Lower.units.length !== expectedGrade1LowerUnits.length) {
  errors.push('一年级下册没有标记为六单元教材校订数据')
}

for (const [index, expected] of expectedGrade1LowerUnits.entries()) {
  const unit = grade1Lower.units[index]
  if (!unit) continue
  if (unit.title !== expected.title || unit.subtitle !== expected.subtitle) {
    errors.push(`一年级下册 Unit ${index + 1} 标题与教材不一致`)
  }
  const actualWords = (unit.words || []).map(item => item.english)
  if (JSON.stringify(actualWords) !== JSON.stringify(expected.words)) {
    errors.push(`一年级下册 Unit ${index + 1} Word list 与教材不一致`)
  }
  if (unit.source?.audioTrackId !== expected.audioTrackId || !unit.source?.scanPages || !unit.pageRange) {
    errors.push(`一年级下册 Unit ${index + 1} 缺少扫描件或主音轨来源`)
  }
  if (!unit.sentences?.length || !unit.readyChant?.lines?.length || !unit.communication?.title || !unit.communication?.question) {
    errors.push(`一年级下册 Unit ${index + 1} 句型、课堂歌谣或交流活动不完整`)
  }
  if (!unit.story?.title || !unit.story?.titleChinese || !unit.story?.lines?.length) {
    errors.push(`一年级下册 Unit ${index + 1} 故事内容不完整`)
  }
  if (!unit.extendTitle || !unit.extendTitleChinese || !unit.extend?.length) {
    errors.push(`一年级下册 Unit ${index + 1} 拓展阅读不完整`)
  }
  if (!unit.letters?.length || unit.letters.some(item => !item.letter || !item.word || !item.chinese || !item.chant?.length)) {
    errors.push(`一年级下册 Unit ${index + 1} 字母歌谣不完整`)
  }
}

if (grade1Lower.units[4]?.words.some(item => /heavy|重/i.test(`${item.english}${item.chinese}`))) {
  errors.push('一年级下册 Unit 5 Word list 混入了学生手写内容')
}

const integratedGrade1Lower = bookData.getBook('lower', 1)
for (const [index, expected] of expectedGrade1LowerUnits.entries()) {
  const unit = integratedGrade1Lower.units[index]
  if (unit?.title !== expected.title || unit?.mediaId !== `grade1-lower-unit-${String(index + 1).padStart(2, '0')}`) {
    errors.push(`一年级下册 Unit ${index + 1} 没有正确合并教材正文与媒体目录`)
  }
  if (!unit?.videos?.length || !unit?.audios?.length || !unit?.subtitleFileID) {
    errors.push(`一年级下册 Unit ${index + 1} 合并后丢失音视频或字幕资源`)
  }
}

const grade1LowerCatalogUnits = catalog.grades.find(item => item.grade === 1)?.semesters.lower.units || []
for (const [index, expected] of expectedGrade1LowerUnits.entries()) {
  const unit = grade1LowerCatalogUnits[index]
  if (unit?.title !== expected.title || unit?.titleChinese !== expected.subtitle) {
    errors.push(`媒体目录中的一年级下册 Unit ${index + 1} 仍是占位标题`)
  }
}

const scanSourceReadme = path.join(COURSE_ROOT, 'textbooks', 'grade1-lower', 'README.md')
if (!fs.existsSync(scanSourceReadme) || !fs.readFileSync(scanSourceReadme, 'utf8').includes('002AAE2B3418D999E20A8858A3391E4667447857F97A6628D9BCCF4DAADDE9A6')) {
  errors.push('一年级下册扫描件来源或 SHA256 没有落地记录')
}

const chessRulesPath = path.join(ROOT, 'docs', 'chess-rules.md')
const chessRulesSource = fs.existsSync(chessRulesPath) ? fs.readFileSync(chessRulesPath, 'utf8') : ''
const requiredChessRuleTerms = [
  '王车易位', '吃过路兵', '升变', '将军', '将死', '逼和', '死局', '认输',
  '三次重复', '五次重复', '五十回合', '七十五回合', '同意和棋', '将死优先'
]
if (!chessRulesSource) errors.push('国际象棋规则文档没有落盘')
for (const term of requiredChessRuleTerms) {
  if (!chessRulesSource.includes(term)) errors.push(`国际象棋规则文档缺少：${term}`)
}
const expectedChessRuleSections = [
  'goal', 'pieces', 'legal', 'castling', 'en-passant', 'promotion', 'win', 'draw', 'digital', 'app'
]
if (
  chessRules.length !== expectedChessRuleSections.length ||
  chessRules.some((section, index) => section.id !== expectedChessRuleSections[index] || !section.items?.length)
) {
  errors.push('小程序内国际象棋规则章节不完整或顺序错误')
}

const expectedChessPieceKeys = ['wk', 'wq', 'wr', 'wb', 'wn', 'wp', 'bk', 'bq', 'br', 'bb', 'bn', 'bp']
if (
  Object.keys(PIECE_IMAGES).length !== expectedChessPieceKeys.length ||
  expectedChessPieceKeys.some(key => !PIECE_IMAGES[key]?.endsWith(`/images/chess/metal/${key}.png`))
) {
  errors.push('国际象棋金银棋子的 12 个云端映射不完整')
}
const chessAssetsDoc = path.join(ROOT, 'docs', 'chess-assets.md')
if (!fs.existsSync(chessAssetsDoc) || !fs.readFileSync(chessAssetsDoc, 'utf8').includes('gpt-image-2')) {
  errors.push('国际象棋生图来源、规格与云端映射没有落盘')
}
const chessWxmlSource = fs.readFileSync(path.join(MINI_ROOT, 'pages', 'chess', 'chess.wxml'), 'utf8')
const chessWxssSource = fs.readFileSync(path.join(MINI_ROOT, 'pages', 'chess', 'chess.wxss'), 'utf8')
if (
  !chessWxmlSource.includes('item.pieceImage') ||
  !chessWxmlSource.includes('wx:key="renderKey"') ||
  chessWxmlSource.includes('moveLog.length')
) {
  errors.push('国际象棋页面没有使用云端 3D 棋子或仍引用非响应式走子状态')
}
if (!/grid-template-rows:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/.test(chessWxssSource)) {
  errors.push('国际象棋棋盘没有固定为严格等高的 8 行')
}
const chessPageSource = fs.readFileSync(path.join(MINI_ROOT, 'pages', 'chess', 'chess.js'), 'utf8')
if (
  !chessWxmlSource.includes('assetsLoading') ||
  !chessPageSource.includes('preloadPieceAssets') ||
  !chessPageSource.includes('wx.getImageInfo')
) {
  errors.push('国际象棋没有在显示棋盘前预加载全部棋子资源')
}
if (!chessWxmlSource.includes('active-turn') || !chessWxmlSource.includes('boardTurnClass')) {
  errors.push('国际象棋没有明显区分当前走棋方')
}
if (
  !/ROBOT_MOVE_MIN_DELAY_MS\s*=\s*1200/.test(chessPageSource) ||
  !chessPageSource.includes('_aiRequestedAt') ||
  !chessPageSource.includes('remainingDelay')
) {
  errors.push('国际象棋机器人没有在玩家走子后保留至少 1.2 秒的思考反馈')
}
if (
  !chessWxmlSource.includes('item.lastFrom') ||
  !chessWxmlSource.includes('item.lastTo') ||
  !chessWxssSource.includes('.chess-square.last-from::before') ||
  !chessWxssSource.includes('.chess-square.last-to::before')
) {
  errors.push('国际象棋没有分别高亮最近一步的起点和终点')
}
if (
  !chessWxmlSource.includes('capture-effect') ||
  !chessWxssSource.includes('@keyframes capture-wave') ||
  !chessPageSource.includes('triggerCaptureEffect')
) {
  errors.push('国际象棋吃子后没有显示吃子动画')
}
const chessRulesUiText = chessRules.flatMap(section => [section.title, ...section.items]).join('\n')
for (const term of requiredChessRuleTerms) {
  if (!chessRulesUiText.includes(term) && !['同意和棋', '将死优先'].includes(term)) {
    errors.push(`小程序内国际象棋规则缺少：${term}`)
  }
}

if (
  DIFFICULTIES.length !== 10 ||
  DIFFICULTIES.some((difficulty, index) => difficulty.level !== index + 1) ||
  DIFFICULTIES[0]?.name !== '新手' ||
  DIFFICULTIES[9]?.name !== '老手'
) {
  errors.push('国际象棋机器人必须保留从新手到老手的连续十档难度')
}

const initialChessGame = new Chess()
if (initialChessGame.moves().length !== 20) errors.push('国际象棋初始局面合法走法数量错误')
const robotMove = calculateRobotMove(initialChessGame.fen(), 10, () => 0.99)
if (!robotMove || !legalMovesFrom(initialChessGame, robotMove.from).some(move => move.to === robotMove.to)) {
  errors.push('国际象棋机器人没有返回规则引擎认可的合法走法')
}

const castlingGame = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
const castlingTargets = legalMovesFrom(castlingGame, 'e1').map(move => move.to)
if (!castlingTargets.includes('c1') || !castlingTargets.includes('g1')) {
  errors.push('国际象棋规则引擎没有提供完整的长短王车易位')
}
castlingGame.move({ from: 'e1', to: 'g1' })
if (castlingGame.get('g1')?.type !== 'k' || castlingGame.get('f1')?.type !== 'r') {
  errors.push('国际象棋短易位没有同时移动王和车')
}
const attackedCastlingGame = new Chess('r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
const attackedCastlingTargets = legalMovesFrom(attackedCastlingGame, 'e1').map(move => move.to)
if (attackedCastlingTargets.includes('g1') || !attackedCastlingTargets.includes('c1')) {
  errors.push('国际象棋王车易位没有正确检查王经过的受攻击格')
}

const enPassantGame = new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
const enPassantMove = legalMovesFrom(enPassantGame, 'e5').find(move => move.to === 'd6')
if (!enPassantMove || !String(enPassantMove.flags).includes('e')) {
  errors.push('国际象棋规则引擎没有提供吃过路兵')
} else {
  enPassantGame.move({ from: 'e5', to: 'd6' })
  if (enPassantGame.get('d6')?.type !== 'p' || enPassantGame.get('d5')) {
    errors.push('国际象棋吃过路兵没有移除被吃的兵')
  }
}

for (const promotion of ['q', 'r', 'b', 'n']) {
  const promotionGame = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1')
  const choices = legalMovesFrom(promotionGame, 'a7').filter(move => move.to === 'a8')
  if (new Set(choices.map(move => move.promotion)).size !== 4) {
    errors.push('国际象棋升变没有提供后、车、象、马四种选择')
    break
  }
  promotionGame.move({ from: 'a7', to: 'a8', promotion })
  if (promotionGame.get('a8')?.type !== promotion) errors.push(`国际象棋不能升变为：${promotion}`)
}

const pinnedGame = new Chess('k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1')
if (legalMovesFrom(pinnedGame, 'e2').some(move => move.to === 'd2')) {
  errors.push('国际象棋规则引擎允许被牵制棋子暴露己方王')
}
const captureRenderGame = new Chess('4k3/8/8/8/5p2/7N/8/4K3 w - - 0 1')
const beforeCaptureSquares = createBoardSquares(captureRenderGame, 'b', '', [], null)
captureRenderGame.move({ from: 'h3', to: 'f4' })
const afterCaptureSquares = createBoardSquares(captureRenderGame, 'b', '', [], { from: 'h3', to: 'f4' })
const beforeCaptureTarget = beforeCaptureSquares.find(square => square.coord === 'f4')
const afterCaptureTarget = afterCaptureSquares.find(square => square.coord === 'f4')
const afterCaptureOrigin = afterCaptureSquares.find(square => square.coord === 'h3')
if (
  beforeCaptureTarget?.pieceKey !== 'bp' ||
  afterCaptureTarget?.pieceKey !== 'wn' ||
  beforeCaptureTarget.renderKey === afterCaptureTarget.renderKey ||
  afterCaptureOrigin?.pieceKey !== ''
) {
  errors.push('国际象棋吃子后没有强制刷新起点和目标格的棋子图片')
}
if (!afterCaptureTarget?.lastTo || !afterCaptureOrigin?.lastFrom) {
  errors.push('国际象棋最近一步没有正确标记起点和终点')
}
if (
  capturedSquare({ from: 'h3', to: 'f4', captured: 'p', flags: 'c' }) !== 'f4' ||
  capturedSquare({ from: 'e5', to: 'd6', captured: 'p', flags: 'e' }) !== 'd5' ||
  capturedSquare({ from: 'e2', to: 'e4', flags: 'b' }) !== ''
) {
  errors.push('国际象棋吃子动画没有定位到实际被吃棋子的格子')
}
const stalemateGame = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
if (getTerminalState(stalemateGame, [stalemateGame.fen()]).reason !== '逼和') {
  errors.push('国际象棋没有正确自动判定逼和')
}
const insufficientGame = new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1')
if (getTerminalState(insufficientGame, [insufficientGame.fen()]).reason !== '子力不足') {
  errors.push('国际象棋没有正确自动判定标准子力不足局面')
}
const repeatedGame = new Chess()
const threefold = getDrawState(repeatedGame, Array(3).fill(repeatedGame.fen()))
const fivefold = getDrawState(repeatedGame, Array(5).fill(repeatedGame.fen()))
if (!threefold.claimable || threefold.automatic || threefold.reason !== '三次重复局面') {
  errors.push('国际象棋三次重复没有作为可申请和棋处理')
}
if (!fivefold.automatic || fivefold.reason !== '五次重复局面') {
  errors.push('国际象棋五次重复没有自动判和')
}
const fiftyMoveGame = new Chess('7k/8/8/8/8/8/R7/7K w - - 100 51')
const seventyFiveMoveGame = new Chess('7k/8/8/8/8/8/R7/7K w - - 150 76')
if (!getDrawState(fiftyMoveGame, [fiftyMoveGame.fen()]).claimable) {
  errors.push('国际象棋五十回合规则没有作为可申请和棋处理')
}
if (getTerminalState(seventyFiveMoveGame, [seventyFiveMoveGame.fen()]).reason !== '七十五回合无吃子或兵移动') {
  errors.push('国际象棋七十五回合规则没有自动判和')
}
const checkmateAtSeventyFive = new Chess('7k/6Q1/6K1/8/8/8/8/8 b - - 150 76')
if (getTerminalState(checkmateAtSeventyFive, [checkmateAtSeventyFive.fen()]).type !== 'checkmate') {
  errors.push('国际象棋最后一步同时触发七十五回合时没有优先判定将死')
}

const chessWorkerPath = path.join(MINI_ROOT, 'workers', 'chess-ai.js')
const chessWorkerSource = fs.existsSync(chessWorkerPath) ? fs.readFileSync(chessWorkerPath, 'utf8') : ''
if (!chessWorkerSource || /require\(["']\.\.[/\\]/.test(chessWorkerSource)) {
  errors.push('国际象棋 Worker 没有构建为独立单文件')
} else {
  let workerHandler
  let workerReply
  const workerContext = {
    worker: {
      onMessage(handler) { workerHandler = handler },
      postMessage(message) { workerReply = message }
    },
    console
  }
  try {
    new vm.Script(chessWorkerSource, { filename: chessWorkerPath }).runInNewContext(workerContext)
    workerHandler?.({ requestId: 'validation', fen: initialChessGame.fen(), level: 1 })
    if (
      workerReply?.requestId !== 'validation' ||
      !workerReply.move ||
      !legalMovesFrom(initialChessGame, workerReply.move.from).some(move => move.to === workerReply.move.to)
    ) {
      errors.push('国际象棋 Worker 没有返回规则引擎认可的合法走法')
    }
  } catch (error) {
    errors.push(`国际象棋 Worker 无法独立运行: ${error.message}`)
  }
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
