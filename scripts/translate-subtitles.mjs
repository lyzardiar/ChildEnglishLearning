import { createRequire } from 'node:module'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const subtitleRoot = path.join(repoRoot, 'docs', 'wechat-course-sources', 'subtitles')
const unitIndexRoot = path.join(subtitleRoot, 'raw', 'unit-indexes')
const unitOutputRoot = path.join(subtitleRoot, 'units')
const cachePath = path.join(subtitleRoot, 'translation-cache.json')
const issuePath = path.join(subtitleRoot, 'translation-issues.json')
const modelName = 'qwen2.5:1.5b'
const ollamaUrl = 'http://127.0.0.1:11434/api/chat'

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function cleanChinese(value, source) {
  let result = cleanText(value)
    .replace(/\s*[-–—](?:\s*[-–—!?！。]*)*$/u, '')
    .replace(/\s+([，。！？；：])/g, '$1')
    .replace(/,/g, '，')
    .replace(/!/g, '！')
    .replace(/\?/g, '？')
    .replace(/\.(?=$)/, '。')
    .trim()

  const names = [
    [/Laura/i, /Laura|拉拉|劳拉/gi, '劳拉'],
    [/Leon/i, /Leon|里昂|莱昂/gi, '莱昂'],
    [/Alice/i, /Alice|艾丽斯|阿丽斯|爱丽丝/gi, '爱丽丝'],
    [/Peter/i, /Peter|彼得|皮特/gi, '彼得'],
    [/Kitty/i, /Kitty|基蒂|凯蒂/gi, '凯蒂'],
    [/Danny/i, /Danny|丹尼/gi, '丹尼'],
    [/Eddie/i, /Eddie|埃迪/gi, '埃迪'],
    [/Joe/i, /Joe|乔/gi, '乔'],
    [/Jill/i, /Jill|吉尔/gi, '吉尔'],
    [/Tom/i, /Tom|汤姆/gi, '汤姆']
  ]
  for (const [sourcePattern, targetPattern, replacement] of names) {
    if (sourcePattern.test(source)) result = result.replace(targetPattern, replacement)
  }
  return result
}

function unwrapTranslation(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return value.translation || value.chinese || value.text || ''
  }
  return ''
}

