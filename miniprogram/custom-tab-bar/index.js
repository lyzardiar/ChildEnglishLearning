Component({
  data: {
    active: 'index',
    list: [
      {
        key: 'index',
        pagePath: '/pages/index/index',
        icon: '🏠',
        text: '首页'
      },
      {
        key: 'learn',
        pagePath: '/pages/learn/learn',
        icon: '📖',
        text: '学习'
      },
      {
        key: 'game',
        pagePath: '/pages/game/game',
        icon: '🎮',
        text: '游戏'
      },
      {
        key: 'checkin',
        pagePath: '/pages/checkin/checkin',
        icon: '⭐',
        text: '打卡'
      },
      {
        key: 'profile',
        pagePath: '/pages/profile/profile',
        icon: '👤',
        text: '我的'
      }
    ]
  },

  methods: {
    onSwitchTab(e) {
      const { key, path } = e.currentTarget.dataset
      if (key === this.data.active) return

      this.setData({ active: key })
      wx.switchTab({ url: path })
    }
  }
})
