const app = getApp()

Page({
  data: {
    currentChild: null,
    children: [],
    units: [],
    semester: 'upper',
    todayChecked: false,
    streakDays: 0
  },

  onLoad() {
    this.loadChildData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'index' })
    }
    this.loadChildData()
  },

  async loadChildData() {
    // 先用 globalData 立即渲染（如果有缓存）
    const { currentChild, children } = app.globalData
    if (children.length > 0) {
      this.setData({ currentChild, children })
      if (currentChild) {
        this.loadUnits()
        this.loadCheckinStatus()
      }
    }

    // 再从云端拉取最新数据，避免 login 异步未完成时拿到空数组
    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getChildren' }
      })
      const freshChildren = (res.result && res.result.children) || []
      app.globalData.children = freshChildren
      if (freshChildren.length > 0 && !app.globalData.currentChild) {
        app.globalData.currentChild = freshChildren[0]
      }
      this.setData({
        children: freshChildren,
        currentChild: app.globalData.currentChild
      })
      if (app.globalData.currentChild) {
        this.loadUnits()
        this.loadCheckinStatus()
      }
    } catch (err) {
      console.error('加载孩子列表失败:', err)
    }
  },

  loadUnits() {
    const bookData = require('../../data/index.js')
    const book = bookData.getBook(this.data.semester)
    this.setData({ units: book.units || [] })
  },

  async loadCheckinStatus() {
    const { currentChild } = this.data
    if (!currentChild) return

    try {
      const res = await wx.cloud.callFunction({
        name: 'dailyCheckin',
        data: { action: 'getRecords', childId: currentChild._id }
      })
      if (res.result && res.result.code === 0) {
        this.setData({
          todayChecked: res.result.todayChecked,
          streakDays: res.result.streakDays
        })
      }
    } catch (err) {
      console.error('加载打卡状态失败:', err)
    }
  },

  // 切换孩子
  onSwitchChild(e) {
    const childId = e.currentTarget.dataset.id
    app.switchChild(childId)
    this.setData({ currentChild: app.globalData.currentChild })
    this.loadUnits()
    this.loadCheckinStatus()
  },

  // 切换学期
  onSwitchSemester(e) {
    const semester = e.currentTarget.dataset.semester
    this.setData({ semester })
    this.loadUnits()
  },

  // 进入单元学习
  onEnterUnit(e) {
    const unitIndex = e.currentTarget.dataset.index
    wx.navigateTo({
      url: `/pages/learn/learn?semester=${this.data.semester}&unit=${unitIndex}`
    })
  },

  // 进入课文听力
  onEnterListen(e) {
    const unitIndex = e.currentTarget.dataset.index
    wx.navigateTo({
      url: `/pages/listen/listen?semester=${this.data.semester}&unit=${unitIndex}`
    })
  }
})
