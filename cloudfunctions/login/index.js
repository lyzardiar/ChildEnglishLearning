const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  switch (action) {
    case 'getChildren':
      return getChildren(OPENID)
    case 'addChild':
      return addChild(OPENID, event)
    case 'deleteChild':
      return deleteChild(OPENID, event)
    case 'updateChildPreferences':
      return updateChildPreferences(OPENID, event)
    default:
      // 默认：确保家长记录存在，返回 openid
      await ensureParent(OPENID)
      return { code: 0, openid: OPENID }
  }
}

// 确保家长记录存在
async function ensureParent(openid) {
  const { data } = await db.collection('parents').where({ _openid: openid }).get()
  if (data.length === 0) {
    await db.collection('parents').add({
      data: {
        _openid: openid,
        createdAt: db.serverDate(),
        children: []
      }
    })
  }
}

// 获取孩子列表
async function getChildren(openid) {
  const { data } = await db.collection('children')
    .where({ parentOpenid: openid })
    .orderBy('createdAt', 'asc')
    .get()

  return { code: 0, children: data }
}

// 添加孩子
async function addChild(openid, event) {
  const { name, avatar, grade } = event

  if (!name || !name.trim()) {
    return { code: -1, message: '名字不能为空' }
  }

  const result = await db.collection('children').add({
    data: {
      parentOpenid: openid,
      name: name.trim(),
      avatar: avatar || '',
      grade: Number(grade) || 1,
      semester: 'upper',
      currentUnit: 0,
      createdAt: db.serverDate()
    }
  })

  return { code: 0, childId: result._id }
}

async function updateChildPreferences(openid, event) {
  const { childId, grade, semester } = event
  const { data } = await db.collection('children')
    .where({ _id: childId, parentOpenid: openid })
    .get()

  if (data.length === 0) return { code: -1, message: '无权操作' }

  const safeGrade = Math.min(6, Math.max(1, Number(grade) || 1))
  const safeSemester = semester === 'lower' ? 'lower' : 'upper'
  await db.collection('children').doc(childId).update({
    data: { grade: safeGrade, semester: safeSemester, updatedAt: db.serverDate() }
  })
  return { code: 0 }
}

// 删除孩子
async function deleteChild(openid, event) {
  const { childId } = event

  // 验证权限：只能删除自己的孩子
  const { data } = await db.collection('children')
    .where({ _id: childId, parentOpenid: openid })
    .get()

  if (data.length === 0) {
    return { code: -1, message: '无权操作' }
  }

  await db.collection('children').doc(childId).remove()

  // 同时删除该孩子的学习记录
  const records = await db.collection('learning_records')
    .where({ childId })
    .get()

  if (records.data.length > 0) {
    await db.collection('learning_records')
      .where({ childId })
      .remove()
  }

  return { code: 0 }
}
