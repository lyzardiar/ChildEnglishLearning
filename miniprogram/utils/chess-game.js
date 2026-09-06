const { Chess } = require('../vendor/js-chess-engine.js')
const { PIECE_IMAGES } = require('../data/chess-assets.js')

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PIECE_GLYPHS = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟'
}
const PIECE_NAMES = { k: '王', q: '后', r: '车', b: '象', n: '马', p: '兵' }
const PROMOTION_PIECES = [
  { key: 'q', whiteGlyph: '♕', blackGlyph: '♛', name: '后' },
  { key: 'r', whiteGlyph: '♖', blackGlyph: '♜', name: '车' },
  { key: 'b', whiteGlyph: '♗', blackGlyph: '♝', name: '象' },
  { key: 'n', whiteGlyph: '♘', blackGlyph: '♞', name: '马' }
]

const DIFFICULTIES = [
  { level: 1, name: '新手', detail: '会走棋', engineLevel: 1, randomness: 1000, randomMoveRate: 0.8, ttSizeMB: 0.25 },
  { level: 2, name: '小兵', detail: '开始吃子', engineLevel: 1, randomness: 800, randomMoveRate: 0.55, ttSizeMB: 0.25 },
  { level: 3, name: '学徒', detail: '留意威胁', engineLevel: 1, randomness: 500, randomMoveRate: 0.3, ttSizeMB: 0.25 },
  { level: 4, name: '入门', detail: '少犯错误', engineLevel: 1, randomness: 250, randomMoveRate: 0.1, ttSizeMB: 0.25 },
  { level: 5, name: '练习', detail: '看两步棋', engineLevel: 2, randomness: 180, randomMoveRate: 0.08, ttSizeMB: 0.5 },
  { level: 6, name: '进阶', detail: '攻守兼顾', engineLevel: 2, randomness: 80, randomMoveRate: 0, ttSizeMB: 0.5 },
  { level: 7, name: '熟练', detail: '寻找战术', engineLevel: 3, randomness: 60, randomMoveRate: 0, ttSizeMB: 1 },
  { level: 8, name: '高手', detail: '稳定计算', engineLevel: 3, randomness: 20, randomMoveRate: 0, ttSizeMB: 1 },
  { level: 9, name: '专家', detail: '深入搜索', engineLevel: 4, randomness: 10, randomMoveRate: 0, ttSizeMB: 2 },
  {
    level: 10,
    name: '老手',
    detail: '全力应战',
    engineLevel: 4,
    randomness: 0,
    randomMoveRate: 0,
    ttSizeMB: 4,
    depth: { base: 4, extended: 1, check: true, quiescence: 2 }
  }
]

function getDifficulty(level) {
  const index = Math.min(10, Math.max(1, Number(level) || 1)) - 1
  return DIFFICULTIES[index]
}

function colorName(color) {
  return color === 'b' ? '黑方' : '白方'
}

function oppositeColor(color) {
  return color === 'b' ? 'w' : 'b'
}

function positionKey(fen) {
  return String(fen || '').split(' ').slice(0, 4).join(' ')
}

function repetitionCount(positionHistory, fen) {
  const target = positionKey(fen)
  return (positionHistory || []).reduce((count, item) => count + (positionKey(item) === target ? 1 : 0), 0)
}

function halfMoveCount(game) {
  return Number(game.fen().split(' ')[4]) || 0
}

function getDrawState(game, positionHistory) {
  const repeats = repetitionCount(positionHistory, game.fen())
  const halfMove = halfMoveCount(game)
  if (game.isStalemate()) return { automatic: true, claimable: false, reason: '逼和' }
  if (game.isInsufficientMaterial()) return { automatic: true, claimable: false, reason: '子力不足' }
  if (repeats >= 5) return { automatic: true, claimable: false, reason: '五次重复局面' }
  if (halfMove >= 150) return { automatic: true, claimable: false, reason: '七十五回合无吃子或兵移动' }
  if (repeats >= 3 || game.isThreefoldRepetition()) return { automatic: false, claimable: true, reason: '三次重复局面' }
  if (halfMove >= 100 || game.isDrawByFiftyMoves()) return { automatic: false, claimable: true, reason: '五十回合无吃子或兵移动' }
  return { automatic: false, claimable: false, reason: '' }
}

