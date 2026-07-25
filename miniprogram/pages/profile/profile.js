const app = getApp()
const imageStyle = require('../../utils/imageStyle')

Page({
  data: {
    children: [],
    showAddModal: false,
    newChildName: '',
    avatarOptions: [
      '/images/avatar-boy1.png',
      '/images/avatar-girl1.png',
      '/images/avatar-boy2.png',
      '/images/avatar-girl2.png'
    ],
    selectedAvatar: 0,
    // 图片风格
    styleList: imageStyle.STYLES,
    currentStyle: imageStyle.getCurrentStyle()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 'profile' })
    }
    this.setData({ children: app.globalData.children })
  },

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
      // TODO: 调用云函数创建孩子档案
      // const res = await wx.cloud.callFunction({
      //   name: 'login',
      //   data: {
      //     action: 'addChild',
      //     name: newChildName.trim(),
      //     avatar: avatarOptions[selectedAvatar]
      //   }
      // })

      // 临时本地添加（云函数就绪后替换）
      const newChild = {
        _id: 'temp_' + Date.now(),
        name: newChildName.trim(),
        avatar: avatarOptions[selectedAvatar],
        semester: 'upper',
        currentUnit: 0
      }

      app.globalData.children.push(newChild)
      if (!app.globalData.currentChild) {
        app.globalData.currentChild = newChild
      }

      this.setData({
        children: app.globalData.children,
        showAddModal: false
      })

      wx.showToast({ title: '添加成功', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  // 删除孩子
  onDeleteChild(e) {
    const childId = e.currentTarget.dataset.id
    const child = this.data.children.find(c => c._id === childId)

    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${child.name}」的学习档案吗？`,
      success: async (res) => {
        if (res.confirm) {
          // TODO: 调用云函数删除
          app.globalData.children = app.globalData.children.filter(c => c._id !== childId)
          if (app.globalData.currentChild && app.globalData.currentChild._id === childId) {
            app.globalData.currentChild = app.globalData.children[0] || null
          }
          this.setData({ children: app.globalData.children })
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
  }
})
