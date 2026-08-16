// pages/cairn-gen/cairn-gen.js — 石冢 Cairn 冒险者工具
const STORAGE_KEY = 'cairn_characters';

// 背包槽位唯一 id 计数器：inventory 元素为 {id, v} 对象，拖动排序时微信按 wx:key="id" 追踪 DOM，避免 input 组件内容串行
let _invId = 1;

// ---------- 静态数据表（拆分至 data/ 目录，保持原变量名引用） ----------
const GAME_DATA = require('./data/game-data');
const PINYIN_MAP = GAME_DATA.PINYIN_MAP;
const CAIRN_SPELLS = GAME_DATA.CAIRN_SPELLS;
const SHOP_ARMOR = GAME_DATA.SHOP_ARMOR;
const SHOP_WEAPONS = GAME_DATA.SHOP_WEAPONS;
const SHOP_GEAR = GAME_DATA.SHOP_GEAR;
const SHOP_DATA = GAME_DATA.SHOP_DATA;
const WOUNDS = GAME_DATA.WOUNDS;
const KITS = GAME_DATA.KITS;
function spellPinyin(name) {
  let r = '';
  for (const ch of name) {
    if (ch === '/') continue;
    r += PINYIN_MAP[ch] || ch;
  }
  return r;
}





Page({
  data: {
    step: 0, characters: [], char: null, _loadIndex: -1,
    invUsed: 0, dragFrom: -1, dragTarget: -1, dragOffsetY: 0, invRowStyles: [],
    showShop: false, shopCat: 'armor', shopList: [],
    showWounds: false, woundRoll: 0, woundItem: null, woundExtra: '', woundCanApply: false, woundApplyLabel: '', woundApply: null,
    diceSelected: {}, diceRolling: false, diceResult: null, diceHistory: [],
    showCheck: false, checkLabel: '', checkTarget: 0, checkRoll: 0, checkSuccess: false,
    showSpells: false, notesExpanded: false, notesExpandable: false, spellList: [], spellSearch: '',
    showKitPicker: false, kitStep: 'pick', kits: [],
    showProfileEdit: false, editProfile: {},
    showWoundEdit: false, woundEditIdx: -1, woundEditD: '',
    showExportDialog: false,
  },
  onLoad() { this.initGenData(); this.loadList(); this._dragRowH = (wx.getSystemInfoSync().windowWidth || 375) / 750 * 60; this.setData({ kits: KITS.map(k => ({ n: k.n, e: k.e, desc: k.items.join(' · '), items0: k.items.slice(0, 2).join(' · ') })) }); },
  onShow() { this.loadList(); },

  loadList() { const list = wx.getStorageSync(STORAGE_KEY) || []; this.setData({ characters: list }); },
  saveList(list) { wx.setStorageSync(STORAGE_KEY, list); this.setData({ characters: list }); },

  showKitPicker() { this.setData({ showKitPicker: true, kitStep: 'pick' }); },
  closeKitPicker() { this.setData({ showKitPicker: false }); },
  pickRandom() {
    this.setData({ showKitPicker: false });
    this._deletePending = null;
    const ch = this.generateRaw(null);
    const list = this.data.characters; list.unshift(ch); this.saveList(list); this.openChar(0);
  },
  pickKitList() { this.setData({ kitStep: 'list' }); },
  backKitList() { this.setData({ kitStep: 'pick' }); },
  pickGenerateMode(e) {
    const kit = parseInt(e.currentTarget.dataset.kit);
    this.setData({ showKitPicker: false });
    this._deletePending = null;
    const ch = this.generateRaw(kit >= 0 ? kit : null);
    const list = this.data.characters; list.unshift(ch); this.saveList(list); this.openChar(0);
  },
  openChar(e) {
    const idx = typeof e === 'number' ? e : e.currentTarget.dataset.index;
    const list = this.data.characters; if (idx < 0 || idx >= list.length) return;
    const char = JSON.parse(JSON.stringify(list[idx]));
    let inv = char.inventory || [];
    // 兼容旧数据（字符串数组）→ 对象数组 {id, v}，保证拖动时 input 按 id 追踪不串行
    inv = inv.map(s => (typeof s === 'string' ? { id: _invId++, v: s } : (s && s.v !== undefined ? s : { id: _invId++, v: '' })));
    // 兼容旧数据：行装上限（板车/马/骡子可扩展）
    if (!char.invSlots || char.invSlots < 10) char.invSlots = 10;
    // 背包压缩：非空项前移、空槽沉底（修复删除后留空隙的旧数据），并补足行装上限
    const filled = inv.filter(s => s.v && s.v.trim());
    while (filled.length < char.invSlots) filled.push({ id: _invId++, v: '' });
    char.inventory = filled;
    const invUsed = char.inventory.filter(s => s.v && s.v.trim()).length;
    // 兼容旧数据：无 max 字段则用当前值
    if (!char.strMax) { char.strMax = char.str; char.dexMax = char.dex; char.wilMax = char.wil; char.hpMax = char.hp; }
    if (char.gp === undefined) { char.gp = char.gold || 0; char.sp = 0; char.cp = 0; }
    // 冒险家信息迁移：旧数据笔记开头为「名字，出身，年龄岁\n\n描述」→ 存入 profile，笔记恢复纯粹（角色信息由信息框承载，不再写入笔记）
    if (!char.profile) {
      const m = /^(.+?)，(.+?)，(\d+)岁\n\n([\s\S]*)$/.exec(char.notes || '');
      if (m) {
        char.profile = { background: m[2], age: parseInt(m[3]) || 0, desc: m[4] };
        // 若笔记完全等于自动生成的冒险家信息，则清空（信息已迁移）
        if (char.notes === m[1] + '，' + m[2] + '，' + m[3] + '岁\n\n' + m[4]) char.notes = '';
      } else {
        char.profile = { background: char.background || '', age: char.age || 0, desc: char.description || '' };
      }
    }
    if (!char.wounds) char.wounds = [];
    const noteLen = (char.notes || '').length;
    this.setData({ step: 1, char, _loadIndex: idx, invUsed, dragFrom: -1, dragTarget: -1, dragOffsetY: 0, invRowStyles: this._blankStyles(char.invSlots), diceSelected: {}, diceResult: null, notesExpanded: false, notesExpandable: noteLen > 120 });
    // 测量背包行高（px），供拖动排序换算位移
    wx.createSelectorQuery().select('.inv-slot').boundingClientRect(rect => { if (rect && rect.height > 0) this._dragRowH = rect.height; }).exec();
    this._deletePending = null;
    // 拦截系统返回（安卓侧滑/返回键误触）：返回前弹确认框
    if (wx.enableAlertBeforeUnload) wx.enableAlertBeforeUnload({ message: '确认返回角色列表？' });
  },
  deleteChar(e) {
    const idx = e.currentTarget.dataset.index; const list = this.data.characters;
    wx.showModal({ title: '删除角色', content: '确定删除这个角色吗？', success: (res) => {
      if (!res.confirm) return; list.splice(idx, 1); this.saveList(list);
      if (this.data._loadIndex === idx) this.setData({ step: 0, char: null, _loadIndex: -1 });
    }});
  },
  saveChar() {
    this.writeStorage();
    wx.showToast({ title: '已保存', icon: 'success', duration: 1200 });
  },
  // 页面内返回按钮：直接返回（左上角不易误触）；系统返回拦截见 openChar/backToList
  backToList() { this._deletePending = null; if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload(); this.flushSave(); this.setData({ step: 0, char: null, _loadIndex: -1, diceSelected: {}, diceResult: null, diceHistory: [] }); },
  onHide() { this.flushSave(); if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload(); },
  onUnload() { this.flushSave(); if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload(); },
  // ===== 静默自动保存：所有角色操作防抖 400ms 后写入 storage，页面隐藏/退出时立即落盘 =====
  writeStorage() {
    const list = this.data.characters; const idx = this.data._loadIndex;
    if (idx >= 0 && idx < list.length) { list[idx] = JSON.parse(JSON.stringify(this.data.char)); wx.setStorageSync(STORAGE_KEY, list); }
  },
  autoSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => { this._saveTimer = null; this.writeStorage(); }, 400);
  },
  flushSave() {
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; this.writeStorage(); }
  },

  // ===== 导入导出 =====
  toggleExportDialog() { this.setData({ showExportDialog: !this.data.showExportDialog }); },
  doExportClipboard() {
    const char = this.data.char;
    if (!char) return;
    const data = JSON.parse(JSON.stringify(char));
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
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
        if (!data.name || data.str === undefined || !data.inventory) {
          wx.showToast({ title: '数据格式不符，非石冢角色', icon: 'none', duration: 2000 });
          return;
        }
        data.id = Date.now();
        // 兼容旧数据
        if (!data.strMax) { data.strMax = data.str; data.dexMax = data.dex; data.wilMax = data.wil; data.hpMax = data.hp; }
        if (data.gp === undefined) { data.gp = 0; data.sp = 0; data.cp = 0; }
        const list = that.data.characters;
        list.unshift(data);
        that.saveList(list);
        wx.showToast({ title: '已导入「' + data.name + '」', icon: 'success', duration: 1500 });
      },
      fail() { wx.showToast({ title: '读取剪贴板失败', icon: 'none', duration: 2000 }); }
    });
  },

  roll(d) { return Math.floor(Math.random() * d) + 1; },
  rollD(n, d) { let t = 0; for (let i = 0; i < n; i++) t += this.roll(d); return t; },

  generateRaw(kitIdx) {
    const D = this.gen_data;
    const sel = (t) => { const l = D[t]; if (!l) return ''; if (Array.isArray(l)) return l[Math.floor(Math.random() * l.length)]; return this.selectTable(l); };
    const expand = (s) => { let r = s, n = 50, m; while (n-- > 0 && (m = /\{(\w+)\}/.exec(r))) r = r.replace('{' + m[1] + '}', sel(m[1]) || m[1]); return r; };
    const desc = expand(sel('character'));
    const nm = desc.match(/^我叫(.+?)，曾任(.+?)。/);
    const mk = (v) => ({ id: _invId++, v: v || '' });
    let armor = '', helmet = '', weapons = '', tool = '', gear = '', trinket = '', bonus = '', aTotal = 0, inventory, invSlots = 10, kitName = '';
    if (kitIdx != null && KITS[kitIdx]) {
      // ===== 自选套装模式（规则 p11）=====
      const kit = KITS[kitIdx]; kitName = kit.n;
      let items = kit.items.slice();
      // 魔典随机化：随机法术 → 从 100 道法术中取一道；魅惑或侦测魔法 → 二选一
      items = items.map(it => {
        if (it === '魔典（魅惑或侦测魔法）') return '魔典（' + (Math.random() < 0.5 ? '魅惑' : '侦测魔法') + '）';
        if (it === '魔典（随机法术）') return '魔典（' + CAIRN_SPELLS[Math.floor(Math.random() * CAIRN_SPELLS.length)].name + '）';
        return it;
      });
      // 护甲解析：如 链甲（2 护甲，笨重）= 2、手甲（+1 护甲）= +1，合计不超过 3
      items.forEach(it => {
        const m = /（(\d)\s*护甲/.exec(it);
        if (m) aTotal += parseInt(m[1]);
        else if (it.includes('（+1 护甲）')) aTotal += 1;
      });
      if (aTotal > 3) aTotal = 3;
      // 栏位扩展：板车 +4
      if (items.some(it => it.includes('板车'))) invSlots += 4;
      inventory = [mk('口粮（3日份）'), mk('火炬')];
      let slot = 2;
      for (const it of items) {
        if (slot >= 10) break;
        if (it.includes('笨重')) { inventory[slot++] = mk(it); if (slot < 10) inventory[slot++] = mk('（笨重）'); }
        else inventory[slot++] = mk(it);
      }
      while (inventory.length < invSlots) inventory.push(mk(''));
      armor = items.find(it => it.includes('护甲')) || '';
      weapons = items.find(it => /（d\d/.test(it) && !it.includes('护甲')) || '';
      tool = items[2] || ''; gear = items[3] || ''; trinket = items[4] || ''; bonus = items[5] || '';
    } else {
      // ===== 全随机模式（原逻辑）=====
      armor = expand(sel('armor')); helmet = expand(sel('helmet')); weapons = expand(sel('weapons'));
      tool = expand(sel('tool')); gear = expand(sel('gear')); trinket = expand(sel('trinket')); bonus = expand(sel('bonus'));
      [armor, helmet].forEach(s => { if (s.includes('1')) aTotal += 1; else if (s.includes('2')) aTotal += 2; else if (s.includes('3')) aTotal += 3; });
      if (aTotal > 3) aTotal = 3;
      inventory = [mk('口粮（3日份）'), mk('火炬'), mk(), mk(), mk(), mk(), mk(), mk(), mk(), mk()];
      let slot = 2;
      for (const item of [armor, helmet, weapons, tool, gear, trinket, bonus]) {
        if (!item || item === '无上身防具' || item.startsWith('，')) continue;
        if (item.includes('笨重')) { if (slot < 10) inventory[slot++] = mk(item); if (slot < 10) inventory[slot++] = mk('（笨重）'); }
        else if (slot < 10) inventory[slot++] = mk(item);
      }
    }
    const strVal = this.rollD(3, 6), dexVal = this.rollD(3, 6), wilVal = this.rollD(3, 6), hpVal = this.roll(6);
    const name = nm ? nm[1] : '冒险者', bg = nm ? nm[2] : '', age = this.rollD(2, 20) + 10;
    // 生成的法术（魔典）→ 笔记记录对应法术信息（套装与随机模式统一扫描背包）
    const spellNotes = [];
    for (const it of inventory) {
      if (!it || !it.v) continue;
      const m = /^魔典（(.+)）$/.exec(it.v);
      if (m) {
        const sp = CAIRN_SPELLS.find(s => s.name === m[1]);
        if (sp) spellNotes.push(sp);
      }
    }
    const notes = spellNotes.map(sp => '【' + sp.name + '】' + sp.desc).join('\n');
    return { id: Date.now(), name, background: bg, description: desc,
      age,
      str: strVal, strMax: strVal, dex: dexVal, dexMax: dexVal, wil: wilVal, wilMax: wilVal,
      hp: hpVal, hpMax: hpVal, armor: aTotal,
      gp: this.rollD(3, 6), sp: 0, cp: 0,
      inventory, armorBody: armor, helmetShield: helmet, weapons, tool, gear, trinket, bonus, notes, invSlots, kit: kitName,
      profile: { background: bg, age, desc }, wounds: [] };
  },

  selectTable(list) {
    let len = 0; for (const k in list) { const r = this.keyRange(k); if (r[1] > len) len = r[1]; }
    if (!len) return ''; const idx = Math.floor(Math.random() * len) + 1;
    for (const k in list) { const r = this.keyRange(k); if (idx >= r[0] && idx <= r[1]) return list[k]; } return '';
  },
  keyRange(k) {
    const m1 = /(\d+)-00/.exec(k); if (m1) return [parseInt(m1[1]), 100];
    const m2 = /(\d+)-(\d+)/.exec(k); if (m2) return [parseInt(m2[1]), parseInt(m2[2])];
    if (k === '00') return [100, 100]; return [parseInt(k), parseInt(k)];
  },

  initGenData() {
    this.gen_data = {
      character: ['我叫{name}·{surname}，曾任{background}。我体格{physique}，皮肤{skin}，毛发{hair}，面容{face}。我言谈{speech}，衣物{clothing}。我{vice}但{virtue}，并公认{reputation}。我不幸遭受了{misfortune}。'],
      name: ['阿贡恩','碧翠丝','布瑞根','布朗温','坎诺拉','芝艾欧','埃吉欧','埃斯米','格瑞娅','赫奈恩','利兰','利拉瑟欧','丽莎白','莫拉利欧','莫格温','希泊','希欧恩','温内恩','伊格沃','伊斯伦','阿沃欧','拜文','博若斯','伯瑞德','布瑞苟','布瑞格勒','坎霍瑞欧','艾姆瑞斯','艾赛克斯','格林苟','格林维特','格鲁威德','格鲁斯','格威斯汀','曼诺格','麦欧纳克斯','奥萨克斯','崔安尼恩','温兰','伊尔米尔'],
      surname: ['阿伯纳西','阿德卡普','伯尔','坎德维克','科米克','克拉姆沃勒','邓斯沃洛','盖特瑞','格莱斯','哈克尼斯','哈珀','卢末','迈克斯谬克','斯迈斯','桑德曼','斯温尼','撒切尔','托尔门','韦弗','沃尔德'],
      background: ['炼金师','铁匠','窃贼','屠夫','木匠','牧师','赌徒','掘墓人','草药师','猎人','魔法师','佣兵','商人','矿工','亡命徒','演员','扒手','走私贩','仆从','游侠'],
      physique: ['匀称','健壮','高耸','矮胖','结实','运动','瘦长','矮小','骨瘦','软弱'], skin: ['深暗','胎记','晒黑','瘢麻','风霜','油滑','苍白','完美','玫红','纹身'],
      hair: ['光秃','编辫','油滑','波浪','卷毛','长发','稀疏','肮脏','拳曲','奢华'], face: ['棱角','方脸','骨感','锋利','凹沉','拉长','破碎','柔软','似鼠','圆润'],
      speech: ['粗钝','洪亮','单调','沙哑','隐晦','正式','结巴','严谨','尖锐','呢喃'], clothing: ['古朴','血腥','馊臭','污脏','老套','优雅','磨损','异域','制服','肮脏'],
      virtue: ['雄心','勇敢','自律','荣耀','沉着','仁慈','谦逊','宽容','合群','谨慎'], vice: ['好斗','刻薄','怯懦','狡诈','贪婪','记仇','懒惰','紧张','粗鲁','虚荣'],
      reputation: ['古怪','睿智','尊敬','雄心','丑恶','危险','诚实','粗野','懒散','逗趣'], misfortune: ['遗弃','成瘾','勒索','蒙罪','诅咒','遇骗','降职','辱没','决裂','流放'],
      armor: {'1-3':'无上身防具','4-14':'镶嵌甲（1 护甲，笨重）','15-19':'链甲（2 护甲，笨重）','20':'板甲（3 护甲，笨重）'},
      helmet: {'1-13':'，无头盔或盾牌','14-16':'，头盔（+1 护甲）','17-19':'，盾牌（+1 护甲）','20':'，头盔（+1 护甲）及盾牌（+1 护甲）'},
      weapons: {'1-10':'{wgroup1}','11-14':'{wgroup2}','15-19':'{wgroup3}','20':'{wgroup4}'},
      wgroup1: ['匕首（d6）','棍棒（d6）','杖（d6）'], wgroup2: ['剑（d8）','硬头锤（d8）','斧（d8）'],
      wgroup3: ['弓（d6，笨重）','弩（d6，笨重）','投石索（d4）'], wgroup4: ['戟（d10，笨重）','战锤（d10，笨重）','战斧（d10，笨重）'],
      armor_weapons: {'1-10':'{armor}','11-20':'{weapons}'}, tool_trinket: {'1-10':'{tool}','11-20':'{trinket}'},
      bonus: {'1-6':'{tool_trinket}','7-13':'{gear}','14-17':'{armor_weapons}','18-20':'魔典（包含法术「{spellbook}」）'},
      tool: ['风箱','水桶（叠放）','蒺藜','粉笔','凿子','炊具','撬棍','手动钻头','鱼竿','胶水（叠放）','油脂','锤子','沙漏','金属锉刀（叠放）','钉子（叠放）','网（叠放）','锯子','密封剂','铲子','钳子'],
      trinket: ['瓶子','牌组（叠放）','骰组（叠放）','脸彩','假珠宝（叠放）','号角','焚香（叠放）','乐器','透镜','弹珠（叠放）','镜子','香水','羽毛笔&墨水','盐袋（叠放）','小铃铛','肥皂（叠放）','海绵','焦油罐','细绳（叠放）','哨子'],
      gear: ['气囊','抗毒剂','板车（+4 栏位，笨重）','锁链（10\'）','道金棒','火油','抓钩','大麻袋','大陷阱','开锁器','手铐','镐子','长杆（10\'）','滑轮','驱虫剂','绳索（25\'）','结界法物','望远镜','火绒盒','狼毒草'],
      spellbook: ['黏附','锚丝','活化物体','拟人','奥术眼','星界监狱','磁吸','幻听','乱语','饵花','兽形','迷糊','换身','魅惑','命令','领悟','泡沫锥','操控植物','操控天气','治愈创伤','耳聋','侦测魔法','拆卸','伪装','移位','地震','弹性','元素墙','取物','炽光弹','雾云','狂暴','异界门','重力转移','贪婪','加速','仇恨','聆听耳语','悬浮','催眠','冰触','鉴别物主','照明','隐形系绳','敲击','跳跃','液态空气','魔法缓冲','住宅','弹珠狂欢','假面','微缩','镜影','镜行','多臂','夜球','物化','泥形','安抚','恐惧症','陷坑','原始澎湃','推/拉','复苏死者','复苏魂灵','读心','磁斥','视卜','雕塑元素','感知','护盾','遮蔽','易位','睡眠','滑溜','烟形','嗅闻','熄灭','排序','奇观','法术锯','蛛爬','召唤方块','化群','心灵遥控','心灵感应','传送','标靶','灌丛','召唤石偶','时间操控','真视','涌泉','视控','幻视','结界','蛛网','部件','法师标记','X 光透视'],
    };
  },

  doCheck(e) {
    const attr = e.currentTarget.dataset.attr; const c = this.data.char;
    const target = attr === 'str' ? c.str : attr === 'dex' ? c.dex : c.wil;
    const roll = this.roll(20); const success = roll <= target;
    this.setData({ showCheck: true, checkLabel: attr === 'str' ? '力量 STR' : attr === 'dex' ? '敏捷 DEX' : '意志 WIL', checkTarget: target, checkRoll: roll, checkSuccess: success });
  },
  closeCheck() { this.setData({ showCheck: false }); },

  statDelta(e) {
    const { field, delta } = e.currentTarget.dataset; const c = this.data.char; const d = parseInt(delta);
    if (field === 'hp') c.hp = Math.max(0, Math.min(c.hpMax, c.hp + d));
    else { c[field] = Math.max(0, c[field] + d); this.checkAttrZero(c); }
    this.setData({ char: c });
    this.autoSave();
  },
  checkAttrZero(c) {
    if (c.str <= 0) wx.showToast({ title: '⚠ 力量归零：角色死亡！', icon: 'none', duration: 2500 });
    else if (c.dex <= 0) wx.showToast({ title: '⚠ 敏捷归零：角色麻痹！', icon: 'none', duration: 2500 });
    else if (c.wil <= 0) wx.showToast({ title: '⚠ 意志归零：角色昏迷！', icon: 'none', duration: 2500 });
  },

  onArmorInput(e) { let v = parseInt(e.detail.value) || 0; if (v > 3) v = 3; const c = this.data.char; c.armor = v; this.setData({ char: c }); this.autoSave(); },
  onCoinInput(e) { const field = e.currentTarget.dataset.field; const v = parseInt(e.detail.value) || 0; const c = this.data.char; c[field] = v; this.setData({ char: c }); this.autoSave(); },

  // ===== 商店（规则 p10 装备列表） =====
  openShop() { this.setData({ showShop: true, shopCat: 'armor', shopList: SHOP_ARMOR }); },
  closeShop() { this.setData({ showShop: false }); },
  switchShopCat(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ shopCat: cat, shopList: SHOP_DATA[cat] });
  },
  buyItem(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.shopList[idx];
    if (!item) return;
    const c = this.data.char;
    // 以铜币结算（1gp = 10sp = 100cp）
    const total = (c.gp || 0) * 100 + (c.sp || 0) * 10 + (c.cp || 0);
    const cost = item.p * 100;
    if (total < cost) { wx.showToast({ title: '金币不足', icon: 'none' }); return; }
    const slots = c.invSlots || 10;
    const empty = c.inventory.filter(s => !s.v || !s.v.trim()).length;
    if (empty < item.s) { wx.showToast({ title: '背包空间不足（需 ' + item.s + ' 槽）', icon: 'none' }); return; }
    // 扣钱
    const remain = total - cost;
    c.gp = Math.floor(remain / 100); c.sp = Math.floor((remain % 100) / 10); c.cp = remain % 10;
    // 入背包（自动填入最前空槽）
    let placed = 0;
    for (let i = 0; i < slots && placed < item.s; i++) {
      if (!c.inventory[i].v || !c.inventory[i].v.trim()) { c.inventory[i].v = item.n; placed++; }
    }
    // 板车/马/骡子等扩展行装上限
    if (item.bonus) {
      c.invSlots = slots + item.bonus;
      while (c.inventory.length < c.invSlots) c.inventory.push({ id: _invId++, v: '' });
    }
    const u = c.inventory.filter(s => s.v && s.v.trim()).length;
    this.checkInvFull(c, u);
    this.setData({ char: c, invUsed: u, invRowStyles: this._blankStyles(c.invSlots) });
    this.autoSave();
    wx.showToast({ title: '已购买：' + item.n, icon: 'success', duration: 1500 });
    wx.vibrateShort({ type: 'light' });
  },

  // ===== 伤痕表（规则 p15） =====
  openWounds() { this.setData({ showWounds: true, woundRoll: 0, woundItem: null, woundExtra: '', woundCanApply: false, woundApplyLabel: '', woundApply: null }); this.rollWound(); },
  closeWounds() { this.setData({ showWounds: false }); },
  rollWound() {
    const c = this.data.char;
    const r = this.roll(12);
    const item = WOUNDS.find(w => w.d === r);
    let extra = '', canApply = false, applyLabel = '', apply = null;
    const BODY1 = ['脖子', '手', '眼', '胸', '腿', '耳'];
    const BODY4 = ['腿', '腿', '臂', '臂', '肋', '颅'];
    const ATTR = ['力量', '力量', '敏捷', '敏捷', '意志', '意志'];
    const hpMax = c.hpMax || c.hp || 0;
    let rec = ''; // 简洁记录（仅叙事结果，不含判定投掷过程）
    if (item.sub === 'body') {
      const part = (item.d === 1 ? BODY1 : BODY4)[this.roll(6) - 1];
      const chk = item.d === 1 ? this.roll(6) : this.rollD(2, 6);
      extra = '部位：' + part + '；判定投骰 ' + chk + (chk > hpMax ? '（高于最大 HP ' + hpMax + '，应重投）' : '（未超过最大 HP ' + hpMax + '，保留）');
      rec = '部位：' + part;
    } else if (item.sub === 'hpUp') {
      const n = this.roll(6);
      extra = '投骰 1d6：' + n + ' → 最大 HP +' + n;
      rec = '最大 HP +' + n;
      canApply = true; applyLabel = '最大 HP +' + n; apply = { k: 'hpMax', op: '+', n };
    } else if (item.sub === 'hpSet') {
      const n = this.rollD(2, 6);
      extra = '投骰 2d6：' + n + ' → 新最大 HP 为 ' + n;
      rec = '新最大 HP ' + n;
      canApply = true; applyLabel = '最大 HP 设为 ' + n; apply = { k: 'hpMax', op: '=', n };
    } else if (item.sub === 'attr') {
      const a = ATTR[this.roll(6) - 1];
      const cur = c[a + 'Max'] || c[a] || 0;
      const chk = this.rollD(3, 6);
      extra = '受损属性：' + a + '（当前 ' + cur + '）；投骰 3d6：' + chk + (chk > cur ? '（高于当前属性，应重投）' : '（未超过，保留）');
      rec = '受损属性：' + a;
    } else if (item.sub === 'save') {
      const sv = this.roll(20);
      if (sv <= c.wil) {
        const n = item.d === 8 ? this.roll(4) : this.roll(6);
        extra = '意志豁免 ' + sv + ' ≤ ' + c.wil + '：通过！' + (item.d === 8 ? '投骰 1d4' : '投骰 1d6') + '：' + n + ' → 最大意志 +' + n;
        rec = '意志豁免通过，最大意志 +' + n;
        canApply = true; applyLabel = '最大意志 +' + n; apply = { k: 'wilMax', op: '+', n };
      } else {
        extra = '意志豁免 ' + sv + ' > ' + c.wil + '：失败，无加成';
        rec = '意志豁免失败';
      }
    } else { // overMax：2/5/7/9/12 判定投骰
      let n, base, baseName;
      if (item.d === 2) { n = this.roll(6); base = hpMax; baseName = '最大 HP'; }
      else if (item.d === 5) { n = this.rollD(2, 6); base = hpMax; baseName = '最大 HP'; }
      else if (item.d === 7) { n = this.rollD(3, 6); base = c.dexMax || c.dex || 0; baseName = '最大敏捷'; }
      else if (item.d === 9) { n = this.rollD(3, 6); base = c.wilMax || c.wil || 0; baseName = '最大意志'; }
      else { n = this.rollD(3, 6); base = hpMax; baseName = '最大 HP'; }
      extra = '判定投骰 ' + n + '（' + baseName + ' ' + base + '）' + (n > base ? '：高于上限，应重投' : '：未超过，保留');
    }
    this._woundRec = rec;
    this.setData({ woundRoll: r, woundItem: item, woundExtra: extra, woundCanApply: canApply, woundApplyLabel: applyLabel, woundApply: apply });
    wx.vibrateShort({ type: 'light' });
  },
  applyWound() {
    const c = this.data.char;
    const item = this.data.woundItem;
    if (!item) return;
    const ap = this.data.woundApply;
    if (ap) {
      if (ap.op === '+') c[ap.k] = (c[ap.k] || 0) + ap.n;
      else if (ap.op === '=') { c[ap.k] = ap.n; if (c.hp > c.hpMax) c.hp = c.hpMax; }
    }
    // 伤痕有叙事属性：无论是否有属性变化，玩家确认的最终结果一律记录
    const now = new Date();
    const ts = (now.getMonth() + 1) + '/' + now.getDate() + ' ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    c.wounds = c.wounds || [];
    c.wounds.unshift({ t: item.t, d: this._woundRec || '', ts });
    this.setData({ char: c });
    this.autoSave();
    wx.showToast({ title: '已应用并记录', icon: 'success', duration: 1500 });
    this.closeWounds();
  },
  // 受伤记录：进入编辑后才能删除
  openWoundEdit(e) {
    const idx = e.currentTarget.dataset.index;
    const w = this.data.char.wounds[idx];
    if (!w) return;
    this.setData({ showWoundEdit: true, woundEditIdx: idx, woundEditD: w.d });
  },
  closeWoundEdit() { this.setData({ showWoundEdit: false }); },
  onWoundEditInput(e) { this.setData({ woundEditD: e.detail.value }); },
  saveWoundEdit() {
    const c = this.data.char;
    const w = c.wounds[this.data.woundEditIdx];
    if (w) { w.d = this.data.woundEditD; this.setData({ char: c }); this.autoSave(); }
    this.closeWoundEdit();
    wx.showToast({ title: '已保存', icon: 'success', duration: 1200 });
  },
  confirmDeleteWound() {
    const idx = this.data.woundEditIdx;
    wx.showModal({
      title: '删除受伤记录',
      content: '确定删除这条受伤记录吗？',
      success: (res) => {
        if (!res.confirm) return;
        const c = this.data.char;
        c.wounds.splice(idx, 1);
        this.setData({ char: c });
        this.autoSave();
        this.closeWoundEdit();
      }
    });
  },
  // ===== 冒险家信息编辑 =====
  openProfileEdit() {
    const p = this.data.char.profile || {};
    this.setData({ showProfileEdit: true, editProfile: { name: this.data.char.name || '', background: p.background || '', age: p.age || '', desc: p.desc || '' } });
  },
  closeProfileEdit() { this.setData({ showProfileEdit: false }); },
  onEditProfileInput(e) {
    const f = e.currentTarget.dataset.field;
    this.setData({ editProfile: { ...this.data.editProfile, [f]: e.detail.value } });
  },
  saveProfileEdit() {
    const c = this.data.char;
    const ep = this.data.editProfile;
    if (ep.name !== undefined && ep.name.trim()) c.name = ep.name.trim();
    c.profile = { background: (ep.background || '').trim(), age: ep.age ? (parseInt(ep.age) || 0) : 0, desc: ep.desc || '' };
    this.setData({ char: c, showProfileEdit: false });
    this.autoSave();
    wx.showToast({ title: '已保存', icon: 'success', duration: 1200 });
  },
  // 一键复制角色信息（名字、出身、年龄、特质）
  copyProfile() {
    const c = this.data.char;
    const p = c.profile || {};
    const text = '【' + c.name + '】\n' +
      '出身：' + (p.background || '—') + '\n' +
      '年龄：' + (p.age || '—') + '\n' +
      '特质：' + (p.desc || '—');
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制角色信息', icon: 'success', duration: 1500 }) });
  },

  onInvInput(e) { const idx = e.currentTarget.dataset.index; const c = this.data.char; c.inventory[idx].v = e.detail.value; const u = c.inventory.filter(s => s.v && s.v.trim()).length; this.checkInvFull(c, u); this.setData({ char: c, invUsed: u }); this.autoSave(); },
  deleteInvItem(e) {
    const idx = e.currentTarget.dataset.index;
    const now = Date.now();
    const prev = this._deletePending;
    // 同一槽位且在800ms内再次点击 → 执行删除
    if (prev && prev.idx === idx && now - prev.time < 800) {
      this._deletePending = null;
      const c = this.data.char;
      if (!c.inventory[idx] || !c.inventory[idx].v || !c.inventory[idx].v.trim()) return;
      c.inventory.splice(idx, 1); // 移除该项，后续项目自动前移补位
      const slots = c.invSlots || 10;
      while (c.inventory.length < slots) c.inventory.push({ id: _invId++, v: '' }); // 补足行装上限
      const u = c.inventory.filter(s => s.v && s.v.trim()).length;
      this.setData({ char: c, invUsed: u, dragFrom: -1, dragTarget: -1, dragOffsetY: 0, invRowStyles: this._blankStyles(c.invSlots) });
      this.autoSave();
      return;
    }
    // 首次点击 → 记录并提示
    this._deletePending = { idx, time: now };
    wx.showToast({ title: '再次点击删除', icon: 'none', duration: 1200 });
  },
  // ===== 背包拖动排序（按住左侧把手上下拖，带平滑让位动画） =====
  _dragStartY: 0, _dragStartIndex: -1, _dragOrig: null, _dragRowH: 30,
  _slots() { return (this.data.char && this.data.char.invSlots) || 10; },
  _blankStyles(slots) { return new Array(slots || this._slots()).fill(''); },
  onDragStart(e) {
    const idx = e.currentTarget.dataset.index;
    const c = this.data.char;
    if (!c || !c.inventory[idx] || !c.inventory[idx].v || !c.inventory[idx].v.trim()) return; // 空槽不可拖
    this._dragStartY = e.touches[0].clientY;
    this._dragStartIndex = idx;
    this._dragOrig = c.inventory.slice(); // 起始快照（拖动结束才真正重排）
    this.setData({ dragFrom: idx, dragTarget: idx, dragOffsetY: 0, invRowStyles: this.buildRowStyles(idx, idx, 0) });
    wx.vibrateShort({ type: 'light' });
  },
  onDragMove(e) {
    if (this._dragStartIndex < 0 || !this._dragOrig) return;
    const dy = e.touches[0].clientY - this._dragStartY;
    const rowH = this._dragRowH || 30;
    const nonEmpty = this._dragOrig.filter(s => s.v && s.v.trim()).length; // 空槽沉底，只在前 N 项之间排序
    let target = this._dragStartIndex + Math.round(dy / rowH);
    target = Math.max(0, Math.min(nonEmpty - 1, target));
    const changed = target !== this.data.dragTarget;
    this.setData({ dragOffsetY: dy, dragTarget: target, invRowStyles: this.buildRowStyles(this._dragStartIndex, target, dy) });
    if (changed) wx.vibrateShort({ type: 'light' });
  },
  onDragEnd() {
    if (this._dragStartIndex < 0 || !this._dragOrig) return;
    const from = this._dragStartIndex;
    const dy = this.data.dragOffsetY;
    const rowH = this._dragRowH || 30;
    const nonEmpty = this._dragOrig.filter(s => s.v && s.v.trim()).length;
    const finalTarget = Math.max(0, Math.min(nonEmpty - 1, from + Math.round(dy / rowH)));
    if (finalTarget === from) {
      // 没有移动：直接复位
      this._dragStartIndex = -1; this._dragOrig = null;
      this.setData({ dragFrom: -1, dragTarget: -1, dragOffsetY: 0, invRowStyles: this._blankStyles() });
      return;
    }
    // 两帧归位动画：
    // 帧1：立即重排数据，并把被拖行"钉"在视觉当前位置（无过渡），其他行此时已无缝就位
    const c = this.data.char;
    const arr = this._dragOrig.slice();
    const [item] = arr.splice(from, 1);
    arr.splice(finalTarget, 0, item);
    c.inventory = arr;
    const styles = this._blankStyles();
    styles[finalTarget] = `transform: translateY(${dy + (from - finalTarget) * rowH}px); transition: none;`;
    this._dragStartIndex = -1; this._dragOrig = null;
    this.setData({ char: c, dragFrom: -1, dragTarget: -1, dragOffsetY: 0, invRowStyles: styles }, () => {
      // 帧2：清空位移，被拖行带过渡滑入目标槽位（若期间用户已开始新拖动则跳过）
      if (this.data.dragFrom === -1) this.setData({ invRowStyles: this._blankStyles() });
    });
    this.autoSave();
  },
  // 计算每行的位移样式：被拖行跟随手指，其余行让位（transition 由 CSS 类提供）
  buildRowStyles(from, target, offsetY) {
    const rowH = this._dragRowH || 30;
    const styles = this._blankStyles();
    if (from < 0) return styles;
    for (let i = 0; i < styles.length; i++) {
      if (i === from) {
        styles[i] = `transform: translateY(${offsetY}px); transition: none;`;
      } else {
        let sh = 0;
        if (target > from && i > from && i <= target) sh = -rowH; // 下方行上移让位
        else if (target < from && i >= target && i < from) sh = rowH; // 上方行下移让位
        styles[i] = sh ? `transform: translateY(${sh}px);` : '';
      }
    }
    return styles;
  },
  addFatigue() { const c = this.data.char; const slots = c.invSlots || 10; for (let i = 0; i < slots; i++) { if (!c.inventory[i].v || c.inventory[i].v.trim() === '') { c.inventory[i].v = '疲乏'; break; } } const u = c.inventory.filter(s => s.v && s.v.trim()).length; this.checkInvFull(c, u); this.setData({ char: c, invUsed: u }); this.autoSave(); },
  addBulk() { const c = this.data.char; const slots = c.invSlots || 10; for (let i = 0; i < slots; i++) { if (!c.inventory[i].v || c.inventory[i].v.trim() === '') { c.inventory[i].v = '（笨重）'; break; } } const u = c.inventory.filter(s => s.v && s.v.trim()).length; this.checkInvFull(c, u); this.setData({ char: c, invUsed: u }); this.autoSave(); },
  checkInvFull(c, used) { const slots = c.invSlots || 10; if (used > slots && c.hp > 0) { c.hp = 0; wx.showToast({ title: '⚠ 背包超载！HP 降至 0', icon: 'none', duration: 2500 }); } },

  _lastLongpress: 0,
  selectDice(e) { if (this.data.diceRolling) return; const now = Date.now(); if (now - this._lastLongpress < 400) return; const d = parseInt(e.currentTarget.dataset.d); const sel = { ...this.data.diceSelected }; sel[d] = (sel[d] || 0) + 1; this.setData({ diceSelected: sel, diceResult: null }); },
  deselectDice(e) { if (this.data.diceRolling) return; this._lastLongpress = Date.now(); const d = parseInt(e.currentTarget.dataset.d); const sel = { ...this.data.diceSelected }; if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; } this.setData({ diceSelected: sel, diceResult: null }); },
  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },
  clearHistory() { this.setData({ diceHistory: [] }); },
  rollSelected() {
    const sel = this.data.diceSelected, keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null }); wx.vibrateShort({ type: 'medium' });
    const dice = []; let total = 0;
    keys.forEach(k => { const sides = parseInt(k), count = sel[k]; for (let i = 0; i < count; i++) { const r = this.roll(sides); dice.push({ sides, result: r }); total += r; } });
    setTimeout(() => { const result = { dice, total, time: new Date().toLocaleTimeString() }; const history = [result, ...this.data.diceHistory].slice(0, 50); this.setData({ diceRolling: false, diceResult: result, diceHistory: history }); }, 700);
  },

  onNotesInput(e) {
    const c = this.data.char; c.notes = e.detail.value;
    const noteLen = (c.notes || '').length;
    this.setData({ char: c, notesExpandable: noteLen > 120 });
    this.autoSave();
  },
  toggleNotes() { this.setData({ notesExpanded: !this.data.notesExpanded }); },

  openSpells() {
    const list = CAIRN_SPELLS.map((s, i) => ({ ...s, seq: i + 1 }));
    this.setData({ showSpells: true, spellList: list, spellSearch: '' });
  },
  closeSpells() { this.setData({ showSpells: false }); },
  onSpellSearch(e) {
    const v = e.detail.value;
    if (!v) {
      const list = CAIRN_SPELLS.map((s, i) => ({ ...s, seq: i + 1 }));
      this.setData({ spellSearch: v, spellList: list });
      return;
    }
    const q = v.toUpperCase();
    const list = CAIRN_SPELLS
      .map((s, i) => ({ ...s, seq: i + 1 }))
      .filter(s => s.name.includes(v) || s.desc.includes(v) || spellPinyin(s.name).includes(q));
    this.setData({ spellSearch: v, spellList: list });
  },
  appendSpell(e) {
    const name = e.currentTarget.dataset.name;
    const spell = CAIRN_SPELLS.find(s => s.name === name);
    if (!spell) return;
    const c = this.data.char;
    c.notes = (c.notes || '') + '\n【' + spell.name + '】' + spell.desc;
    this.setData({ char: c, notesExpandable: true, notesExpanded: true });
    this.autoSave();
    wx.showToast({ title: '已添加「' + spell.name + '」', icon: 'success', duration: 1200 });
  },
  preventTouchMove() {},
});
