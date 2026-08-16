// pages/liminal-horror-gen/liminal-horror-gen.js
// 阈限恐怖 Liminal Horror — 调查员生成 & 游玩工具
const STORAGE_KEY = 'lh_characters';

// ---------- 静态数据表（拆分至 data/ 目录，保持原变量名引用） ----------
const GAME_DATA = require('./data/game-data');
const BACKGROUNDS = GAME_DATA.BACKGROUNDS;
const BLOOM_ARCHETYPES = GAME_DATA.BLOOM_ARCHETYPES;
const APPEARANCES = GAME_DATA.APPEARANCES;
const FIRST_ENCOUNTERS = GAME_DATA.FIRST_ENCOUNTERS;
const IDEOLOGIES = GAME_DATA.IDEOLOGIES;
const TRAITS = GAME_DATA.TRAITS;
const COND_KEYS = GAME_DATA.COND_KEYS;
const COND_LABELS = GAME_DATA.COND_LABELS;
const SHOP_ITEMS = GAME_DATA.SHOP_ITEMS;
const MODULES = GAME_DATA.MODULES;
const MALE_NAMES = GAME_DATA.MALE_NAMES;
const FEMALE_NAMES = GAME_DATA.FEMALE_NAMES;

function fmtTime(ts) { const d = new Date(ts); const M = String(d.getMonth()+1).padStart(2,'0'); const D = String(d.getDate()).padStart(2,'0'); const h = String(d.getHours()).padStart(2,'0'); const m = String(d.getMinutes()).padStart(2,'0'); return M + '-' + D + ' ' + h + ':' + m; }

