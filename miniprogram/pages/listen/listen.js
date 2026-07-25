const speech = require('../../utils/speech')

Page({
  data: {
    semester: 'upper',
    unitIndex: 0,
    unitTitle: '',
    activeTab: 'sentences',
    // 句子
    sentences: [],
    currentSentenceIndex: 0,
    // 故事
    story: {},
    currentStoryIndex: 0,
    // 扩展
    extendLines: [],
    currentExtendIndex: 0,
    // 通用
    isPlaying: false,
    playMode: 'single',
    showChinese: false
  },

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
        sentences: unit.sentences || [],
        story: unit.story || {},
        extendLines: unit.extend || []
      })
      wx.setNavigationBarTitle({ title: `${unit.title} - 听课文` })
    }
  },

  // 切换 tab
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.onStop()
    this.setData({ activeTab: tab })
  },

  // === 句子 ===

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
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (err) {
        break
      }
    }

    this.setData({ isPlaying: false, playMode: 'single' })
  },

  // === 故事 ===

  async onPlayStoryLine(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentStoryIndex: index })

    const line = this.data.story.lines[index]
    if (!line) return

    this.setData({ isPlaying: true })
    try {
      await speech.speak(line.english)
    } catch (err) {
      console.error('播放失败:', err)
    }
    this.setData({ isPlaying: false })
  },

  async onPlayStoryAll() {
    if (this.data.isPlaying) {
      this.onStop()
      return
    }

    const lines = this.data.story.lines || []
    this._stopFlag = false
    this.setData({ playMode: 'all', isPlaying: true })

    for (let i = 0; i < lines.length; i++) {
      if (this._stopFlag) break
      this.setData({ currentStoryIndex: i })
      try {
        await speech.speak(lines[i].english)
        if (this._stopFlag) break
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (err) {
        break
      }
    }

    this.setData({ isPlaying: false, playMode: 'single' })
  },

  onSelectStoryLine(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentStoryIndex: index })
  },

  // === 扩展 ===

  async onPlayExtendLine(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentExtendIndex: index })

    const line = this.data.extendLines[index]
    if (!line) return

    this.setData({ isPlaying: true })
    try {
      await speech.speak(line.english)
    } catch (err) {
      console.error('播放失败:', err)
    }
    this.setData({ isPlaying: false })
  },

  async onPlayExtendAll() {
    if (this.data.isPlaying) {
      this.onStop()
      return
    }

    const lines = this.data.extendLines
    this._stopFlag = false
    this.setData({ playMode: 'all', isPlaying: true })

    for (let i = 0; i < lines.length; i++) {
      if (this._stopFlag) break
      this.setData({ currentExtendIndex: i })
      try {
        await speech.speak(lines[i].english)
        if (this._stopFlag) break
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (err) {
        break
      }
    }

    this.setData({ isPlaying: false, playMode: 'single' })
  },

  onSelectExtendLine(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentExtendIndex: index })
  },

  // === 通用 ===

  onStop() {
    this._stopFlag = true
    speech.stop()
    this.setData({ isPlaying: false, playMode: 'single' })
  },

  onSelectSentence(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentSentenceIndex: index })
  },

  onPrev() {
    const { currentSentenceIndex } = this.data
    if (currentSentenceIndex > 0) {
      this.setData({ currentSentenceIndex: currentSentenceIndex - 1 })
    }
  },

  onNext() {
    const { currentSentenceIndex, sentences } = this.data
    if (currentSentenceIndex < sentences.length - 1) {
      this.setData({ currentSentenceIndex: currentSentenceIndex + 1 })
    }
  },

  onToggleChinese() {
    this.setData({ showChinese: !this.data.showChinese })
  }
})
