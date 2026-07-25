const speech = require('../../utils/speech')

Page({
  data: {
    semester: 'upper',
    unitIndex: 0,
    unitTitle: '',
    sentences: [],
    currentSentenceIndex: 0,
    isPlaying: false,
    playMode: 'single',
    showChinese: false
  },

  // 内部停止标志，用于中断连续播放循环
  _stopFlag: false,

  onLoad(options) {
    const semester = options.semester || 'upper'
    const unitIndex = parseInt(options.unit) || 0
    this.setData({ semester, unitIndex })
    this.loadUnitData()
  },

  onUnload() {
    this._stopFlag = true
    speech.stop()
  },

  loadUnitData() {
    const { semester, unitIndex } = this.data
    const bookData = require('../../data/index.js')
    const data = bookData.getBook(semester)
    const unit = data.units[unitIndex]

    if (unit) {
      this.setData({
        unitTitle: unit.title,
        sentences: unit.sentences || []
      })
      wx.setNavigationBarTitle({ title: `${unit.title} - 听课文` })
    }
  },

  // 播放当前句
  async onPlayCurrent() {
    const { sentences, currentSentenceIndex } = this.data
    const sentence = sentences[currentSentenceIndex]
    if (!sentence) return

    this.setData({ isPlaying: true })
    try {
      await speech.speak(sentence.english)
    } catch (err) {
      console.error('播放失败:', err)
    }
    this.setData({ isPlaying: false })
  },

  // 点击某句的喇叭图标，播放该句
  async onPlaySentence(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentSentenceIndex: index })

    const sentence = this.data.sentences[index]
    if (!sentence) return

    this.setData({ isPlaying: true })
    try {
      await speech.speak(sentence.english)
    } catch (err) {
      console.error('播放失败:', err)
    }
    this.setData({ isPlaying: false })
  },

  // 连续播放全部
  async onPlayAll() {
    const { sentences } = this.data
    this._stopFlag = false
    this.setData({ playMode: 'all', isPlaying: true })

    for (let i = 0; i < sentences.length; i++) {
      if (this._stopFlag) break

      this.setData({ currentSentenceIndex: i })
      try {
        await speech.speak(sentences[i].english)
        if (this._stopFlag) break
        // 句间停顿
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (err) {
        break
      }
    }

    this.setData({ isPlaying: false, playMode: 'single' })
  },

  // 停止播放
  onStop() {
    this._stopFlag = true
    speech.stop()
    this.setData({ isPlaying: false, playMode: 'single' })
  },

  // 切换句子（仅选中，不播放）
  onSelectSentence(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentSentenceIndex: index })
  },

  // 上一句
  onPrev() {
    const { currentSentenceIndex } = this.data
    if (currentSentenceIndex > 0) {
      this.setData({ currentSentenceIndex: currentSentenceIndex - 1 })
    }
  },

  // 下一句
  onNext() {
    const { currentSentenceIndex, sentences } = this.data
    if (currentSentenceIndex < sentences.length - 1) {
      this.setData({ currentSentenceIndex: currentSentenceIndex + 1 })
    }
  },

  // 切换中文显示
  onToggleChinese() {
    this.setData({ showChinese: !this.data.showChinese })
  }
})
