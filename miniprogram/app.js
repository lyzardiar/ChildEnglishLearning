App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'your-env-id', // TODO: 替换为你的云开发环境ID
      traceUser: true
    })

    this.globalData = {
      openid: '',
      currentChild: null, // 当前选中的孩子档案
      children: []        // 家长下所有孩子
    }

    this.login()
  },

  async login() {
    try {
      const res = await wx.cloud.callFunction({ name: 'login' })
      this.globalData.openid = res.result.openid

      // 获取家长下的孩子列表
      const childrenRes = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getChildren' }
      })
      this.globalData.children = childrenRes.result.children || []

      // 默认选中第一个孩子
      if (this.globalData.children.length > 0) {
        this.globalData.currentChild = this.globalData.children[0]
      }
    } catch (err) {
      console.error('登录失败:', err)
    }
  },

  // 切换当前孩子
  switchChild(childId) {
    const child = this.globalData.children.find(c => c._id === childId)
    if (child) {
      this.globalData.currentChild = child
    }
  },

  globalData: {
    openid: '',
    currentChild: null,
    children: []
  }
})
