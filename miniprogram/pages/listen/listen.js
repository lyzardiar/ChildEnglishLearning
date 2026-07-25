const speech = require('../../utils/speech')

Page({
  data: {
    semester: 'upper',
    unitIndex: 0,
    unitTitle: '',
    sentences: [],       // 课文句子列表
    currentSentenceIndex: 0,
    isPlaying: false,
    playMode: 'single',  // single=逐句, all=连续播放
    showChinese: false   // 是否显示中文翻译
  },

  onLoad(options) {
    const semester = options.semester || 'upper'
    const unitIndex = parseInt(options.unit) || 0
    this.setData({ semester, unitIndex })
    this.loadUnitData()
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

  // 连续播放全部
  async onPlayAll() {
    const { sentences } = this.data
    this.setData({ playMode: 'all', isPlaying: true })

    for (let i = 0; i < sentences.length; i++) {
      this.setData({ currentSentenceIndex: i })
      try {
        await speech.speak(sentences[i].english)
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
    speech.stop()
    this.setData({ isPlaying: false, playMode: 'single' })
  },

  // 切换句子
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
