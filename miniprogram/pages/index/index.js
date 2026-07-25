const app = getApp()

Page({
  data: {
    currentChild: null,
    children: [],
    units: [], // 当前册的单元列表
    semester: 'upper', // upper=上册, lower=下册
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
    const { currentChild, children } = app.globalData
    this.setData({ currentChild, children })

    if (currentChild) {
      // TODO: 从云数据库加载学习进度
      this.loadUnits()
      this.loadCheckinStatus()
    }
  },

  loadUnits() {
    // 加载当前学期的单元列表
    const bookData = require('../../data/index.js')
    const book = bookData.getBook(this.data.semester)
    this.setData({ units: book.units || [] })
  },

  async loadCheckinStatus() {
    // TODO: 查询今日是否已打卡、连续天数
    this.setData({ todayChecked: false, streakDays: 0 })
  },

  // 切换孩子
  onSwitchChild(e) {
    const childId = e.currentTarget.dataset.id
    app.switchChild(childId)
    this.setData({ currentChild: app.globalData.currentChild })
    this.loadUnits()
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
