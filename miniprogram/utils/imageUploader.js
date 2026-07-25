/**
 * 图片上传工具 - 将本地单词配图批量上传到云存储
 * 上传后缓存 fileID，后续直接从云端加载
 * 用法：在 profile 页连续点击"图片风格"标题 5 次触发
 */
const imageStyle = require('./imageStyle')

// 上册所有单词（与 data/grade1-upper.js 保持一致）
const WORDS = {
  'unit-01': ['hello', 'hi', 'goodbye', 'bye', 'morning', 'afternoon'],
  'unit-02': ['name', 'boy', 'girl', 'teacher', 'friend', 'nice'],
  'unit-03': ['father', 'mother', 'brother', 'sister', 'grandpa', 'grandma'],
  'unit-04': ['eye', 'ear', 'nose', 'mouth', 'hand', 'foot'],
  'unit-05': ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  'unit-06': ['red', 'blue', 'yellow', 'green', 'orange', 'purple'],
  'unit-07': ['cat', 'dog', 'bird', 'fish', 'rabbit', 'monkey'],
  'unit-08': ['apple', 'banana', 'orange', 'pear', 'peach', 'grape'],
  'unit-09': ['rice', 'egg', 'milk', 'bread', 'cake', 'water'],
  'unit-10': ['ball', 'doll', 'car', 'kite', 'robot', 'bear'],
  'unit-11': ['sun', 'rain', 'wind', 'cloud', 'hot', 'cold'],
  'unit-12': ['new', 'year', 'happy', 'party', 'sing', 'dance'],
}

/**
 * 批量上传所有本地图片到云存储
 * @param {function} onProgress - 进度回调 (current, total, word)
 * @returns {Promise<{success: number, failed: number}>}
 */
async function uploadAllImages(onProgress) {
  const styles = imageStyle.STYLES.map(s => s.key)
  const cache = imageStyle._loadCache()
  let success = 0
  let failed = 0
  let current = 0

  // 计算总数
  const allTasks = []
  for (const style of styles) {
    for (const [unitId, words] of Object.entries(WORDS)) {
      for (const word of words) {
        const cacheKey = `${style}/${unitId}/${word}`
        if (!cache[cacheKey]) {
          allTasks.push({ style, unitId, word, cacheKey })
        }
      }
    }
  }

  const total = allTasks.length
  if (total === 0) {
    return { success: 0, failed: 0, skipped: 'all' }
  }

  for (const task of allTasks) {
    current++
    const { style, unitId, word, cacheKey } = task
    const localPath = `/images/words/${style}/${unitId}/${word}.png`
    const cloudPath = `images/words/${style}/${unitId}/${word}.png`

    if (onProgress) onProgress(current, total, word)

    try {
      const res = await wx.cloud.uploadFile({
        filePath: localPath,
        cloudPath: cloudPath
      })
      cache[cacheKey] = res.fileID
      success++
    } catch (err) {
      console.warn(`上传失败 ${cacheKey}:`, err)
      failed++
    }
  }

  // 保存缓存
  imageStyle.saveFileIDCache(cache)

  return { success, failed }
}

module.exports = { uploadAllImages }