async function requestPlainTranslation(text) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          model: modelName,
          stream: false,
          messages: [
            {
              role: 'system',
              content: 'Translate the English primary-school textbook text into concise Simplified Chinese. Return only the Chinese translation without quotes, labels, or explanation.'
            },
            { role: 'user', content: text }
          ],
          options: { temperature: 0, num_ctx: 2048, num_predict: 128 }
        })
      })
      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`)
      const payload = await response.json()
      const value = cleanChinese(
        cleanText(payload.message?.content)
          .replace(/^翻译(?:为|成)?\s*[：:]\s*/, '')
          .replace(/^[“"]|[”"]$/g, ''),
        text
      )
      if (value) return value
      throw new Error(`Ollama 单句翻译为空: ${JSON.stringify(text)}`)
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
  throw lastError
}

function needsQualityRepair(text, chinese) {
  const tokens = cleanText(text).replace(/[，,.!?！？]+$/u, '').split(/\s+/).filter(Boolean)
  if (tokens.length >= 4 && tokens.every(token => /^[a-z]$/i.test(token)) && /^字母序列：/.test(chinese)) return false
  const hanCount = (String(chinese || '').match(/[\p{Script=Han}]/gu) || []).length
  const wordCount = (String(text || '').match(/[A-Za-z]+/g) || []).length
  return hanCount === 0 || (wordCount >= 20 && hanCount < Math.max(6, wordCount * 0.45))
}

async function requestQualityRepair(text) {
  const nameKey = cleanText(text).replace(/[，,.!?！？]+$/u, '').toLowerCase()
  const letterTokens = nameKey.split(/\s+/).filter(Boolean)
  if (letterTokens.length >= 4 && letterTokens.every(token => /^[a-z]$/i.test(token))) {
    return `字母序列：${letterTokens.map(token => token.toUpperCase()).join('、')}。`
  }
  const knownNames = {
    charlie: '查理',
    coco: '可可',
    ed: '埃德',
    gary: '加里',
    gwenda: '格温达',
    jane: '简',
    john: '约翰',
    'jun jun': '俊俊',
    leo: '利奥',
    lottie: '洛蒂',
    ping: '平',
    rudolph: '鲁道夫',
    sally: '莎莉',
    sam: '山姆',
    sana: '萨娜',
    tim: '蒂姆',
    yoshi: '耀西',
    yuki: '优希',
    zed: '泽德'
  }
  if (knownNames[nameKey]) return knownNames[nameKey]
  if (nameKey === 'little justin') return '小贾斯汀'
  if (nameKey === 'by tamsin thompson') return '作者：塔姆辛·汤普森'

  const knownPhrases = {
    'and one for me': '也给我一个',
    blow: '吹',
    by: '作者',
    cheer: '加油',
    'come and play': '来一起玩吧',
    'do you': '你呢',
    do: '助动词 do',
    does: '助动词 does',
    dr: '字母组合 dr',
    dress: '连衣裙',
    drink: '喝',
    drive: '驾驶',
    er: '呃',
    everyone: '每个人',
    fit: '合适',
    how: '怎么样',
    january: '一月',
    job: '工作',
    'job people': 'job（工作），people（人们）',
    listen: '请听',
    log: '原木',
    ma: '妈妈',
    mug: '马克杯',
    nice: '真棒',
    'o for ox': 'O 代表 ox（公牛）',
    'or sweet sweet': 'sore（疼痛的），sick（生病的）',
    ping: '乒',
    put: '放',
    queen: '女王',
    'queen bee': '蜂王',
    right: '对吗',
    tape: '胶带',
    the: '这个',
    toast: '吐司',
    ur: '字母组合 ur',
    'what is': '是什么',
    which: '哪一个',
    yen: '日元',
    'yo yo': '悠悠球',
    zero: '零',
    zoo: '动物园'
  }
  if (knownPhrases[nameKey]) return knownPhrases[nameKey]

  const isolatedLetter = cleanText(text).match(/^([A-Za-z])[,，.!！?？]?$/)
  if (isolatedLetter) return `字母 ${isolatedLetter[1].toUpperCase()}。`
  const repeatedLetter = cleanText(text).match(/^([A-Za-z])\1[,，.!！?？]?$/i)
  if (repeatedLetter) return `字母 ${repeatedLetter[1].toUpperCase()}，${repeatedLetter[1].toLowerCase()}。`

  const words = cleanText(text).split(' ')
  if (words.length > 32) {
    const chunks = []
    for (let index = 0; index < words.length; index += 24) {
      chunks.push(words.slice(index, index + 24).join(' '))
    }
    const translated = []
    for (const chunk of chunks) translated.push(await requestQualityRepair(chunk))
    return translated.join(' ')
  }

  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          model: modelName,
          stream: false,
          messages: [
            {
              role: 'system',
              content: '你是小学英语字幕翻译。必须把输入完整翻译成自然的简体中文，只输出译文。即使输入只有一个英文单词或残句，也必须给出中文释义，不能照抄英文。例如 And? 译为“然后呢？”，Nice. 译为“真棒。”。自然拼读内容保留字母和目标英文单词，并在括号中补充中文含义。不得概括或遗漏任何分句。'
            },
            { role: 'user', content: `请翻译：\n英文：${text}\n中文：` }
          ],
          options: {
            temperature: attempt === 1 ? 0 : 0.2,
            num_ctx: 4096,
            num_predict: Math.min(1024, Math.max(192, Math.ceil(text.length * 1.5)))
          }
        })
      })
      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`)
      const payload = await response.json()
      const value = cleanChinese(
        cleanText(payload.message?.content)
          .replace(/^翻译(?:为|成)?\s*[：:]\s*/, '')
          .replace(/^[“"]|[”"]$/g, ''),
        text
      )
      if (!needsQualityRepair(text, value)) return value
      throw new Error(`修复翻译仍不完整: ${JSON.stringify(text)}`)
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
  throw lastError
}

function addSeed(translations, english, chinese, source) {
  const key = cleanText(english)
  const value = cleanText(chinese)
  if (key && value) translations[key] = { chinese: value, source }
}

function seedManualTranslations(translations) {
  const manualSample = require(path.join(repoRoot, 'miniprogram', 'data', 'subtitles', 'grade1-lower-unit-01.js'))
  for (const tracks of [manualSample.video, manualSample.audio]) {
    for (const lines of Object.values(tracks)) {
      for (const line of lines) addSeed(translations, line.english, line.chinese, 'manual-unit1-lower')
    }
  }

  const grade1Upper = require(path.join(repoRoot, 'miniprogram', 'data', 'grade1-upper.js'))
  for (const unit of grade1Upper.units) {
    addSeed(translations, unit.title, unit.subtitle, 'manual-grade1-upper')
    for (const word of unit.words || []) addSeed(translations, word.english, word.chinese, 'manual-grade1-upper')
    for (const sentence of unit.sentences || []) addSeed(translations, sentence.english, sentence.chinese, 'manual-grade1-upper')
    for (const letter of unit.letters || []) addSeed(translations, letter.word, letter.chinese, 'manual-grade1-upper')
    if (unit.story) {
      addSeed(translations, unit.story.title, unit.story.titleChinese, 'manual-grade1-upper')
      for (const line of unit.story.lines || []) addSeed(translations, line.english, line.chinese, 'manual-grade1-upper')
    }
    for (const line of unit.extend || []) addSeed(translations, line.english, line.chinese, 'manual-grade1-upper')
  }
}

