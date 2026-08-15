// pages/coc-keeper/coc-keeper.js — COC 守密人助手
const STORAGE_KEY = 'coc_keeper_tasks';

// ========== 桌面端大屏布局 ==========
// 宽屏判定阈值（CSS px）：桌面平台且窗口不小于该尺寸时自动进入"全屏布局"
var LAYOUT_STORAGE_KEY = 'coc_keeper_layout';
var WIDE_MIN_WIDTH = 720;
var WIDE_MIN_HEIGHT = 500;
// 手动强制全屏时的最小可用宽度（低于则回落窄条布局）
var WIDE_FORCE_MIN_WIDTH = 560;
// 宽屏布局的模块 id 与默认顺序：所有模块（调查员/NPC/工具）都是内容自伸缩的
// 自由面板，在瀑布流中按此顺序排布，可拖拽换位、折叠
var DESK_TOOL_IDS = ['players', 'npcs', 'clues', 'notes', 'ai', 'combat', 'dice', 'madness', 'random', 'lexicon', 'rules', 'export'];

// ========== 静态数据表（拆分至 data/ 目录，保持原变量名引用） ==========
var MADNESS_DATA = require('./data/madness');
var IMMEDIATE_SYMPTOMS = MADNESS_DATA.IMMEDIATE_SYMPTOMS;
var SUMMARY_SYMPTOMS = MADNESS_DATA.SUMMARY_SYMPTOMS;
var PHOBIAS = MADNESS_DATA.PHOBIAS;
var MANIAS = MADNESS_DATA.MANIAS;

var NPC_DATA = require('./data/npc-templates');
var NPC_TEMPLATES = NPC_DATA.NPC_TEMPLATES;
var NPC_TEMPLATE_CATS = NPC_DATA.NPC_TEMPLATE_CATS;
var NPC_TEMPLATES_BY_CAT = NPC_DATA.NPC_TEMPLATES_BY_CAT;
var NPC_SAMPLE_TEXT = NPC_DATA.NPC_SAMPLE_TEXT;

var LEXICON_DATA = require('./data/lexicon');
var KEEPERS_LEXICON = LEXICON_DATA.KEEPERS_LEXICON;
var KEEPERS_LEXICON_CATS = LEXICON_DATA.KEEPERS_LEXICON_CATS;

var RANDOM_DATA = require('./data/random');
var RANDOM_SURNAMES_CN = RANDOM_DATA.RANDOM_SURNAMES_CN;
var RANDOM_GIVEN_CN = RANDOM_DATA.RANDOM_GIVEN_CN;
var RANDOM_FIRST_WEST_M = RANDOM_DATA.RANDOM_FIRST_WEST_M;
var RANDOM_FIRST_WEST_F = RANDOM_DATA.RANDOM_FIRST_WEST_F;
var RANDOM_LAST_WEST = RANDOM_DATA.RANDOM_LAST_WEST;
var RANDOM_JOBS = RANDOM_DATA.RANDOM_JOBS;
var RANDOM_CLUES = RANDOM_DATA.RANDOM_CLUES;
var RANDOM_ITEMS = RANDOM_DATA.RANDOM_ITEMS;
var RANDOM_TRAITS = RANDOM_DATA.RANDOM_TRAITS;

var RULES_DATA = require('./data/rules');
var RULES_SECTIONS = RULES_DATA.RULES_SECTIONS;

var AI_PREP_DATA = require('./data/ai-prep');
var AI_NPC_PROMPT = AI_PREP_DATA.AI_NPC_PROMPT;
var AI_CLUE_PROMPT = AI_PREP_DATA.AI_CLUE_PROMPT;
var AI_NOTE_PROMPT = AI_PREP_DATA.AI_NOTE_PROMPT;
var AI_CLUE_SAMPLE = AI_PREP_DATA.AI_CLUE_SAMPLE;
var AI_NOTE_SAMPLE = AI_PREP_DATA.AI_NOTE_SAMPLE;

// ========== 掷骰工具 ==========
function rollD10() { return Math.floor(Math.random() * 10) + 1; }
function rollD100() { return Math.floor(Math.random() * 100) + 1; }

// COC 7 版伤害加值 / 体格（按 STR+SIZ 查表）
function dbOf(strSiz) {
  if (strSiz >= 2 && strSiz <= 64) return { db: '-2', build: '-2' };
  if (strSiz <= 84) return { db: '-1', build: '-1' };
  if (strSiz <= 124) return { db: '+0', build: '0' };
  if (strSiz <= 164) return { db: '+1D4', build: '1' };
  if (strSiz <= 204) return { db: '+1D6', build: '2' };
  return { db: '+2D6', build: '3' };
}

// 从数据文本提取护甲（如「护甲 1（皮肤）」「护甲 无（免疫普通武器）」「护甲 0」）
function extractArmor(text) {
  var m = (text || '').match(/护甲\s*([0-9零无]+(?:\s*[（(][^)）]*[)）])?)/);
  return m ? m[1].trim() : '';
}

