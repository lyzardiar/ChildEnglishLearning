const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, childId } = event

  // 验证孩子归属
  const valid = await validateChild(OPENID, childId)
  if (!valid) {
    return { code: -1, message: '无权操作' }
  }

  switch (action) {
    case 'save':
      return saveProgress(childId, event)
    case 'get':
      return getProgress(childId)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 验证孩子是否属于当前家长
async function validateChild(openid, childId) {
  const { data } = await db.collection('children')
    .where({ _id: childId, parentOpenid: openid })
    .get()
  return data.length > 0
}

// 保存学习进度
async function saveProgress(childId, event) {
  const { semester, unitIndex, type, wordIndex, score } = event

  await db.collection('learning_records').add({
    data: {
      childId,
      semester,
      unitIndex,
      type,        // 'word' | 'listen' | 'game'
      wordIndex: wordIndex || 0,
      score: score || 0,
      createdAt: db.serverDate()
    }
  })

  // 更新孩子的当前进度
  await db.collection('children').doc(childId).update({
    data: {
      semester,
      currentUnit: unitIndex,
      updatedAt: db.serverDate()
    }
  })

  return { code: 0 }
}

// 获取学习进度
async function getProgress(childId) {
  const { data } = await db.collection('learning_records')
    .where({ childId })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return { code: 0, records: data }
}
