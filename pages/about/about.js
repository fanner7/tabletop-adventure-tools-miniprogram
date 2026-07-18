// pages/about/about.js
Page({
  data: {
    version: '1.5.0',
    year: new Date().getFullYear(),
  },

  onCopyRepo() {
    wx.setClipboardData({
      data: 'https://github.com/fanner7/tabletop-adventure-tools-miniprogram',
      success() { wx.showToast({ title: '已复制仓库地址', icon: 'success', duration: 1500 }); }
    });
  },
});