Page({
  data: {
    // --- 任务 ---
    tasks: [],
    filteredTasks: [],
    taskSearch: '',
    flashKey: '',
    currentTaskId: null,
    currentTask: null,
    viewingType: '',
    viewingData: null,
    viewingIndex: -1,
    detailScrollTop: 0,
    showCreateTask: false,
    createTaskName: '',
    showCombatDialog: false,
    combatOrder: [],
    combatHasTies: false,
    combatTieNames: '',
    combatCurrent: -1,
    showNpcDetail: false,
    npcDetail: null,
    showMadnessDialog: false,

    // --- NPC 编辑 ---
    showEditNPC: false,
    editNpcIndex: -1,
    editNpcName: '',
    editNpcDex: '',
    editNpcDb: '',
    editNpcArmor: '',
    editNpcHp: '',
    editNpcMp: '',
    editNpcAttack: '',
    editNpcData: '',

    // --- 手动新建调查员 ---
    showNewPlayer: false,
    newPlayerName: '',
    newPlayerOcc: '',
    newPlayerHp: '',
    newPlayerSan: '',
    newPlayerMp: '',
    newPlayerLuck: '',
    newPlayerDex: '',

    // --- 导入弹窗 ---
    showImportNpcDialog: false,
    showImportPlayerDialog: false,
    npcSampleText: NPC_SAMPLE_TEXT,

    // --- 疯狂发作 ---
    madnessType: 'immediate',
    madnessSteps: [],
    madnessStep: 0,
    madnessResult: null,
    madnessResultParts: [],
    madnessRolling: false,
    showMadnessSteps: false,

    // --- 掷骰 ---
    showDiceDialog: false,
    diceSelected: {},
    diceRolling: false,
    diceResult: null,
    diceHistory: [],
    dice100Mode: 'normal', // normal | bonus1 | bonus2 | penalty1 | penalty2

    // --- NPC 模板库 ---
    showNpcTemplates: false,
    npcTemplateCats: NPC_TEMPLATE_CATS,
    npcTemplatesByCat: NPC_TEMPLATES_BY_CAT,
    tplCat: 'urban',

    // --- 随机生成器 ---
    showRandomDialog: false,
    randomResult: null,
    randomNpc: null,

    // --- 词汇表 ---
    showLexiconDialog: false,
    lexiconCats: KEEPERS_LEXICON_CATS,
    lexiconByCat: KEEPERS_LEXICON,
    lexiconCat: 'atm',

    // --- 任务导入导出 ---
    showExportTaskDialog: false,

    // --- 检定助手 ---
    showCheckDialog: false,
    checkTitle: '',
    checkTotal: 50,
    checkMode: 'normal',
    checkDice: null,
    checkLevel: null,
    checkRolling: false,
    checkAttack: '',
    checkDb: '',
    checkDamage: null,

    // --- 桌面端大屏布局 ---
    layoutMode: 'auto',          // auto | wide | narrow
    isDesktopPlatform: false,    // windows / mac / devtools
    isWide: false,               // 当前是否渲染全屏布局
    winWidth: 375,
    winHeight: 667,
    deskToolOrder: DESK_TOOL_IDS.slice(),
    deskToolPos: {},             // id -> 顺序索引（模块 CSS order）
    deskToolCollapsed: {},       // id -> 是否折叠
    deskDragY: 0,                // 拖拽模块的实时位移（px）
    deskDragX: 0,
    deskDragId: '',              // 正在拖拽的模块 id
    // 瀑布流布局：模块绝对定位贴紧排布（引擎计算）
    deskModTop: {},              // id -> 顶部偏移 px
    deskModLeft: {},             // id -> 左侧偏移 px
    deskModW: 300,               // 模块宽度 px
    deskGridH: 0,                // 工作台总高度 px
    deskReady: false,            // 首次排布完成前隐藏模块，避免闪烁
    deskTopInsetRpx: 0,          // PC 端顶部补偿（rpx，随窗口宽度等比；可手动微调）
    statusBarH: 0,               // 系统报告的顶部栏高度（诊断用）
    vpW: 0,                      // selectViewport 实测视口宽（诊断用）
    vpH: 0,                      // selectViewport 实测视口高（诊断用）

    // --- 线索表 ---
    showCluesDialog: false,
    clueInput: '',
    clueSource: '',
    clueLocInput: '',
    clueSearch: '',
    clueLocFilter: '',
    clueLocs: [],
    clueBackupCount: 0,
    clueFiltered: [],
    showClueLocEdit: false,
    editClueLocId: null,
    clueLocEditValue: '',

    // --- 团务笔记 ---
    showNotesDialog: false,
    showNoteEdit: false,
    editNoteId: null,
    noteTitle: '',
    noteContent: '',

    // --- 规则速查 ---
    showRulesDialog: false,
    rulesSections: RULES_SECTIONS,
    rulesCat: 'check',
    rulesItems: RULES_SECTIONS[0].items,
    rulesTable: RULES_SECTIONS[0].table || [],

    // --- AI 备团 ---
    showAiDialog: false,
    aiImportText: '',

    // --- 战斗轮增强 ---
    combatRound: 0,
    combatDmgNum: '',
  },

  _lastDiceLongpress: 0,

  onLoad() {
    this._initLayout();
    this.loadTasks();
  },
  onShow() { this.loadTasks(); },

  // ==================== 桌面端大屏布局 ====================
  // 窗口尺寸变化（PC 拉伸/最大化、平板旋转）时实时响应
  onResize(res) {
    var size = (res && res.size) || {};
    var w = size.windowWidth, h = size.windowHeight;
    if (!w) {
      try {
        var info = wx.getWindowInfo();
        w = info.windowWidth; h = info.windowHeight;
      } catch (e) { /* 旧基础库回退 */ }
    }
    if (!w) return;
    this.setData({ winWidth: w, winHeight: h });
    this._applyLayout();
    this._measureViewport();
  },

  onReady() {
    this._measureViewport();
    this._scheduleLayoutDesk();
  },

  _readWindowInfo() {
    var info = { windowWidth: 375, windowHeight: 667, statusBarHeight: 0 };
    try { info = wx.getWindowInfo(); }
    catch (e) { try { info = wx.getSystemInfoSync(); } catch (e2) { /* ignore */ } }
    return info;
  },

  _readPlatform() {
    var platform = '';
    try { platform = (wx.getDeviceInfo() || {}).platform; }
    catch (e) { try { platform = (wx.getSystemInfoSync() || {}).platform; } catch (e2) { /* ignore */ } }
    return platform || '';
  },

  _initLayout() {
    this._wrapSetData();
    var info = this._readWindowInfo();
    var platform = this._readPlatform();
    var saved = {};
    try { saved = wx.getStorageSync(LAYOUT_STORAGE_KEY) || {}; } catch (e) { saved = {}; }

    var order = Array.isArray(saved.toolOrder) ? saved.toolOrder.filter(function (id) {
      return DESK_TOOL_IDS.indexOf(id) > -1;
    }) : [];
    if (order.length !== DESK_TOOL_IDS.length) order = DESK_TOOL_IDS.slice();
    var collapsed = (saved.collapsed && typeof saved.collapsed === 'object') ? saved.collapsed : {};
    var mode = (saved.mode === 'wide' || saved.mode === 'narrow') ? saved.mode : 'auto';
    var statusBarH = info.statusBarHeight || 0;
    var isPC = platform === 'windows' || platform === 'mac';
    // 顶部补偿：PC 端 statusBarHeight 恒为 0（微信不报告窗口装饰高度），无法自动检测，
    // 由用户通过「顶+ / 顶−」一次性微调并记忆；rpx 单位随窗口宽度等比，各尺寸下保持一致。
    var inset = (typeof saved.topInset === 'number' && saved.topInset >= 0 && saved.topInset <= 240) ? saved.topInset : 0;

    this.setData({
      isDesktopPlatform: isPC || platform === 'devtools',
      winWidth: info.windowWidth || 375,
      winHeight: info.windowHeight || 667,
      statusBarH: statusBarH,
      layoutMode: mode,
      deskToolOrder: order,
      deskToolCollapsed: collapsed,
      deskTopInsetRpx: inset
    });
    this._applyLayout();
  },

  // 包装 setData：宽屏工作台内容变化后自动重排瀑布流（纯布局字段不触发）
  _wrapSetData() {
    if (this._setDataWrapped) return;
    this._setDataWrapped = true;
    var that = this;
    var orig = this.setData;
    this.setData = function (data, cb) {
      var result = orig.call(this, data, cb);
      var contentChanged = Object.keys(data || {}).some(function (k) {
        return k.indexOf('desk') !== 0 && k !== 'flashKey' && k !== 'vpW' && k !== 'vpH';
      });
      if (contentChanged && that.data.isWide && that.data.currentTask && !that.data.viewingType) {
        that._scheduleLayoutDesk();
      }
      return result;
    };
  },

  // ==================== 瀑布流布局引擎 ====================
  _scheduleLayoutDesk() {
    var that = this;
    if (this._layoutTimer) clearTimeout(this._layoutTimer);
    this._layoutTimer = setTimeout(function () { that._layoutDesk(); }, 150);
  },

  // 测量各模块真实高度 → 按最短列贪心分配 → 绝对定位贴紧排布
  _layoutDesk() {
    if (!this.data.isWide || !this.data.currentTask || this.data.viewingType) return;
    var that = this;
    var q = wx.createSelectorQuery();
    var heights = {};
    var gridRect = null;
    q.select('.desk-grid').boundingClientRect(function (r) { gridRect = r; });
    DESK_TOOL_IDS.forEach(function (tid) {
      q.select('#desk-panel-' + tid).boundingClientRect(function (r) {
        if (r && r.height) heights[tid] = r.height;
      });
    });
    q.exec(function () {
      if (!gridRect || !gridRect.width) { that._layoutRetry(); return; }
      if (Object.keys(heights).length < DESK_TOOL_IDS.length) { that._layoutRetry(); return; }
      that._layoutRetries = 0;
      that._deskHeights = heights;
      that._deskGridW = gridRect.width;
      that._distributeDesk();
    });
  },

  _layoutRetry() {
    this._layoutRetries = (this._layoutRetries || 0) + 1;
    if (this._layoutRetries <= 4) this._scheduleLayoutDesk();
  },

  _distributeDesk(order, dragOverride) {
    order = order || this.data.deskToolOrder;
    var gap = 12, minW = 300;
    var gridW = this._deskGridW || (this.data.winWidth - 28);
    var n = Math.max(1, Math.floor((gridW + gap) / (minW + gap)));
    var colW = Math.floor((gridW - gap * (n - 1)) / n);
    var heights = this._deskHeights || {};
    var tops = [];
    for (var i = 0; i < n; i++) tops.push(0);
    var lefts = {}, topsOut = {};
    order.forEach(function (id) {
      var col = 0;
      for (var i = 1; i < n; i++) if (tops[i] < tops[col] - 0.5) col = i;
      if (dragOverride && dragOverride.id === id) {
        // 被拖模块：视觉位置锁定在拖拽起点（transform 跟随光标），布局仍按顺序占用槽位
        lefts[id] = Math.round(dragOverride.left);
        topsOut[id] = Math.round(dragOverride.top);
      } else {
        lefts[id] = Math.round(col * (colW + gap));
        topsOut[id] = Math.round(tops[col]);
      }
      tops[col] += (heights[id] || 40) + gap;
    });
    var gridH = 0;
    tops.forEach(function (t) { if (t > gridH) gridH = t; });
    var colWChanged = this._deskColWPrev !== undefined && Math.abs(this._deskColWPrev - colW) > 20;
    this._deskColWPrev = colW;
    this.setData({
      deskModTop: topsOut, deskModLeft: lefts, deskModW: colW,
      deskGridH: Math.round(gridH), deskReady: true
    });
    // 列宽变化（首次布局/窗口拉伸）会让内容换行高度改变，再测一轮收敛
    if (colWChanged) this._scheduleLayoutDesk();
  },

  // 根据平台 + 窗口尺寸 + 用户手动选择，计算当前是否使用全屏布局
  _applyLayout() {
    var mode = this.data.layoutMode;
    var wide;
    if (mode === 'wide') {
      wide = this.data.isDesktopPlatform && this.data.winWidth >= WIDE_FORCE_MIN_WIDTH;
    } else if (mode === 'narrow') {
      wide = false;
    } else {
      wide = this.data.isDesktopPlatform &&
        this.data.winWidth >= WIDE_MIN_WIDTH &&
        this.data.winHeight >= WIDE_MIN_HEIGHT;
    }
    var pos = {};
    this.data.deskToolOrder.forEach(function (id, i) { pos[id] = i; });
    this.setData({ isWide: wide, deskToolPos: pos });
    // 全屏布局下工具面板常驻，进入任务时自动刷新战斗轮
    if (wide && this.data.currentTask) this.refreshCombatOrder(false);
  },

  _persistLayout() {
    try {
      wx.setStorageSync(LAYOUT_STORAGE_KEY, {
        mode: this.data.layoutMode,
        toolOrder: this.data.deskToolOrder,
        collapsed: this.data.deskToolCollapsed,
        topInset: this.data.deskTopInsetRpx
      });
    } catch (e) { /* 存储失败不影响使用 */ }
  },

  // PC 端顶部补偿微调（rpx：随窗口宽度等比缩放，保证任何窗口大小下补偿一致）
  adjustTopInset(e) {
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    var v = Math.max(0, Math.min(240, this.data.deskTopInsetRpx + delta));
    if (v === this.data.deskTopInsetRpx) return;
    this.setData({ deskTopInsetRpx: v });
    this._persistLayout();
  },

  // 实测页面视口（selectViewport），与 JS 报告的窗口尺寸对比，用于诊断 PC 端视口偏差
  _measureViewport() {
    var that = this;
    try {
      wx.createSelectorQuery().selectViewport().boundingClientRect(function (rect) {
        if (rect) that.setData({ vpW: Math.round(rect.width), vpH: Math.round(rect.height) });
      }).exec();
    } catch (e) { /* 不支持时忽略，仅诊断用途 */ }
  },

  onModeBtnTap(e) {
    var mode = e.currentTarget.dataset.mode;
    if (mode !== 'auto' && mode !== 'wide' && mode !== 'narrow') return;
    if (mode === 'wide' && this.data.winWidth < WIDE_FORCE_MIN_WIDTH) {
      wx.showToast({ title: '窗口太窄，全屏布局需要至少 ' + WIDE_FORCE_MIN_WIDTH + 'px 宽（可拉伸窗口）', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ layoutMode: mode });
    this._persistLayout();
    this._applyLayout();
    var label = mode === 'wide' ? '🖥 全屏布局' : mode === 'narrow' ? '📱 窄条布局' : '✨ 自动布局';
    wx.showToast({ title: label, icon: 'none', duration: 1200 });
  },

  resetDeskLayout() {
    this.setData({
      deskToolOrder: DESK_TOOL_IDS.slice(),
      deskToolCollapsed: {},
      deskTopInsetRpx: 0
    });
    this._persistLayout();
    this._applyLayout();
    wx.showToast({ title: '↺ 布局已重置', icon: 'none', duration: 1200 });
  },

  toggleToolPanel(e) {
    if (!this.data.isWide) return;
    // 刚结束拖拽时不响应点击
    if (this._lastToolDragEnd && Date.now() - this._lastToolDragEnd < 300) return;
    var id = e.currentTarget.dataset.id;
    var collapsed = Object.assign({}, this.data.deskToolCollapsed);
    collapsed[id] = !collapsed[id];
    this.setData({ deskToolCollapsed: collapsed });
    this._persistLayout();
    // 折叠/展开改变模块高度，重新排布瀑布流
    this._scheduleLayoutDesk();
  },

  // ---- 模块拖拽排序（按住 ⠿ 手柄在自适应网格中拖动换位） ----
  onToolDragStart(e) {
    if (!this.data.isWide) return;
    var id = e.currentTarget.dataset.id;
    var touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!touch) return;
    var that = this;
    var rects = {};
    // 按 id 逐个测量模块位置（DOM 顺序与显示顺序可能不同）
    var q = wx.createSelectorQuery();
    DESK_TOOL_IDS.forEach(function (tid) {
      q.select('#desk-panel-' + tid).boundingClientRect(function (r) {
        rects[tid] = r ? {
          left: r.left, top: r.top,
          midX: r.left + r.width / 2,
          midY: r.top + r.height / 2,
          height: r.height
        } : null;
      });
    });
    q.exec(function () {
      var myRect = rects[id];
      that._toolDrag = {
        id: id,
        startX: touch.clientX,
        startY: touch.clientY,
        startLeft: myRect ? myRect.left : 0,
        startTop: myRect ? myRect.top : 0,
        baseOrder: that.data.deskToolOrder.slice(),
        rects: rects
      };
      that.setData({ deskDragX: 0, deskDragY: 0, deskDragId: id });
    });
  },

  onToolDragMove(e) {
    var d = this._toolDrag;
    if (!d || !d.rects) return;
    var touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!touch) return;
    var dx = touch.clientX - d.startX;
    var dy = touch.clientY - d.startY;
    var px = touch.clientX, py = touch.clientY;
    // 二维网格插入位置：指针处于某模块上方/同一行左侧，则该模块排在被拖模块之前
    var others = d.baseOrder.filter(function (id) { return id !== d.id; });
    var insertAt = 0;
    others.forEach(function (oid) {
      var r = d.rects[oid];
      if (!r) return;
      var before = false;
      if (r.midY < py - r.height / 2) before = true;
      else if (Math.abs(r.midY - py) <= r.height / 2 && r.midX < px) before = true;
      if (before) insertAt++;
    });
    var newOrder = others.slice(0, insertAt).concat([d.id]).concat(others.slice(insertAt));
    var pos = {};
    newOrder.forEach(function (id, i) { pos[id] = i; });
    this.setData({ deskToolOrder: newOrder, deskToolPos: pos, deskDragX: dx, deskDragY: dy, deskDragId: d.id });
    // 拖拽过程中实时重排瀑布流：被拖模块位置基准锁定在起点（跟随光标），其余模块让位
    this._distributeDesk(newOrder, { id: d.id, left: d.startLeft, top: d.startTop });
  },

  onToolDragEnd() {
    var d = this._toolDrag;
    this._toolDrag = null;
    this._lastToolDragEnd = Date.now();
    if (d) this._persistLayout();
    this.setData({ deskDragX: 0, deskDragY: 0, deskDragId: '' });
    // 松手后按最终顺序落位（配合过渡动画平滑落入新槽位）
    this._distributeDesk();
  },

  // 生成唯一 id：Date.now() 在同一毫秒内会重复（批量导入时导致多条数据同 id，
  // 查找/勾选/删除全部错乱），加序号保证每条唯一
  _uid() {
    this._uidSeq = (this._uidSeq || 0) + 1;
    return Date.now() * 1000 + (this._uidSeq % 1000);
  },

  // ==================== 任务存储 ====================
  loadTasks() {
    var tasks = wx.getStorageSync(STORAGE_KEY) || [];
    this._enrichTasks(tasks);
    this.setData({ tasks: tasks });
    this._applyTaskFilter();
    if (this.data.currentTaskId) {
      var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
      if (task) this.setData({ currentTask: task });
      else this.setData({ currentTaskId: null, currentTask: null });
    }
    this._refreshClueView();
    if (this.data.isWide && this.data.currentTask) this.refreshCombatOrder(false);
  },

  saveTasks(tasks) {
    var that = this;
    var cur = null;
    // 标记当前任务的最后编辑时间（用于列表排序展示）
    if (this.data.currentTaskId) {
      cur = tasks.find(function (t) { return t.id === that.data.currentTaskId; });
      if (cur) cur.updatedAt = Date.now();
    }
    tasks.sort(function (a, b) { return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0); });
    this._enrichTasks(tasks);
    wx.setStorageSync(STORAGE_KEY, tasks);
    this.setData({ tasks: tasks });
    this._applyTaskFilter();
    // 任务对象多为"就地修改"（如切换可见性、HP/SAN 加减）：
    // setData 按引用比较，同引用会被视图层跳过，必须用浅拷贝的新引用回写
    // currentTask，让整棵任务子树的绑定重新渲染。
    if (cur) this.setData({ currentTask: Object.assign({}, cur) });
    this._refreshClueView();
    // 宽屏布局下战斗轮面板常驻，数据变化后保持同步
    if (this.data.isWide && this.data.currentTask) this.refreshCombatOrder(false);
  },

  // 任务列表数据补充：攻击显示文本 / 预览摘要 / 时间文案
  _enrichTasks(tasks) {
    var that = this;
    tasks.forEach(function (t) {
      t.timeText = that._fmtTime(t.updatedAt || t.createdAt);
      // 旧任务/导入任务补齐新字段（线索表 / 团务笔记）
      if (!Array.isArray(t.clues)) t.clues = [];
      if (!Array.isArray(t.notes)) t.notes = [];
      // 线索结构迁移：旧版 tag 字段 → location；旧版出处含「备用线索」→ 备用标记
      t.clues.forEach(function (c) {
        if (c.tag !== undefined) {
          if (!c.location) c.location = c.tag;
          delete c.tag;
        }
        if (!c.isBackup && (c.source === '备用线索' || c.location === '备用线索')) {
          c.isBackup = true;
          if (c.location === '备用线索') c.location = '';
          if (!c.source) c.source = '备用线索';
        }
      });
      (t.npcs || []).forEach(function (n) {
        n.attackDisplay = n.attack ? that._buildAttackDisplay(n.attack, n.data) : '';
        if (!n.armor) n.armor = extractArmor(n.data);
      });
    });
  },

  _fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var h = d.getHours(), m = d.getMinutes();
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },

  // 攻击显示文本：为没有百分比的攻击段补上技能值（如「斗殴 1D3+DB」→「斗殴 50% 1D3+DB」）
  _buildAttackDisplay(attack, data) {
    var skillsLine = (data || '').match(/(?:^|\n)\s*技能[：:]([^\n]*)/i);
    var skillsText = skillsLine ? skillsLine[1] : '';
    return attack.split('/').map(function (seg) {
      var s = seg.trim();
      if (/(\d+)%/.test(s)) return s;
      var name = s.split(/[\s\u3000]+/)[0].trim();
      var sm = skillsText.match(new RegExp(name + '\\s*(\\d+)%'));
      return sm ? name + ' ' + sm[1] + '% ' + s.slice(name.length).trim() : s;
    }).join(' / ');
  },

  _applyTaskFilter() {
    var q = (this.data.taskSearch || '').trim();
    var list = this.data.tasks;
    var filtered = q ? list.filter(function (t) { return t.name.indexOf(q) > -1; }) : list;
    this.setData({ filteredTasks: filtered });
  },

  // ==================== 任务管理 ====================
  createTask() {
    this.setData({ showCreateTask: true, createTaskName: '' });
  },

  closeCreateTask() {
    this.setData({ showCreateTask: false, createTaskName: '' });
  },

  onTaskNameInput(e) {
    this.setData({ createTaskName: e.detail.value });
  },

  confirmCreateTask() {
    var name = this.data.createTaskName.trim();
    if (!name) { wx.showToast({ title: '请输入任务名称', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = { id: this._uid(), name: name, createdAt: Date.now(), players: [], npcs: [] };
    tasks.unshift(task);
    this.saveTasks(tasks);
    this.selectTaskById(task.id);
    this.setData({ showCreateTask: false, createTaskName: '' });
  },

  selectTask(e) {
    this.selectTaskById(e.currentTarget.dataset.id);
  },

  selectTaskById(id) {
    var task = this.data.tasks.find(function (t) { return t.id === id; });
    if (task) {
      this._closeAllDialogs();
      this.setData({ currentTaskId: id, currentTask: task, viewingType: '', viewingData: null });
      this._refreshClueView();
      if (this.data.isWide) this.refreshCombatOrder(false);
    }
  },

  deleteTask(e) {
    var id = e.currentTarget.dataset.id;
    var task = this.data.tasks.find(function (t) { return t.id === id; });
    var that = this;
    wx.showModal({
      title: '删除任务',
      content: '确定删除「' + (task ? task.name : '') + '」及其所有数据吗？',
      success: function (res) {
        if (!res.confirm) return;
        var tasks = that.data.tasks.filter(function (t) { return t.id !== id; });
        that.saveTasks(tasks);
        if (that.data.currentTaskId === id) {
          that._closeAllDialogs();
          that.setData({ currentTaskId: null, currentTask: null, viewingType: '', viewingData: null });
        }
      }
    });
  },

  onTaskSearchInput(e) {
    this.setData({ taskSearch: e.detail.value });
    this._applyTaskFilter();
  },

  duplicateTask(e) {
    var id = e.currentTarget.dataset.id;
    var task = this.data.tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    var copy = JSON.parse(JSON.stringify(task));
    copy.id = Date.now();
    copy.name = task.name + '（副本）';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    var tasks = this.data.tasks;
    tasks.unshift(copy);
    this.saveTasks(tasks);
    wx.showToast({ title: '✅ 已复制为「' + copy.name + '」', icon: 'success' });
  },

  backToList() {
    this._closeAllDialogs();
    this.setData({ currentTaskId: null, currentTask: null, viewingType: '', viewingData: null });
  },

  // ==================== 导入 ====================
  // ==================== 导入（弹窗入口） ====================
  openImportPlayerDialog() { this.setData({ showImportPlayerDialog: true }); },
  closeImportPlayerDialog() { this.setData({ showImportPlayerDialog: false }); },
  openImportNpcDialog() { this.setData({ showImportNpcDialog: true }); },
  closeImportNpcDialog() { this.setData({ showImportNpcDialog: false }); },

  copyNpcSample() {
    wx.setClipboardData({
      data: NPC_SAMPLE_TEXT,
      success: function () { wx.showToast({ title: '样例已复制', icon: 'success', duration: 1200 }); }
    });
  },

  doImportPlayer() {
    var that = this;
    wx.getClipboardData({
      success: function (res) {
        try {
          var data = JSON.parse(res.data);
          if (!data.attrValues || !data.charInfo) {
            wx.showToast({ title: '剪贴板内容不是有效的调查员数据', icon: 'none' }); return;
          }
          var tasks = that.data.tasks;
          var task = tasks.find(function (t) { return t.id === that.data.currentTaskId; });
          if (!task) return;
          var name = data.charInfo.name || '未命名';
          if (task.players.find(function (p) { return p.charInfo && p.charInfo.name === name; })) {
            wx.showToast({ title: '已存在同名调查员「' + name + '」', icon: 'none' }); return;
          }
          task.players.push(data);
          that.saveTasks(tasks);
          that.setData({ currentTask: task, showImportPlayerDialog: false });
          wx.showToast({ title: '✅ 已导入「' + name + '」', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '数据解析失败，请检查剪贴板', icon: 'none' });
        }
      },
      fail: function () { wx.showToast({ title: '读取剪贴板失败，请先复制调查员数据', icon: 'none' }); }
    });
  },

  // 解析一段 NPC 数据文本（首行名字 + 自由排版），供剪贴板导入与 AI 批量导入共用
  _parseNpcText(text) {
    text = (text || '').trim();
    if (!text) return null;
    var lines = text.split('\n');
    var name = lines[0].trim() || '未命名 NPC';
    var dexMatch = text.match(/DEX\s*(\d+)/i);
    var dex = dexMatch ? parseInt(dexMatch[1]) : null;
    var hpMatch = text.match(/\bHP[：:\s]*(\d+)/i);
    var hp = hpMatch ? parseInt(hpMatch[1]) : null;
    var mpMatch = text.match(/\bMP[：:\s]*(\d+)/i);
    var mp = mpMatch ? parseInt(mpMatch[1]) : null;
    // 尝试提取攻击方式行（行首匹配，避免误抓描述文字），提取不到则留空，可在编辑中手填
    var attackMatch = text.match(/(?:^|\n)\s*(?:攻击|攻撃|Attack)\s*[：:]\s*([^\n\r]+)/i);
    var attack = attackMatch ? attackMatch[1].trim() : '';
    // 尝试提取 DB（伤害加值，如「DB +1D4」）
    var dbMatch = text.match(/\bDB\s*([+\-−]?\d*D\d+|[+\-−]?0)\b/i);
    var db = dbMatch ? dbMatch[1].trim() : '';
    return {
      id: this._uid(), name: name, dex: dex, hp: hp, mp: mp,
      attack: attack, db: db, armor: extractArmor(text), data: text, visible: true
    };
  },

  doImportNpc() {
    var that = this;
    wx.getClipboardData({
      success: function (res) {
        var text = (res.data || '').trim();
        if (!text) { wx.showToast({ title: '剪贴板为空，请先复制 NPC 数据', icon: 'none' }); return; }
        var npc = that._parseNpcText(text);
        if (!npc) { wx.showToast({ title: '未识别到有效 NPC 数据', icon: 'none' }); return; }
        var tasks = that.data.tasks;
        var task = tasks.find(function (t) { return t.id === that.data.currentTaskId; });
        if (!task) return;
        task.npcs.push(npc);
        that.saveTasks(tasks);
        that.setData({ currentTask: task, showImportNpcDialog: false });
        var dexInfo = npc.dex !== null ? ' (DEX ' + npc.dex + ')' : '';
        wx.showToast({ title: '✅ 已导入「' + npc.name + '」' + dexInfo, icon: 'success' });
      },
      fail: function () { wx.showToast({ title: '读取剪贴板失败，请先复制 NPC 数据', icon: 'none' }); }
    });
  },

  // ==================== 手动新建调查员 ====================
  openNewPlayer() {
    this.setData({
      showNewPlayer: true, showImportPlayerDialog: false,
      newPlayerName: '', newPlayerOcc: '', newPlayerHp: '', newPlayerSan: '', newPlayerMp: '', newPlayerLuck: '', newPlayerDex: ''
    });
  },
  closeNewPlayer() { this.setData({ showNewPlayer: false }); },
  onNewPlayerNameInput(e) { this.setData({ newPlayerName: e.detail.value }); },
  onNewPlayerOccInput(e) { this.setData({ newPlayerOcc: e.detail.value }); },
  onNewPlayerHpInput(e) { this.setData({ newPlayerHp: e.detail.value }); },
  onNewPlayerSanInput(e) { this.setData({ newPlayerSan: e.detail.value }); },
  onNewPlayerMpInput(e) { this.setData({ newPlayerMp: e.detail.value }); },
  onNewPlayerLuckInput(e) { this.setData({ newPlayerLuck: e.detail.value }); },
  onNewPlayerDexInput(e) { this.setData({ newPlayerDex: e.detail.value }); },

  confirmNewPlayer() {
    var name = this.data.newPlayerName.trim();
    if (!name) { wx.showToast({ title: '请输入调查员名称', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    if (task.players.find(function (p) { return p.charInfo && p.charInfo.name === name; })) {
      wx.showToast({ title: '已存在同名调查员「' + name + '」', icon: 'none' }); return;
    }
    // 数字字段：留空 = 不填（可选）；填了非法则提示
    var that = this;
    var parseNum = function (raw, label) {
      if (!raw.trim()) return null;
      var v = parseInt(raw.trim());
      if (isNaN(v) || v < 0) { wx.showToast({ title: label + ' 请输入有效数字', icon: 'none' }); return undefined; }
      return v;
    };
    var hp = parseNum(this.data.newPlayerHp, 'HP');
    if (hp === undefined) return;
    var san = parseNum(this.data.newPlayerSan, 'SAN');
    if (san === undefined) return;
    var mp = parseNum(this.data.newPlayerMp, 'MP');
    if (mp === undefined) return;
    var luck = parseNum(this.data.newPlayerLuck, 'LUCK');
    if (luck === undefined) return;
    var dex = parseNum(this.data.newPlayerDex, 'DEX');
    if (dex === undefined) return;

    var occ = this.data.newPlayerOcc.trim();
    var derived = {};
    if (hp !== null) derived.hp = hp;
    if (san !== null) derived.san = san;
    if (mp !== null) derived.mp = mp;
    var attrValues = {};
    if (dex !== null) attrValues.dex = dex;
    if (luck !== null) attrValues.luck = luck;

    task.players.push({
      charInfo: { name: name },
      selectedOcc: occ ? { name: occ } : null,
      derived: derived,
      attrValues: attrValues,
      playHP: hp !== null ? hp : undefined,
      playSAN: san !== null ? san : undefined,
      playMP: mp !== null ? mp : undefined,
      playLuck: luck !== null ? luck : undefined,
      visible: true
    });
    this.saveTasks(tasks);
    this.setData({ currentTask: task, showNewPlayer: false });
    wx.showToast({ title: '✅ 已添加「' + name + '」', icon: 'success' });
  },

  // ==================== 详情查看 ====================
  viewPlayer(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      viewingType: 'player',
      viewingData: this.data.currentTask.players[index],
      viewingIndex: index,
      detailScrollTop: 0
    });
  },
  viewNPC(e) {
    var index = e.currentTarget.dataset.index;
    var npc = this.data.currentTask && this.data.currentTask.npcs[index];
    if (!npc) return;
    // 只传轻量字段副本，避免整棵任务对象树参与序列化
    this.setData({
      viewingIndex: index,
      showNpcDetail: true,
      npcDetail: {
        name: npc.name, dex: npc.dex, hp: npc.hp, mp: npc.mp,
        db: npc.db, armor: npc.armor, attack: npc.attack,
        attackDisplay: npc.attackDisplay, data: npc.data || ''
      }
    });
  },

  closeNpcDetail() { this.setData({ showNpcDetail: false }); },
  onPlayerSwiperChange(e) {
    var index = e.detail.current;
    this.setData({ viewingIndex: index, viewingData: this.data.currentTask.players[index] });
  },
  onNPCSwiperChange(e) {
    var index = e.detail.current;
    this.setData({ viewingIndex: index, viewingData: this.data.currentTask.npcs[index] });
  },
  onDetailScroll(e) { this.setData({ detailScrollTop: e.detail.scrollTop }); },
  closeDetail() {
    this._closeAllDialogs();
    this.setData({ viewingType: '', viewingData: null, viewingIndex: -1, detailScrollTop: 0 });
  },

  // ==================== 守密人工具弹窗 ====================
  _closeAllDialogs() {
    this.setData({
      showCombatDialog: false, showMadnessDialog: false, showDiceDialog: false,
      showRandomDialog: false, showExportTaskDialog: false,
      showCluesDialog: false, showNotesDialog: false, showRulesDialog: false,
      showNoteEdit: false, showAiDialog: false, showClueLocEdit: false
    });
  },

  // ==================== 战斗轮排序 ====================
  // open 为 true 时同时打开弹窗（窄条模式）；false 仅刷新数据（宽屏面板常驻）
  refreshCombatOrder(open) {
    var task = this.data.currentTask;
    if (!task) return;
    // 保留上一次的行动状态（死亡标记 / 当前行动者），查阅其他信息后重新打开不重置
    var oldOrder = this.data.combatOrder || [];
    var oldDead = {};
    oldOrder.forEach(function (it) { if (it.dead) oldDead[it.key] = true; });
    var oldCurrentKey = (this.data.combatCurrent >= 0 && oldOrder[this.data.combatCurrent])
      ? oldOrder[this.data.combatCurrent].key : null;

    var items = [];
    task.players.forEach(function (p, i) {
      if (p.visible === false) return;
      var dex = (p.attrValues && p.attrValues.dex) ? p.attrValues.dex : 0;
      var curHp = p.playHP !== undefined ? p.playHP : p.derived.hp;
      items.push({
        key: 'p' + i, name: p.charInfo.name || '未命名', dex: dex, type: 'player',
        dead: !!oldDead['p' + i],
        hpText: p.derived.hp !== undefined ? curHp + '/' + p.derived.hp : ''
      });
    });
    task.npcs.forEach(function (n, i) {
      if (n.visible === false) return;
      var dex = n.dex !== null && n.dex !== undefined ? n.dex : 0;
      items.push({
        key: 'n' + i, name: n.name, dex: dex, type: 'npc',
        dead: !!oldDead['n' + i],
        hpText: (n.hp !== null && n.hp !== undefined) ? String(n.hp) : ''
      });
    });
    items.sort(function (a, b) { return b.dex - a.dex; });
    var ties = new Set();
    for (var i = 0; i < items.length - 1; i++) {
      if (items[i].dex === items[i + 1].dex && items[i].dex > 0) { ties.add(i); ties.add(i + 1); }
    }
    var tieNames = [];
    items.forEach(function (item, i) { item.tie = ties.has(i); if (item.tie) tieNames.push(item.name); });
    var newCurrent = -1;
    items.forEach(function (it, i) { if (it.key === oldCurrentKey && !it.dead) newCurrent = i; });
    this.setData({
      showCombatDialog: open ? true : this.data.showCombatDialog,
      combatOrder: items, combatCurrent: newCurrent,
      combatHasTies: ties.size > 0, combatTieNames: Array.from(new Set(tieNames)).join('、')
    });
  },

  openCombatOrder() { this.refreshCombatOrder(true); },

  closeCombatDialog() { this.setData({ showCombatDialog: false }); },

  // 战斗轮推进：点名字设为当前行动者
  tapCombatTag(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var item = this.data.combatOrder[index];
    if (!item || item.dead) return;
    this.setData({ combatCurrent: index });
  },

  // 长按标记死亡/复活（战斗中跳过）
  toggleCombatDead(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var items = this.data.combatOrder;
    if (!items[index]) return;
    items[index].dead = !items[index].dead;
    var cur = this.data.combatCurrent;
    if (cur === index) cur = -1;
    // 新数组引用，确保就地修改也能触发视图更新
    this.setData({ combatOrder: items.slice(), combatCurrent: cur });
  },

  // 推进到下一个存活角色（循环）
  nextCombatTurn() {
    var items = this.data.combatOrder;
    var aliveIdx = [];
    items.forEach(function (it, i) { if (!it.dead) aliveIdx.push(i); });
    if (aliveIdx.length === 0) { wx.showToast({ title: '没有存活角色了', icon: 'none' }); return; }
    var pos = aliveIdx.indexOf(this.data.combatCurrent);
    var next = pos === -1 ? aliveIdx[0] : aliveIdx[(pos + 1) % aliveIdx.length];
    this.setData({ combatCurrent: next });
  },

  combatReset() {
    var items = this.data.combatOrder;
    items.forEach(function (it) { it.dead = false; });
    // 新数组引用，确保就地修改也能触发视图更新
    this.setData({ combatOrder: items.slice(), combatCurrent: -1, combatRound: 0 });
  },

  // 宽屏面板上的"刷新"按钮：按当前任务重新生成战斗顺序
  refreshCombat() { this.refreshCombatOrder(false); },

  // ==================== 删除卡片 ====================
  deletePlayer(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var name = task.players[index].charInfo.name || '未命名';
    var that = this;
    wx.showModal({
      title: '删除调查员', content: '确定从任务中移除「' + name + '」吗？',
      success: function (res) {
        if (!res.confirm) return;
        task.players.splice(index, 1);
        that.saveTasks(tasks);
        that.setData({ currentTask: task, viewingType: '', viewingData: null, viewingIndex: -1 });
      }
    });
  },

  deleteNPC(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var name = task.npcs[index].name;
    var that = this;
    wx.showModal({
      title: '删除 NPC', content: '确定删除 NPC「' + name + '」吗？',
      success: function (res) {
        if (!res.confirm) return;
        task.npcs.splice(index, 1);
        that.saveTasks(tasks);
        that.setData({ currentTask: task, viewingType: '', viewingData: null, viewingIndex: -1 });
      }
    });
  },

  // ==================== 可见性切换 ====================
  togglePlayerVisible(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.players[index]) return;
    task.players[index].visible = task.players[index].visible === false ? true : false;
    this.saveTasks(tasks);
    // 路径级更新：确保视图层必然刷新该字段（saveTasks 已回写 currentTask 新引用）
    var patch = {};
    patch['currentTask.players[' + index + '].visible'] = task.players[index].visible;
    this.setData(patch);
  },

  toggleNpcVisible(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.npcs[index]) return;
    // 默认视为可见，所以 undefined / true → false，false → true
    task.npcs[index].visible = task.npcs[index].visible === false ? true : false;
    this.saveTasks(tasks);
    // 路径级更新：确保视图层必然刷新该字段（saveTasks 已回写 currentTask 新引用）
    var patch = {};
    patch['currentTask.npcs[' + index + '].visible'] = task.npcs[index].visible;
    this.setData(patch);
  },

  // ==================== NPC 编辑 / 手动新建 ====================
  openNewNPC() {
    this.setData({
      showEditNPC: true, editNpcIndex: -1,
      editNpcName: '', editNpcDex: '', editNpcDb: '', editNpcArmor: '', editNpcHp: '', editNpcMp: '', editNpcAttack: '', editNpcData: ''
    });
  },

  editNPC(e) {
    var index = e.currentTarget.dataset.index;
    var task = this.data.currentTask;
    if (!task || !task.npcs[index]) return;
    var npc = task.npcs[index];
    this.setData({
      showEditNPC: true,
      editNpcIndex: index,
      editNpcName: npc.name || '',
      editNpcDex: npc.dex !== null && npc.dex !== undefined ? String(npc.dex) : '',
      editNpcDb: npc.db || '',
      editNpcArmor: npc.armor || '',
      editNpcHp: npc.hp !== null && npc.hp !== undefined ? String(npc.hp) : '',
      editNpcMp: npc.mp !== null && npc.mp !== undefined ? String(npc.mp) : '',
      editNpcAttack: npc.attack || '',
      editNpcData: npc.data || ''
    });
  },

  closeEditNPC() {
    this.setData({ showEditNPC: false, editNpcIndex: -1, editNpcName: '', editNpcDex: '', editNpcDb: '', editNpcArmor: '', editNpcHp: '', editNpcMp: '', editNpcAttack: '', editNpcData: '' });
  },

  onEditNpcNameInput(e) { this.setData({ editNpcName: e.detail.value }); },
  onEditNpcDexInput(e) { this.setData({ editNpcDex: e.detail.value }); },
  onEditNpcDbInput(e) { this.setData({ editNpcDb: e.detail.value }); },
  onEditNpcArmorInput(e) { this.setData({ editNpcArmor: e.detail.value }); },
  onEditNpcHpInput(e) { this.setData({ editNpcHp: e.detail.value }); },
  onEditNpcMpInput(e) { this.setData({ editNpcMp: e.detail.value }); },
  onEditNpcAttackInput(e) { this.setData({ editNpcAttack: e.detail.value }); },
  onEditNpcDataInput(e) { this.setData({ editNpcData: e.detail.value }); },

  confirmEditNPC() {
    var name = this.data.editNpcName.trim();
    if (!name) { wx.showToast({ title: '请输入 NPC 名称', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var idx = this.data.editNpcIndex;
    var isNew = idx === -1;
    if (!isNew && !task.npcs[idx]) return;

    var dexRaw = this.data.editNpcDex.trim();
    var dex = dexRaw ? parseInt(dexRaw) : null;
    if (dexRaw && (isNaN(dex) || dex < 0)) {
      wx.showToast({ title: 'DEX 请输入有效数字', icon: 'none' }); return;
    }

    var hpRaw = this.data.editNpcHp.trim();
    var hp = hpRaw ? parseInt(hpRaw) : null;
    if (hpRaw && (isNaN(hp) || hp < 0)) {
      wx.showToast({ title: 'HP 请输入有效数字', icon: 'none' }); return;
    }

    var mpRaw = this.data.editNpcMp.trim();
    var mp = mpRaw ? parseInt(mpRaw) : null;
    if (mpRaw && (isNaN(mp) || mp < 0)) {
      wx.showToast({ title: 'MP 请输入有效数字', icon: 'none' }); return;
    }

    if (isNew) {
      task.npcs.push({
        id: this._uid(), name: name, dex: dex, hp: hp, mp: mp,
        db: this.data.editNpcDb.trim(),
        armor: this.data.editNpcArmor.trim(),
        attack: this.data.editNpcAttack.trim(),
        data: this.data.editNpcData,
        visible: true
      });
    } else {
      task.npcs[idx].name = name;
      task.npcs[idx].dex = dex;
      task.npcs[idx].db = this.data.editNpcDb.trim();
      task.npcs[idx].armor = this.data.editNpcArmor.trim();
      task.npcs[idx].hp = hp;
      task.npcs[idx].mp = mp;
      task.npcs[idx].attack = this.data.editNpcAttack.trim();
      task.npcs[idx].data = this.data.editNpcData;
    }

    this.saveTasks(tasks);
    this.setData({ currentTask: task });
    this.setData({ showEditNPC: false, editNpcIndex: -1, editNpcName: '', editNpcDex: '', editNpcDb: '', editNpcArmor: '', editNpcHp: '', editNpcMp: '', editNpcAttack: '', editNpcData: '' });
    wx.showToast({ title: isNew ? '✅ NPC 已创建' : '✅ NPC 已更新', icon: 'success' });
  },

  // ==================== NPC HP / MP 调节 ====================
  adjustNpcHp(e) {
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    this._adjustNpcStat('hp', delta);
  },
  adjustNpcMp(e) {
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    this._adjustNpcStat('mp', delta);
  },
  _adjustNpcStat(key, delta) {
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var idx = this.data.viewingIndex;
    var npc = task.npcs[idx];
    if (!npc) return;
    if (npc[key] === null || npc[key] === undefined) {
      npc[key] = Math.max(0, delta);
    } else {
      npc[key] = Math.max(0, npc[key] + delta);
    }
    this.saveTasks(tasks);
    this.setData({
      currentTask: task,
      npcDetail: { name: npc.name, dex: npc.dex, hp: npc.hp, mp: npc.mp, db: npc.db, armor: npc.armor, attack: npc.attack, attackDisplay: npc.attackDisplay, data: npc.data || '' }
    });
  },

  // 卡片快捷加减（无需进入详情页）
  adjustNpcCardStat(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var key = e.currentTarget.dataset.key;
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.npcs[index]) return;
    var npc = task.npcs[index];
    if (npc[key] === null || npc[key] === undefined) {
      npc[key] = Math.max(0, delta);
    } else {
      npc[key] = Math.max(0, npc[key] + delta);
    }
    this.saveTasks(tasks);
    this._flashStat('n' + index + '-' + key);
    this.setData({ currentTask: task });
  },

  // 数值变化动效：短暂高亮当前变化的属性值
  _flashStat(key) {
    var that = this;
    this.setData({ flashKey: key });
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(function () { that.setData({ flashKey: '' }); }, 500);
  },

  // 调查员卡片快捷加减（HP / SAN / MP）
  adjustPlayerStat(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var key = e.currentTarget.dataset.key; // hp | san | mp
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.players[index]) return;
    var p = task.players[index];
    var derived = p.derived || {};
    var maxVal = key === 'hp' ? derived.hp : key === 'san' ? derived.san : derived.mp;
    var field = 'play' + key.toUpperCase();
    var cur = p[field] !== undefined ? p[field] : (maxVal !== undefined ? maxVal : 0);
    var next = Math.max(0, cur + delta);
    p[field] = next;

    if (key === 'hp' && next <= 0) {
      wx.showToast({ title: '💀 生命归零：昏迷 / 濒死', icon: 'none' });
    } else if (key === 'san') {
      var loss = cur - next;
      if (next <= 0) {
        wx.showToast({ title: '🧠 SAN 归零：永久疯狂', icon: 'none' });
      } else if (loss >= Math.floor(maxVal / 5)) {
        // 单次损失 ≥ 最大 SAN 的 1/5 → 临时疯狂，直连疯狂发作
        this.setData({
          showMadnessDialog: true, showMadnessSteps: false, madnessStep: 0,
          madnessSteps: [], madnessResult: null, madnessResultParts: []
        });
        wx.showToast({ title: '🌀 临时疯狂！已打开疯狂发作', icon: 'none', duration: 1800 });
      }
    }
    this.saveTasks(tasks);
    this.setData({ currentTask: task });
  },

  // ==================== 疯狂发作 ====================
  openMadness() {
    this.setData({ showMadnessDialog: true, showMadnessSteps: false, madnessStep: 0, madnessSteps: [], madnessResult: null, madnessResultParts: [] });
  },

  closeMadness() { this.setData({ showMadnessDialog: false }); },

  switchMadnessType(e) {
    var type = e.currentTarget.dataset.type;
    this.setData({ madnessType: type, showMadnessSteps: false, madnessStep: 0, madnessSteps: [], madnessResult: null, madnessResultParts: [] });
  },

  doMadnessRoll() {
    if (this.data.madnessRolling) return;
    var isImmediate = this.data.madnessType === 'immediate';
    var table = isImmediate ? IMMEDIATE_SYMPTOMS : SUMMARY_SYMPTOMS;
    var that = this;
    var DELAY = 500;

    this.setData({ madnessRolling: true, showMadnessSteps: true, madnessStep: 0, madnessSteps: [], madnessResult: null, madnessResultParts: [] });

    setTimeout(function () {
      var d10 = rollD10();
      var symptom = table[d10];
      var steps = [{ label: '1D10', value: d10, detail: symptom.name }];
      that.setData({ madnessStep: 1, madnessSteps: steps });

      if (symptom.needsPhobia || symptom.needsMania) {
        setTimeout(function () {
          var d100 = rollD100();
          var subEntry = symptom.needsPhobia ? PHOBIAS[d100 - 1] : MANIAS[d100 - 1];
          var subLabel = symptom.needsPhobia ? '恐惧症 1D100' : '躁狂症 1D100';
          steps.push({ label: subLabel, value: d100, detail: subEntry.name + '：' + subEntry.desc });
          that.setData({ madnessStep: 2, madnessSteps: steps });
          that._scheduleMadnessDuration(symptom, steps, isImmediate, DELAY);
        }, DELAY);
      } else {
        that._scheduleMadnessDuration(symptom, steps, isImmediate, DELAY);
      }
    }, DELAY);
  },

  _scheduleMadnessDuration(symptom, steps, isImmediate, delay) {
    var that = this;
    setTimeout(function () {
      var dur = symptom.duration;
      var durStep = null;
      if (dur) {
        var durRoll = rollD10();
        durStep = { label: '持续时间 ' + dur.dice, value: durRoll, detail: durRoll + ' ' + dur.unit + (dur.note || '') };
        steps.push(durStep);
      }
      var finalStep = durStep ? 3 : (symptom.needsPhobia || symptom.needsMania ? 2 : 1);
      that.setData({ madnessStep: finalStep, madnessSteps: steps, madnessRolling: false });
      that._buildMadnessResult(symptom, steps, isImmediate, durStep);
    }, delay);
  },

  _buildMadnessResult(symptom, steps, isImmediate, durStep) {
    var parts = [];
    var typeLabel = isImmediate ? '即时症状' : '总结症状';
    parts.push({ label: '疯狂类型', value: typeLabel });
    parts.push({ label: '1D10 结果', value: steps[0].value + ' — ' + symptom.name });
    parts.push({ label: '症状描述', value: symptom.desc });

    if (steps.length >= 2 && (symptom.needsPhobia || symptom.needsMania)) {
      var subLabel = symptom.needsPhobia ? '恐惧症' : '躁狂症';
      parts.push({ label: subLabel + ' 1D100', value: steps[1].value + ' — ' + steps[1].detail });
    }
    if (durStep) {
      parts.push({ label: '持续时间', value: durStep.detail });
    }

    var txt = '【' + typeLabel + '】\n';
    txt += '1D10 = ' + steps[0].value + '：' + symptom.name + '\n';
    txt += symptom.desc;
    if (steps.length >= 2 && (symptom.needsPhobia || symptom.needsMania)) {
      var sl = symptom.needsPhobia ? '恐惧症' : '躁狂症';
      txt += '\n\n' + sl + ' 1D100 = ' + steps[1].value + '：' + steps[1].detail;
    }
    if (durStep) txt += '\n\n持续时间：' + durStep.detail;

    this.setData({ madnessResult: txt, madnessResultParts: parts });
  },

  // ==================== 掷骰 ====================
  openDice() { this.setData({ showDiceDialog: true }); },
  closeDice() { this.setData({ showDiceDialog: false }); },

  // ==================== 检定助手 ====================
  _openCheck(title, total) {
    this.setData({
      showCheckDialog: true, checkTitle: title, checkTotal: total,
      checkMode: 'normal', checkDice: null, checkLevel: null, checkRolling: false
    });
  },

  closeCheckDialog() { this.setData({ showCheckDialog: false }); },

  // 调查员技能检定（详情页技能网格点击）
  openSkillCheck(e) {
    var skill = e.currentTarget.dataset.skill || '';
    var total = parseInt(e.currentTarget.dataset.total);
    if (isNaN(total)) return;
    this.setData({ checkAttack: '', checkDb: '', checkDamage: null });
    this._openCheck(skill, total);
  },

  // NPC 攻击检定（卡片/详情攻击行点击，自动提取技能值）
  // 优先取攻击文本里的百分比（如「爪击 25%」）；没有则按攻击名从数据「技能：」行匹配（如「斗殴 50%」）
  openAttackCheck(e) {
    var attack = e.currentTarget.dataset.attack;
    if (!attack) return;
    var index = parseInt(e.currentTarget.dataset.index);
    var first = attack.split('/')[0].trim();
    var attackName = first.split(/[\s\u3000]+/)[0].trim();
    var m = first.match(/(\d+)%/);
    var total = m ? parseInt(m[1]) : null;
    if (!total) {
      var task = this.data.currentTask;
      var npc = task && task.npcs[index];
      if (npc && npc.data) {
        var skillsLine = npc.data.match(/(?:^|\n)\s*技能[：:]([^\n]*)/i);
        if (skillsLine) {
          var sm = skillsLine[1].match(new RegExp(attackName + '\\s*(\\d+)%'));
          if (sm) total = parseInt(sm[1]);
        }
      }
    }
    if (!total) {
      wx.showToast({ title: '未找到「' + attackName + '」的技能值，可在编辑中补充', icon: 'none' }); return;
    }
    var npc = (this.data.currentTask && this.data.currentTask.npcs[index]) || null;
    this.setData({ checkAttack: attack, checkDb: (npc && npc.db) || '', checkDamage: null });
    this._openCheck(attackName || first, total);
  },

  setCheckMode(e) {
    if (this.data.checkRolling) return;
    this.setData({ checkMode: e.currentTarget.dataset.mode, checkDice: null, checkLevel: null });
  },

  // COC 7 判定：1 大成功；大失败（技能<50 时 96-100，技能≥50 时仅 100）；≤1/5 极难；≤1/2 困难；≤技能 普通；其余失败
  _judgeCheck(total, d100) {
    if (d100 === 1) return { text: '大成功！', cls: 'critical' };
    if (d100 === 100 || (total < 50 && d100 >= 96)) return { text: '大失败！', cls: 'fumble' };
    if (d100 <= Math.floor(total / 5)) return { text: '极难成功', cls: 'extreme' };
    if (d100 <= Math.floor(total / 2)) return { text: '困难成功', cls: 'hard' };
    if (d100 <= total) return { text: '普通成功', cls: 'success' };
    return { text: '失败', cls: 'fail' };
  },

  doCheckRoll() {
    if (this.data.checkRolling) return;
    var mode = this.data.checkMode === 'bonus' ? 'bonus1' : this.data.checkMode === 'penalty' ? 'penalty1' : 'normal';
    var that = this;
    this.setData({ checkRolling: true, checkDice: null, checkLevel: null });
    wx.vibrateShort({ type: 'medium', fail: function () {} });
    setTimeout(function () {
      var dice = that._rollD100(mode);
      var level = that._judgeCheck(that.data.checkTotal, dice.result);
      that.setData({ checkRolling: false, checkDice: dice, checkLevel: level });
    }, 600);
  },

  // 掷伤害：从攻击文本解析伤害表达式，DB 自动代入（如 1D6+DB → 1D6+1D4）
  doDamageRoll() {
    var attack = this.data.checkAttack;
    if (!attack) return;
    var first = attack.split('/')[0];
    var m = first.match(/(\d+D\d+)(\s*[+\-−]\s*DB)?/i);
    if (!m) {
      wx.showToast({ title: '未能解析伤害表达式（如 1D6+DB）', icon: 'none' }); return;
    }
    var dbDice = (this.data.checkDb || '').match(/(\d+D\d+)/i);
    var rollExpr = m[0];
    if (m[2] && dbDice) rollExpr = rollExpr.replace(/DB/i, dbDice[1]);
    // 掷出所有 NdM 骰子并累加常数
    var total = 0;
    var parts = [];
    var re = /(\d+)D(\d+)/gi;
    var mm;
    while ((mm = re.exec(rollExpr)) !== null) {
      var n = parseInt(mm[1]), s = parseInt(mm[2]);
      var sum = 0;
      for (var i = 0; i < n; i++) sum += 1 + Math.floor(Math.random() * s);
      total += sum;
      parts.push(mm[0] + '=' + sum);
    }
    var constM = rollExpr.replace(re, ' ').match(/[+\-−]\s*\d+/g);
    if (constM) {
      constM.forEach(function (c) {
        var v = parseInt(c.replace(/[+\-−]/g, '').trim());
        total += c.indexOf('-') > -1 ? -v : v;
      });
    }
    wx.vibrateShort({ type: 'light', fail: function () {} });
    this.setData({ checkDamage: { expr: rollExpr, total: total, parts: parts, partsStr: parts.join(' · ') } });
  },

  _diceRoll(d) { return Math.floor(Math.random() * d) + 1; },

  selectDice(e) {
    if (this.data.diceRolling) return;
    var now = Date.now();
    if (now - this._lastDiceLongpress < 400) return;
    var d = parseInt(e.currentTarget.dataset.d);
    var sel = {};
    var keys = Object.keys(this.data.diceSelected);
    for (var i = 0; i < keys.length; i++) { sel[keys[i]] = this.data.diceSelected[keys[i]]; }
    sel[d] = (sel[d] || 0) + 1;
    this.setData({ diceSelected: sel, diceResult: null });
  },

  deselectDice(e) {
    if (this.data.diceRolling) return;
    this._lastDiceLongpress = Date.now();
    var d = parseInt(e.currentTarget.dataset.d);
    var sel = {};
    var keys = Object.keys(this.data.diceSelected);
    for (var i = 0; i < keys.length; i++) { sel[keys[i]] = this.data.diceSelected[keys[i]]; }
    if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; }
    this.setData({ diceSelected: sel, diceResult: null });
  },

  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },

  clearDiceHistory() { this.setData({ diceHistory: [] }); },

  // --- 百分骰奖励/惩罚骰模式 ---
  setDice100Mode(e) {
    if (this.data.diceRolling) return;
    var mode = e.currentTarget.dataset.mode;
    if (mode === this.data.dice100Mode) mode = 'normal'; // 再点一次取消
    this.setData({ dice100Mode: mode, diceResult: null });
  },

  // COC 规则：十位骰 0-90，个位骰 0-9；奖励骰多掷十位取小，惩罚骰取大；00+0 = 100
  _rollD100(mode) {
    var tensCount = mode === 'normal' ? 1 : (mode === 'bonus1' || mode === 'penalty1') ? 2 : 3;
    var tens = [];
    for (var i = 0; i < tensCount; i++) tens.push((this._diceRoll(10) - 1) * 10);
    var ones = this._diceRoll(10) - 1;
    var chosen;
    if (mode === 'bonus1' || mode === 'bonus2') chosen = Math.min.apply(null, tens);
    else if (mode === 'penalty1' || mode === 'penalty2') chosen = Math.max.apply(null, tens);
    else chosen = tens[0];
    var result = chosen + ones;
    if (chosen === 0 && ones === 0) result = 100;
    return { sides: 100, result: result, mode: mode, tens: tens, tensStr: tens.join('|'), chosen: chosen, ones: ones };
  },

  rollSelected() {
    var sel = this.data.diceSelected;
    var keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null });
    wx.vibrateShort({ type: 'medium', fail: function () {} });
    var that = this;
    var mode = this.data.dice100Mode;
    var dice = [];
    var total = 0;
    keys.forEach(function (k) {
      var sides = parseInt(k);
      var count = sel[k];
      for (var i = 0; i < count; i++) {
        var r = (sides === 100 && mode !== 'normal') ? that._rollD100(mode) : { sides: sides, result: that._diceRoll(sides) };
        dice.push(r);
        total += r.result;
      }
    });
    setTimeout(function () {
      var result = { dice: dice, total: total, time: new Date().toLocaleTimeString() };
      var history = [result].concat(that.data.diceHistory).slice(0, 50);
      // 奖励/惩罚是一次性的：投完自动回归普通，避免连续投掷误带模式
      that.setData({ diceRolling: false, diceResult: result, diceHistory: history, dice100Mode: 'normal' });
    }, 700);
  },

  // ==================== 任务导入导出 ====================
  openExportTask() { this.setData({ showExportTaskDialog: true }); },
  closeExportTask() { this.setData({ showExportTaskDialog: false }); },

  exportTask() {
    var task = this.data.currentTask;
    if (!task) return;
    var data = JSON.parse(JSON.stringify(task));
    var that = this;
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success: function () {
        wx.showToast({ title: '任务数据已复制到剪贴板', icon: 'success', duration: 1500 });
        that.setData({ showExportTaskDialog: false });
      },
      fail: function () { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  importTask() {
    var that = this;
    wx.getClipboardData({
      success: function (res) {
        var data;
        try { data = JSON.parse(res.data); } catch (e) {
          wx.showToast({ title: '剪贴板中没有有效的任务数据', icon: 'none', duration: 2000 });
          return;
        }
        if (!data.name || !data.players || !data.npcs || data.id === undefined) {
          wx.showToast({ title: '数据格式不符，非任务数据', icon: 'none', duration: 2000 });
          return;
        }
        // 赋予新 ID 避免冲突
        data.id = Date.now();
        data.createdAt = Date.now();
        var tasks = that.data.tasks;
        // 检查同名任务
        if (tasks.find(function (t) { return t.name === data.name; })) {
          wx.showToast({ title: '已存在同名任务「' + data.name + '」，请先重命名', icon: 'none', duration: 2000 });
          return;
        }
        tasks.unshift(data);
        that.saveTasks(tasks);
        that.setData({ showExportTaskDialog: false });
        wx.showToast({ title: '已导入任务「' + data.name + '」', icon: 'success', duration: 1500 });
      },
      fail: function () { wx.showToast({ title: '读取剪贴板失败', icon: 'none', duration: 2000 }); }
    });
  },

  // ==================== NPC 模板库 ====================
  openNpcTemplates() { this.setData({ showNpcTemplates: true }); },
  closeNpcTemplates() { this.setData({ showNpcTemplates: false }); },

  switchTplCat(e) {
    this.setData({ tplCat: e.currentTarget.dataset.id });
  },

  // 同名 NPC 自动编号（深潜者 → 深潜者 2 → 深潜者 3），支持多个同种怪
  _uniqueNpcName(task, name) {
    var base = name;
    var i = 1;
    var candidate = base;
    while (task.npcs.some(function (n) { return n.name === candidate; })) {
      candidate = base + ' ' + (i + 1);
      i++;
    }
    return candidate;
  },

  addNpcFromTemplate(e) {
    var id = e.currentTarget.dataset.id;
    var tpl = NPC_TEMPLATES.find(function (t) { return t.id === id; });
    if (!tpl) return;
    // 攻击方式优先取模板字段，否则从数据文本提取（兼容「攻击：xxx」行）；DB 从数据文本提取（「DB +1D4」）
    var attack = tpl.attack || ((tpl.data.match(/(?:^|\n)\s*(?:攻击|攻撃|Attack)\s*[：:]\s*([^\n\r]+)/i) || [])[1] || '').trim();
    var db = ((tpl.data.match(/\bDB\s*([+\-−]?\d*D\d+|[+\-−]?0)\b/i) || [])[1] || '').trim();
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var name = this._uniqueNpcName(task, tpl.name);
    task.npcs.push({ id: this._uid(), name: name, dex: tpl.dex, hp: tpl.hp, mp: tpl.mp, attack: attack, db: db, armor: extractArmor(tpl.data), data: tpl.data, visible: true });
    this.saveTasks(tasks);
    this.setData({ currentTask: task, showNpcTemplates: false });
    wx.showToast({ title: '✅ 已添加「' + name + '」', icon: 'success' });
  },

  // ==================== 随机生成器 ====================
  openRandom() {
    this.setData({ showRandomDialog: true, randomResult: null, randomNpc: null });
  },

  closeRandom() { this.setData({ showRandomDialog: false }); },

  _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  rollRandomName(e) {
    var type = e.currentTarget.dataset.type;
    var name;
    if (type === 'cn') {
      name = this._pick(RANDOM_SURNAMES_CN) + this._pick(RANDOM_GIVEN_CN);
    } else {
      var female = Math.random() < 0.5;
      var first = female ? this._pick(RANDOM_FIRST_WEST_F) : this._pick(RANDOM_FIRST_WEST_M);
      var last = this._pick(RANDOM_LAST_WEST);
      name = first.cn + '·' + last.cn + '（' + first.en + ' ' + last.en + '）';
    }
    this.setData({ randomResult: { type: type === 'cn' ? '中文名称' : '西式名称（中文译名）', value: name }, randomNpc: null });
  },

  rollRandomClue() {
    this.setData({ randomResult: { type: '随机线索', value: this._pick(RANDOM_CLUES) }, randomNpc: null });
  },

  rollRandomItem() {
    this.setData({ randomResult: { type: '随身物品', value: this._pick(RANDOM_ITEMS) }, randomNpc: null });
  },

  rollRandomNpc() {
    var female = Math.random() < 0.5;
    var name, nameEn = '';
    // 1920s 默认欧美背景：西式名为主（含中文译名），中文名小概率（唐人街等场景）
    if (Math.random() < 0.85) {
      var first = female ? this._pick(RANDOM_FIRST_WEST_F) : this._pick(RANDOM_FIRST_WEST_M);
      var last = this._pick(RANDOM_LAST_WEST);
      name = first.cn + '·' + last.cn;
      nameEn = first.en + ' ' + last.en;
    } else {
      name = this._pick(RANDOM_SURNAMES_CN) + this._pick(RANDOM_GIVEN_CN);
    }
    var job = this._pick(RANDOM_JOBS);
    var trait = this._pick(RANDOM_TRAITS);
    var item = this._pick(RANDOM_ITEMS);
    var clue = this._pick(RANDOM_CLUES);
    // COC 7 属性：STR/CON/DEX/APP/POW = 3D6×5；SIZ/INT/EDU = (2D6+6)×5
    var d6 = this._diceRoll;
    var r36 = function () { return (d6(6) + d6(6) + d6(6)) * 5; };
    var r266 = function () { return (2 + d6(6) + d6(6)) * 5; };
    var str = r36(), con = r36(), dex = r36(), app = r36(), pow = r36();
    var siz = r266(), int = r266(), edu = r266();
    var luck = r36();
    var hp = Math.max(1, Math.floor((con + siz) / 10));
    var mp = Math.floor(pow / 5);
    var dbObj = dbOf(str + siz);
    var brawl = 25 + Math.floor(Math.random() * 31);   // 斗殴 25-55
    var dodge = Math.max(20, Math.floor(dex / 2));      // 闪避 = DEX/2
    var spot = 25 + Math.floor(Math.random() * 26);     // 侦查 25-50
    var listen = 20 + Math.floor(Math.random() * 26);   // 聆听 20-45
    var data = name + (nameEn ? '（' + nameEn + '）' : '') + '（' + job + '）\n' +
      'STR ' + str + ' CON ' + con + ' SIZ ' + siz + ' DEX ' + dex + ' INT ' + int + ' APP ' + app + ' POW ' + pow + ' EDU ' + edu + '\n' +
      'HP ' + hp + ' MP ' + mp + ' 幸运 ' + luck + '\n' +
      'DB ' + dbObj.db + ' 体格 ' + dbObj.build + ' 护甲 0\n' +
      '技能：斗殴 ' + brawl + '% 闪避 ' + dodge + '% 侦查 ' + spot + '% 聆听 ' + listen + '%\n' +
      '攻击：斗殴 1D3+DB\n' +
      '外貌/举止：' + trait + '\n' +
      '随身物品：' + item + '\n' +
      '线索：' + clue + '\n' +
      '描述：' + job + '（随机生成，数值仅供参考，KP 可调整）';
    this.setData({ randomNpc: { name: name, job: job, dex: dex, hp: hp, mp: mp, db: dbObj.db, data: data }, randomResult: null });
  },

  copyRandomResult() {
    var value = this.data.randomResult ? this.data.randomResult.value : '';
    if (!value) return;
    wx.setClipboardData({
      data: value,
      success: function () { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  // ==================== 克苏鲁词汇表 ====================
  openLexicon() { this.setData({ showLexiconDialog: true }); },
  closeLexicon() { this.setData({ showLexiconDialog: false }); },
  switchLexiconCat(e) { this.setData({ lexiconCat: e.currentTarget.dataset.id }); },

  copyLexiconItem(e) {
    var w = e.currentTarget.dataset.w || '';
    var d = e.currentTarget.dataset.d || '';
    if (!w) return;
    wx.setClipboardData({
      data: d ? w + '：' + d : w,
      success: function () { wx.showToast({ title: '已复制「' + w + '」', icon: 'success', duration: 1200 }); }
    });
  },

  copyRandomNpc() {
    var npc = this.data.randomNpc;
    if (!npc) return;
    wx.setClipboardData({
      data: npc.data,
      success: function () { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  importRandomNpc() {
    var npc = this.data.randomNpc;
    if (!npc) return;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    task.npcs.push({
      id: this._uid(), name: npc.name, dex: npc.dex, hp: npc.hp, mp: npc.mp,
      db: npc.db || '', attack: '斗殴 1D3+DB', data: npc.data, visible: true
    });
    this.saveTasks(tasks);
    this.setData({ currentTask: task, randomNpc: null });
    wx.showToast({ title: '✅ 已导入「' + npc.name + '」', icon: 'success' });
  },

  // 随机遭遇：从怪物模板随机抽 1-3 个一键加入任务（杂兵为主，精英小概率应急）
  rollRandomEncounter() {
    var monsterCats = ['deep', 'ghoul', 'migo', 'sky', 'cthulhu', 'serpent', 'alien'];
    // 加权池：杂兵权重 5，精英权重 1 → 遭遇以杂兵为主
    var pool = [];
    NPC_TEMPLATES.forEach(function (t) {
      if (monsterCats.indexOf(t.cat) === -1) return;
      var w = t.desc.indexOf('杂兵') > -1 ? 5 : 1;
      for (var i = 0; i < w; i++) pool.push(t);
    });
    if (!pool.length) return;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var r = Math.random();
    var count = r < 0.3 ? 1 : r < 0.7 ? 2 : 3;
    var added = [];
    for (var i = 0; i < count; i++) {
      var tpl = this._pick(pool);
      var attack = ((tpl.data.match(/(?:^|\n)\s*(?:攻击|攻撃|Attack)\s*[：:]\s*([^\n\r]+)/i) || [])[1] || '').trim();
      var db = ((tpl.data.match(/\bDB\s*([+\-−]?\d*D\d+|[+\-−]?0)\b/i) || [])[1] || '').trim();
      var name = this._uniqueNpcName(task, tpl.name);
      task.npcs.push({ id: this._uid(), name: name, dex: tpl.dex, hp: tpl.hp, mp: tpl.mp, attack: attack, db: db, armor: extractArmor(tpl.data), data: tpl.data, visible: true });
      added.push(name);
    }
    if (!added.length) { wx.showToast({ title: '抽到的怪都已在场了，再试一次', icon: 'none' }); return; }
    this.saveTasks(tasks);
    this.setData({ currentTask: task });
    wx.showToast({ title: '⚔️ 遭遇：' + added.join('、'), icon: 'none', duration: 2000 });
  },

  // ==================== 线索表 ====================
  openClues() { this.setData({ showCluesDialog: true }); },
  closeClues() { this.setData({ showCluesDialog: false }); },
  onClueInput(e) { this.setData({ clueInput: e.detail.value }); },
  onClueSourceInput(e) { this.setData({ clueSource: e.detail.value }); },
  onClueLocInput(e) { this.setData({ clueLocInput: e.detail.value }); },

  // 线索视图：地点统计（含备用线索）+ 搜索/地点过滤
  _refreshClueView() {
    var task = this.data.currentTask;
    var clues = (task && task.clues) || [];
    var q = (this.data.clueSearch || '').trim().toLowerCase();
    var filter = this.data.clueLocFilter || '';
    var counts = {};
    var backupCount = 0;
    clues.forEach(function (c) {
      if (c.isBackup) backupCount++;
      if (c.location) counts[c.location] = (counts[c.location] || 0) + 1;
    });
    var locs = Object.keys(counts).map(function (t) { return { loc: t, count: counts[t] }; })
      .sort(function (a, b) { return b.count - a.count; });
    // 选中的筛选已不存在时自动回到「全部」
    if (filter === '__backup__' && backupCount === 0) filter = '';
    else if (filter && filter !== '__backup__' && !counts[filter]) filter = '';
    var filtered = clues.filter(function (c) {
      if (filter === '__backup__') { if (!c.isBackup) return false; }
      else if (filter) { if (c.location !== filter) return false; }
      if (q) {
        var hay = ((c.text || '') + ' ' + (c.location || '') + ' ' + (c.source || '')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    this.setData({ clueLocs: locs, clueBackupCount: backupCount, clueLocFilter: filter, clueFiltered: filtered });
  },

  onClueSearchInput(e) {
    this.setData({ clueSearch: e.detail.value });
    this._refreshClueView();
  },

  onClueLocTap(e) {
    this.setData({ clueLocFilter: e.currentTarget.dataset.loc || '' });
    this._refreshClueView();
  },

  // 设置/修改单条线索的地点
  openClueLocEdit(e) {
    var id = e.currentTarget.dataset.id;
    var task = this.data.currentTask;
    var clue = (task && task.clues) ? task.clues.find(function (c) { return String(c.id) === String(id); }) : null;
    if (!clue) return;
    this.setData({ showClueLocEdit: true, editClueLocId: String(id), clueLocEditValue: clue.location || '' });
  },

  closeClueLocEdit() { this.setData({ showClueLocEdit: false, editClueLocId: null }); },
  onClueLocEditInput(e) { this.setData({ clueLocEditValue: e.detail.value }); },

  saveClueLoc() {
    var id = this.data.editClueLocId;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.clues || id === null) return;
    var clue = task.clues.find(function (c) { return String(c.id) === id; });
    if (!clue) return;
    clue.location = (this.data.clueLocEditValue || '').trim();
    this.setData({ showClueLocEdit: false, editClueLocId: null });
    this.saveTasks(tasks);
  },

  // 地点归一化：把层级地点（如「科比特老房子·一楼储藏室」）拆成
  // 场所级地点（用于筛选）与子地点（并入出处），避免标签碎片化
  _splitClueLoc(loc, src) {
    loc = (loc || '').trim();
    src = (src || '').trim();
    var idx = loc.indexOf('·');
    if (idx > -1) {
      var sub = loc.slice(idx + 1).trim();
      loc = loc.slice(0, idx).trim();
      if (sub) src = sub + (src ? ' · ' + src : '');
    }
    return { location: loc, source: src };
  },

  addClue() {
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var text = (this.data.clueInput || '').trim();
    if (!text) { wx.showToast({ title: '请输入线索内容', icon: 'none' }); return; }
    var norm = this._splitClueLoc(this.data.clueLocInput, this.data.clueSource);
    task.clues = task.clues || [];
    task.clues.push({
      id: this._uid(), text: text,
      location: norm.location,
      source: norm.source,
      isBackup: norm.source === '备用线索',
      given: false
    });
    this.setData({ clueInput: '', clueSource: '', clueLocInput: '' });
    this.saveTasks(tasks);
  },

  toggleClueGiven(e) {
    var id = e.currentTarget.dataset.id;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.clues) return;
    var clue = task.clues.find(function (c) { return String(c.id) === String(id); });
    if (!clue) return;
    clue.given = !clue.given;
    this.saveTasks(tasks);
  },

  deleteClue(e) {
    var id = e.currentTarget.dataset.id;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.clues) return;
    task.clues = task.clues.filter(function (c) { return String(c.id) !== String(id); });
    this.saveTasks(tasks);
  },

  // ==================== 团务笔记 ====================
  openNotes() { this.setData({ showNotesDialog: true }); },
  closeNotes() { this.setData({ showNotesDialog: false }); },
  addNote() { this.setData({ showNoteEdit: true, editNoteId: null, noteTitle: '', noteContent: '' }); },
  closeNoteEdit() { this.setData({ showNoteEdit: false }); },
  onNoteTitleInput(e) { this.setData({ noteTitle: e.detail.value }); },
  onNoteContentInput(e) { this.setData({ noteContent: e.detail.value }); },

  openNoteEdit(e) {
    var id = e.currentTarget.dataset.id;
    var task = this.data.currentTask;
    var note = (task && task.notes) ? task.notes.find(function (n) { return String(n.id) === String(id); }) : null;
    this.setData({
      showNoteEdit: true, editNoteId: id,
      noteTitle: note ? note.title : '',
      noteContent: note ? note.content : ''
    });
  },

  saveNote() {
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var title = (this.data.noteTitle || '').trim() || '未命名笔记';
    var content = this.data.noteContent || '';
    task.notes = task.notes || [];
    if (this.data.editNoteId === null) {
      task.notes.push({ id: this._uid(), title: title, content: content, updatedAt: Date.now() });
    } else {
      var note = task.notes.find(function (n) { return String(n.id) === String(this.data.editNoteId); }.bind(this));
      if (note) { note.title = title; note.content = content; note.updatedAt = Date.now(); }
    }
    this.setData({ showNoteEdit: false });
    this.saveTasks(tasks);
    wx.showToast({ title: '✅ 笔记已保存', icon: 'success', duration: 1000 });
  },

  deleteNote() {
    var id = this.data.editNoteId;
    if (id === null) { this.setData({ showNoteEdit: false }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.notes) return;
    task.notes = task.notes.filter(function (n) { return String(n.id) !== String(id); });
    this.setData({ showNoteEdit: false });
    this.saveTasks(tasks);
  },

  exportNotes() {
    var task = this.data.currentTask;
    var notes = (task && task.notes) || [];
    if (!notes.length) { wx.showToast({ title: '还没有笔记', icon: 'none' }); return; }
    var txt = '【' + (task ? task.name : '') + ' 团务笔记】\n\n' +
      notes.map(function (n) { return '◆ ' + n.title + '\n' + n.content; }).join('\n\n');
    wx.setClipboardData({
      data: txt,
      success: function () { wx.showToast({ title: '📋 笔记已复制到剪贴板', icon: 'success', duration: 1500 }); }
    });
  },

  // ==================== 规则速查 ====================
  openRules() { this.setData({ showRulesDialog: true }); },
  closeRules() { this.setData({ showRulesDialog: false }); },
  switchRulesCat(e) {
    var id = e.currentTarget.dataset.id;
    var sec = RULES_SECTIONS.find(function (s) { return s.id === id; }) || RULES_SECTIONS[0];
    this.setData({ rulesCat: sec.id, rulesItems: sec.items, rulesTable: sec.table || [] });
  },

  // ==================== AI 备团 ====================
  openAi() { this.setData({ showAiDialog: true }); },
  closeAi() { this.setData({ showAiDialog: false }); },
  onAiImportTextInput(e) { this.setData({ aiImportText: e.detail.value }); },

  copyAiPrompt(e) {
    var type = e.currentTarget.dataset.type;
    var text = type === 'npc' ? AI_NPC_PROMPT : type === 'clue' ? AI_CLUE_PROMPT : AI_NOTE_PROMPT;
    wx.setClipboardData({
      data: text,
      success: function () { wx.showToast({ title: '📋 提示词已复制', icon: 'success', duration: 1200 }); }
    });
  },

  copyAiSample(e) {
    var type = e.currentTarget.dataset.type;
    var text = type === 'npc' ? NPC_SAMPLE_TEXT : type === 'clue' ? AI_CLUE_SAMPLE : AI_NOTE_SAMPLE;
    wx.setClipboardData({
      data: text,
      success: function () { wx.showToast({ title: '📋 样例已复制', icon: 'success', duration: 1200 }); }
    });
  },

  copyAiAll() {
    var text = '【AI 备团 · 全套提示词与格式样例】\n\n' +
      '一、整理 NPC（输出后粘贴回工具 → 「导入为 NPC」）\n' + AI_NPC_PROMPT + '\n\n【NPC 格式样例】\n' + NPC_SAMPLE_TEXT + '\n\n' +
      '二、整理线索（输出后粘贴回工具 → 「导入为线索」）\n' + AI_CLUE_PROMPT + '\n\n【线索格式样例】\n' + AI_CLUE_SAMPLE + '\n\n' +
      '三、整理团务笔记（输出后粘贴回工具 → 「导入为笔记」）\n' + AI_NOTE_PROMPT + '\n\n【笔记格式样例】\n' + AI_NOTE_SAMPLE;
    wx.setClipboardData({
      data: text,
      success: function () { wx.showToast({ title: '📋 全部提示词与样例已复制', icon: 'success', duration: 1500 }); }
    });
  },

  // AI 输出批量导入 NPC：按「---」或空行分块，每块一张卡
  importAiNpcs() {
    var text = (this.data.aiImportText || '').trim();
    if (!text) { wx.showToast({ title: '请先把 AI 输出粘贴进来', icon: 'none' }); return; }
    var blocks = (text.indexOf('---') > -1 ? text.split(/---+/) : text.split(/\n\s*\n+/))
      .map(function (b) { return b.trim(); }).filter(Boolean);
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var added = 0, failed = 0;
    var that = this;
    blocks.forEach(function (b) {
      var npc = that._parseNpcText(b);
      if (!npc) { failed++; return; }
      npc.name = that._uniqueNpcName(task, npc.name);
      task.npcs.push(npc);
      added++;
    });
    if (!added) { wx.showToast({ title: '未解析出有效 NPC，请检查格式', icon: 'none', duration: 2000 }); return; }
    this.saveTasks(tasks);
    this.setData({ aiImportText: '' });
    wx.showToast({ title: '✅ 已导入 ' + added + ' 个 NPC' + (failed ? '（' + failed + ' 块失败）' : ''), icon: 'success', duration: 1800 });
  },

  // AI 输出批量导入线索：每行一条，「内容｜地点｜出处（备注）」
  importAiClues() {
    var text = (this.data.aiImportText || '').trim();
    if (!text) { wx.showToast({ title: '请先把 AI 输出粘贴进来', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    task.clues = task.clues || [];
    var added = 0;
    var that = this;
    text.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      // 格式：内容｜地点｜出处（地点/出处可省略）；出处为「备用线索」→ 备用线索
      var segs = line.split(/[｜|]/).map(function (s) { return s.trim(); });
      var clueText = segs[0] || '';
      // 地点归一化：层级地点（如「科比特老房子·一楼储藏室」）拆为
      // 场所级地点 + 子地点并入出处，避免筛选标签碎片化
      var norm = that._splitClueLoc(segs[1] || '', segs[2] || '');
      var loc = norm.location;
      var src = norm.source;
      var isBackup = false;
      if (src === '备用线索') isBackup = true;
      else if (!src && loc === '备用线索') { isBackup = true; src = '备用线索'; loc = ''; }
      if (!clueText) return;
      task.clues.push({ id: that._uid(), text: clueText, location: loc, source: src, isBackup: isBackup, given: false });
      added++;
    });
    if (!added) { wx.showToast({ title: '未识别到线索（每行一条）', icon: 'none' }); return; }
    this.saveTasks(tasks);
    this.setData({ aiImportText: '' });
    wx.showToast({ title: '✅ 已导入 ' + added + ' 条线索', icon: 'success', duration: 1500 });
  },

  // AI 输出批量导入笔记：以「## 标题」分块（优先），否则按空行分块（每块首行为标题）
  importAiNotes() {
    var text = (this.data.aiImportText || '').trim();
    if (!text) { wx.showToast({ title: '请先把 AI 输出粘贴进来', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    task.notes = task.notes || [];
    var blocks = [];
    if (/^##\s*/m.test(text)) {
      // 「## 标题」格式：块内允许空行，不受影响
      text.split(/^##\s*/m).forEach(function (part) {
        part = part.trim();
        if (!part) return;
        var ls = part.split('\n');
        var title = (ls[0] || '').trim() || '未命名笔记';
        var content = ls.slice(1).join('\n').trim();
        blocks.push({ title: title, content: content });
      });
    } else {
      // 兼容旧格式：空行分块，首行为标题
      text.split(/\n\s*\n+/).forEach(function (block) {
        block = block.trim();
        if (!block) return;
        var ls = block.split('\n');
        var title = (ls[0] || '').trim() || '未命名笔记';
        var content = ls.slice(1).join('\n').trim();
        blocks.push({ title: title, content: content });
      });
    }
    var added = 0;
    blocks.forEach(function (b) {
      task.notes.push({ id: this._uid(), title: b.title, content: b.content, updatedAt: Date.now() });
      added++;
    }.bind(this));
    if (!added) { wx.showToast({ title: '未识别到笔记块', icon: 'none' }); return; }
    this.saveTasks(tasks);
    this.setData({ aiImportText: '' });
    wx.showToast({ title: '✅ 已导入 ' + added + ' 篇笔记', icon: 'success', duration: 1500 });
  },

  // ==================== 战斗轮增强 ====================
  nextCombatRound() {
    this.setData({ combatRound: this.data.combatRound + 1 });
  },

  onCombatDmgInput(e) { this.setData({ combatDmgNum: e.detail.value }); },

  // 当前行动者 HP 微调（±1）
  adjustCombatHp(e) {
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    var item = this.data.combatOrder[this.data.combatCurrent];
    if (!item || item.dead) { wx.showToast({ title: '请先点选当前行动者（未死亡）', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var idx = parseInt(item.key.slice(1));
    if (item.key.charAt(0) === 'p') {
      var p = task.players[idx];
      if (!p) return;
      var max = p.derived && p.derived.hp;
      var cur = p.playHP !== undefined ? p.playHP : max;
      p.playHP = Math.max(0, cur + delta);
    } else {
      var npc = task.npcs[idx];
      if (!npc) return;
      if (npc.hp !== null && npc.hp !== undefined) npc.hp = Math.max(0, npc.hp + delta);
    }
    this.saveTasks(tasks);
    if (!this.data.isWide) this.refreshCombatOrder(false);
  },

  // 手动扣除伤害：玩家线下掷骰报出结果，KP 输入数值直接扣血
  applyCombatDamage() {
    var item = this.data.combatOrder[this.data.combatCurrent];
    if (!item || item.dead) { wx.showToast({ title: '请先点选当前行动者（未死亡）', icon: 'none' }); return; }
    var dmg = parseInt(this.data.combatDmgNum);
    if (isNaN(dmg) || dmg < 0) { wx.showToast({ title: '请输入伤害数值', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var idx = parseInt(item.key.slice(1));
    var dead = false;
    if (item.key.charAt(0) === 'p') {
      var p = task.players[idx];
      if (!p) return;
      var max = p.derived && p.derived.hp;
      var cur = p.playHP !== undefined ? p.playHP : max;
      p.playHP = Math.max(0, cur - dmg);
      dead = p.playHP <= 0;
    } else {
      var npc = task.npcs[idx];
      if (!npc) return;
      if (npc.hp !== null && npc.hp !== undefined) {
        npc.hp = Math.max(0, npc.hp - dmg);
        dead = npc.hp <= 0;
      }
    }
    this.setData({ combatDmgNum: '' });
    this.saveTasks(tasks);
    if (!this.data.isWide) this.refreshCombatOrder(false);
    wx.showToast({
      title: '💥 ' + item.name + ' 受 ' + dmg + ' 伤害' + (dead ? '（归零）' : ''),
      icon: 'none', duration: 1500
    });
  },

  preventTouchMove() {},
});