function automaticTranslation(text) {
  const singleLetter = text.match(/^([A-Z])\.$/)
  if (singleLetter) return `字母 ${singleLetter[1]}。`
  const letter = text.match(/^([A-Z])(?:\s*[,，]\s*|\s+)([a-z])\.?$/)
  if (letter) return `字母 ${letter[1]}，${letter[2]}。`
  return ''
}

const indexFiles = (await readdir(unitIndexRoot))
  .filter(name => name.endsWith('.json'))
  .sort()
const indexes = await Promise.all(indexFiles.map(async name =>
  JSON.parse(await readFile(path.join(unitIndexRoot, name), 'utf8'))
))

let cache = { schemaVersion: 1, model: modelName, updatedAt: '', translations: {} }
try {
  cache = JSON.parse(await readFile(cachePath, 'utf8'))
} catch {}
cache.model = modelName
for (const [text, entry] of Object.entries(cache.translations)) {
  if (entry.source === 'nllb-local' || entry.source === 'rule') delete cache.translations[text]
}
seedManualTranslations(cache.translations)

const uniqueTexts = [...new Set(indexes.flatMap(unit =>
  unit.items.flatMap(item => item.segments.map(line => cleanText(line.english)))
).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en'))

for (const text of uniqueTexts) {
  const automatic = automaticTranslation(text)
  if (automatic && !cache.translations[text]) {
    cache.translations[text] = { chinese: automatic, source: 'rule' }
  }
}

const pending = uniqueTexts.filter(text => !cache.translations[text]?.chinese)
console.log(JSON.stringify({ units: indexes.length, uniqueTexts: uniqueTexts.length, cached: uniqueTexts.length - pending.length, pending: pending.length }, null, 2))

async function requestTranslation(batch, attempt = 1) {
  const input = Object.fromEntries(batch.map((text, index) => [String(index + 1), text]))
  try {
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({
        model: modelName,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content: 'Translate English primary-school textbook lines into concise, natural, child-friendly Simplified Chinese. Use common Chinese transliterations for character names. Return only one JSON object whose keys exactly match the input keys. Do not add explanations.'
          },
          { role: 'user', content: JSON.stringify(input) }
        ],
        options: {
          temperature: 0,
          num_ctx: 4096,
          num_predict: Math.max(256, batch.length * 48)
        }
      })
    })
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`)
    const payload = await response.json()
    const result = JSON.parse(payload.message?.content || '{}')
    const translations = batch.map((text, index) => {
      const value = Array.isArray(result) ? result[index] : result[String(index + 1)]
      return cleanChinese(unwrapTranslation(value), text)
    })
    if (batch.length === 1 && !translations[0] && result && typeof result === 'object') {
      const fallback = Object.values(result).map(unwrapTranslation).find(Boolean)
      translations[0] = cleanChinese(fallback, batch[0])
    }
    if (translations.some(value => !value)) {
      throw new Error(`Ollama 返回的翻译数量不完整: ${JSON.stringify(batch)}`)
    }
    return translations
  } catch (error) {
    if (attempt >= 2 && batch.length > 1) {
      const middle = Math.ceil(batch.length / 2)
      const first = await requestTranslation(batch.slice(0, middle))
      const second = await requestTranslation(batch.slice(middle))
      return [...first, ...second]
    }
    if (attempt >= 4) {
      if (batch.length === 1) return [await requestPlainTranslation(batch[0])]
      throw error
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    return requestTranslation(batch, attempt + 1)
  }
}

if (pending.length) {
  const batchSize = 32
  const workerCount = 4
  let nextOffset = 0
  let completed = 0
  let writeQueue = Promise.resolve()
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const offset = nextOffset
      nextOffset += batchSize
      if (offset >= pending.length) return
      const batch = pending.slice(offset, offset + batchSize)
      const output = await requestTranslation(batch)
      batch.forEach((text, index) => {
        cache.translations[text] = {
          chinese: output[index],
          source: `ollama-${modelName}`
        }
      })
      completed += batch.length
      cache.updatedAt = new Date().toISOString()
      writeQueue = writeQueue.then(() => writeJson(cachePath, cache))
      await writeQueue
      console.log(`翻译 ${completed}/${pending.length}`)
    }
  })
  await Promise.all(workers)
  await writeQueue
}

const repairTexts = uniqueTexts.filter(text =>
  needsQualityRepair(text, cache.translations[text]?.chinese)
)
const repairFailures = []
if (repairTexts.length) {
  console.log(`质量修复 0/${repairTexts.length}`)
  for (let index = 0; index < repairTexts.length; index += 1) {
    const text = repairTexts[index]
    try {
      cache.translations[text] = {
        chinese: await requestQualityRepair(text),
        source: `repair-ollama-${modelName}`
      }
    } catch (error) {
      repairFailures.push({
        text,
        message: error instanceof Error ? error.message : String(error)
      })
    }
    if ((index + 1) % 8 === 0 || index === repairTexts.length - 1) {
      cache.updatedAt = new Date().toISOString()
      await writeJson(cachePath, cache)
      console.log(`质量修复 ${index + 1}/${repairTexts.length}`)
    }
  }
}

const issues = []
issues.push(...repairFailures.map(item => ({ type: 'translation-repair-failed', ...item })))
const outputSummary = []
const manualSample = require(path.join(repoRoot, 'miniprogram', 'data', 'subtitles', 'grade1-lower-unit-01.js'))
const lineCorrections = {
  'Q quack quack quack quack please be quiet little little duck,': {
    english: 'Q, q. Quack, quack, quack, quack. Please be quiet, little duck.',
    chinese: '字母 Q，q。嘎嘎嘎嘎，请安静一点，小鸭子。'
  },
  'Smoke smoke smoke smoke.': {
    english: 'Sm, sm. Smoke, smoke.',
    chinese: '字母组合 sm，smoke（烟）。'
  },
  'SP spider spider St star star spider spider what can you see?': {
    english: 'Sp, sp. Spider, spider. St, st. Star, star. Spider, spider, what can you see?',
    chinese: '字母组合 sp，spider（蜘蛛）；字母组合 st，star（星星）。蜘蛛，蜘蛛，你能看见什么？'
  }
}

for (const unit of indexes) {
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    unitId: unit.unitId,
    video: {},
    audio: {}
  }
  for (const item of unit.items) {
    const lines = item.segments.map((line, index) => {
      const correction = lineCorrections[cleanText(line.english)]
      const english = correction?.english || line.english
      const translation = correction?.chinese || cache.translations[cleanText(line.english)]?.chinese || ''
      if (!translation) issues.push({ unitId: unit.unitId, mediaId: item.id, line: index + 1, type: 'missing-translation', english: line.english })
      if (translation && needsQualityRepair(english, translation)) issues.push({ unitId: unit.unitId, mediaId: item.id, line: index + 1, type: 'low-quality-translation', english, chinese: translation })
      if (/[А-Яа-яЁё]/u.test(translation)) issues.push({ unitId: unit.unitId, mediaId: item.id, line: index + 1, type: 'unexpected-script', english: line.english, chinese: translation })
      if (/\b(\w+)(?:\s+\1){3,}\b/i.test(english)) issues.push({ unitId: unit.unitId, mediaId: item.id, line: index + 1, type: 'repeated-asr-text', english, chinese: translation })
      return { ...line, english, chinese: translation }
    })
    result[item.mediaType === 'video' ? 'video' : 'audio'][item.id] = lines
    if (!lines.length) issues.push({ unitId: unit.unitId, mediaId: item.id, type: 'empty-track' })
  }

  if (unit.unitId === manualSample.unitId) {
    result.video = { ...result.video, ...manualSample.video }
    result.audio = { ...result.audio, ...manualSample.audio }
  }

  const videoLines = Object.values(result.video).reduce((sum, lines) => sum + lines.length, 0)
  const audioLines = Object.values(result.audio).reduce((sum, lines) => sum + lines.length, 0)
  outputSummary.push({ unitId: unit.unitId, videoTracks: Object.keys(result.video).length, audioTracks: Object.keys(result.audio).length, videoLines, audioLines })
  await writeJson(path.join(unitOutputRoot, `${unit.unitId}.json`), result)
}

cache.updatedAt = new Date().toISOString()
await writeJson(cachePath, cache)
await writeJson(issuePath, {
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  total: issues.length,
  items: issues
})
await writeJson(path.join(subtitleRoot, 'summary.json'), {
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  model: modelName,
  units: outputSummary,
  totals: {
    units: outputSummary.length,
    videoTracks: outputSummary.reduce((sum, item) => sum + item.videoTracks, 0),
    audioTracks: outputSummary.reduce((sum, item) => sum + item.audioTracks, 0),
    videoLines: outputSummary.reduce((sum, item) => sum + item.videoLines, 0),
    audioLines: outputSummary.reduce((sum, item) => sum + item.audioLines, 0),
    issues: issues.length
  }
})

console.log(JSON.stringify({ units: outputSummary.length, issues: issues.length }, null, 2))
if (issues.some(item => ['missing-translation', 'empty-track', 'low-quality-translation', 'translation-repair-failed'].includes(item.type))) process.exitCode = 1
