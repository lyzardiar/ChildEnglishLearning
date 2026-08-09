#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '..')
const SOURCE_ROOT = path.join(ROOT, 'docs', 'wechat-course-sources')
const OUTPUT = path.join(ROOT, 'miniprogram', 'data', 'media-catalog.js')
const manifest = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, 'migration', 'media-manifest.json'), 'utf8'))
const knowledge = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, 'catalog', 'knowledge-by-unit.json'), 'utf8'))
const grade1Upper = require(path.join(ROOT, 'miniprogram', 'data', 'grade1-upper.js'))
const grade1Lower = require(path.join(ROOT, 'miniprogram', 'data', 'grade1-lower.js'))
let subtitleManifest = { units: {} }
try {
  subtitleManifest = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, 'subtitles', 'subtitle-manifest.json'), 'utf8'))
} catch {}

const SEMESTER_NAMES = { upper: '上册', lower: '下册' }
const GRADE_NAMES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
const CATEGORY_NAMES = {
  story: '故事',
  extend: '拓展阅读',
  letters: '字母认读',
  sounds: '语音练习',
  explore: '探索活动',
  listenAndSay: '听一听，说一说',
  lookAndRead: '看一看，读一读',
  readAStory: '读故事',
  learnTheSounds: '学习语音',
  listenAndEnjoy: '听一听，欣赏一下',
  textbook: '课本内容'
}

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12
}

const TITLE_TRANSLATIONS = {
  "grandma's magic pot": '奶奶的魔法锅',
  'different families': '不同的家庭',
  'on the farm': '在农场',
  'the tortoise and the rabbit': '乌龟和兔子',
  "mary's pencil case": '玛丽的铅笔盒',
  'do you use them': '你会使用它们吗？',
  'the talent show': '才艺表演',
  'what can animals do': '动物会做什么？',
  'in the garden': '在花园里',
  'a big fish': '一条大鱼',
  'in the park': '在公园里',
  'colourful chameleons': '五彩缤纷的变色龙',
  'leon in the garden': '莱昂在花园里',
  'school is over': '放学了',
  'leon in the park': '莱昂在公园里',
  'our weekends': '我们的周末',
  'leon in the game': '游戏中的莱昂',
  'do you like summer': '你喜欢夏天吗？',
  'leon on the farm': '莱昂在农场',
  'strawberries, apples and bananas': '草莓、苹果和香蕉',
  'strawberries,apples and bananas': '草莓、苹果和香蕉',
  'little tadpole': '小蝌蚪',
  'how do i grow': '我是怎样长大的？',
  "daisy's story a magic show": '黛西的故事：魔术表演',
  'the blind men and the elephant': '盲人摸象',
  "dan's story at uncle bob's party": '丹的故事：鲍勃叔叔的聚会',
  "grandma's bag": '奶奶的包',
  "bill's story the lost toy": '比尔的故事：丢失的玩具',
  'different toys': '不同的玩具',
  "nana's story around my new home": '娜娜的故事：我的新家周围',
  'my favourite shopping centre': '我最喜欢的购物中心',
  'the mid-autumn festival': '中秋节',
  "the story of chang'e": '嫦娥的故事',
  "jenny's story (a tasting test)": '珍妮的故事：味觉测试',
  "jenny's story(a tasting test)": '珍妮的故事：味觉测试',
  'a new family member': '一位新的家庭成员',
  'wash your hands': '洗洗手',
  'a secret club': '秘密俱乐部',
  'the lion dance': '舞狮',
  'in the jungle': '在丛林里',
  'hours of sleep': '睡眠时间',
  'the hero': '英雄',
  'heroes around us': '我们身边的英雄',
  'the boy and the wolf': '男孩和狼',
  'a dentist comes to school': '牙医来到学校',
  'at the beach': '在海滩',
  "children's day survey": '儿童节调查',
  "let's make ice cream": '我们来做冰淇淋',
  "let's make music": '我们来创作音乐',
  "li ming's and li liang's day": '李明和李亮的一天',
  "nini's new school": '妮妮的新学校',
  'our homes': '我们的家',
  'poems about being polite': '关于礼貌的诗',
  'shapes in art': '艺术中的形状',
  'we all like our school': '我们都喜欢学校',
  'what are your hobbies?': '你的爱好是什么？',
  'what do students wear': '学生们穿什么？',
  'what time is it': '现在几点？',
  "what's outside": '外面有什么？',
  "who's in the tree": '谁在树上？',
  'jiajia needs a schedule': '佳佳需要一张时间表',
  'ben and bob': '本和鲍勃',
  "elliot's new friend": '埃利奥特的新朋友',
  'come and join us': '来加入我们吧',
  'at the fire station': '在消防站',
  'clothes for a busy day': '忙碌一天的服装',
  'different musical instruments': '不同的乐器',
  'gu dong is coming': '咕咚来了',
  'the world of paper-cuts': '剪纸的世界',
  'keeping up with time': '跟上时间的脚步',
  'special homes around the world': '世界各地的特色住宅',
  'school life around the world': '世界各地的校园生活',
  'what is our world made of': '我们的世界由什么组成？',
  'act like a team': '像团队一样行动',
  "children's day around the world": '世界各地的儿童节'
}

