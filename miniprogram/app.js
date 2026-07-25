App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'cloud1-d8g5ssn6n94472f8a',
      traceUser: true
    })

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

      this.globalData.loginReady = true
    } catch (err) {
      console.error('登录失败:', err)
      this.globalData.loginReady = true
      // 延迟重试一次
      setTimeout(() => {
        if (!this.globalData.openid) {
          console.log('重试登录...')
          this.login()
        }
      }, 3000)
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
    children: [],
    loginReady: false
  }
})
