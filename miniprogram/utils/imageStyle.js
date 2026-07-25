/**
 * 图片路径工具
 * 根据当前选择的风格自动计算单词配图路径
 * 路径约定: /images/words/{style}/{unitId}/{word}.png
 */

// 可用风格列表
const STYLES = [
  { key: 'flat', name: '扁平卡通', desc: '色彩明快、线条简洁' },
  { key: 'watercolor', name: '手绘水彩', desc: '柔和温暖、艺术感' },
  { key: 'pixel', name: '像素风', desc: '游戏感强、复古可爱' }
]

// 默认风格
const DEFAULT_STYLE = 'flat'

/**
 * 获取当前风格
 */
function getCurrentStyle() {
  try {
    return wx.getStorageSync('imageStyle') || DEFAULT_STYLE
  } catch (e) {
    return DEFAULT_STYLE
  }
}

/**
 * 设置当前风格
 */
function setStyle(styleKey) {
  try {
    wx.setStorageSync('imageStyle', styleKey)
  } catch (e) {
    // ignore
  }
}

/**
 * 获取单词配图路径
 * @param {string} unitId - 单元ID，如 'unit-01'
 * @param {string} word - 英文单词，如 'hello'
 * @param {string} style - 可选，指定风格；不传则用当前风格
 * @returns {string} 图片路径
 */
function getWordImage(unitId, word, style) {
  const s = style || getCurrentStyle()
  return `/images/words/${s}/${unitId}/${word}.png`
}

/**
 * 获取欢迎图路径
 */
function getWelcomeImage(style) {
  const s = style || getCurrentStyle()
  return `/images/welcome-${s}.png`
}

module.exports = {
  STYLES,
  DEFAULT_STYLE,
  getCurrentStyle,
  setStyle,
  getWordImage,
  getWelcomeImage
}
