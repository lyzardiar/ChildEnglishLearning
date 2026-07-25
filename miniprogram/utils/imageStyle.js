/**
 * 图片路径工具
 * 图片存储在微信云存储中，通过 fileID 直接访问
 * fileID 格式: cloud://{env}.images/words/{style}/{unitId}/{word}.png
 */

const ENV_ID = 'cloud1-d8g5ssn6n94472f8a'
const FILE_PREFIX = `cloud://${ENV_ID}.`

// 可用风格列表
const STYLES = [
  { key: 'flat', name: '扁平卡通', desc: '色彩明快、线条简洁' },
  { key: 'watercolor', name: '手绘水彩', desc: '柔和温暖、艺术感' },
  { key: 'pixel', name: '像素风', desc: '游戏感强、复古可爱' }
]

const DEFAULT_STYLE = 'flat'

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
 * 获取单词配图的云存储 fileID
 * @param {string} unitId - 单元ID，如 'unit-01'
 * @param {string} word - 英文单词，如 'hello'
 * @param {string} style - 可选，指定风格
 * @returns {string} 云存储 fileID
 */
function getWordImage(unitId, word, style) {
  // TODO: watercolor/pixel 风格图片上传云存储后去掉此回退
  const s = 'flat'
  return `${FILE_PREFIX}images/words/${s}/${unitId}/${word}.png`
}

/**
 * 获取欢迎图路径
 */
function getWelcomeImage(style) {
  const s = style || getCurrentStyle()
  return `${FILE_PREFIX}images/welcome-${s}.png`
}

module.exports = {
  STYLES,
  DEFAULT_STYLE,
  getCurrentStyle,
  setStyle,
  getWordImage,
  getWelcomeImage
}
