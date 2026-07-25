const speech = require('../../utils/speech')
const imageStyle = require('../../utils/imageStyle')

Page({
  data: {
    semester: 'upper',
    unitIndex: 0,
    unitId: '',
    unitTitle: '',
    words: [],
    currentWordIndex: 0,
    currentWord: null,
    currentWordImage: '',
    isPlaying: false,    // 是否正在播放示范发音
    isRecording: false,  // 是否正在录音
    readResult: null,    // 跟读结果: 'correct' | 'retry' | null
    learnedCount: 0,
    totalCount: 0
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
      const words = unit.words || []
      const firstWord = words[0] || null
      this.setData({
        unitId: unit.id,
        unitTitle: unit.title,
        words: words,
        totalCount: words.length,
        currentWordIndex: 0,
        currentWord: firstWord,
        currentWordImage: firstWord ? imageStyle.getWordImage(unit.id, firstWord.english) : ''
      })
      wx.setNavigationBarTitle({ title: unit.title })
    }
  },

  // 播放单词示范发音
  async onPlayWord() {
    const { currentWord } = this.data
    if (!currentWord) return

    this.setData({ isPlaying: true })
    try {
      await speech.speak(currentWord.english)
    } catch (err) {
      console.error('播放失败:', err)
    }
    this.setData({ isPlaying: false })
  },

  // 开始跟读
  async onStartRead() {
    const { currentWord } = this.data
    if (!currentWord) return

    this.setData({ isRecording: true, readResult: null })

    try {
      const result = await speech.recognize()
      const isCorrect = speech.matchWord(result, currentWord.english)
      this.setData({
        isRecording: false,
        readResult: isCorrect ? 'correct' : 'retry'
      })

      if (isCorrect) {
        wx.vibrateShort({ type: 'medium' })
        // 延迟后自动进入下一个单词
        setTimeout(() => this.onNextWord(), 1200)
      }
    } catch (err) {
      console.error('识别失败:', err)
      this.setData({ isRecording: false, readResult: 'retry' })
    }
  },

  // 下一个单词
  onNextWord() {
    const { currentWordIndex, words, learnedCount, unitId } = this.data
    const nextIndex = currentWordIndex + 1

    if (nextIndex >= words.length) {
      // 本单元学完
      this.onUnitComplete()
      return
    }

    this.setData({
      currentWordIndex: nextIndex,
      currentWord: words[nextIndex],
      currentWordImage: imageStyle.getWordImage(unitId, words[nextIndex].english),
      readResult: null,
      learnedCount: learnedCount + 1
    })
  },

  // 上一个单词
  onPrevWord() {
    const { currentWordIndex, words, unitId } = this.data
    if (currentWordIndex <= 0) return

    const prevIndex = currentWordIndex - 1
    this.setData({
      currentWordIndex: prevIndex,
      currentWord: words[prevIndex],
      currentWordImage: imageStyle.getWordImage(unitId, words[prevIndex].english),
      readResult: null
    })
  },

  // 单元完成
  onUnitComplete() {
    wx.showModal({
      title: '太棒了！',
      content: '本单元单词全部学完啦！',
      showCancel: false,
      success: () => {
        // TODO: 保存学习进度到云数据库
        wx.navigateBack()
      }
    })
  }
})
