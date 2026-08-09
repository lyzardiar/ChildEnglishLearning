const app = getApp()
const speech = require('../../utils/speech')
const bookData = require('../../data/index.js')

Page({
  data: {
    games: [
      {
        id: 'listen-match',
        name: '听音选词',
        icon: '♪',
        desc: '听单词，选出正确的选项',
        color: '#1677C8'
      },
      {
        id: 'meaning-match',
        name: '中英配对',
        icon: '中',
        desc: '看中文，选出对应英文',
        color: '#E85D4A'
      }
    ],
    grades: bookData.getGrades(),
    grade: 1,
    semester: 'upper',
    unitIndex: 0,
    units: [],
    // 当前游戏状态
    currentGame: null,
    gameScore: 0,
    gameRound: 0,
    totalRounds: 5,
    // 听音选词
    listenMatchCorrect: '',
    listenMatchOptions: [],
    promptChinese: '',
    lastAnswerCorrect: null
  },

  onLoad() {
    const child = app.globalData.currentChild
    const grade = Number(child && child.grade) || Number(wx.getStorageSync('currentGrade')) || 1
    const semester = (child && child.semester) || wx.getStorageSync('currentSemester') || 'upper'
    this.setData({ grade, semester })
    this.loadUnits()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'game' })
    }
  },

  loadUnits() {
    const book = bookData.getBook(this.data.semester, this.data.grade)
    this.setData({ units: book.units || [] })
  },

  onSwitchGrade(e) {
    this.setData({ grade: Number(e.currentTarget.dataset.grade), unitIndex: 0 })
    this.loadUnits()
  },

  // 切换学期
  onSwitchSemester(e) {
    const semester = e.currentTarget.dataset.semester
    this.setData({ semester, unitIndex: 0 })
    this.loadUnits()
  },

  // 选择单元
  onSelectUnit(e) {
    const unitIndex = e.currentTarget.dataset.index
    this.setData({ unitIndex })
  },

  // 选择游戏
  onSelectGame(e) {
    const gameId = e.currentTarget.dataset.id
    this.setData({ currentGame: gameId, gameScore: 0, gameRound: 0, lastAnswerCorrect: null })
    this.startGame(gameId)
  },

  startGame(gameId) {
    const { semester, unitIndex } = this.data
    const data = bookData.getBook(semester, this.data.grade)
    const unit = data.units[unitIndex]
    const words = unit ? unit.words || [] : []

    if (words.length < 3) {
      wx.showToast({ title: '单词太少，换个单元试试', icon: 'none' })
      this.setData({ currentGame: null })
      return
    }

    this.gameWords = words
    this.setData({ totalRounds: Math.min(5, words.length) })

    switch (gameId) {
      case 'listen-match':
        this.startListenMatch()
        break
      case 'meaning-match':
        this.nextMeaningMatchRound()
        break
    }
  },

  // === 听音选词 ===
  startListenMatch() {
    this.nextListenMatchRound()
  },

  nextListenMatchRound() {
    const { gameRound, totalRounds } = this.data
    if (gameRound >= totalRounds) {
      this.onGameComplete()
      return
    }

    const words = this.gameWords
    const correctIndex = Math.floor(Math.random() * words.length)
    const correct = words[correctIndex]

    let options = [correct]
    while (options.length < Math.min(4, words.length)) {
      const rand = words[Math.floor(Math.random() * words.length)]
      if (!options.find(o => o.english === rand.english)) {
        options.push(rand)
      }
    }
    options = options.sort(() => Math.random() - 0.5)

    this.setData({
      gameRound: gameRound + 1,
      listenMatchCorrect: correct.english,
      listenMatchOptions: options,
      lastAnswerCorrect: null
    })

    // 自动播放正确单词的发音
    speech.speak(correct.english)
  },

  // 重播发音
  onReplayWord() {
    const { listenMatchCorrect } = this.data
    if (listenMatchCorrect) {
      speech.speak(listenMatchCorrect)
    }
  },

  onListenMatchAnswer(e) {
    const answer = e.currentTarget.dataset.english
    const { listenMatchCorrect, gameScore } = this.data

    if (answer === listenMatchCorrect) {
      this.setData({ gameScore: gameScore + 1, lastAnswerCorrect: true })
      wx.vibrateShort({ type: 'medium' })
    } else {
      this.setData({ lastAnswerCorrect: false })
      wx.vibrateShort({ type: 'heavy' })
    }

    setTimeout(() => this.nextListenMatchRound(), 1000)
  },

  nextMeaningMatchRound() {
    const { gameRound, totalRounds } = this.data
    if (gameRound >= totalRounds) {
      this.onGameComplete()
      return
    }

    const words = this.gameWords
    const correct = words[Math.floor(Math.random() * words.length)]
    const options = [correct]
    while (options.length < Math.min(4, words.length)) {
      const candidate = words[Math.floor(Math.random() * words.length)]
      if (!options.some(item => item.english === candidate.english)) options.push(candidate)
    }
    options.sort(() => Math.random() - 0.5)
    this.setData({
      gameRound: gameRound + 1,
      promptChinese: correct.chinese,
      listenMatchCorrect: correct.english,
      listenMatchOptions: options,
      lastAnswerCorrect: null
    })
  },

  onMeaningMatchAnswer(e) {
    const answer = e.currentTarget.dataset.english
    const correct = answer === this.data.listenMatchCorrect
    this.setData({ gameScore: this.data.gameScore + (correct ? 1 : 0), lastAnswerCorrect: correct })
    wx.vibrateShort({ type: correct ? 'medium' : 'heavy' })
    setTimeout(() => this.nextMeaningMatchRound(), 900)
  },

  // 游戏完成
  async onGameComplete() {
    const { gameScore, totalRounds, grade, semester, unitIndex } = this.data
    const currentChild = app.globalData.currentChild

    // 保存游戏分数到云数据库
    if (currentChild) {
      try {
        await wx.cloud.callFunction({
          name: 'saveProgress',
          data: {
            action: 'save',
            childId: currentChild._id,
            grade,
            semester,
            unitIndex,
            type: 'game',
            score: gameScore
          }
        })
      } catch (err) {
        console.error('保存游戏分数失败:', err)
      }
    }

    wx.showModal({
      title: '游戏结束！',
      content: `你答对了 ${gameScore}/${totalRounds} 题`,
      showCancel: false,
      success: () => {
        this.setData({ currentGame: null })
      }
    })
  },

  // 退出游戏
  onExitGame() {
    speech.stop()
    this.setData({ currentGame: null })
  }
})
