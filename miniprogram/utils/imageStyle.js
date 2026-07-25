/**
 * 图片路径工具
 * 优先使用云存储 fileID，回退到本地路径
 * 云存储路径约定: images/words/{style}/{unitId}/{word}.png
 */

// 可用风格列表
const STYLES = [
  { key: 'flat', name: '扁平卡通', desc: '色彩明快、线条简洁' },
  { key: 'watercolor', name: '手绘水彩', desc: '柔和温暖、艺术感' },
  { key: 'pixel', name: '像素风', desc: '游戏感强、复古可爱' }
]

const DEFAULT_STYLE = 'flat'
const CACHE_KEY = 'imageFileIDs'

// 内存缓存，避免每次读 storage
let _fileIDCache = null

function getCurrentStyle() {
  try {
    return wx.getStorageSync('imageStyle') || DEFAULT_STYLE
  } catch (e) {
    return DEFAULT_STYLE
  }
}

function setStyle(styleKey) {
  try {
    wx.setStorageSync('imageStyle', styleKey)
  } catch (e) {
    // ignore
  }
}

/**
 * 加载 fileID 缓存到内存
 */
function _loadCache() {
  if (_fileIDCache) return _fileIDCache
  try {
    _fileIDCache = wx.getStorageSync(CACHE_KEY) || {}
  } catch (e) {
    _fileIDCache = {}
  }
  return _fileIDCache
}

/**
 * 保存 fileID 缓存
 */
function saveFileIDCache(map) {
  _fileIDCache = map
  try {
    wx.setStorageSync(CACHE_KEY, map)
  } catch (e) {
    // ignore
  }
}

/**
 * 获取单词配图路径
 * 优先返回云存储 fileID，没有则回退本地路径
 * @param {string} unitId - 单元ID，如 'unit-01'
 * @param {string} word - 英文单词，如 'hello'
 * @param {string} style - 可选，指定风格
 * @returns {string} 图片路径或 fileID
 */
function getWordImage(unitId, word, style) {
  const s = style || getCurrentStyle()
  const cacheKey = `${s}/${unitId}/${word}`
  const cache = _loadCache()

  if (cache[cacheKey]) {
    return cache[cacheKey]
  }

  // 回退到本地路径
  return `/images/words/${s}/${unitId}/${word}.png`
}

/**
 * 获取欢迎图路径
 */
function getWelcomeImage(style) {
  const s = style || getCurrentStyle()
  const cache = _loadCache()
  const cacheKey = `welcome-${s}`

  if (cache[cacheKey]) {
    return cache[cacheKey]
  }
  return `/images/welcome-${s}.png`
}

module.exports = {
  STYLES,
  DEFAULT_STYLE,
  getCurrentStyle,
  setStyle,
  getWordImage,
  getWelcomeImage,
  saveFileIDCache,
  _loadCache
}