function roll(d) { return Math.floor(Math.random() * d) + 1; }
function rollD(n, d) { let t = 0; for (let i = 0; i < n; i++) t += roll(d); return t; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function parseBackground(bgStr) {
  const idx = bgStr.indexOf('：');
  const name = idx >= 0 ? bgStr.slice(0, idx) : bgStr;
  let rest = idx >= 0 ? bgStr.slice(idx + 1) : '';
  // 繁孽格式："描述。携带：物品列表" → 提取"携带："后的物品
  let itemsPart = rest;
  const carryIdx = rest.indexOf('携带：');
  if (carryIdx >= 0) {
    itemsPart = rest.slice(carryIdx + 3); // "携带："之后
  }
  itemsPart = itemsPart.replace(/。$/, '').trim();
  let armor = 0;
  const armorMatches = bgStr.match(/\+(\d+)\s*护甲/g);
  if (armorMatches) armor = armorMatches.reduce((s, m) => s + parseInt(m.match(/\+(\d+)/)[1]), 0);
  const items = itemsPart ? itemsPart.split(/[，,、]/).map(s => s.trim()).filter(Boolean) : [];
  return { name, armor, items };
}

function countSlots(inv) {
  return inv.reduce((s, item) => s + (item && item.trim() ? (item.includes('笨重') ? 2 : 1) : 0), 0);
}

Page({
  data: {
    step: 0, characters: [], char: null, _loadIndex: -1,
    invUsed: 0,
    diceSelected: {}, diceRolling: false, diceResult: null, diceHistory: [],
    showCheck: false, checkLabel: '', checkTarget: 0, checkRoll: 0, checkSuccess: false,
    showExportDialog: false,
    showShop: false, shopSearch: '', shopCats: [],
    showNameDialog: false, newCharName: '', activeModule: 'core',
    notesExpandable: false, notesExpanded: false,
    // 临时状态（步进1中编辑用）
    _deletePending: null
  },

  onLoad() { this.loadList(); },
  onShow() { this.loadList(); },

  loadList() {
    const list = wx.getStorageSync(STORAGE_KEY) || [];
    // 预格式化时间
    list.forEach(ch => {
      const ts = ch.updatedAt || ch.createdAt;
      ch._time = ts ? fmtTime(ts) : '';
    });
    this.setData({ characters: list });
  },
  saveList(list) {
    // 格式化显示时间（不持久化）
    list.forEach(ch => {
      const ts = ch.updatedAt || ch.createdAt;
      ch._time = ts ? fmtTime(ts) : '';
    });
    // 写入存储前剥离临时字段
    const clean = list.map(function(ch) {
      var copy = {};
      for (var k in ch) { if (k !== '_time') copy[k] = ch[k]; }
      return copy;
    });
    wx.setStorageSync(STORAGE_KEY, clean);
    this.setData({ characters: list });
  },

  /* ========== Step 0: 角色列表 ========== */
  startNew() {
    this.saveChar();
    this.setData({ showNameDialog: true, newCharName: '', activeModule: 'core' });
  },

  onNewNameInput(e) { this.setData({ newCharName: e.detail.value }); },

  pickMaleName() { this.setData({ newCharName: pick(MALE_NAMES) }); },
  pickFemaleName() { this.setData({ newCharName: pick(FEMALE_NAMES) }); },

  switchModule(e) {
    this.setData({ activeModule: e.currentTarget.dataset.key });
  },

  confirmNewChar() {
    const name = this.data.newCharName.trim();
    if (!name) { wx.showToast({ title: '请输入调查员姓名', icon: 'none' }); return; }
    this.setData({ showNameDialog: false });
    this._deletePending = null;
    const ch = this.generateRaw(name, this.data.activeModule);
    const list = this.data.characters;
    list.unshift(ch);
    this.saveList(list);
    this.openChar(0);
  },

  cancelNewChar() { this.setData({ showNameDialog: false }); },

  openChar(e) {
    const idx = typeof e === 'number' ? e : e.currentTarget.dataset.index;
    const list = this.data.characters;
    if (idx < 0 || idx >= list.length) return;
    const char = JSON.parse(JSON.stringify(list[idx]));
    const invUsed = countSlots(char.inventory);
    const noteLen = (char.notes || '').length;
    this.setData({
      step: 1, char, _loadIndex: idx, invUsed,
      diceSelected: {}, diceResult: null,
      notesExpanded: false, notesExpandable: noteLen > 120
    });
    this._deletePending = null;
  },

  deleteChar(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.characters;
    wx.showModal({
      title: '删除角色', content: '确定删除这个调查员吗？',
      success: (res) => {
        if (!res.confirm) return;
        list.splice(idx, 1);
        this.saveList(list);
        if (this.data._loadIndex === idx) this.setData({ step: 0, char: null, _loadIndex: -1 });
      }
    });
  },

  saveChar() {
    const list = this.data.characters;
    const idx = this.data._loadIndex;
    if (idx >= 0 && idx < list.length) {
      const data = JSON.parse(JSON.stringify(this.data.char));
      data.updatedAt = Date.now();
      list[idx] = data;
      this.saveList(list);
      wx.showToast({ title: '已保存', icon: 'success', duration: 1200 });
    }
  },

  backToList() {
    this._deletePending = null;
    this.saveChar();
    this.setData({ step: 0, char: null, _loadIndex: -1, diceSelected: {}, diceResult: null, diceHistory: [] });
  },

  /* ========== 角色生成 ========== */
  generateRaw(name, moduleKey) {
    const strVal = rollD(3, 6), agiVal = rollD(3, 6), wilVal = rollD(3, 6);
    const hpVal = roll(6), luckVal = rollD(3, 6), moneyVal = roll(6) * 100;
    const mod = MODULES.find(m => m.key === moduleKey) || MODULES[0];
    const bgStr = pick(mod.backgrounds);
    const bg = parseBackground(bgStr);

    const inventory = ['智能手机'];
    for (const item of bg.items) {
      if (inventory.length < 10) inventory.push(item);
    }
    while (inventory.length < 10) inventory.push('');

    const now = Date.now();
    return {
      id: now,
      name: name || '',
      module: moduleKey,
      background: bg.name,
      backgroundRaw: bgStr,
      strength: strVal, strengthMax: strVal,
      agility: agiVal, agilityMax: agiVal,
      will: wilVal, willMax: wilVal,
      hp: hpVal, hpMax: hpVal,
      armor: bg.armor,
      stability: 0,
      luck: luckVal, luckMax: luckVal,
      money: moneyVal,
      inventory,
      conditions: {},
      fallout: [],
      details: {
        appearance: pick(APPEARANCES),
        firstEncounter: pick(FIRST_ENCOUNTERS),
        ideology: pick(IDEOLOGIES),
        traits: {
          physique:   pick(TRAITS.physique),
          face:       pick(TRAITS.face),
          speech:     pick(TRAITS.speech),
          virtue:     pick(TRAITS.virtue),
          vice:       pick(TRAITS.vice),
          misfortune: pick(TRAITS.misfortune)
        }
      },
      notes: '',
      createdAt: now,
      updatedAt: now
    };
  },

  /* ========== 属性 & HP 增减 ========== */
  statDelta(e) {
    const { field, delta } = e.currentTarget.dataset;
    const c = this.data.char;
    const d = parseInt(delta);
    const maxField = field + 'Max';

    if (field === 'hp') {
      if (c.conditions && c.conditions.deprived) {
        wx.showToast({ title: '⚠ 处于"匮乏"状态，无法恢复 HP', icon: 'none', duration: 2000 });
        return;
      }
      c.hp = Math.max(0, Math.min(c.hpMax, c.hp + d));
    } else if (field === 'armor' || field === 'stability') {
      c[field] = Math.max(0, (c[field] || 0) + d);
    } else if (field === 'luck') {
      c.luck = Math.max(0, (c.luck || 0) + d);
    } else if (field === 'money') {
      c.money = Math.max(0, (c.money || 0) + d * 10);
    } else {
      c[field] = Math.max(0, c[field] + d);
      this.checkAttrZero(c);
    }
    this.setData({ char: c });
  },

  checkAttrZero(c) {
    if (c.strength <= 0) wx.showToast({ title: '⚠ 力量归零：调查员死亡！', icon: 'none', duration: 2500 });
    else if (c.agility <= 0) wx.showToast({ title: '⚠ 敏捷归零：调查员瘫痪！', icon: 'none', duration: 2500 });
    else if (c.will <= 0) wx.showToast({ title: '⚠ 意志归零：调查员迷失！', icon: 'none', duration: 2500 });
  },

  /* ========== 金钱输入 ========== */
  onMoneyInput(e) {
    const c = this.data.char;
    c.money = parseInt(e.detail.value) || 0;
    this.setData({ char: c });
  },

  onArmorInput(e) {
    let v = parseInt(e.detail.value) || 0;
    const c = this.data.char; c.armor = v; this.setData({ char: c });
  },

  onStabilityInput(e) {
    let v = parseInt(e.detail.value) || 0;
    const c = this.data.char; c.stability = v; this.setData({ char: c });
  },

  /* ========== 豁免检定 (d20 ≤ 属性) ========== */
  doCheck(e) {
    const attr = e.currentTarget.dataset.attr;
    const c = this.data.char;
    let target;
    if (attr === 'luck') {
      target = c.luck;
      this.setData({ showCheck: true, checkLabel: '幸运', checkTarget: target });
    } else {
      const map = { strength: '力量 STR', agility: '敏捷 AGI', will: '意志 WIL' };
      target = c[attr];
      this.setData({ showCheck: true, checkLabel: map[attr] || attr, checkTarget: target });
    }
    const r = roll(20);
    const success = r <= target;
    wx.vibrateShort({ type: success ? 'light' : 'heavy' });
    this.setData({ checkRoll: r, checkSuccess: success });
  },

  closeCheck() { this.setData({ showCheck: false }); },

  /* ========== 状态 toggle ========== */
  toggleCondition(e) {
    const key = e.currentTarget.dataset.key;
    const c = this.data.char;
    if (!c.conditions) c.conditions = {};
    if (c.conditions[key]) delete c.conditions[key];
    else c.conditions[key] = true;
    this.setData({ char: c });
  },

  /* ========== 背包 ========== */
  onInvInput(e) {
    const idx = e.currentTarget.dataset.index;
    const c = this.data.char;
    c.inventory[idx] = e.detail.value;
    // 确保始终有10个槽
    while (c.inventory.length < 10) c.inventory.push('');
    const used = countSlots(c.inventory);
    this.checkInvFull(c, used);
    this.setData({ char: c, invUsed: used });
  },

  deleteInvItem(e) {
    const idx = e.currentTarget.dataset.index;
    const now = Date.now();
    const prev = this._deletePending;
    if (prev && prev.idx === idx && now - prev.time < 800) {
      this._deletePending = null;
      const c = this.data.char;
      c.inventory[idx] = '';
      const used = countSlots(c.inventory);
      this.setData({ char: c, invUsed: used });
      return;
    }
    this._deletePending = { idx, time: now };
    wx.showToast({ title: '再次点击删除', icon: 'none', duration: 1200 });
  },

  addBulkItem() {
    const c = this.data.char;
    const used = countSlots(c.inventory);
    if (used + 2 > 10) { wx.showToast({ title: '⚠ 行装栏不足！', icon: 'none', duration: 1500 }); return; }
    // 找第一个空槽填入
    for (let i = 0; i < c.inventory.length; i++) {
      if (!c.inventory[i] || !c.inventory[i].trim()) { c.inventory[i] = '（笨重）'; break; }
    }
    const newUsed = countSlots(c.inventory);
    this.checkInvFull(c, newUsed);
    this.setData({ char: c, invUsed: newUsed });
  },

  checkInvFull(c, used) {
    if (used > 10 && c.hp > 0) {
      c.hp = 0;
      wx.showToast({ title: '⚠ 行装超载！HP 降至 0', icon: 'none', duration: 2500 });
    }
  },

  /* ========== 姓名 ========== */
  onNameInput(e) {
    const c = this.data.char;
    c.name = e.detail.value;
    this.setData({ char: c });
  },

  /* ========== 备注 ========== */
  onNotesInput(e) {
    const c = this.data.char;
    c.notes = e.detail.value;
    const noteLen = (c.notes || '').length;
    this.setData({ char: c, notesExpandable: noteLen > 120 });
  },
  toggleNotes() { this.setData({ notesExpanded: !this.data.notesExpanded }); },

  /* ========== 掷骰 ========== */
  _lastLongpress: 0,
  selectDice(e) {
    if (this.data.diceRolling) return;
    const now = Date.now();
    if (now - this._lastLongpress < 400) return;
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = Object.assign({}, this.data.diceSelected);
    sel[d] = (sel[d] || 0) + 1;
    this.setData({ diceSelected: sel, diceResult: null });
  },
  deselectDice(e) {
    if (this.data.diceRolling) return;
    this._lastLongpress = Date.now();
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = Object.assign({}, this.data.diceSelected);
    if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; }
    this.setData({ diceSelected: sel, diceResult: null });
  },
  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },
  clearHistory() { this.setData({ diceHistory: [] }); },

  rollSelected() {
    const sel = this.data.diceSelected;
    const keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null });
    wx.vibrateShort({ type: 'medium' });
    const dice = [];
    let total = 0;
    keys.forEach(k => {
      const sides = parseInt(k), count = sel[k];
      for (let i = 0; i < count; i++) { const r = roll(sides); dice.push({ sides, result: r }); total += r; }
    });
    setTimeout(() => {
      const result = { dice, total, time: new Date().toLocaleTimeString() };
      const history = [result].concat(this.data.diceHistory).slice(0, 50);
      this.setData({ diceRolling: false, diceResult: result, diceHistory: history });
    }, 700);
  },

  /* ========== 商店 ========== */
  _buildShopCats(items) {
    const cats = ['武器','护甲','工具','载具','杂物'];
    const indexed = items.map(function(s, i) {
      var copy = {}; for (var k in s) copy[k] = s[k];
      copy._idx = i; return copy;
    });
    return cats.map(c => {
      const catItems = indexed.filter(s => s.cat === c);
      return { cat: c, count: catItems.length, items: catItems };
    }).filter(c => c.items.length > 0);
  },
  openShop() {
    this.setData({ showShop: true, shopCats: this._buildShopCats(SHOP_ITEMS), shopSearch: '' });
  },
  closeShop() { this.setData({ showShop: false }); },
  onShopSearch(e) {
    const v = e.detail.value;
    if (!v) { this.setData({ shopSearch: v, shopCats: this._buildShopCats(SHOP_ITEMS) }); return; }
    const filtered = SHOP_ITEMS.filter(s => s.name.includes(v) || s.desc.includes(v) || s.cat.includes(v));
    this.setData({ shopSearch: v, shopCats: this._buildShopCats(filtered) });
  },
  addShopItem(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const all = SHOP_ITEMS;
    const item = all[idx];
    if (!item) return;
    const c = this.data.char;
    const slotsNeeded = item.bulky ? 2 : 1;
    const used = countSlots(c.inventory);
    if (used + slotsNeeded > 10) {
      wx.showToast({ title: '⚠ 行装栏不足！', icon: 'none', duration: 2000 });
      return;
    }
    let itemName = item.name;
    if (item.desc) itemName += '（' + item.desc + '）';
    if (item.bulky) itemName += '（笨重）';
    for (let i = 0; i < c.inventory.length; i++) {
      if (!c.inventory[i] || !c.inventory[i].trim()) { c.inventory[i] = itemName; break; }
    }
    const newUsed = countSlots(c.inventory);
    this.checkInvFull(c, newUsed);
    this.setData({ char: c, invUsed: newUsed });
    wx.showToast({ title: '已添加「' + item.name + '」', icon: 'success', duration: 1200 });
  },

  /* ========== 导出导入 ========== */
  toggleExportDialog() { this.setData({ showExportDialog: !this.data.showExportDialog }); },

  doExportClipboard() {
    const char = this.data.char;
    if (!char) return;
    wx.setClipboardData({
      data: JSON.stringify(JSON.parse(JSON.stringify(char)), null, 2),
      success: () => { wx.showToast({ title: '角色数据已复制', icon: 'success', duration: 1500 }); this.toggleExportDialog(); },
      fail: () => { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  importCharacter() {
    const that = this;
    wx.getClipboardData({
      success(res) {
        let data;
        try { data = JSON.parse(res.data); } catch (e) { wx.showToast({ title: '剪贴板中没有有效的角色数据', icon: 'none', duration: 2000 }); return; }
        if (!data.strength === undefined || !data.inventory) {
          wx.showToast({ title: '数据格式不符，非 LH 调查员', icon: 'none', duration: 2000 });
          return;
        }
        data.id = Date.now();
        const list = that.data.characters;
        list.unshift(data);
        that.saveList(list);
        wx.showToast({ title: '已导入「' + (data.name || '未命名') + '」', icon: 'success', duration: 1500 });
      },
      fail() { wx.showToast({ title: '读取剪贴板失败', icon: 'none', duration: 2000 }); }
    });
  },

  preventTouchMove() {}
});
