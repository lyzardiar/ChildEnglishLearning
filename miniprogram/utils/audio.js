const INNER_AUDIO_OPTIONS = {
  mixWithOther: false,
  obeyMuteSwitch: false,
  speakerOn: true
}

let configured = false
let configurePromise = null

function configure(force = false) {
  if (configurePromise) return configurePromise
  if (!force && configured) return Promise.resolve(true)
  if (typeof wx === 'undefined' || typeof wx.setInnerAudioOption !== 'function') {
    return Promise.resolve(false)
  }

  const request = new Promise(resolve => {
    try {
      wx.setInnerAudioOption({
        ...INNER_AUDIO_OPTIONS,
        success() {
          configured = true
          resolve(true)
        },
        fail(error) {
          console.warn('设置音频播放模式失败:', error)
          resolve(false)
        }
      })
    } catch (error) {
      console.warn('设置音频播放模式异常:', error)
      resolve(false)
    }
  })

  configurePromise = request.then(result => {
    configurePromise = null
    return result
  })
  return configurePromise
}

function createContext() {
  const context = wx.createInnerAudioContext()
  context.obeyMuteSwitch = false
  context.volume = 1
  return context
}

module.exports = {
  INNER_AUDIO_OPTIONS,
  configure,
  createContext
}
