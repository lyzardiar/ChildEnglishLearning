const app = getApp()
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
    imageLoadError: false,
    isPlaying: false,
    isRecording: false,
    readResult: null,
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
      // 最后一个单词也学会了，计数+1后完成
      this.setData({ learnedCount: learnedCount + 1 })
      this.onUnitComplete()
      return
    }

    this.setData({
      currentWordIndex: nextIndex,
      currentWord: words[nextIndex],
      currentWordImage: imageStyle.getWordImage(unitId, words[nextIndex].english),
      imageLoadError: false,
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
      imageLoadError: false,
      readResult: null
    })
  },

  // 图片加载失败，显示占位符
  onImageError() {
    this.setData({ imageLoadError: true })
  },

  // 单元完成
  async onUnitComplete() {
    const { semester, unitIndex, totalCount } = this.data
    const currentChild = app.globalData.currentChild

    // 保存学习进度到云数据库
    if (currentChild) {
      try {
        await wx.cloud.callFunction({
          name: 'saveProgress',
          data: {
            action: 'save',
            childId: currentChild._id,
            semester,
            unitIndex,
            type: 'learn',
            score: totalCount
          }
        })
      } catch (err) {
        console.error('保存进度失败:', err)
      }
    }

    wx.showModal({
      title: '太棒了！',
      content: '本单元单词全部学完啦！',
      showCancel: false,
      success: () => {
        wx.navigateBack()
      }
    })
  }
})
