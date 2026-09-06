const app = getApp()
const chessRules = require('../../data/chess-rules.js')
const { PIECE_IMAGES } = require('../../data/chess-assets.js')
const chessAi = require('../../utils/chess-ai.js')
const {
  Chess,
  DIFFICULTIES,
  PROMOTION_PIECES,
  getDifficulty,
  oppositeColor,
  getDrawState,
  getTerminalState,
  legalMovesFrom,
  capturedSquare,
  createBoardSquares,
  isPromotionMove,
  moveLabel,
  shouldRobotAcceptDraw
} = require('../../utils/chess-game.js')

const STORAGE_KEY = 'chessGameV1'
const STATS_KEY = 'chessStatsV1'
const ROBOT_MOVE_MIN_DELAY_MS = 1200
const CAPTURE_EFFECT_MS = 1000
let cachedPieceImages = null

function safeVibrate(type = 'light') {
  if (typeof wx.vibrateShort === 'function') wx.vibrateShort({ type })
}

function capturedGlyphs(game) {
  const expected = { p: 8, n: 2, b: 2, r: 2, q: 1 }
  const glyphs = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' }
  }
  const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } }
  game.board().flat().filter(Boolean).forEach(piece => {
    if (counts[piece.color][piece.type] !== undefined) counts[piece.color][piece.type] += 1
  })
  const result = { w: [], b: [] }
  ;['w', 'b'].forEach(color => {
    ;['q', 'r', 'b', 'n', 'p'].forEach(type => {
      for (let i = counts[color][type]; i < expected[type]; i += 1) result[color].push(glyphs[color][type])
    })
  })
  return result
}

