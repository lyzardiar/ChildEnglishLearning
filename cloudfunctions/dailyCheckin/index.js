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
    case 'checkin':
      return doCheckin(childId)
    case 'getRecords':
      return getRecords(childId)
    default:
      return { code: -1, message: '未知操作' }
  }
}

async function validateChild(openid, childId) {
  const { data } = await db.collection('children')
    .where({ _id: childId, parentOpenid: openid })
    .get()
  return data.length > 0
}

// 执行打卡
async function doCheckin(childId) {
  const today = getTodayStr()

  // 检查今天是否已打卡
  const { data: existing } = await db.collection('checkins')
    .where({ childId, date: today })
    .get()

  if (existing.length > 0) {
    return { code: 0, message: '今日已打卡', alreadyChecked: true }
  }

  // 计算连续天数
  const yesterday = getYesterdayStr()
  const { data: yesterdayRecord } = await db.collection('checkins')
    .where({ childId, date: yesterday })
    .get()

  let streakDays = 1
  if (yesterdayRecord.length > 0) {
    streakDays = (yesterdayRecord[0].streakDays || 0) + 1
  }

  // 写入打卡记录
  await db.collection('checkins').add({
    data: {
      childId,
      date: today,
      streakDays,
      createdAt: db.serverDate()
    }
  })

  return { code: 0, streakDays, alreadyChecked: false }
}

// 获取打卡记录
async function getRecords(childId) {
  const today = getTodayStr()

  // 今日是否已打卡
  const { data: todayRecord } = await db.collection('checkins')
    .where({ childId, date: today })
    .get()

  const todayChecked = todayRecord.length > 0
  const streakDays = todayChecked ? (todayRecord[0].streakDays || 0) : 0

  // 总打卡天数
  const { total } = await db.collection('checkins')
    .where({ childId })
    .count()

  // 本月打卡日期列表
  const monthPrefix = today.substring(0, 7) // 'YYYY-MM'
  const { data: monthRecords } = await db.collection('checkins')
    .where({
      childId,
      date: db.RegExp({ regexp: `^${monthPrefix}` })
    })
    .get()

  const checkedDates = monthRecords.map(r => parseInt(r.date.split('-')[2]))

  return {
    code: 0,
    todayChecked,
    streakDays,
    totalDays: total,
    checkedDates
  }
}

function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getYesterdayStr() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const y = yesterday.getFullYear()
  const m = String(yesterday.getMonth() + 1).padStart(2, '0')
  const d = String(yesterday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
