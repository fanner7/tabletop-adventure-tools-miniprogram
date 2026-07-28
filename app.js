// app.js
// 全局注入 onShareAppMessage，点亮所有页面的转发按钮，并统一管理主题。
const THEME_MODE_KEY = 'appThemeMode';
const DEFAULT_THEME_MODE = 'system';
const THEME_LABELS = {
  light: '白天',
  dark: '黑夜',
  system: '跟随系统',
};

function normalizeTheme(theme) {
  return theme === 'dark' ? 'dark' : 'light';
}

function normalizeThemeMode(mode) {
  return mode === 'light' || mode === 'dark' || mode === 'system'
    ? mode
    : DEFAULT_THEME_MODE;
}

function getSystemTheme() {
  try {
    if (typeof wx.getAppBaseInfo === 'function') {
      const appBaseInfo = wx.getAppBaseInfo();
      return normalizeTheme(appBaseInfo && appBaseInfo.theme);
    }
    if (typeof wx.getSystemInfoSync === 'function') {
      const info = wx.getSystemInfoSync();
      return normalizeTheme(info && info.theme);
    }
  } catch (e) {
    return 'light';
  }
  return 'light';
}

function getFallbackThemeState() {
  let themeMode = DEFAULT_THEME_MODE;
  try {
    themeMode = normalizeThemeMode(wx.getStorageSync(THEME_MODE_KEY));
  } catch (e) {
    themeMode = DEFAULT_THEME_MODE;
  }
  const systemTheme = getSystemTheme();
  const theme = themeMode === 'system' ? systemTheme : themeMode;
  return {
    theme,
    themeMode,
    systemTheme,
    themeLabel: THEME_LABELS[theme],
    themeModeLabel: THEME_LABELS[themeMode],
    systemThemeLabel: THEME_LABELS[systemTheme],
  };
}

function getInitialThemeState() {
  try {
    const app = getApp();
    if (app && typeof app.getThemeState === 'function') {
      return app.getThemeState();
    }
  } catch (e) {
    // App 尚未初始化时直接读取本地主题。
  }
  return getFallbackThemeState();
}

function syncPageTheme(page) {
  if (!page || typeof page.setData !== 'function') return;
  let state = getFallbackThemeState();
  try {
    const app = getApp();
    if (app && typeof app.syncThemeToPage === 'function') {
      app.syncThemeToPage(page);
      return;
    }
  } catch (e) {
    // App 尚未初始化时使用兜底状态。
  }
  page.setData(state);
}

const _Page = Page;
Page = function (opts) {
  opts = opts || {};
  opts.data = Object.assign({}, opts.data || {}, getInitialThemeState());

  if (!opts.onShareAppMessage) {
    opts.onShareAppMessage = function () {
      return {
        title: '桌面冒险工具集',
        path: '/' + (this.route || 'pages/index/index'),
      };
    };
  }

  const originalOnLoad = opts.onLoad;
  opts.onLoad = function (query) {
    syncPageTheme(this);
    if (typeof originalOnLoad === 'function') {
      return originalOnLoad.call(this, query);
    }
  };

  const originalOnShow = opts.onShow;
  opts.onShow = function () {
    syncPageTheme(this);
    try {
      const app = getApp();
      if (app && typeof app.applyNavigationTheme === 'function') {
        app.applyNavigationTheme();
      }
    } catch (e) {
      // ignore
    }
    if (typeof originalOnShow === 'function') {
      return originalOnShow.call(this);
    }
  };

  return _Page(opts);
};

App({
  onLaunch() {
    this.initTheme();

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

  initTheme() {
    const themeMode = normalizeThemeMode(wx.getStorageSync(THEME_MODE_KEY));
    const systemTheme = getSystemTheme();
    const theme = themeMode === 'system' ? systemTheme : themeMode;

    this.globalData.themeMode = themeMode;
    this.globalData.systemTheme = systemTheme;
    this.globalData.theme = theme;
    this.watchSystemTheme();
    this.applyNavigationTheme();
  },

  watchSystemTheme() {
    if (this._watchingTheme || typeof wx.onThemeChange !== 'function') return;
    this._watchingTheme = true;
    wx.onThemeChange((res) => {
      const systemTheme = normalizeTheme(res && res.theme);
      this.globalData.systemTheme = systemTheme;
      if (this.globalData.themeMode === 'system') {
        this.updateTheme(systemTheme);
      } else {
        this.notifyThemeChanged();
      }
    });
  },

  getThemeState() {
    this.refreshSystemTheme();
    const theme = normalizeTheme(this.globalData.theme);
    const themeMode = normalizeThemeMode(this.globalData.themeMode);
    const systemTheme = normalizeTheme(this.globalData.systemTheme);
    return {
      theme,
      themeMode,
      systemTheme,
      themeLabel: THEME_LABELS[theme],
      themeModeLabel: THEME_LABELS[themeMode],
      systemThemeLabel: THEME_LABELS[systemTheme],
    };
  },

  refreshSystemTheme() {
    const systemTheme = getSystemTheme();
    this.globalData.systemTheme = systemTheme;
    if (this.globalData.themeMode === 'system') {
      this.globalData.theme = systemTheme;
    }
  },

  setThemeMode(mode) {
    const themeMode = normalizeThemeMode(mode);
    const systemTheme = getSystemTheme();
    const theme = themeMode === 'system' ? systemTheme : themeMode;

    wx.setStorageSync(THEME_MODE_KEY, themeMode);
    this.globalData.themeMode = themeMode;
    this.globalData.systemTheme = systemTheme;
    this.updateTheme(theme);
  },

  updateTheme(theme) {
    this.globalData.theme = normalizeTheme(theme);
    this.applyNavigationTheme();
    this.notifyThemeChanged();
  },

  syncThemeToPage(page) {
    if (!page || typeof page.setData !== 'function') return;
    const state = this.getThemeState();
    const data = page.data || {};
    if (
      data.theme === state.theme &&
      data.themeMode === state.themeMode &&
      data.systemTheme === state.systemTheme
    ) {
      return;
    }
    page.setData(state);
  },

  notifyThemeChanged() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    pages.forEach((page) => this.syncThemeToPage(page));
  },

  applyNavigationTheme() {
    const isDark = normalizeTheme(this.globalData.theme) === 'dark';
    const backgroundColor = isDark ? '#111827' : '#f6f2ea';
    const frontColor = isDark ? '#ffffff' : '#000000';

    try {
      if (typeof wx.setNavigationBarColor === 'function') {
        wx.setNavigationBarColor({
          frontColor,
          backgroundColor,
          animation: {
            duration: 150,
            timingFunc: 'easeIn',
          },
        });
      }
      if (typeof wx.setBackgroundColor === 'function') {
        wx.setBackgroundColor({
          backgroundColor,
          backgroundColorTop: backgroundColor,
          backgroundColorBottom: backgroundColor,
        });
      }
    } catch (e) {
      // 部分基础库或开发工具场景可能不支持，主题 class 仍会生效。
    }
  },

  globalData: {
    userInfo: null,
    themeMode: DEFAULT_THEME_MODE,
    theme: 'light',
    systemTheme: 'light',
  }
})
