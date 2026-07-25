const app = getApp()

Page({
  data: {
    currentChild: null,
    streakDays: 0,
    totalDays: 0,
    todayChecked: false,
    weekDays: [],
    monthRecords: [],
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
    this.generateMonthCalendar(year, month, [])
  },

  generateMonthCalendar(year, month, checkedDates) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()
    const today = new Date().getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', empty: true })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        isToday: d === today,
        checked: checkedDates.includes(d)
      })
    }
    this.setData({ monthRecords: days })
  },

  async loadCheckinData() {
    const { currentChild } = app.globalData
    this.setData({ currentChild })

    if (!currentChild) return

    try {
      const res = await wx.cloud.callFunction({
        name: 'dailyCheckin',
        data: { action: 'getRecords', childId: currentChild._id }
      })

      if (res.result && res.result.code === 0) {
        const { todayChecked, streakDays, totalDays, checkedDates } = res.result
        this.setData({ todayChecked, streakDays, totalDays })

        // 更新月历
        const now = new Date()
        this.generateMonthCalendar(now.getFullYear(), now.getMonth() + 1, checkedDates || [])
      }
    } catch (err) {
      console.error('加载打卡数据失败:', err)
    }

    this.generateWeekView()
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
        checked: false
      })
    }

    // 如果有月历数据，同步本周的打卡状态
    const { monthRecords } = this.data
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const todayDate = now.getDate()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - dayOfWeek + i)
      // 只标记本月的日期
      if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear) {
        const dayNum = date.getDate()
        const record = monthRecords.find(r => r.day === dayNum && !r.empty)
        if (record && record.checked) {
          weekDays[i].checked = true
        }
      }
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
      const res = await wx.cloud.callFunction({
        name: 'dailyCheckin',
        data: { action: 'checkin', childId: currentChild._id }
      })

      if (res.result && res.result.code === 0) {
        const streakDays = res.result.streakDays || this.data.streakDays + 1
        this.setData({
          todayChecked: true,
          streakDays,
          totalDays: this.data.totalDays + 1
        })

        // 更新月历中今天的状态
        const today = new Date().getDate()
        const monthRecords = this.data.monthRecords.map(r => {
          if (r.day === today) return { ...r, checked: true }
          return r
        })
        this.setData({ monthRecords })
        this.generateWeekView()

        wx.showToast({ title: '打卡成功！', icon: 'success' })
        wx.vibrateShort({ type: 'heavy' })
      } else {
        wx.showToast({ title: res.result.message || '打卡失败', icon: 'none' })
      }
    } catch (err) {
      console.error('打卡失败:', err)
      wx.showToast({ title: '打卡失败，请重试', icon: 'none' })
    }
  }
})
