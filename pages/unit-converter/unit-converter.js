// pages/unit-converter/unit-converter.js — 英制（美制）→ 公制 快捷换算
//
// 设计目标：带团时从模组里看到一个英制数字，立刻知道公制是多少。
// 核心思路：输入一个数字，同时列出所有常见英制单位的换算结果，
// 不做"选择单位"的二级操作，减少切换。

// 换算系数：以"1 单位 = factor 公制基本单位"
// 长度以米(m)为基准；重量以千克(kg)；温度单独处理（非线性）。
const CONVERSIONS = [
  {
    group: '长度 / 距离',
    units: [
      { from: '英寸',    en: 'inch / in',   to: '厘米',  factor: 2.54,        decimals: 1 },
      { from: '英尺',    en: 'foot / ft',   to: '米',    factor: 0.3048,      decimals: 2 },
      { from: '码',      en: 'yard / yd',   to: '米',    factor: 0.9144,      decimals: 2 },
      { from: '英里',    en: 'mile / mi',   to: '公里',  factor: 1.609344,    decimals: 2 },
      { from: '海里',    en: 'nautical mi', to: '公里',  factor: 1.852,       decimals: 2 },
    ],
  },
  {
    group: '面积',
    units: [
      { from: '平方英尺', en: 'sq ft',       to: '平方米', factor: 0.09290304, decimals: 2 },
      { from: '平方码',   en: 'sq yd',       to: '平方米', factor: 0.83612736, decimals: 2 },
      { from: '英亩',     en: 'acre',        to: '平方米', factor: 4046.8564224, decimals: 0 },
    ],
  },
  {
    group: '体积 / 容积',
    units: [
      { from: '液盎司(美)', en: 'fl oz (US)', to: '毫升',   factor: 29.5735295625, decimals: 0 },
      { from: '杯',         en: 'cup (US)',   to: '毫升',   factor: 236.5882365,   decimals: 0 },
      { from: '品脱(美)',   en: 'pint (US)',  to: '毫升',   factor: 473.176473,    decimals: 0 },
      { from: '夸脱(美)',   en: 'quart (US)', to: '升',     factor: 0.946352946,   decimals: 2 },
      { from: '加仑(美)',   en: 'gallon (US)', to: '升',    factor: 3.785411784,   decimals: 2 },
      { from: '立方英尺',   en: 'cu ft',      to: '立方米', factor: 0.028316846592, decimals: 3 },
    ],
  },
  {
    group: '重量 / 质量',
    units: [
      { from: '盎司',    en: 'ounce / oz', to: '克',     factor: 28.349523125, decimals: 0 },
      { from: '磅',      en: 'pound / lb', to: '千克',   factor: 0.45359237,   decimals: 2 },
      { from: '英石',    en: 'stone',      to: '千克',   factor: 6.35029318,   decimals: 1 },
      { from: '短吨',    en: 'ton (US)',   to: '吨',     factor: 0.90718474,   decimals: 2 },
    ],
  },
  {
    group: '温度',
    units: [
      { from: '华氏度',  en: '°F',         to: '摄氏度', kind: 'temp', decimals: 1 },
    ],
  },
];

function fmt(n, decimals) {
  if (!isFinite(n)) return '—';
  const fixed = Number(n).toFixed(decimals);
  // 去掉多余的尾零和小数点
  if (decimals > 0) {
    return fixed.replace(/\.?0+$/, '');
  }
  return fixed;
}

// 华氏 → 摄氏
function f2c(f) {
  return (f - 32) * 5 / 9;
}

const STORAGE_KEY_COLLAPSED = 'unit_conv_collapsed';
const STORAGE_KEY_SELECTED = 'unit_conv_selected';

function loadMap(key) {
  try {
    const v = wx.getStorageSync(key);
    return v && typeof v === 'object' ? v : {};
  } catch (e) {
    return {};
  }
}

function saveMap(key, map) {
  try {
    wx.setStorageSync(key, map);
  } catch (e) { /* ignore */ }
}

Page({
  data: {
    value: '',            // 输入框原始字符串
    rows: [],             // 渲染用分组
    keyword: '',          // 过滤关键字
    collapsed: {},        // { groupName: true } 折叠状态
    selected: {},         // { unitId: true } 专注标记状态
  },

  onLoad() {
    const collapsed = loadMap(STORAGE_KEY_COLLAPSED);
    const selected = loadMap(STORAGE_KEY_SELECTED);
    this.setData({ collapsed, selected });
    this.applyWindowBg();
    this.buildRows('', '', collapsed, selected);
  },

  onShow() {
    this.applyWindowBg();
  },

  // 让页面下拉/上拉回弹的原生背景跟随主题，避免出现黑边
  applyWindowBg() {
    const isDark = this.data.theme === 'dark';
    try {
      if (typeof wx.setBackgroundColor === 'function') {
        const color = isDark ? '#111827' : '#f6f2ea';
        wx.setBackgroundColor({
          backgroundColor: color,
          backgroundColorTop: color,
          backgroundColorBottom: color,
        });
      }
    } catch (e) { /* ignore */ }
  },

  onInput(e) {
    const v = e.detail.value;
    this.setData({ value: v });
    this.buildRows(v, this.data.keyword, this.data.collapsed, this.data.selected);
  },

  onKeyword(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    this.buildRows(this.data.value, keyword, this.data.collapsed, this.data.selected);
  },

  onClear() {
    this.setData({ value: '' });
    this.buildRows('', this.data.keyword, this.data.collapsed, this.data.selected);
  },

  // 切换分组折叠
  onToggleGroup(e) {
    const group = e.currentTarget.dataset.group;
    const collapsed = { ...this.data.collapsed };
    collapsed[group] = !collapsed[group];
    this.setData({ collapsed });
    saveMap(STORAGE_KEY_COLLAPSED, collapsed);
    this.buildRows(this.data.value, this.data.keyword, collapsed, this.data.selected);
  },

  // 点击单位行：切换"专注标记"选中态（再次点击取消，与输入的数字无关）
  onToggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const selected = { ...this.data.selected };
    if (selected[id]) {
      delete selected[id];
    } else {
      selected[id] = true;
    }
    this.setData({ selected });
    saveMap(STORAGE_KEY_SELECTED, selected);
    this.buildRows(this.data.value, this.data.keyword, this.data.collapsed, selected);
  },

  buildRows(v, keyword, collapsed, selected) {
    const num = parseFloat(v);
    const valid = !isNaN(num) && v.trim() !== '';
    const filtering = !!keyword;
    const kw = String(keyword).toLowerCase();

    const groups = CONVERSIONS.map(g => {
      const units = g.units.map(u => {
        let numText = '';
        if (valid) {
          if (u.kind === 'temp') {
            numText = fmt(f2c(num), u.decimals);
          } else {
            numText = fmt(num * u.factor, u.decimals);
          }
        }
        const hay = (u.from + ' ' + u.en + ' ' + u.to).toLowerCase();
        const match = !filtering || hay.indexOf(kw) >= 0;
        return {
          id: u.from,
          from: u.from,
          en: u.en,
          to: u.to,
          inputText: valid ? v + ' ' + u.from : u.from,
          numText,
          selected: !!selected[u.from],
          match,
        };
      }).filter(u => u.match);
      return {
        group: g.group,
        collapsed: filtering ? false : !!collapsed[g.group],
        units,
      };
    }).filter(g => g.units.length > 0);

    this.setData({ rows: groups });
  },
});
