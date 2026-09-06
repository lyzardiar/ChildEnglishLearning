const { EngineGame } = require('../vendor/js-chess-engine.js')
const { getDifficulty } = require('./chess-game.js')

function normalizeMovesMap(movesMap) {
  const result = []
  Object.keys(movesMap || {}).forEach(from => {
    ;(movesMap[from] || []).forEach(to => result.push({ from: from.toLowerCase(), to: to.toLowerCase() }))
  })
  return result
}

function randomMove(moves, random) {
  return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))]
}

function calculateRobotMove(fen, level, random = Math.random) {
  const difficulty = getDifficulty(level)
  const game = new EngineGame(fen)
  const legalMoves = normalizeMovesMap(game.moves())
  if (!legalMoves.length) return null

  if (difficulty.randomMoveRate && random() < difficulty.randomMoveRate) {
    return { ...randomMove(legalMoves, random), source: 'variety' }
  }

  const result = game.ai({
    level: difficulty.engineLevel,
    play: false,
    randomness: difficulty.randomness,
    ttSizeMB: difficulty.ttSizeMB,
    ...(difficulty.depth ? { depth: difficulty.depth } : {})
  })
  const source = Object.keys(result.move || {})[0]
  const from = source?.toLowerCase()
  return from ? {
    from,
    to: result.move[source].toLowerCase(),
    source: 'engine',
    depth: result.depth || null,
    nodesSearched: result.nodesSearched || null
  } : randomMove(legalMoves, random)
}

module.exports = { calculateRobotMove }
