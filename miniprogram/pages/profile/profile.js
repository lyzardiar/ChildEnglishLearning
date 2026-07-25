const app = getApp()
const imageStyle = require('../../utils/imageStyle')
const imageUploader = require('../../utils/imageUploader')

Page({
  data: {
    children: [],
    showAddModal: false,
    newChildName: '',
    avatarOptions: ['👦', '👧', '🧒', '👶'],
    selectedAvatar: 0,
    // 图片风格
    styleList: imageStyle.STYLES,
    currentStyle: imageStyle.getCurrentStyle(),
    uploading: false
  },

  _styleTapCount: 0,
  _styleTapTimer: null,

  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'profile' })
    }
    await this.loadChildren()
  },

  // 从云端加载孩子列表
  async loadChildren() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getChildren' }
      })
      const children = (res.result && res.result.children) || []
      app.globalData.children = children
      if (children.length > 0 && !app.globalData.currentChild) {
        app.globalData.currentChild = children[0]
      }
      this.setData({ children })
    } catch (err) {
      console.error('加载孩子列表失败:', err)
    }
  },

  // 空函数，用于阻止弹窗内容区事件冒泡
  noop() {},

  // 显示添加孩子弹窗
  onShowAddModal() {
    this.setData({ showAddModal: true, newChildName: '', selectedAvatar: 0 })
  },

  // 隐藏弹窗
  onHideAddModal() {
    this.setData({ showAddModal: false })
  },

  // 输入孩子名字
  onNameInput(e) {
    this.setData({ newChildName: e.detail.value })
  },

  // 选择头像
  onSelectAvatar(e) {
    this.setData({ selectedAvatar: e.currentTarget.dataset.index })
  },

  // 确认添加孩子
  async onConfirmAdd() {
    const { newChildName, selectedAvatar, avatarOptions } = this.data
    if (!newChildName.trim()) {
      wx.showToast({ title: '请输入名字', icon: 'none' })
      return
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: {
          action: 'addChild',
          name: newChildName.trim(),
          avatar: avatarOptions[selectedAvatar]
        }
      })

      if (res.result && res.result.code === 0) {
        this.setData({ showAddModal: false })
        wx.showToast({ title: '添加成功', icon: 'success' })
        await this.loadChildren()
      } else {
        wx.showToast({ title: res.result.message || '添加失败', icon: 'none' })
      }
    } catch (err) {
      console.error('添加孩子失败:', err)
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  // 删除孩子
  onDeleteChild(e) {
    const childId = e.currentTarget.dataset.id
    const child = this.data.children.find(c => c._id === childId)
    if (!child) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${child.name}」的学习档案吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'login',
              data: { action: 'deleteChild', childId }
            })
            if (app.globalData.currentChild && app.globalData.currentChild._id === childId) {
              app.globalData.currentChild = null
            }
            await this.loadChildren()
            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (err) {
            console.error('删除孩子失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 切换当前孩子
  onSwitchChild(e) {
    const childId = e.currentTarget.dataset.id
    app.switchChild(childId)
    this.setData({ children: app.globalData.children })
  },

  // 切换图片风格
  onSwitchStyle(e) {
    const styleKey = e.currentTarget.dataset.key
    imageStyle.setStyle(styleKey)
    this.setData({ currentStyle: styleKey })
    wx.showToast({ title: '已切换风格', icon: 'success' })
  },

  // 隐藏入口：连续点击"图片风格"标题 5 次触发云上传
  onStyleTitleTap() {
    this._styleTapCount++
    clearTimeout(this._styleTapTimer)
    this._styleTapTimer = setTimeout(() => { this._styleTapCount = 0 }, 2000)

    if (this._styleTapCount >= 5) {
      this._styleTapCount = 0
      this.uploadImages()
    }
  },

  // 批量上传图片到云存储
  async uploadImages() {
    if (this.data.uploading) return

    this.setData({ uploading: true })
    wx.showLoading({ title: '上传中 0%', mask: true })

    try {
      const result = await imageUploader.uploadAllImages((current, total, word) => {
        wx.showLoading({ title: `上传中 ${Math.round(current / total * 100)}%`, mask: true })
      })

      wx.hideLoading()
      if (result.skipped === 'all') {
        wx.showToast({ title: '已全部上传过', icon: 'success' })
      } else {
        wx.showToast({ title: `完成！成功${result.success}张`, icon: 'success' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('上传失败:', err)
      wx.showToast({ title: '上传出错', icon: 'none' })
    }

    this.setData({ uploading: false })
  }
})