function cleanText(value = '') {
  return value
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.)])/g, '$1')
    .replace(/([,(])\s+/g, '$1')
    .trim()
}

function translationKey(value) {
  return cleanText(value)
    .replace(/[’]/g, "'")
    .replace(/bannanas/gi, 'bananas')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function detectCategory(value) {
  const text = value.toLowerCase()
  if (/listen\s+and\s+say/.test(text)) return 'listenAndSay'
  if (/look\s+and\s+read|read\s+and\s+read/.test(text)) return 'lookAndRead'
  if (/read\s+a\s+story/.test(text)) return 'readAStory'
  if (/learn\s+the\s+sounds?/.test(text)) return 'learnTheSounds'
  if (/listen\s+and\s+enjoy/.test(text)) return 'listenAndEnjoy'
  if (/story/.test(text)) return 'story'
  if (/extend/.test(text)) return 'extend'
  if (/letters?/.test(text)) return 'letters'
  if (/sounds?/.test(text)) return 'sounds'
  if (/explore/.test(text)) return 'explore'
  return 'textbook'
}

function parseKnowledgeBlock(value) {
  const clean = cleanText(value.replace(/^↑/, ''))
  const category = detectCategory(clean)
  const pageMatch = clean.match(/课本第([^页]+)页/)
  const colonIndex = Math.max(clean.indexOf('：'), clean.indexOf(':'))
  let title = colonIndex >= 0 ? cleanText(clean.slice(colonIndex + 1)) : ''
  if (!title && !pageMatch && category === 'textbook') title = clean
  if (/^英语.+视频Unit\s*\d+$/i.test(title)) title = ''
  const chineseTitle = title ? TITLE_TRANSLATIONS[translationKey(title)] || '' : ''
  return {
    category,
    categoryChinese: CATEGORY_NAMES[category],
    page: pageMatch ? `第${pageMatch[1]}页` : '',
    title,
    titleChinese: chineseTitle
  }
}

function durationText(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function isUnitSource(source) {
  return /^\s*unit\s*0*\d+\s*$/i.test(source.label || '')
}

function appendixMeta(value) {
  const sourceTitle = cleanText(value)
  const title = sourceTitle
    .replace(/^project\s*(\d)/i, 'Project $1')
    .replace(/\s*&\s*/g, ' & ')
  const lower = title.toLowerCase()

  if (/^project/.test(lower)) {
    return { title, titleChinese: title.replace(/^Project/i, '项目'), type: 'project', mark: 'P', categoryChinese: '项目实践' }
  }
  if (/word list/.test(lower) || /^单词/.test(title)) {
    const titleChinese = /^单词/.test(title)
      ? '第 1-8 单元词汇'
      : title.replace(/word list/i, '词汇表')
    return { title, titleChinese, type: 'vocabulary', mark: 'Aa', categoryChinese: '词汇复习' }
  }
  if (/letters?/.test(lower)) {
    return { title, titleChinese: '字母表', type: 'alphabet', mark: 'ABC', categoryChinese: '字母认读' }
  }
  if (/daily expressions?.*proper nouns.*irregular verbs/.test(lower)) {
    return { title, titleChinese: '日常用语、专有名词和不规则动词', type: 'reference', mark: '录', categoryChinese: '参考资料' }
  }
  if (/daily expressions?/.test(lower)) {
    return { title, titleChinese: '日常用语', type: 'speaking', mark: '说', categoryChinese: '日常表达' }
  }
  if (/picture dictionary/.test(lower)) {
    return { title, titleChinese: '图解词典', type: 'picture', mark: '图', categoryChinese: '图解词典' }
  }
  if (/grammar/.test(lower)) {
    return { title, titleChinese: '语法复习表', type: 'grammar', mark: '语', categoryChinese: '语法参考' }
  }
  if (/proper nouns.*months.*numbers/.test(lower)) {
    return { title, titleChinese: '专有名词、月份和数词', type: 'reference', mark: '录', categoryChinese: '参考资料' }
  }
  if (/proper nouns/.test(lower)) {
    return { title, titleChinese: '专有名词', type: 'reference', mark: '录', categoryChinese: '参考资料' }
  }
  return { title, titleChinese: '配套资料', type: 'reference', mark: '附', categoryChinese: '配套资料' }
}

const localSubtitleCache = new Map()

function loadLocalSubtitle(unitId) {
  if (localSubtitleCache.has(unitId)) return localSubtitleCache.get(unitId)
  const file = path.join(SOURCE_ROOT, 'subtitles', 'units', `${unitId}.json`)
  let value = { video: {}, audio: {} }
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {}
  localSubtitleCache.set(unitId, value)
  return value
}

function spokenNumber(token) {
  const normalized = String(token || '').toLowerCase()
  return /^\d+$/.test(normalized) ? Number(normalized) : NUMBER_WORDS[normalized] || null
}

function detectTrackInfo(mediaId, subtitleUnitId, type) {
  const lines = loadLocalSubtitle(subtitleUnitId).audio?.[mediaId] || []
  const text = lines.slice(0, 12).map(line => line.english || '').join(' ')
  const specialTracks = [
    [/\bdaily expressions?\b/i, { order: 901, name: 'Daily expressions · 日常用语' }],
    [/\bdays of the week\b/i, { order: 902, name: 'Days of the week · 星期' }],
    [/\bcardinal numbers?\b/i, { order: 903, name: 'Cardinal numbers · 基数词' }],
    [/\bordinal numbers?\b/i, { order: 904, name: 'Ordinal numbers · 序数词' }],
    [/^\s*months?\b/i, { order: 905, name: 'Months · 月份' }],
    [/^\s*proper nouns?\b/i, { order: 906, name: 'Proper nouns · 专有名词' }],
    [/^(?:\s*\d+){8,}/, { order: 907, name: 'Numbers · 数词' }]
  ]
  const special = specialTracks.find(([pattern]) => pattern.test(text))?.[1]
  if (special) return special
  const pattern = type === 'project'
    ? /\bproject\s*(\d{1,2}|one|two)\b/i
    : /\bunit\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i
  const order = spokenNumber(text.match(pattern)?.[1])
  return { order, name: '' }
}

function subtitleUnitIdFor(item) {
  const section = item.unitNumber == null ? 'extras' : `unit-${String(item.unitNumber).padStart(2, '0')}`
  return `grade${item.grade}-${item.semester}-${section}`
}

const verifiedMedia = manifest.media.filter(item => item.upload?.status === 'verified' && item.upload.fileID)
const verifiedMediaById = new Map(verifiedMedia.map(item => [item.mediaId, item]))
const appendixSources = (manifest.audioSources || []).filter(source => !isUnitSource(source))
const appendixMediaIds = new Set(appendixSources.flatMap(source => source.mediaIds || []))
const mediaByKey = new Map()
for (const item of verifiedMedia) {
  const effectiveUnitNumber = item.mediaType === 'audio' && appendixMediaIds.has(item.mediaId) ? 0 : item.unitNumber || 0
  const key = `${item.grade}-${item.semester}-${effectiveUnitNumber}`
  if (!mediaByKey.has(key)) mediaByKey.set(key, { videos: [], audios: [] })
  const compact = {
    id: item.mediaId,
    name: cleanText(item.label),
    sequence: item.sequence || 0,
    durationSeconds: item.durationSeconds || null,
    durationText: durationText(item.durationSeconds),
    fileID: item.upload.fileID
  }
  mediaByKey.get(key)[item.mediaType === 'video' ? 'videos' : 'audios'].push(compact)
}

const grade1Titles = {
  upper: new Map(grade1Upper.units.map((unit, index) => [index + 1, {
    title: unit.title,
    titleChinese: unit.subtitle
  }])),
  lower: new Map(grade1Lower.units.map((unit, index) => [index + 1, {
    title: unit.title,
    titleChinese: unit.subtitle
  }]))
}
const grades = []

for (let grade = 1; grade <= 6; grade += 1) {
  const semesters = {}
  for (const semester of ['upper', 'lower']) {
    const sourceUnits = knowledge.grades?.[String(grade)]?.[semester] || []
    const units = sourceUnits.map(source => {
      const number = source.unitNumber
      const unitId = `grade${grade}-${semester}-unit-${String(number).padStart(2, '0')}`
      const media = mediaByKey.get(`${grade}-${semester}-${number}`) || { videos: [], audios: [] }
      const titleOverride = grade === 1 ? grade1Titles[semester].get(number) : null
      const knowledgeItems = (source.knowledgeBlocks || []).map(parseKnowledgeBlock)
      const subtitleEntry = subtitleManifest.units?.[unitId]
      return {
        id: unitId,
        unitNumber: number,
        title: titleOverride?.title || `Unit ${number}`,
        titleChinese: titleOverride?.titleChinese || `第${number}单元`,
        sourceTitle: source.pageTitle,
        knowledge: knowledgeItems,
        videos: media.videos.sort((a, b) => a.sequence - b.sequence),
        audios: media.audios.sort((a, b) => a.sequence - b.sequence),
        subtitleFileID: subtitleEntry?.status === 'verified' ? subtitleEntry.fileID : '',
        counts: { videos: media.videos.length, audios: media.audios.length }
      }
    })
    const semesterAppendixSources = appendixSources.filter(source => source.grade === grade && source.semester === semester)
    const appendices = semesterAppendixSources.map(source => {
      const meta = appendixMeta(source.label)
      const sourceMedia = (source.mediaIds || [])
        .map(mediaId => verifiedMediaById.get(mediaId))
        .filter(item => item?.mediaType === 'audio')
      const subtitleUnitIds = [...new Set(sourceMedia.map(subtitleUnitIdFor))]
      const subtitleUnitId = subtitleUnitIds[0] || `grade${grade}-${semester}-extras`
      const subtitleEntry = subtitleUnitIds.length === 1 ? subtitleManifest.units?.[subtitleUnitId] : null
      const tracks = sourceMedia.map((item, sourceIndex) => {
        const trackInfo = detectTrackInfo(item.mediaId, subtitleUnitIdFor(item), meta.type)
        let name = trackInfo.name || meta.title
        if (!trackInfo.name) {
          if (meta.type === 'vocabulary' && trackInfo.order) name = `Unit ${trackInfo.order} · 单词`
          else if (meta.type === 'project' && trackInfo.order) name = `Project ${trackInfo.order}`
          else if (sourceMedia.length > 1) name = `${meta.title} · ${sourceIndex + 1}`
        }
        return {
          id: item.mediaId,
          name,
          sequence: trackInfo.order || sourceIndex + 1,
          durationSeconds: item.durationSeconds || null,
          durationText: durationText(item.durationSeconds),
          fileID: item.upload.fileID,
          detectedOrder: trackInfo.order || 1000 + sourceIndex
        }
      }).sort((a, b) => a.detectedOrder - b.detectedOrder)
      const trackNameCounts = tracks.reduce((counts, item) => {
        counts[item.name] = (counts[item.name] || 0) + 1
        return counts
      }, {})
      const seenTrackNames = {}
      const displayTracks = tracks.map(({ detectedOrder, ...item }) => {
        if (trackNameCounts[item.name] <= 1) return item
        seenTrackNames[item.name] = (seenTrackNames[item.name] || 0) + 1
        return { ...item, name: `${item.name}（${seenTrackNames[item.name]}）` }
      })
      const durationSeconds = displayTracks.reduce((sum, item) => sum + (item.durationSeconds || 0), 0)
      const availability = displayTracks.length ? 'ready' : source.status === 'empty' ? 'missing' : 'processing'
      return {
        id: source.id,
        mediaId: subtitleUnitId,
        ...meta,
        availability,
        statusText: availability === 'ready' ? '可播放' : availability === 'missing' ? '原资源页暂无音频' : '资源整理中',
        audios: displayTracks,
        videos: [],
        knowledge: [],
        subtitleFileID: subtitleEntry?.status === 'verified' ? subtitleEntry.fileID : '',
        counts: { videos: 0, audios: displayTracks.length },
        durationSeconds,
        durationText: durationText(durationSeconds)
      }
    })
    semesters[semester] = {
      name: `${GRADE_NAMES[grade - 1]}${SEMESTER_NAMES[semester]}`,
      sourceStatus: '公众号资源归档',
      units,
      appendices
    }
  }
  grades.push({ grade, name: GRADE_NAMES[grade - 1], semesters })
}

const catalog = {
  generatedAt: new Date().toISOString(),
  mediaSource: '微信云存储归档',
  grades
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, `// Generated by scripts/build-miniprogram-catalog.mjs.\nmodule.exports = ${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT).replaceAll('\\', '/'),
  bytes: fs.statSync(OUTPUT).size,
  grades: grades.length,
  units: grades.reduce((sum, item) => sum + item.semesters.upper.units.length + item.semesters.lower.units.length, 0),
  videos: verifiedMedia.filter(item => item.mediaType === 'video').length,
  audios: verifiedMedia.filter(item => item.mediaType === 'audio').length,
  appendices: grades.reduce((sum, item) => sum + item.semesters.upper.appendices.length + item.semesters.lower.appendices.length, 0),
  appendixAudios: appendixMediaIds.size
}, null, 2))
