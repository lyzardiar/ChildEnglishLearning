const { calculateRobotMove } = require('../miniprogram/utils/chess-ai.js')

worker.onMessage(message => {
  try {
    const move = calculateRobotMove(message.fen, message.level)
    worker.postMessage({ requestId: message.requestId, move })
  } catch (error) {
    worker.postMessage({ requestId: message.requestId, error: error.message || '机器人计算失败' })
  }
})