function getTerminalState(game, positionHistory) {
  if (game.isCheckmate()) {
    return {
      finished: true,
      type: 'checkmate',
      winner: oppositeColor(game.turn()),
      reason: '将死'
    }
  }
  const draw = getDrawState(game, positionHistory)
  if (draw.automatic) {
    return { finished: true, type: 'draw', winner: '', reason: draw.reason }
  }
  return { finished: false, type: '', winner: '', reason: '' }
}

function legalMovesFrom(game, square) {
  return game.moves({ square: String(square || '').toLowerCase(), verbose: true })
}

function capturedSquare(move) {
  if (!move?.captured) return ''
  return String(move.flags || '').includes('e')
    ? `${move.to[0]}${move.from[1]}`
    : move.to
}

function createBoardSquares(
  game,
  playerColor,
  selectedSquare,
  legalTargets,
  lastMove,
  pieceImages = PIECE_IMAGES,
  captureEffect = null
) {
  const files = playerColor === 'b' ? [...FILES].reverse() : FILES
  const ranks = playerColor === 'b' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
  const legal = new Set(legalTargets || [])
  const squares = []
  ranks.forEach((rank, row) => {
    files.forEach((file, column) => {
      const coord = `${file}${rank}`
      const piece = game.get(coord)
      const pieceKey = piece ? `${piece.color}${piece.type}` : ''
      squares.push({
        coord,
        renderKey: `${coord}-${pieceKey || 'empty'}`,
        pieceKey,
        piece: piece?.type || '',
        pieceName: piece ? PIECE_NAMES[piece.type] : '',
        glyph: PIECE_GLYPHS[pieceKey] || '',
        pieceImage: pieceImages[pieceKey] || PIECE_IMAGES[pieceKey] || '',
        pieceColor: piece?.color || '',
        dark: (FILES.indexOf(file) + rank) % 2 === 1,
        selected: coord === selectedSquare,
        legal: legal.has(coord),
        capture: legal.has(coord) && Boolean(piece),
        last: coord === lastMove?.from || coord === lastMove?.to,
        lastFrom: coord === lastMove?.from,
        lastTo: coord === lastMove?.to,
        captureEffect: coord === captureEffect?.square,
        captureEffectKind: coord === captureEffect?.square ? captureEffect.kind : '',
        captureEffectText: coord === captureEffect?.square ? captureEffect.text : '',
        checked: Boolean(game.inCheck() && piece?.type === 'k' && piece.color === game.turn()),
        fileLabel: row === 7 ? file : '',
        rankLabel: column === 0 ? String(rank) : ''
      })
    })
  })
  return squares
}

function isPromotionMove(game, from, to) {
  const piece = game.get(from)
  return Boolean(piece?.type === 'p' && (to.endsWith('8') || to.endsWith('1')))
}

function moveLabel(move, actor) {
  if (!move) return ''
  return `${actor} ${move.san || `${move.from}-${move.to}`}`
}

function shouldRobotAcceptDraw(game) {
  const pieces = game.board().flat().filter(Boolean)
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  const score = pieces.reduce((total, piece) => total + values[piece.type] * (piece.color === 'w' ? 1 : -1), 0)
  return pieces.length <= 10 && Math.abs(score) <= 2 || halfMoveCount(game) >= 60 && Math.abs(score) <= 1
}

module.exports = {
  Chess,
  DIFFICULTIES,
  PROMOTION_PIECES,
  PIECE_NAMES,
  getDifficulty,
  colorName,
  oppositeColor,
  positionKey,
  repetitionCount,
  halfMoveCount,
  getDrawState,
  getTerminalState,
  legalMovesFrom,
  capturedSquare,
  createBoardSquares,
  isPromotionMove,
  moveLabel,
  shouldRobotAcceptDraw
}