Page({
  data: {
    difficulties: DIFFICULTIES.map(item => ({ level: item.level, name: item.name, detail: item.detail })),
    assetsLoading: true,
    loadingProgress: 0,
    loadingDetail: '正在准备棋子',
    difficultyLevel: 3,
    difficultyName: '学徒',
    playerColor: 'w',
    playerColorName: '白方',
    robotColorName: '黑方',
    playerKingImage: PIECE_IMAGES.wk,
    robotKingImage: PIECE_IMAGES.bk,
    squares: [],
    selectedSquare: '',
    legalTargets: [],
    lastMove: null,
    lastMoveText: '新棋局',
    recentMoves: [],
    playerCaptures: '',
    robotCaptures: '',
    statusText: '轮到你走',
    statusKind: 'turn',
    playerTurn: true,
    robotTurn: false,
    boardTurnClass: 'player-turn',
    robotThinking: false,
    canUndo: false,
    hasMoves: false,
    canClaimDraw: false,
    claimReason: '',
    showDifficulty: false,
    showRules: false,
    rules: chessRules,
    showPromotion: false,
    promotionOptions: [],
    showGameOver: false,
    resultTitle: '',
    resultDetail: ''
  },

  async onLoad() {
    this.createAiWorker()
    await this.preloadPieceAssets()
    if (this._pageUnloaded) return
    this.setData({ assetsLoading: false, loadingProgress: 100, loadingDetail: '棋盘准备完成' })
    if (!this.restoreGame()) {
      const savedLevel = Number(wx.getStorageSync('chessDifficulty')) || 3
      this.startNewGame('w', savedLevel)
    }
  },

  onHide() {
    this.saveGame()
  },

  onUnload() {
    this._pageUnloaded = true
    this.cancelRobotMove()
    this.clearCaptureEffect()
    this.saveGame()
    if (this._worker) this._worker.terminate()
    this._worker = null
  },

  async preloadPieceAssets() {
    if (cachedPieceImages) {
      this.pieceImages = cachedPieceImages
      this.setData({ loadingProgress: 100, loadingDetail: '棋盘准备完成' })
      return
    }
    const entries = Object.entries(PIECE_IMAGES)
    let sources = PIECE_IMAGES
    try {
      if (wx.cloud?.getTempFileURL) {
        const result = await wx.cloud.getTempFileURL({ fileList: entries.map(([, fileID]) => fileID) })
        const resolved = { ...PIECE_IMAGES }
        ;(result.fileList || []).forEach(item => {
          const key = entries.find(([, fileID]) => fileID === item.fileID)?.[0]
          if (key && item.tempFileURL) resolved[key] = item.tempFileURL
        })
        sources = resolved
      }
    } catch (error) {
      console.warn('获取国际象棋资源地址失败，将直接读取云文件:', error)
    }

    const loaded = {}
    let completed = 0
    await Promise.all(entries.map(async ([key]) => {
      const source = sources[key]
      loaded[key] = await this.preloadPieceImage(source)
      completed += 1
      if (!this._pageUnloaded) {
        this.setData({
          loadingProgress: Math.round(completed / entries.length * 100),
          loadingDetail: `正在准备棋子 ${completed}/${entries.length}`
        })
      }
    }))
    cachedPieceImages = loaded
    this.pieceImages = loaded
  },

  preloadPieceImage(source, attempt = 1) {
    if (typeof wx.getImageInfo !== 'function') return Promise.resolve(source)
    return new Promise(resolve => {
      wx.getImageInfo({
        src: source,
        success: result => resolve(result.path || source),
        fail: error => {
          if (attempt < 2) {
            setTimeout(() => resolve(this.preloadPieceImage(source, attempt + 1)), 120)
            return
          }
          console.warn('预加载国际象棋棋子失败:', source, error)
          resolve(source)
        }
      })
    })
  },

  createAiWorker() {
    if (typeof wx.createWorker !== 'function') return
    try {
      this._worker = wx.createWorker('workers/chess-ai.js', { useExperimentalWorker: true })
      this._worker.onMessage(message => this.onRobotMessage(message))
      if (typeof this._worker.onError === 'function') {
        this._worker.onError(error => {
          console.warn('国际象棋 Worker 运行失败，将使用主线程:', error)
          this._worker = null
          if (this.data.robotThinking) setTimeout(() => this.runRobotFallback(), 0)
        })
      }
      if (typeof this._worker.onProcessKilled === 'function') {
        this._worker.onProcessKilled(() => {
          this._worker = null
          if (this.data.robotThinking) setTimeout(() => this.runRobotFallback(), 0)
        })
      }
    } catch (error) {
      console.warn('国际象棋 Worker 不可用，将使用主线程:', error)
      this._worker = null
    }
  },

  restoreGame() {
    try {
      const saved = wx.getStorageSync(STORAGE_KEY)
      if (!saved || saved.version !== 1 || !saved.fen || saved.gameOver) return false
      this.game = new Chess(saved.fen)
      this.playerColor = saved.playerColor === 'b' ? 'b' : 'w'
      this.snapshots = Array.isArray(saved.snapshots) ? saved.snapshots : []
      this.positionHistory = Array.isArray(saved.positionHistory) && saved.positionHistory.length
        ? saved.positionHistory
        : [saved.fen]
      this.moveLog = Array.isArray(saved.moveLog) ? saved.moveLog : []
      this.lastMove = saved.lastMove || null
      const difficulty = getDifficulty(saved.difficultyLevel || 3)
      this.setData({
        difficultyLevel: difficulty.level,
        difficultyName: difficulty.name,
        playerColor: this.playerColor,
        playerColorName: this.playerColor === 'w' ? '白方 · 银色' : '黑方 · 金色',
        robotColorName: this.playerColor === 'w' ? '黑方 · 金色' : '白方 · 银色',
        playerKingImage: (this.pieceImages || PIECE_IMAGES)[`${this.playerColor}k`],
        robotKingImage: (this.pieceImages || PIECE_IMAGES)[`${oppositeColor(this.playerColor)}k`]
      })
      this.renderGame()
      if (this.finishIfNeeded()) return true
      if (this.game.turn() !== this.playerColor) this.requestRobotMove()
      return true
    } catch (error) {
      console.warn('恢复国际象棋对局失败:', error)
      wx.removeStorageSync(STORAGE_KEY)
      return false
    }
  },

  startNewGame(playerColor = this.playerColor || 'w', difficultyLevel = this.data.difficultyLevel || 3) {
    this.cancelRobotMove()
    this.game = new Chess()
    this.playerColor = playerColor === 'b' ? 'b' : 'w'
    this.snapshots = []
    this.positionHistory = [this.game.fen()]
    this.moveLog = []
    this.lastMove = null
    this._resultCommitted = false
    this._lastDrawOfferPly = -10
    const difficulty = getDifficulty(difficultyLevel)
    this.setData({
      difficultyLevel: difficulty.level,
      difficultyName: difficulty.name,
      playerColor: this.playerColor,
      playerColorName: this.playerColor === 'w' ? '白方 · 银色' : '黑方 · 金色',
      robotColorName: this.playerColor === 'w' ? '黑方 · 金色' : '白方 · 银色',
      playerKingImage: (this.pieceImages || PIECE_IMAGES)[`${this.playerColor}k`],
      robotKingImage: (this.pieceImages || PIECE_IMAGES)[`${oppositeColor(this.playerColor)}k`],
      selectedSquare: '',
      legalTargets: [],
      lastMove: null,
      lastMoveText: '新棋局',
      showDifficulty: false,
      showPromotion: false,
      showGameOver: false,
      resultTitle: '',
      resultDetail: '',
      robotThinking: false
    })
    this.clearCaptureEffect()
    wx.setStorageSync('chessDifficulty', difficulty.level)
    this.renderGame()
    this.saveGame()
    if (this.playerColor === 'b') this.requestRobotMove()
  },

  renderGame() {
    if (!this.game) return
    const draw = getDrawState(this.game, this.positionHistory)
    const captures = capturedGlyphs(this.game)
    const playerCaptureCount = (this.playerColor === 'w' ? captures.b : captures.w).length
    const robotCaptureCount = (this.playerColor === 'w' ? captures.w : captures.b).length
    const playerTurn = this.game.turn() === this.playerColor
    let statusText = playerTurn
      ? `轮到你走 · ${this.playerColor === 'w' ? '银方' : '金方'}`
      : `机器人回合 · ${this.playerColor === 'w' ? '金方' : '银方'}`
    let statusKind = playerTurn ? 'turn' : 'wait'
    if (this.data.robotThinking) {
      statusText = `机器人思考中 · ${this.playerColor === 'w' ? '金方' : '银方'}`
      statusKind = 'thinking'
    } else if (this.game.inCheck()) {
      statusText = this.game.turn() === this.playerColor ? '将军！保护国王' : '你将军了！'
      statusKind = 'check'
    }
    const recentMoves = this.moveLog.slice(-4).reverse()
    this.setData({
      squares: createBoardSquares(
        this.game,
        this.playerColor,
        this.data.selectedSquare,
        this.data.legalTargets,
        this.lastMove,
        this.pieceImages,
        this.captureEffect
      ),
      lastMove: this.lastMove,
      lastMoveText: this.moveLog.length ? this.moveLog[this.moveLog.length - 1].label : '新棋局',
      recentMoves,
      playerCaptures: playerCaptureCount ? `已吃 ${playerCaptureCount} 枚` : '',
      robotCaptures: robotCaptureCount ? `已吃 ${robotCaptureCount} 枚` : '',
      statusText,
      statusKind,
      playerTurn,
      robotTurn: !playerTurn,
      boardTurnClass: playerTurn ? 'player-turn' : 'robot-turn',
      canUndo: this.snapshots.length > 0 && !this.data.robotThinking,
      hasMoves: this.moveLog.length > 0,
      canClaimDraw: draw.claimable && this.game.turn() === this.playerColor && !this.data.robotThinking,
      claimReason: draw.claimable ? draw.reason : ''
    })
  },

  onSquareTap(e) {
    if (!this.game || this.data.robotThinking || this.data.showGameOver || this.data.showPromotion) return
    if (this.game.turn() !== this.playerColor) return
    const coord = e.currentTarget.dataset.coord
    const piece = this.game.get(coord)
    const selected = this.data.selectedSquare
    if (selected && this.data.legalTargets.includes(coord)) {
      if (isPromotionMove(this.game, selected, coord)) {
        this.pendingPromotion = { from: selected, to: coord }
        const promotionOptions = PROMOTION_PIECES.map(item => ({
          ...item,
          glyph: this.playerColor === 'w' ? item.whiteGlyph : item.blackGlyph,
          image: (this.pieceImages || PIECE_IMAGES)[`${this.playerColor}${item.key}`]
        }))
        this.setData({ showPromotion: true, promotionOptions })
        return
      }
      this.commitPlayerMove(selected, coord)
      return
    }
    if (piece?.color === this.playerColor) {
      if (selected === coord) {
        this.clearSelection()
        return
      }
      const targets = [...new Set(legalMovesFrom(this.game, coord).map(move => move.to))]
      this.setData({ selectedSquare: coord, legalTargets: targets })
      this.renderGame()
      safeVibrate()
      return
    }
    this.clearSelection()
  },

  clearSelection() {
    this.setData({ selectedSquare: '', legalTargets: [] })
    this.renderGame()
  },

  onChoosePromotion(e) {
    const pending = this.pendingPromotion
    if (!pending) return
    this.pendingPromotion = null
    this.commitPlayerMove(pending.from, pending.to, e.currentTarget.dataset.piece)
  },

  onCancelPromotion() {
    this.pendingPromotion = null
    this.setData({ showPromotion: false })
  },

  commitPlayerMove(from, to, promotion) {
    const snapshot = {
      fen: this.game.fen(),
      positionHistoryLength: this.positionHistory.length,
      moveLogLength: this.moveLog.length,
      lastMove: this.lastMove
    }
    try {
      const move = this.game.move({ from, to, ...(promotion ? { promotion } : {}) })
      if (!move) return
      this.snapshots.push(snapshot)
      this.positionHistory.push(this.game.fen())
      this.lastMove = { from: move.from, to: move.to }
      this.moveLog.push({
        ply: this.moveLog.length + 1,
        label: moveLabel(move, '你'),
        from: move.from,
        to: move.to,
        san: move.san
      })
      this.triggerCaptureEffect(move, 'player')
      this.setData({ selectedSquare: '', legalTargets: [], showPromotion: false })
      safeVibrate('medium')
      if (this.finishIfNeeded()) return
      this.renderGame()
      this.saveGame()
      this.requestRobotMove()
    } catch (error) {
      console.error('走子失败:', error)
      this.clearSelection()
    }
  },

  requestRobotMove() {
    if (!this.game || this.game.turn() === this.playerColor || this.data.showGameOver) return
    const requestId = `${Date.now()}-${(this._aiSequence || 0) + 1}`
    this._aiSequence = (this._aiSequence || 0) + 1
    this._aiRequestId = requestId
    this._aiFen = this.game.fen()
    this._aiRequestedAt = Date.now()
    this.setData({ robotThinking: true, selectedSquare: '', legalTargets: [] })
    this.renderGame()
    const message = { requestId, fen: this._aiFen, level: this.data.difficultyLevel }
    if (this._worker) {
      try {
        this._worker.postMessage(message)
      } catch (error) {
        console.warn('国际象棋 Worker 消息发送失败，将使用主线程:', error)
        this._worker = null
        setTimeout(() => this.runRobotFallback(), 0)
      }
    } else {
      setTimeout(() => this.runRobotFallback(), 80)
    }
  },

  runRobotFallback() {
    const requestId = this._aiRequestId
    const fen = this._aiFen
    if (!requestId || !fen) return
    try {
      const move = chessAi.calculateRobotMove(fen, this.data.difficultyLevel)
      this.onRobotMessage({ requestId, move })
    } catch (error) {
      this.onRobotMessage({ requestId, error: error.message })
    }
  },

  onRobotMessage(message) {
    if (!message || message.requestId !== this._aiRequestId || !this.game || this.game.fen() !== this._aiFen) return
    const remainingDelay = ROBOT_MOVE_MIN_DELAY_MS - (Date.now() - (this._aiRequestedAt || 0))
    if (!message.delayElapsed && remainingDelay > 0) {
      clearTimeout(this._robotMoveDelayTimer)
      this._robotMoveDelayTimer = setTimeout(() => {
        this._robotMoveDelayTimer = null
        this.onRobotMessage({ ...message, delayElapsed: true })
      }, remainingDelay)
      return
    }
    this._aiRequestId = ''
    this._aiFen = ''
    this._aiRequestedAt = 0
    if (message.error || !message.move) {
      console.error('机器人走棋失败:', message.error)
      const fallback = this.game.moves({ verbose: true })[0]
      if (!fallback) {
        this.setData({ robotThinking: false })
        this.finishIfNeeded()
        return
      }
      message.move = { from: fallback.from, to: fallback.to, fallback: true }
    }
    try {
      const candidates = legalMovesFrom(this.game, message.move.from).filter(item => item.to === message.move.to)
      const candidate = candidates.find(item => item.promotion === 'q') || candidates[0]
      if (!candidate) throw new Error('机器人返回了非法走法')
      const move = this.game.move({
        from: candidate.from,
        to: candidate.to,
        ...(candidate.promotion ? { promotion: candidate.promotion } : {})
      })
      this.positionHistory.push(this.game.fen())
      this.lastMove = { from: move.from, to: move.to }
      this.moveLog.push({
        ply: this.moveLog.length + 1,
        label: moveLabel(move, '机器人'),
        from: move.from,
        to: move.to,
        san: move.san
      })
      this.triggerCaptureEffect(move, 'robot')
      this.setData({ robotThinking: false })
      if (message.move.fallback) wx.showToast({ title: '机器人换了一种想法', icon: 'none' })
      safeVibrate()
      if (this.finishIfNeeded()) return
      this.renderGame()
      this.saveGame()
    } catch (error) {
      console.error('应用机器人走法失败:', error)
      this.setData({ robotThinking: false })
      this.renderGame()
      wx.showToast({ title: '机器人走棋失败', icon: 'none' })
    }
  },

  cancelRobotMove() {
    clearTimeout(this._robotMoveDelayTimer)
    this._robotMoveDelayTimer = null
    this._aiRequestId = ''
    this._aiFen = ''
    this._aiRequestedAt = 0
    if (this.data.robotThinking) this.setData({ robotThinking: false })
  },

  triggerCaptureEffect(move, actor) {
    clearTimeout(this._captureEffectTimer)
    this._captureEffectTimer = null
    if (!move?.captured) {
      this.captureEffect = null
      return
    }
    this.captureEffect = {
      square: capturedSquare(move),
      kind: actor === 'player' ? 'player-capture' : 'robot-capture',
      text: actor === 'player' ? '吃子！' : '被吃'
    }
    this._captureEffectTimer = setTimeout(() => {
      this._captureEffectTimer = null
      this.captureEffect = null
      if (!this._pageUnloaded && this.game) this.renderGame()
    }, CAPTURE_EFFECT_MS)
  },

  clearCaptureEffect() {
    clearTimeout(this._captureEffectTimer)
    this._captureEffectTimer = null
    this.captureEffect = null
  },

  finishIfNeeded() {
    const terminal = getTerminalState(this.game, this.positionHistory)
    if (terminal.type === 'checkmate') {
      const winner = terminal.winner
      this.finishGame(
        winner === this.playerColor ? '你赢了！' : '机器人获胜',
        winner === this.playerColor ? '漂亮的将死' : '这局被将死了，再来一盘',
        winner === this.playerColor ? 'win' : 'loss'
      )
      return true
    }
    if (terminal.type === 'draw') {
      this.finishGame('和棋', terminal.reason, 'draw')
      return true
    }
    return false
  },

  finishGame(title, detail, result) {
    this.cancelRobotMove()
    this.setData({
      selectedSquare: '',
      legalTargets: [],
      showPromotion: false,
      showGameOver: true,
      resultTitle: title,
      resultDetail: detail
    })
    this.renderGame()
    if (!this._resultCommitted) {
      this._resultCommitted = true
      this.recordResult(result)
    }
    this.saveGame(true)
  },

  recordResult(result) {
    const stats = wx.getStorageSync(STATS_KEY) || { win: 0, loss: 0, draw: 0 }
    stats[result] = (Number(stats[result]) || 0) + 1
    wx.setStorageSync(STATS_KEY, stats)
    const child = app.globalData.currentChild
    if (!child || !wx.cloud) return
    wx.cloud.callFunction({
      name: 'saveProgress',
      data: {
        action: 'save',
        childId: child._id,
        grade: Number(child.grade) || 1,
        semester: child.semester || 'upper',
        unitIndex: 0,
        type: 'chess',
        score: result === 'win' ? this.data.difficultyLevel : 0
      }
    }).catch(error => console.error('保存国际象棋结果失败:', error))
  },

  onUndo() {
    if (!this.data.canUndo || !this.snapshots.length) return
    this.cancelRobotMove()
    const snapshot = this.snapshots.pop()
    this.clearCaptureEffect()
    this.game = new Chess(snapshot.fen)
    this.positionHistory = this.positionHistory.slice(0, snapshot.positionHistoryLength)
    this.moveLog = this.moveLog.slice(0, snapshot.moveLogLength)
    this.lastMove = snapshot.lastMove || null
    this._resultCommitted = false
    this.setData({
      selectedSquare: '',
      legalTargets: [],
      showPromotion: false,
      showGameOver: false,
      resultTitle: '',
      resultDetail: ''
    })
    this.renderGame()
    this.saveGame()
  },

  onNewGame() {
    const restart = () => this.startNewGame(this.playerColor, this.data.difficultyLevel)
    if (!this.moveLog.length) {
      restart()
      return
    }
    wx.showModal({
      title: '重新开始？',
      content: '当前棋局会被清除',
      confirmText: '重新开始',
      success: result => { if (result.confirm) restart() }
    })
  },

  onChangeSide() {
    const nextColor = oppositeColor(this.playerColor)
    const change = () => this.startNewGame(nextColor, this.data.difficultyLevel)
    if (!this.moveLog.length) {
      change()
      return
    }
    wx.showModal({
      title: '交换执棋方？',
      content: '换边后会开始一盘新棋',
      confirmText: '换边',
      success: result => { if (result.confirm) change() }
    })
  },

  onResign() {
    if (!this.moveLog.length || this.data.showGameOver) return
    wx.showModal({
      title: '确定认输？',
      content: '机器人将赢得本局',
      confirmText: '认输',
      confirmColor: '#C83E3E',
      success: result => { if (result.confirm) this.finishGame('机器人获胜', '你选择了认输', 'loss') }
    })
  },

  onOfferDraw() {
    if (!this.game || this.game.turn() !== this.playerColor || this.data.robotThinking || this.data.showGameOver) return
    const draw = getDrawState(this.game, this.positionHistory)
    if (draw.claimable) {
      this.finishGame('和棋', draw.reason, 'draw')
      return
    }
    if (this.moveLog.length - this._lastDrawOfferPly < 6) {
      wx.showToast({ title: '再走几步后再提和', icon: 'none' })
      return
    }
    this._lastDrawOfferPly = this.moveLog.length
    if (shouldRobotAcceptDraw(this.game)) this.finishGame('和棋', '机器人接受了提和', 'draw')
    else wx.showToast({ title: '机器人想继续下', icon: 'none' })
  },

  onOpenDifficulty() {
    if (this.data.robotThinking) return
    this.setData({ showDifficulty: true })
  },

  onCloseDifficulty() {
    this.setData({ showDifficulty: false })
  },

  onChooseDifficulty(e) {
    const difficulty = getDifficulty(e.currentTarget.dataset.level)
    if (difficulty.level === this.data.difficultyLevel) {
      this.setData({ showDifficulty: false })
      return
    }
    const change = () => this.startNewGame(this.playerColor, difficulty.level)
    if (!this.moveLog.length) {
      change()
      return
    }
    wx.showModal({
      title: `切换到 ${difficulty.level}档 ${difficulty.name}？`,
      content: '更换机器人后会开始一盘新棋',
      confirmText: '切换',
      success: result => {
        if (result.confirm) change()
        else this.setData({ showDifficulty: false })
      }
    })
  },

  onOpenRules() {
    this.setData({ showRules: true })
  },

  onCloseRules() {
    this.setData({ showRules: false })
  },

  onRematch() {
    this.startNewGame(this.playerColor, this.data.difficultyLevel)
  },

  onLeaveGame() {
    wx.navigateBack()
  },

  onStopTap() {},

  saveGame(gameOver = this.data.showGameOver) {
    if (!this.game) return
    try {
      wx.setStorageSync(STORAGE_KEY, {
        version: 1,
        fen: this.game.fen(),
        playerColor: this.playerColor,
        difficultyLevel: this.data.difficultyLevel,
        snapshots: this.snapshots,
        positionHistory: this.positionHistory,
        moveLog: this.moveLog,
        lastMove: this.lastMove,
        gameOver: Boolean(gameOver),
        savedAt: Date.now()
      })
    } catch (error) {
      console.warn('保存国际象棋对局失败:', error)
    }
  }
})
