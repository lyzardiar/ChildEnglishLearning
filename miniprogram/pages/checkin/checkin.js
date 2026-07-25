const app = getApp()

Page({
  data: {
    currentChild: null,
    streakDays: 0,
    totalDays: 0,
    todayChecked: false,
    weekDays: [],       // 本周打卡情况
    monthRecords: [],   // 本月打卡日历
    currentMonth: ''
  },

  onLoad() {
    this.initMonth()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'checkin' })
    }
    this.loadCheckinData()
  },

  initMonth() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    this.setData({ currentMonth: `${year}年${month}月` })
    this.generateMonthCalendar(year, month)
  },

  generateMonthCalendar(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay() // 0=周日
    const today = new Date().getDate()

    const days = []
    // 填充月初空白
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', empty: true })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isToday: d === today,
        checked: false // 后续从数据库加载
      })
    }
    this.setData({ monthRecords: days })
  },

  async loadCheckinData() {
    const { currentChild } = app.globalData
    this.setData({ currentChild })

    if (!currentChild) return

    try {
      // TODO: 从云数据库加载打卡数据
      // const res = await wx.cloud.callFunction({
      //   name: 'dailyCheckin',
      //   data: { action: 'getRecords', childId: currentChild._id }
      // })
      // this.setData({
      //   streakDays: res.result.streakDays,
      //   totalDays: res.result.totalDays,
      //   todayChecked: res.result.todayChecked
      // })

      // 生成周视图
      this.generateWeekView()
    } catch (err) {
      console.error('加载打卡数据失败:', err)
    }
  },

  generateWeekView() {
    const weekNames = ['日', '一', '二', '三', '四', '五', '六']
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekDays = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - dayOfWeek + i)
      weekDays.push({
        name: weekNames[i],
        date: date.getDate(),
        isToday: i === dayOfWeek,
        checked: false // TODO: 从数据加载
      })
    }
    this.setData({ weekDays })
  },

  // 执行打卡
  async onCheckin() {
    const { currentChild, todayChecked } = this.data
    if (!currentChild) {
      wx.showToast({ title: '请先选择小朋友', icon: 'none' })
      return
    }
    if (todayChecked) {
      wx.showToast({ title: '今天已经打过卡啦', icon: 'none' })
      return
    }

    try {
      // TODO: 调用云函数打卡
      // await wx.cloud.callFunction({
      //   name: 'dailyCheckin',
      //   data: { action: 'checkin', childId: currentChild._id }
      // })

      this.setData({
        todayChecked: true,
        streakDays: this.data.streakDays + 1,
        totalDays: this.data.totalDays + 1
      })

      wx.showToast({ title: '打卡成功！', icon: 'success' })
      wx.vibrateShort({ type: 'heavy' })
    } catch (err) {
      wx.showToast({ title: '打卡失败，请重试', icon: 'none' })
    }
  }
})
