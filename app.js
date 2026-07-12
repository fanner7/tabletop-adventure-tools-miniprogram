// app.js
// 全局注入 onShareAppMessage，点亮所有页面的转发按钮
const _Page = Page;
Page = function (opts) {
  if (!opts.onShareAppMessage) {
    opts.onShareAppMessage = function () {
      return {
        title: '冒险背包',
        path: '/' + (this.route || 'pages/index/index'),
      };
    };
  }
  return _Page(opts);
};

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
