const app = getApp()

Page({
  data: {
    children: [],
    showAddModal: false,
    newChildName: '',
    avatarOptions: ['👦', '👧', '🧒', '👶'],
    selectedAvatar: 0,
    gradeOptions: [
      { value: 1, name: '一年级' },
      { value: 2, name: '二年级' },
      { value: 3, name: '三年级' },
      { value: 4, name: '四年级' },
      { value: 5, name: '五年级' },
      { value: 6, name: '六年级' }
    ],
    selectedGrade: 1
  },

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
    this.setData({ showAddModal: true, newChildName: '', selectedAvatar: 0, selectedGrade: 1 })
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

  onSelectGrade(e) {
    this.setData({ selectedGrade: Number(e.currentTarget.dataset.grade) })
  },

  // 确认添加孩子
  async onConfirmAdd() {
    const { newChildName, selectedAvatar, avatarOptions, selectedGrade } = this.data
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
          avatar: avatarOptions[selectedAvatar],
          grade: selectedGrade
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

  async onChildGradeChange(e) {
    const childId = e.currentTarget.dataset.id
    const grade = Number(e.detail.value) + 1
    const child = this.data.children.find(item => item._id === childId)
    if (!child) return
    try {
      await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'updateChildPreferences', childId, grade, semester: child.semester || 'upper' }
      })
      if (app.globalData.currentChild && app.globalData.currentChild._id === childId) {
        app.globalData.currentChild.grade = grade
      }
      await this.loadChildren()
      wx.showToast({ title: '年级已更新', icon: 'success' })
    } catch (err) {
      console.error('更新年级失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  }
})
