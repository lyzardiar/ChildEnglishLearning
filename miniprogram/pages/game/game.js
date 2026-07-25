Page({
  data: {
    games: [
      {
        id: 'listen-match',
        name: '听音选图',
        icon: '/images/game-listen-match.png',
        desc: '听单词，选出正确的图片',
        color: '#4A90D9'
      },
      {
        id: 'pair-match',
        name: '图片配对',
        icon: '/images/game-pair-match.png',
        desc: '把单词和图片配成对',
        color: '#52C41A'
      },
      {
        id: 'whack-mole',
        name: '打地鼠',
        icon: '/images/game-whack-mole.png',
        desc: '听到单词，快速点击对应地鼠',
        color: '#FAAD14'
      }
    ],
    semester: 'upper',
    unitIndex: 0,
    // 当前游戏状态
    currentGame: null,
    gameScore: 0,
    gameRound: 0,
    totalRounds: 5
  },

  onLoad(options) {
    this.setData({
      semester: options.semester || 'upper',
      unitIndex: parseInt(options.unit) || 0
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'game' })
    }
  },

  // 选择游戏
  onSelectGame(e) {
    const gameId = e.currentTarget.dataset.id
    this.setData({ currentGame: gameId, gameScore: 0, gameRound: 0 })
    this.startGame(gameId)
  },

  startGame(gameId) {
    // 加载当前单元的单词作为游戏素材
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

  // === 听音选图 ===
  startListenMatch() {
    this.nextListenMatchRound()
  },

  nextListenMatchRound() {
    const { gameRound, totalRounds } = this.data
    if (gameRound >= totalRounds) {
      this.onGameComplete()
      return
    }

    // 随机选一个正确答案和3个干扰项
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
    // 打乱顺序
    options = options.sort(() => Math.random() - 0.5)

    this.setData({
      gameRound: gameRound + 1,
      listenMatchCorrect: correct.english,
      listenMatchOptions: options
    })

    // 自动播放正确单词的发音
    const speech = require('../../utils/speech')
    speech.speak(correct.english)
  },

  onListenMatchAnswer(e) {
    const answer = e.currentTarget.dataset.english
    const { listenMatchCorrect, gameScore } = this.data

    if (answer === listenMatchCorrect) {
      this.setData({ gameScore: gameScore + 1 })
      wx.vibrateShort({ type: 'medium' })
    }

    setTimeout(() => this.nextListenMatchRound(), 800)
  },

  // === 图片配对 ===
  startPairMatch() {
    // TODO: 实现配对游戏逻辑
    wx.showToast({ title: '开发中，敬请期待', icon: 'none' })
    this.setData({ currentGame: null })
  },

  // === 打地鼠 ===
  startWhackMole() {
    // TODO: 实现打地鼠游戏逻辑
    wx.showToast({ title: '开发中，敬请期待', icon: 'none' })
    this.setData({ currentGame: null })
  },

  // 游戏完成
  onGameComplete() {
    const { gameScore, totalRounds } = this.data
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
    this.setData({ currentGame: null })
  }
})
