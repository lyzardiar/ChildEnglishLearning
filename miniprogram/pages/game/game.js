const app = getApp()
const speech = require('../../utils/speech')

Page({
  data: {
    games: [
      {
        id: 'listen-match',
        name: '听音选词',
        icon: '👂',
        desc: '听单词，选出正确的选项',
        color: '#4A90D9'
      },
      {
        id: 'pair-match',
        name: '图片配对',
        icon: '🃏',
        desc: '把单词和图片配成对',
        color: '#52C41A'
      },
      {
        id: 'whack-mole',
        name: '打地鼠',
        icon: '🔨',
        desc: '听到单词，快速点击对应地鼠',
        color: '#FAAD14'
      }
    ],
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
    lastAnswerCorrect: null
  },

  onLoad() {
    this.loadUnits()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'game' })
    }
  },

  loadUnits() {
    const bookData = require('../../data/index.js')
    const book = bookData.getBook(this.data.semester)
    this.setData({ units: book.units || [] })
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
    const bookData = require('../../data/index.js')
    const data = bookData.getBook(semester)
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
      case 'pair-match':
        this.startPairMatch()
        break
      case 'whack-mole':
        this.startWhackMole()
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

  // === 图片配对 ===
  startPairMatch() {
    wx.showToast({ title: '开发中，敬请期待', icon: 'none' })
    this.setData({ currentGame: null })
  },

  // === 打地鼠 ===
  startWhackMole() {
    wx.showToast({ title: '开发中，敬请期待', icon: 'none' })
    this.setData({ currentGame: null })
  },

  // 游戏完成
  async onGameComplete() {
    const { gameScore, totalRounds, semester, unitIndex } = this.data
    const currentChild = app.globalData.currentChild

    // 保存游戏分数到云数据库
    if (currentChild) {
      try {
        await wx.cloud.callFunction({
          name: 'saveProgress',
          data: {
            action: 'save',
            childId: currentChild._id,
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
