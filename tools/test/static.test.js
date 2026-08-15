// tools/test/static.test.js — 静态检查：全部页面模块可加载、WXML handler 引用完整、标签平衡
const fs = require('fs');
const path = require('path');
const H = require('./harness');

const PAGE_DIRS = fs.readdirSync(path.join(H.ROOT, 'pages'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

module.exports.run = function () {
  console.log('== 静态检查 ==');
  const suite = H.makeSuite('static');
  const { ok, fail } = suite;

  // ---------- 全部页面/数据 JS 可加载（等价 node --check + require 冒烟） ----------
  {
    let bad = [];
    const allJs = [];
    for (const dir of PAGE_DIRS) {
      const dirPath = path.join(H.ROOT, 'pages', dir);
      for (const f of fs.readdirSync(dirPath, { recursive: true })) {
        if (String(f).endsWith('.js')) allJs.push(path.join(dirPath, String(f)));
      }
    }
    for (const file of allJs) {
      const rel = path.relative(H.ROOT, file).replace(/\\/g, '/');
      try {
        const isPage = fs.readdirSync(path.dirname(file)).some(f => f.endsWith('.wxml')) && !path.basename(file).startsWith('data');
        if (isPage) {
          H.loadPage(rel);
        } else {
          delete require.cache[require.resolve(file)];
          require(file);
        }
      } catch (e) {
        bad.push(rel + ': ' + e.message);
      }
    }
    ok(bad.length === 0, '全部 ' + allJs.length + ' 个 JS 文件可加载' + (bad.length ? '（' + bad.slice(0, 3).join('；') + '）' : ''));
  }

  // ---------- 每个页面的 WXML handler 引用 + 标签平衡 ----------
  {
    let badHandlers = [], badTags = [];
    for (const dir of PAGE_DIRS) {
      const wxmlFile = path.join(H.ROOT, 'pages', dir, dir + '.wxml');
      const jsFile = path.join(H.ROOT, 'pages', dir, dir + '.js');
      if (!fs.existsSync(wxmlFile) || !fs.existsSync(jsFile)) continue;
      const wxml = H.readWxml('pages/' + dir + '/' + dir + '.wxml');
      const handlers = H.extractHandlers(wxml);
      const captured = H.loadPage('pages/' + dir + '/' + dir + '.js');
      const missing = [...handlers].filter(h => typeof captured[h] !== 'function');
      if (missing.length) badHandlers.push(dir + ': ' + missing.join(', '));
      const unbal = H.checkTagBalance(wxml);
      if (unbal) badTags.push(dir + ': <' + unbal.tag + '> 开 ' + (unbal.open - unbal.selfClose) + ' / 闭 ' + unbal.close);
    }
    ok(badHandlers.length === 0, '全部页面 WXML handler 引用完整' + (badHandlers.length ? '（' + badHandlers[0] + '）' : ''));
    ok(badTags.length === 0, '全部页面 WXML 标签平衡' + (badTags.length ? '（' + badTags[0] + '）' : ''));
  }

  return suite.done();
};
