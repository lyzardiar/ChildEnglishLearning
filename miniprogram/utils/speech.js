/**
 * 语音工具模块（无插件版本）
 * TTS: 调用 tts 云函数（腾讯云 TTS），带云存储缓存
 * ASR: 录音后上传云函数进行语音识别
 */

// 全局音频实例
let audioContext = null

/**
 * 播放单词/句子发音
 * 优先播放云存储音频，如果没有则调用 tts 云函数
 * @param {string} text - 英文文本
 * @param {string} audioUrl - 可选，云存储音频地址
 * @returns {Promise}
 */
function speak(text, audioUrl) {
  return new Promise((resolve, reject) => {
    // 销毁上一个音频实例
    if (audioContext) {
      audioContext.destroy()
      audioContext = null
    }

    if (audioUrl) {
      // 有预录音频，直接播放
      audioContext = wx.createInnerAudioContext()
      audioContext.src = audioUrl
      audioContext.onEnded(() => resolve())
      audioContext.onError((err) => {
        console.error('音频播放失败，回退到 TTS:', err)
        // 预录音频失败，回退到云函数 TTS
        playViaTTS(text).then(resolve).catch(() => resolve())
      })
      audioContext.play()
    } else {
      // 没有预录音频，调用 tts 云函数
      playViaTTS(text).then(resolve).catch(() => resolve())
    }
  })
}

/**
 * 调用 tts 云函数获取语音 URL 并播放
 * 云函数内部有缓存机制，相同文本不会重复调用 API
 */
function playViaTTS(text) {
  return new Promise((resolve) => {
    wx.cloud.callFunction({
      name: 'tts',
      data: { text }
    }).then(res => {
      const result = res.result
      if (result && result.code === 0 && result.url) {
        if (audioContext) {
          audioContext.destroy()
          audioContext = null
        }
        audioContext = wx.createInnerAudioContext()
        audioContext.src = result.url
        audioContext.onEnded(() => resolve())
        audioContext.onError((err) => {
          console.error('TTS 音频播放失败:', err)
          resolve()
        })
        audioContext.play()
      } else {
        console.warn('TTS 返回异常:', result)
        resolve()
      }
    }).catch(err => {
      console.warn('TTS 云函数调用失败:', err)
      resolve()
    })
  })
}

/**
 * 语音识别 - 录音并上传云函数识别
 * @param {object} options - { duration: 5000 }
 * @returns {Promise<string>} 识别出的文字
 */
function recognize(options = {}) {
  return new Promise((resolve, reject) => {
    const recorderManager = wx.getRecorderManager()
    const duration = options.duration || 5000

    let finished = false

    recorderManager.onStop(async (res) => {
      if (finished) return
      finished = true

      const { tempFilePath } = res
      if (!tempFilePath) {
        reject(new Error('录音文件为空'))
        return
      }

      try {
        // 先上传录音到云存储
        const uploadRes = await wx.cloud.uploadFile({
          filePath: tempFilePath,
          cloudPath: `recordings/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`
        })

        // 再调用云函数识别
        const result = await wx.cloud.callFunction({
          name: 'speechRecognize',
          data: {
            fileID: uploadRes.fileID
          }
        })

        if (result.result && result.result.code === 0) {
          resolve(result.result.text || '')
        } else {
          reject(new Error(result.result?.message || '识别失败'))
        }
      } catch (err) {
        reject(err)
      }
    })

    recorderManager.onError((err) => {
      if (!finished) {
        finished = true
        // 区分权限拒绝和其他错误
        if (err && err.errMsg && err.errMsg.includes('auth')) {
          reject(new Error('请允许使用麦克风权限'))
        } else {
          reject(err)
        }
      }
    })

    // 开始录音
    recorderManager.start({
      duration: duration,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
      frameSize: 50
    })

    // 超时自动停止（比 duration 多留 500ms 余量，避免和自动停止竞争）
    setTimeout(() => {
      if (!finished) {
        recorderManager.stop()
      }
    }, duration + 500)
  })
}

/**
 * 停止播放
 */
function stop() {
  if (audioContext) {
    audioContext.stop()
    audioContext.destroy()
    audioContext = null
  }
}

/**
 * 单词匹配判断（宽松模式，适合儿童）
 * @param {string} recognized - 识别出的文字
 * @param {string} target - 目标单词/短语
 * @returns {boolean}
 */
function matchWord(recognized, target) {
  if (!recognized || !target) return false

  const normalize = (str) => str.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const rec = normalize(recognized)
  const tar = normalize(target)

  if (rec === tar) return true
  if (rec.includes(tar) || tar.includes(rec)) return true

  // 编辑距离容错
  if (tar.length <= 5) {
    return levenshtein(rec, tar) <= 1
  }
  return levenshtein(rec, tar) <= 2
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }

  return dp[m][n]
}

module.exports = {
  speak,
  recognize,
  stop,
  matchWord
}
