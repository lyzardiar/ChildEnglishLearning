const app = getApp()
const bookData = require('../../data/index.js')
const assets = require('../../data/assets.js')

Page({
  data: {
    currentChild: null,
    children: [],
    grades: bookData.getGrades(),
    grade: 1,
    gradeName: '一年级',
    semester: 'upper',
    semesterName: '上册',
    units: [],
    appendices: [],
    catalogTab: 'units',
    videoCount: 0,
    audioCount: 0,
    appendixAudioCount: 0,
    availableAppendixCount: 0,
    todayChecked: false,
    streakDays: 0,
    heroImage: assets.homeHero,
    heroImageError: false
  },

  onLoad() {
    const storedGrade = Number(wx.getStorageSync('currentGrade')) || 1
    const storedSemester = wx.getStorageSync('currentSemester') || 'upper'
    this.setData({ grade: storedGrade, semester: storedSemester })
    this.loadUnits()
    this.loadChildData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'index' })
    }
    this.loadChildData()
  },

  async loadChildData() {
    const cached = app.globalData
    if (cached.children.length) {
      this.applyChildren(cached.children, cached.currentChild)
    }

    try {
      const res = await wx.cloud.callFunction({ name: 'login', data: { action: 'getChildren' } })
      const children = (res.result && res.result.children) || []
      app.globalData.children = children
      if (children.length && !app.globalData.currentChild) app.globalData.currentChild = children[0]
      this.applyChildren(children, app.globalData.currentChild)
    } catch (err) {
      console.error('加载孩子列表失败:', err)
    }
  },

  applyChildren(children, currentChild) {
    this.setData({ children, currentChild })
    if (currentChild) {
      const grade = Number(currentChild.grade) || this.data.grade
      const semester = currentChild.semester || this.data.semester
      this.setData({ grade, semester })
      this.loadUnits()
      this.loadCheckinStatus()
    }
  },

  loadUnits() {
    const { grade, semester } = this.data
    const book = bookData.getBook(semester, grade)
    const appendices = book.appendices || []
    const videoCount = book.units.reduce((sum, unit) => sum + unit.counts.videos, 0)
    const unitAudioCount = book.units.reduce((sum, unit) => sum + unit.counts.audios, 0)
    const appendixAudioCount = appendices.reduce((sum, item) => sum + item.counts.audios, 0)
    this.setData({
      units: book.units,
      appendices,
      gradeName: bookData.getGrade(grade).name,
      semesterName: semester === 'lower' ? '下册' : '上册',
      videoCount,
      audioCount: unitAudioCount + appendixAudioCount,
      appendixAudioCount,
      availableAppendixCount: appendices.filter(item => item.availability === 'ready').length
    })
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
        this.setData({ todayChecked: res.result.todayChecked, streakDays: res.result.streakDays })
      }
    } catch (err) {
      console.error('加载打卡状态失败:', err)
    }
  },

  onSwitchChild(e) {
    app.switchChild(e.currentTarget.dataset.id)
    this.applyChildren(app.globalData.children, app.globalData.currentChild)
  },

  onSwitchGrade(e) {
    const grade = Number(e.currentTarget.dataset.grade)
    wx.setStorageSync('currentGrade', grade)
    this.setData({ grade })
    this.loadUnits()
    this.savePreference()
  },

  onSwitchSemester(e) {
    const semester = e.currentTarget.dataset.semester
    wx.setStorageSync('currentSemester', semester)
    this.setData({ semester })
    this.loadUnits()
    this.savePreference()
  },

  savePreference() {
    const { currentChild, grade, semester } = this.data
    if (!currentChild) return
    wx.cloud.callFunction({
      name: 'login',
      data: { action: 'updateChildPreferences', childId: currentChild._id, grade, semester }
    }).catch(err => console.error('保存教材偏好失败:', err))
  },

  onEnterUnit(e) {
    wx.navigateTo({
      url: `/pages/learn/learn?grade=${this.data.grade}&semester=${this.data.semester}&unit=${e.currentTarget.dataset.index}`
    })
  },

  onSwitchCatalog(e) {
    this.setData({ catalogTab: e.currentTarget.dataset.tab })
  },

  onEnterAppendix(e) {
    const index = Number(e.currentTarget.dataset.index)
    const item = this.data.appendices[index]
    if (!item || item.availability !== 'ready') {
      wx.showToast({ title: item?.statusText || '资源整理中', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/learn/learn?grade=${this.data.grade}&semester=${this.data.semester}&appendix=${index}`
    })
  },

  onHeroImageError() {
    this.setData({ heroImageError: true })
  }
})
