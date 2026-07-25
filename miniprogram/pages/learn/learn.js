const app = getApp()
const speech = require('../../utils/speech')
const imageStyle = require('../../utils/imageStyle')

Page({
  data: {
    semester: 'upper',
    unitIndex: 0,
    unitId: '',
    unitTitle: '',
    activeTab: 'words',
    // 单词
    words: [],
    currentWordIndex: 0,
    currentWord: null,
    currentWordImage: '',
    imageLoadError: false,
    isPlaying: false,
    learnedCount: 0,
    totalCount: 0,
    // 字母
    letters: []
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
        currentWordImage: firstWord ? imageStyle.getWordImage(unit.id, firstWord.english) : '',
        letters: unit.letters || []
      })
      wx.setNavigationBarTitle({ title: unit.title })
    }
  },

  // 切换 tab
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // === 单词相关 ===

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

  onNextWord() {
    const { currentWordIndex, words, learnedCount, unitId } = this.data
    const nextIndex = currentWordIndex + 1

    if (nextIndex >= words.length) {
      this.setData({ learnedCount: learnedCount + 1 })
      this.onUnitComplete()
      return
    }

    this.setData({
      currentWordIndex: nextIndex,
      currentWord: words[nextIndex],
      currentWordImage: imageStyle.getWordImage(unitId, words[nextIndex].english),
      imageLoadError: false,
      learnedCount: learnedCount + 1
    })
  },

  onPrevWord() {
    const { currentWordIndex, words, unitId } = this.data
    if (currentWordIndex <= 0) return

    const prevIndex = currentWordIndex - 1
    this.setData({
      currentWordIndex: prevIndex,
      currentWord: words[prevIndex],
      currentWordImage: imageStyle.getWordImage(unitId, words[prevIndex].english),
      imageLoadError: false
    })
  },

  onImageError() {
    this.setData({ imageLoadError: true })
  },

  // === 字母相关 ===

  async onPlayLetter(e) {
    const index = e.currentTarget.dataset.index
    const letter = this.data.letters[index]
    if (!letter) return

    // 播放 "A, a for ant" 格式
    const text = `${letter.letter[0]}. ${letter.letter[0]} for ${letter.word}`
    this.setData({ isPlaying: true })
    try {
      await speech.speak(text)
    } catch (err) {
      console.error('播放失败:', err)
    }
    this.setData({ isPlaying: false })
  },

  // === 单元完成 ===

  async onUnitComplete() {
    const { semester, unitIndex, totalCount } = this.data
    const currentChild = app.globalData.currentChild

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
