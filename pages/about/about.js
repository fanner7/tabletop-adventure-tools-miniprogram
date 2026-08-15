// pages/about/about.js
Page({
  data: {
    version: '1.6.2',
    year: new Date().getFullYear(),
  },

  onThemeModeTap(e) {
    const mode = e.currentTarget.dataset.mode;
    const app = getApp();
    if (app && typeof app.setThemeMode === 'function') {
      app.setThemeMode(mode);
    }
  },

  onCopyRepo() {
    wx.setClipboardData({
      data: 'https://github.com/fanner7/tabletop-adventure-tools-miniprogram',
      success() { wx.showToast({ title: '已复制仓库地址', icon: 'success', duration: 1500 }); }
    });
  },
});
