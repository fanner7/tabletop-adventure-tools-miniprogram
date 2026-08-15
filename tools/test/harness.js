// tools/test/harness.js — 共享测试框架：wx mock + Page 桩 + 页面实例化
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');

// ---------- wx mock（含独立 storage） ----------
function createContext() {
  const storage = {};
  const wx = {
    getStorageSync: k => (k in storage ? storage[k] : ''),
    setStorageSync: (k, v) => { storage[k] = JSON.parse(JSON.stringify(v)); },
    removeStorageSync: k => { delete storage[k]; },
    showToast: () => {},
    showModal: (o) => { if (o && o.success) o.success({ confirm: true }); },
    showLoading: () => {}, hideLoading: () => {},
    getClipboardData: () => {}, setClipboardData: () => {},
    previewImage: () => {},
    createSelectorQuery: () => ({ select: () => ({ fields: () => ({ exec: (cb) => cb([]) }) }) }),
    canvasToTempFilePath: () => {},
    getWindowInfo: () => ({ pixelRatio: 2, windowWidth: 375, windowHeight: 667 }),
    navigateBack: () => {},
    showActionSheet: () => {},
  };
  global.wx = wx;
  return { wx, storage };
}

// ---------- 加载页面模块（捕获 Page 配置） ----------
function loadPage(relFile) {
  const full = path.join(ROOT, relFile);
  let captured = null;
  const oldPage = global.Page;
  global.Page = (cfg) => { captured = cfg; };
  delete require.cache[require.resolve(full)];
  require(full);
  global.Page = oldPage;
  if (!captured) throw new Error('Page() 未捕获: ' + relFile);
  return captured;
}

// ---------- 页面实例（深拷贝 data + 路径 setData） ----------
function makePage(captured) {
  const page = Object.create(captured);
  page.data = JSON.parse(JSON.stringify(captured.data));
  page.setData = function (patch, cb) {
    for (const k of Object.keys(patch)) {
      const segs = k.replace(/\[(\d+)\]/g, '.$1').split('.');
      let t = this.data;
      for (let i = 0; i < segs.length - 1; i++) {
        const s = segs[i];
        if (t[s] === undefined || t[s] === null) t[s] = {};
        t = t[s];
      }
      t[segs[segs.length - 1]] = patch[k];
    }
    if (cb) cb();
  };
  return page;
}

// ---------- 简单断言收集器 ----------
function makeSuite(name) {
  let failures = 0;
  const ok = (cond, label) => {
    if (cond) console.log('  ✓ ' + label);
    else { failures++; console.error('  ✗ ' + label); }
  };
  const fail = (label) => { failures++; console.error('  ✗ ' + label); };
  return {
    ok, fail,
    done: () => {
      if (failures === 0) console.log('PASS ' + name);
      else console.error('FAIL ' + name + '（' + failures + ' 处）');
      return failures;
    },
  };
}

// ---------- WXML 工具 ----------
function readWxml(relFile) {
  return fs.readFileSync(path.join(ROOT, relFile), 'utf8');
}
function extractHandlers(wxml) {
  const re = /(?:bind|catch)(?:tap|input|change|longpress|confirm|blur|focus|touchstart|touchmove|submit)="([A-Za-z_][A-Za-z0-9_]*)"/g;
  const set = new Set();
  let m;
  while ((m = re.exec(wxml))) set.add(m[1]);
  return set;
}
function checkTagBalance(wxml) {
  const tags = ['view', 'text', 'block', 'scroll-view', 'button', 'input', 'picker', 'swiper', 'image'];
  for (const tag of tags) {
    // (?![a-zA-Z-]) 防止 <text 误匹配 <textarea、<swiper 误匹配 <swiper-item 等
    const open = (wxml.match(new RegExp('<' + tag + '(?![a-zA-Z-])', 'g')) || []).length;
    const selfClose = (wxml.match(new RegExp('<' + tag + '(?![a-zA-Z-])[^>]*/>', 'g')) || []).length;
    const close = (wxml.match(new RegExp('</' + tag + '(?![a-zA-Z-])>', 'g')) || []).length;
    if (open - selfClose !== close) return { tag, open, close, selfClose };
  }
  return null;
}

// ---------- 常用造卡工具 ----------
function setFullAttrs(page, vals) {
  const v = vals || { str: 55, con: 60, dex: 50, app: 45, pow: 65, siz: 55, int: 60, edu: 70, luck: 40 };
  page.data.attrValues = v;
  page.data.rolled = { str: true, con: true, dex: true, app: true, pow: true, siz: true, int: true, edu: true, luck: true };
  page.data.rolledCount = 9;
  page.data.allRolled = true;
  return v;
}

module.exports = { ROOT, createContext, loadPage, makePage, makeSuite, readWxml, extractHandlers, checkTagBalance, setFullAttrs };
