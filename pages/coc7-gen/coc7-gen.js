// pages/coc7-gen/coc7-gen.js — COC 调查员工具
// ============================================================
// 数据来源：COC7空白卡CY2lusFinal (1).xlsx 分析结果
// 注意：所有角色数据仅保存到手机本地（wx.setStorageSync）
// ============================================================

// ---------- 静态数据表（拆分至 data/ 目录，保持原变量名引用） ----------
var SKILLS_DATA = require('./data/skills');
var CAT_LABELS = SKILLS_DATA.CAT_LABELS;
var CAT_ORDER = SKILLS_DATA.CAT_ORDER;
var ALL_SKILLS = SKILLS_DATA.ALL_SKILLS;
var FREE_SKILL_ALIAS = SKILLS_DATA.FREE_SKILL_ALIAS;
var CN_NUM = SKILLS_DATA.CN_NUM;

var NAMES_DATA = require('./data/names');
var MALE_NAMES = NAMES_DATA.MALE_NAMES;
var FEMALE_NAMES = NAMES_DATA.FEMALE_NAMES;

var OCCUPATIONS = require('./data/occupations').OCCUPATIONS;
var WEAPONS_1920S = require('./data/weapons').WEAPONS_1920S;
var traits_dictionary = require('./data/traits').traits_dictionary;
var PRESET_CHARACTERS = require('./data/presets').PRESET_CHARACTERS;
var KEEPER_RULES = require('../coc-keeper/data/rules').RULES_SECTIONS;

// ---------- 武器分类 ----------
function getWeaponCategory(w) {
  const meleeSkills = ['斗殴', '剑', '斧', '矛', '鞭子', '绞具', '链枷', '电锯'];
  if (meleeSkills.includes(w.skill)) return '🗡️ 近战';
  if (w.skill === '手枪') return '🔫 手枪';
  if (w.skill === '步枪/霰弹枪') return '🎯 步枪';
  if (w.skill === '冲锋枪') return '💥 冲锋枪';
  if (w.skill === '机枪') return '🎪 机枪';
  if (w.skill === '弓') return '🏹 弓弩';
  if (['投掷', '爆破', '炮术'].includes(w.skill)) return '💣 爆炸';
  return '🔥 特殊';
}
function groupWeapons(list) {
  const map = {};
  for (const w of list) {
    const cat = getWeaponCategory(w);
    if (!map[cat]) map[cat] = [];
    map[cat].push(w);
  }
  const order = ['🗡️ 近战', '🔫 手枪', '🎯 步枪', '💥 冲锋枪', '🎪 机枪', '🏹 弓弩', '💣 爆炸', '🔥 特殊'];
  return order.filter(c => map[c]).map(c => ({ cat: c, weapons: map[c] }));
}

// ---------- 工具函数 ----------
function calcOccPoints(formula, edu, app, dex, str, pow) {
  if (!formula) return edu * 4;
  // 教育×4
  if (formula.includes('教育×4')) return edu * 4;
  // 教育×2＋敏捷×2
  if (formula.includes('教育×2') && formula.includes('敏捷×2')) return edu * 2 + dex * 2;
  // 教育×2＋外貌×2
  if (formula.includes('教育×2') && formula.includes('外貌×2')) return edu * 2 + app * 2;
  // 教育×2＋力量×2
  if (formula.includes('教育×2') && formula.includes('力量×2')) return edu * 2 + str * 2;
  // 教育×2＋力量或敏捷×2
  if (formula.includes('或敏捷') || formula.includes('或力量')) return edu * 2 + Math.max(str * 2, dex * 2);
  // 教育×2＋外貌或意志×2（意志=POW，取二者较高）
  if (formula.includes('或意志') || formula.includes('外貌或')) return edu * 2 + Math.max(app * 2, (pow || app) * 2);
  // 教育×2＋敏捷或外貌×2
  if (formula.includes('敏捷或外貌')) return edu * 2 + Math.max(dex * 2, app * 2);
  // Default
  return edu * 4;
}

function getSkillBase(name, edu, dex, specs) {
  if (name === '母语') return edu;
  if (name === '闪避') return Math.floor(dex / 2);
  const sk = ALL_SKILLS.find(s => s.name === name);
  if (!sk) return 0;
  // If spec skill with selected option, use option-specific base
  if (specs && sk.spec && sk.spec.options) {
    const chosen = specs[name];
    if (chosen) {
      const opt = sk.spec.options.find(o => o.name === chosen);
      if (opt) return opt.base;
    }
  }
  return sk.base;
}


function normalizeSkillName(name) {
  if (ALL_SKILLS.some(s => s.name === name)) return name;
  if (FREE_SKILL_ALIAS[name]) return FREE_SKILL_ALIAS[name];
  if (name.includes('外语')) return '外语①';
  if (name.includes('驾驶')) return '驾驶①';
  if (name.includes('科学')) return '科学';
  if (name.includes('母语')) return '母语';
  // 前缀匹配（双向）："科学（生物学；制药）"→"科学"、"图书馆"→"图书馆使用"
  const prefix = ALL_SKILLS.find(s => name.startsWith(s.name) || s.name.startsWith(name));
  if (prefix) return prefix.name;
  return '';
}

// 解析占位条目 → [{ count, hint, allowed, fixed }]；
// allowed = null 表示任意技能，数组表示限定列表；fixed = 条目中隐含的固定职业技能（无需玩家选择）；无法解析返回 []
function parseFreeSkillSlots(occSkillName) {
  const name = occSkillName.trim();
  const out = [];
  // 0) 提取前置固定技能："侦查和下面的一种个人特长：汽车驾驶" → fixed [侦查]；"潜行。※经KP允许…" → fixed [潜行]
  let rest = name;
  let fixedPrefix = [];
  let mf = name.match(/^(.+?)(?:和下面|。)/);
  if (mf) {
    const f = normalizeSkillName(mf[1].trim());
    if (f) {
      fixedPrefix = [f];
      rest = name.slice(mf[1].length);
    }
  }
  // 1) 组合条目型（一条含多个固定技能，非选择型）："急救、医学、外语（拉丁文）、心理学、科学（生物学；制药）"
  if (!/其他|任意|任选|下面|特长/.test(rest) && rest.includes('、')) {
    const parts = rest.split(/、|；/).map(s => normalizeSkillName(s.trim())).filter(Boolean);
    if (parts.length >= 2) {
      out.push({ count: parts.length, hint: name, allowed: parts, fixed: fixedPrefix });
      return out;
    }
  }
  // 2) 限定列表型："下面任选两项：急救、机械维修、外语" / "下面的一种个人特长：汽车驾驶"
  let m = rest.match(/任选(一|两|二|三|四|五|六|七|八|九|十|\d+)项[：:](.+)$/);
  if (!m) m = rest.match(/下面的?(一|两|二|三|四|五|六|七|八|九|十|\d+)种?(?:个人特长|其他)?[：:](.+)$/);
  if (m) {
    const count = CN_NUM[m[1]] || parseInt(m[1], 10) || 1;
    const list = [...new Set(m[2].split(/、|，|,|\//)
      .map(s => normalizeSkillName(s.trim().replace(/[（(].*?[)）]/g, '')))
      .filter(Boolean))];
    if (list.length) out.push({ count, hint: name, allowed: list, fixed: fixedPrefix });
    return out;
  }
  // 3) 特殊："※经KP允许 可以包含克苏鲁神话"
  if (rest.includes('克苏鲁神话')) {
    out.push({ count: 1, hint: name, allowed: ['克苏鲁神话'], fixed: fixedPrefix });
    return out;
  }
  // 4) 特殊："※经KP允许 可用催眠替换其中一项"
  if (rest.includes('催眠')) {
    out.push({ count: 1, hint: name, allowed: ['催眠'], fixed: fixedPrefix });
    return out;
  }
  // 5) 通用数字型："两项其他技能" / "任意四项其他学术、时代" / "任两种其他学术" / "三个学习的专业"
  m = rest.match(/(一|两|二|三|四|五|六|七|八|九|十|\d+)[项种个]/);
  if (m) {
    const count = CN_NUM[m[1]] || parseInt(m[1], 10) || 1;
    out.push({ count, hint: name, allowed: null, fixed: fixedPrefix });
    return out;
  }
  // 6) 无数字但表达自由选择："时代特长（如计算机、锁匠、格斗、射击）" / "个人特长" / "专业书籍主题" / "时代"
  if (/特长|个人|专业书籍主题|其他技能|时代/.test(rest)) {
    out.push({ count: 1, hint: name, allowed: null, fixed: fixedPrefix });
    return out;
  }
  // 7) 数据中被拆开的括号条目："语言（母语" / "外语）" → 视为限定单技能槽
  if (/[（(）)]/.test(rest)) {
    const single = normalizeSkillName(rest);
    if (single) {
      out.push({ count: 1, hint: name, allowed: [single], fixed: fixedPrefix });
      return out;
    }
  }
  return out;
}

// 从职业技能列表生成自由槽（hint/allowed/fixed 由占位条目解析，skill 待玩家选择）
function buildFreeOccSlots(occSkills) {
  const slots = [];
  (occSkills || []).forEach(s => {
    const parsed = parseFreeSkillSlots(s.name);
    parsed.forEach(sp => {
      for (let i = 0; i < sp.count; i++) {
        slots.push({ skill: '', hint: sp.hint, allowed: sp.allowed, fixed: sp.fixed || [] });
      }
    });
  });
  return slots;
}

function roll3D6x5() {
  const rolls = [];
  for (let i = 0; i < 3; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  const sum = rolls.reduce((a, b) => a + b, 0);
  return { value: sum * 5, rolls };
}

function roll2D6plus6x5() {
  const rolls = [];
  for (let i = 0; i < 2; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  const sum = rolls.reduce((a, b) => a + b, 0) + 6;
  return { value: sum * 5, rolls };
}

// 可选建卡法：4D6 舍最低 ×5（英雄式，仅用于 3D6 类属性）
function roll4D6DropLowestX5() {
  const rolls = [];
  for (let i = 0; i < 4; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  const sorted = [...rolls].sort((a, b) => a - b);
  const sum = sorted[1] + sorted[2] + sorted[3];
  return { value: sum * 5, rolls };
}

function makeAttrDisplay(values) {
  const labels = { str:'力量 STR', con:'体质 CON', dex:'敏捷 DEX', app:'外貌 APP', pow:'意志 POW', siz:'体型 SIZ', int:'智力 INT', edu:'教育 EDU', luck:'幸运 LUCK' };
  return Object.keys(labels).map(k => {
    const v = values[k] || 0;
    return { label: labels[k], value: v, hard: Math.floor(v / 2), extreme: Math.floor(v / 5) };
  });
}


function getTraitIndex(value) {
  if (value < 20) return 0;
  if (value < 40) return 1;
  if (value < 60) return 2;
  if (value < 80) return 3;
  return 4;
}

// 单个属性的描述词条（幸运无词条，返回空串）
function getTraitText(key, value) {
  const dict = traits_dictionary[key.toUpperCase()];
  if (!dict) return '';
  return dict[getTraitIndex(value || 0)];
}

// 生成全部属性的词条映射
function makeAttrTraits(values) {
  const out = {};
  ['str','con','dex','app','pow','siz','int','edu','luck'].forEach(k => {
    out[k] = getTraitText(k, values[k] || 0);
  });
  return out;
}

function calcDB(strSiz) {
  // COC7 规则：STR + SIZ 总和查表
  if (strSiz <= 64)  return { db: '-2', build: -2 };
  if (strSiz <= 84)  return { db: '-1', build: -1 };
  if (strSiz <= 124) return { db: '0', build: 0 };
  if (strSiz <= 164) return { db: '+1D4', build: 1 };
  if (strSiz <= 204) return { db: '+1D6', build: 2 };
  return { db: '+2D6', build: 3 };
}

function makeDerivedItems(d) {
  return [
    { l: '生命 HP', v: d.hp },
    { l: '理智 SAN', v: d.san },
    { l: '魔法 MP', v: d.mp },
    { l: '伤害加值', v: d.db },
    { l: '体格', v: d.build },
    { l: '移动力', v: d.mov },
  ];
}

function calcDerivedFrom(attrVals, charInfo) {
  const v = attrVals || {};
  const n = key => parseInt(v[key]) || 50;
  const age = parseInt(charInfo && charInfo.age) || 25;
  const hp = Math.floor((n('con') + n('siz')) / 10);
  const san = n('pow');
  const mp = Math.floor(n('pow') / 5);
  const strSiz = n('str') + n('siz');
  const dbInfo = calcDB(strSiz);
  // 7 版 MOV：基础按 STR/DEX 与 SIZ 关系取 7/8/9，再按年龄段递减
  const mov = Math.max(1, baseMov(n('str'), n('dex'), n('siz')) - ageMovPenalty(age));
  return { hp, san, mp, db: dbInfo.db, build: dbInfo.build, mov };
}

function detectAgeModType(age) {
  if (age >= 15 && age <= 19) return 'teen';
  if (age >= 40) return 'decay';
  return 'none';
}

function getAgeDecay(age) {
  if (age >= 80) return 80;
  if (age >= 70) return 40;
  if (age >= 60) return 20;
  if (age >= 50) return 10;
  if (age >= 40) return 5;
  return 0;
}

function getAppDecay(age) {
  if (age >= 80) return 25;
  if (age >= 70) return 20;
  if (age >= 60) return 15;
  if (age >= 50) return 10;
  if (age >= 40) return 5;
  return 0;
}

function baseMov(str, dex, siz) {
  if (str >= siz && dex >= siz) return 7;
  if (str >= siz || dex >= siz) return 8;
  return 9;
}

function ageMovPenalty(age) {
  if (age >= 80) return 5;
  if (age >= 70) return 4;
  if (age >= 60) return 3;
  if (age >= 50) return 2;
  if (age >= 40) return 1;
  return 0;
}

function applyAgeModifiers(age, attrVals, choice, alloc) {
  var v = {};
  for (var k in attrVals) v[k] = attrVals[k];
  var summary = [];

  var eduGrowth = function(edu) {
    var result = edu;
    for (var i = 0; i < 10; i++) {
      var roll = Math.floor(Math.random() * 100) + 1;
      if (roll > result || roll === 100) {
        var gain = Math.floor(Math.random() * 10) + 1;
        result = Math.min(99, result + gain);
        summary.push('教育成长 +' + gain + ' (' + edu + '→' + result + ')');
      } else { break; }
    }
    return result;
  };

  if (age >= 15 && age <= 19) {
    if (choice === 'str') { v.str = Math.max(0, v.str - 5); summary.push('力量 -5'); }
    else if (choice === 'siz') { v.siz = Math.max(0, v.siz - 5); summary.push('体型 -5'); }
    if (v.edu > 0) v.edu = Math.max(0, v.edu - 5);
    summary.push('教育 -5');
    var r1 = roll3D6x5().value;
    var r2 = roll3D6x5().value;
    v.luck = Math.max(r1, r2);
    summary.push('幸运重投 ' + r1 + ' vs ' + r2 + ' → ' + v.luck);
  } else if (age >= 20 && age <= 39) {
    // 7 版规则：20-39 岁无属性调整（教育成长检定是幕间机制，不属于建卡）
  } else if (age >= 40) {
    var eduTimes = (age >= 60) ? 4 : (age >= 50) ? 3 : (age >= 40) ? 2 : 0;
    for (var i = 0; i < eduTimes; i++) v.edu = eduGrowth(v.edu);
    if (alloc) {
      v.str = Math.max(0, v.str - (alloc.str || 0));
      v.con = Math.max(0, v.con - (alloc.con || 0));
      v.dex = Math.max(0, v.dex - (alloc.dex || 0));
    }
    var appD = getAppDecay(age);
    if (v.app > 0) v.app = Math.max(0, v.app - appD);
    summary.push('外貌 -' + appD);
  }

  var mov = Math.max(1, baseMov(v.str || 0, v.dex || 0, v.siz || 0) - ageMovPenalty(age));
  return { attrValues: v, summary: summary.join('；'), mov: mov };
}



// ========== Page ==========
Page({
  data: {
    // 步骤
    step: 0,
    // 已保存角色列表
    savedCharacters: [],
    tagOptions: [],
    tagFilter: '',
    charSearch: '',
    charTag: '',
    showTagDialog: false,
    tagEditIdx: -1,
    tagInput: '',
    isCompleted: false,
    savedAt: 0,
    playLuck: 50,
    // 游玩模式
    playMode: false,
    playHP: 0,
    playSAN: 0,
    playMP: 0,
    maxSAN: 0,
    maxMP: 0,
    majorWound: false,
    dying: false,
    rollSkill: null,
    rollResult: null,
    rollBonus: 0,
    showRollDialog: false,
    tickedSkills: {},
    showGrowth: false,
    growthPhase: 0,
    growthSkills: [],
    growthResults: [],
    growthReached90: false,
    growthSANBonus: 0,
    growthSANOld: 0,
    growthSANMax: 99,
    growthLuckOld: 0,
    growthLuckGain: 0,
    growthSANInput: 0,
    growthLuckRoll: 0,
    growthLuckSuccess: false,
    growthLuckNew: 0,
    growthCredInput: 0,
    growthLocked: false,
    playLog: [],
    showSanDialog: false,
    sanFormula: '0/1D6',
    sanRollResult: null,
    sanFormulaPresets: ['0/1', '0/1D3', '0/1D6', '1/1D6', '1D3/1D10', '1D6/1D20'],
    sanDayStart: 0,
    sessionSanLoss: 0,
    sanDailyLimit: 1,
    hpPercent: 0,
    sanPercent: 0,
    mpPercent: 0,
    luckPercent: 50,
    // 困难和极难数值显示开关
    showThresholds: false,
    // 导出弹窗开关
    showExportDialog: false,
    // 编辑模式（从完成页返回修改时启用，移除点数限制）
    overrideLimits: false,
    // 属性掷骰
    attrLabels: { str:'力量 STR', con:'体质 CON', dex:'敏捷 DEX', app:'外貌 APP', pow:'意志 POW', siz:'体型 SIZ', int:'智力 INT', edu:'教育 EDU', luck:'幸运 LUCK' },
    attrValues: { str: 0, con: 0, dex: 0, app: 0, pow: 0, siz: 0, int: 0, edu: 0, luck: 0 },
    attrTraits: { str: '', con: '', dex: '', app: '', pow: '', siz: '', int: '', edu: '', luck: '' },
    attrDisplay: [],
    attrRolls: { str: '', con: '', dex: '', app: '', pow: '', siz: '', int: '', edu: '', luck: '' },
    attrDiceRolling: '',
    rolled: { str: false, con: false, dex: false, app: false, pow: false, siz: false, int: false, edu: false, luck: false },
    rolledCount: 0,
    attrRolling: false,
    allRolled: false,
    attrDesc: '',
    // 建卡法：std=标准 3D6 / hero=4D6 舍最低（仅影响 3D6 类属性）
    attrRollMode: 'std',
    // 点数购买（460 点分配，官方可选规则）
    showPointBuy: false,
    pointBuy: { str: 50, con: 50, dex: 50, app: 50, pow: 50, siz: 50, int: 50, edu: 50 },
    pointBuyLuck: 0,
    pointBuyLuckRolls: '',
    pointBuyRemaining: 60,
    // 预置调查员
    showPresetDialog: false,
    presets: PRESET_CHARACTERS.map(pc => ({
      id: pc.id,
      emoji: pc.emoji,
      tagline: pc.tagline,
      name: pc.data.charInfo.name,
      occ: pc.data.selectedOcc ? pc.data.selectedOcc.name : '',
      age: pc.data.charInfo.age,
      gender: pc.data.charInfo.gender,
    })),
    // 自由职业技能槽（“两项其他技能”等占位条目）
    freeOccSlots: [],
    showFreeSlotDialog: false,
    freeSlotEditing: -1,
    freeSlotDialogList: [],
    // 基础信息
    charInfo: { name: '', player: '', age: '25', gender: '男', era: '1920s' },
    ageModSummary: '',
    needAgeMod: false,
    ageModDone: false,
    showAgeModDialog: false,
    ageModType: '',
    ageModDecay: 0,
    ageModChoice: '',
    ageModBase: {},
    ageModAlloc: { str: 0, con: 0, dex: 0 },
    ageModRemaining: 0,
    ageRange: [], ageIndex: 10, genderIndex: 0,
    eras: ['1920s', '现代', '维多利亚', '1990s'], eraIndex: 0,
    // 职业选择
    occSearch: '',
    selectedOcc: null,           // 当前选中的职业
    selectedOptSkills: {},       // 已选可选技能: { skillName: true }
    filteredOccs: [],
    occSkillsText: '',
    occFixedSkills: [],         // 职业固定技能列表
    occSpecRequired: [],        // 必须选择专攻的技能名列表
    occSpecMissing: [],         // 尚未选择专攻的技能名列表
    // 技能分配（双池：职业技能点 + 兴趣技能点）
    occPts: {},           // 各技能分配的职业技能点
    intPts: {},           // 各技能分配的兴趣技能点
    skillSpecs: {},       // 专攻选择: { '技艺①': '美术', '母语': '英语' }
    usedOccPoints: 0, totalOccPoints: 0,
    usedIntPoints: 0, totalIntPoints: 0,
    skillGroups: [],        // 按分类分组的技能列表
    skillValidation: { warnings: [], crValue: 0, crRange: '', crState: 'neutral', crHint: '', occRemain: 0, intRemain: 0 },
    crAutoNote: '',         // 信用评级自动填充的透明化说明
    // 技能 dialog (slider)
    dialogSkill: null,      // 当前编辑的技能信息
    dialogOccVal: 0,        // 职业技能 slider 值
    dialogIntVal: 0,        // 兴趣技能 slider 值
    dialogOccMax: 0,
    dialogIntMax: 0,
    dialogBase: 0,
    dialogSpecIndex: 0,
    dialogReadonly: false,
    showDialog: false,
    // 导航
    canNext: false,
    maxStep: 0,               // 已到达过的最大步骤（步骤指示器可跳转上限）
    showSaveSuccess: false,
    // 草稿（未完成创建进度的自动保存）
    draftInfo: null,          // { name, step, stepName, timestamp }
    // 轻量使用提示（每步一句，不遮挡角色卡主体）
    stepHints: {
      1: '掷骰决定属性；对单项不满意可直接重掷',
      2: '名称必填；年龄会触发官方修正（影响属性与移动力）',
      3: '搜索职业；点亮「☆」把可选技能纳入本职',
      4: '点技能卡分配点数，±5 快捷加减；点技能名看说明',
      5: '先保存角色；点「游玩模式」进入实战检定',
    },
    // 规则速查（复用守密人帷幕数据）
    showRules: false,
    rulesSections: KEEPER_RULES,
    rulesCat: '',
    rulesCatIndex: 0,
    rulesItems: [],
    rulesTable: [],
    // 武器
    charWeapons: [],           // 角色已装备武器 [{name, skill, damage, range, ammo, ...}]
    showWeaponPicker: false,   // 武器选择 dialog
    weaponSearch: '',          // 武器搜索
    filteredWeapons: [],       // 武器搜索结果
    weaponGroups: [],          // 分组武器列表
    showCustomWeapon: false,   // 自定义武器表单
    customWName: '', customWSkill: '', customWDamage: '', customWRange: '',
    customWAttacks: '1', customWAmmo: '', customWMalfunction: '100', customWImpale: '√',
    // 角色卡文本字段
    charBackstory: '',         // 背景故事
    charGear: '',              // 随身物品
    charMythos: '',            // 神话相关
    charSpells: '',            // 法术
    charCompanions: '',        // 调查员伙伴
    charAssets: '',            // 资产
    // 角色卡预览
    derived: { hp: 0, san: 0, mp: 0, db: '+0', build: 0, mov: 8 },
    sortedSkillsByCat: [],
    derivedItems: [],
    catLabels: CAT_LABELS,
    catOrder: CAT_ORDER,

    // 掷骰模块（游玩模式）
    diceSelected: {},
    diceRolling: false,
    diceResult: null,
    diceHistory: [],
  },

  // ==================== 生命周期 ====================
  onLoad() {
    const ages = [];
    for (let i = 15; i <= 90; i++) ages.push(i + '岁');
    this.setData({ ageRange: ages, ageIndex: 10 });
    this.loadSavedList();
  },
  onShow() { this.loadSavedList(); },
  onHide() {
    if (this.data.step === 5 && this.data.isCompleted && !this.data.growthLocked) {
      this.persistCharacter(this.buildCharacterData(this.data.isCompleted));
    }
    // 未完成的创建流程立即落盘为草稿（编辑已保存角色时不生成草稿）
    if (this.data.step >= 1 && this.data.step <= 5 && !this.data.isCompleted && typeof this.data._loadIndex !== 'number') {
      this._saveDraft();
    }
  },

  // ==================== 本地存储 ====================
  loadSavedList() {
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      const pad = n => String(n).padStart(2, '0');
      // 附加展示字段（真实存储下标 / 格式化时间），并提取标签列表
      const tagSet = new Set();
      list.forEach((c, i) => {
        c._idx = i;
        c._timeStr = c.timestamp ? `${new Date(c.timestamp).getFullYear()}/${pad(new Date(c.timestamp).getMonth()+1)}/${pad(new Date(c.timestamp).getDate())} ${pad(new Date(c.timestamp).getHours())}:${pad(new Date(c.timestamp).getMinutes())}` : '';
        if (c.tag) tagSet.add(c.tag);
      });
      // 过滤（标签 + 名称搜索）+ 排序（最近更新在前，无时间戳排最后）
      const filter = this.data.tagFilter || '';
      const search = (this.data.charSearch || '').trim();
      // 标签已被清空时自动回到“全部”
      const effectiveFilter = filter && tagSet.has(filter) ? filter : '';
      if (effectiveFilter !== filter) this.setData({ tagFilter: '' });
      const shown = list
        .filter(c => !effectiveFilter || c.tag === effectiveFilter)
        .filter(c => !search || ((c.charInfo && c.charInfo.name) || c.name || '').includes(search))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.setData({ savedCharacters: shown, tagOptions: [...tagSet] });
      this._readDraftInfo();
    } catch (e) { this.setData({ savedCharacters: [], tagOptions: [] }); }
  },

  // ==================== 草稿（自动保存未完成的创建进度） ====================
  _buildDraft() {
    return {
      v: 1,
      step: this.data.step,
      maxStep: this.data.maxStep,
      attrValues: this.data.attrValues, attrRolls: this.data.attrRolls,
      attrTraits: this.data.attrTraits, attrDisplay: this.data.attrDisplay, attrDesc: this.data.attrDesc,
      rolled: this.data.rolled, rolledCount: this.data.rolledCount, allRolled: this.data.allRolled,
      attrRollMode: this.data.attrRollMode,
      charInfo: this.data.charInfo, ageIndex: this.data.ageIndex, genderIndex: this.data.genderIndex, eraIndex: this.data.eraIndex,
      needAgeMod: this.data.needAgeMod, ageModDone: this.data.ageModDone, ageModSummary: this.data.ageModSummary,
      ageModType: this.data.ageModType, ageModDecay: this.data.ageModDecay, ageModChoice: this.data.ageModChoice,
      ageModBase: this.data.ageModBase, ageModAlloc: this.data.ageModAlloc, ageModRemaining: this.data.ageModRemaining,
      occSearch: this.data.occSearch, selectedOcc: this.data.selectedOcc,
      selectedOptSkills: this.data.selectedOptSkills, occOptGroups: this.data.occOptGroups,
      occFixedSkills: this.data.occFixedSkills, occSpecRequired: this.data.occSpecRequired,
      freeOccSlots: this.data.freeOccSlots,
      occPts: this.data.occPts, intPts: this.data.intPts, skillSpecs: this.data.skillSpecs,
      usedOccPoints: this.data.usedOccPoints, totalOccPoints: this.data.totalOccPoints,
      usedIntPoints: this.data.usedIntPoints, totalIntPoints: this.data.totalIntPoints,
      overrideLimits: this.data.overrideLimits,
      charWeapons: this.data.charWeapons,
      charBackstory: this.data.charBackstory, charGear: this.data.charGear,
      charMythos: this.data.charMythos, charSpells: this.data.charSpells, charCompanions: this.data.charCompanions,
      charAssets: this.data.charAssets,
      charTag: this.data.charTag,
      timestamp: Date.now(),
    };
  },

  _saveDraft() {
    if (this.data.step < 1 || this.data.step > 5 || this.data.isCompleted) return;
    if (typeof this.data._loadIndex === 'number') return; // 编辑已保存角色时不覆盖草稿
    try {
      const draft = this._buildDraft();
      wx.setStorageSync('coc7_draft', draft);
      const stepName = ['', '属性', '信息', '职业', '技能', '完成'][draft.step] || '';
      this.setData({ draftInfo: { name: (draft.charInfo && draft.charInfo.name) || '未命名', step: draft.step, stepName, timestamp: draft.timestamp } });
    } catch (e) { /* 存储失败静默忽略，不打断创建流程 */ }
  },

  _scheduleDraft() {
    if (this._draftTimer) clearTimeout(this._draftTimer);
    this._draftTimer = setTimeout(() => { this._saveDraft(); }, 800);
  },

  _readDraftInfo() {
    try {
      const draft = wx.getStorageSync('coc7_draft');
      if (draft && draft.step >= 1 && draft.step <= 5) {
        const stepName = ['', '属性', '信息', '职业', '技能', '完成'][draft.step] || '';
        this.setData({ draftInfo: { name: (draft.charInfo && draft.charInfo.name) || '未命名', step: draft.step, stepName, timestamp: draft.timestamp } });
        return;
      }
    } catch (e) { /* ignore */ }
    if (this.data.draftInfo) this.setData({ draftInfo: null });
  },

  clearDraft() {
    if (this._draftTimer) { clearTimeout(this._draftTimer); this._draftTimer = null; }
    try { wx.removeStorageSync('coc7_draft'); } catch (e) { /* ignore */ }
    this.setData({ draftInfo: null });
  },

  continueDraft() {
    try {
      const draft = wx.getStorageSync('coc7_draft');
      if (!draft || !(draft.step >= 1 && draft.step <= 5)) { this.clearDraft(); return; }
      const step = draft.step;
      this.setData({
        step, maxStep: Math.max(draft.maxStep || step, step),
        attrValues: draft.attrValues || {}, attrRolls: draft.attrRolls || {},
        attrTraits: draft.attrTraits || {}, attrDisplay: draft.attrDisplay || [], attrDesc: draft.attrDesc || '',
        rolled: draft.rolled || {}, rolledCount: draft.rolledCount || 0, allRolled: !!draft.allRolled,
        attrRollMode: draft.attrRollMode || 'std',
        charInfo: draft.charInfo || { name: '', player: '', age: '25', gender: '男', era: '1920s' },
        ageIndex: draft.ageIndex || 0, genderIndex: draft.genderIndex || 0, eraIndex: draft.eraIndex || 0,
        needAgeMod: !!draft.needAgeMod, ageModDone: !!draft.ageModDone, ageModSummary: draft.ageModSummary || '',
        ageModType: draft.ageModType || '', ageModDecay: draft.ageModDecay || 0, ageModChoice: draft.ageModChoice || '',
        ageModBase: draft.ageModBase || {}, ageModAlloc: draft.ageModAlloc || { str: 0, con: 0, dex: 0 },
        ageModRemaining: draft.ageModRemaining || 0,
        occSearch: draft.occSearch || '', selectedOcc: draft.selectedOcc || null,
        selectedOptSkills: draft.selectedOptSkills || {}, occOptGroups: draft.occOptGroups || [],
        occFixedSkills: draft.occFixedSkills || [], occSpecRequired: draft.occSpecRequired || [],
        freeOccSlots: draft.freeOccSlots || [],
        occPts: draft.occPts || {}, intPts: draft.intPts || {}, skillSpecs: draft.skillSpecs || {},
        usedOccPoints: draft.usedOccPoints || 0, totalOccPoints: draft.totalOccPoints || 0,
        usedIntPoints: draft.usedIntPoints || 0, totalIntPoints: draft.totalIntPoints || 0,
        overrideLimits: !!draft.overrideLimits,
        charWeapons: draft.charWeapons || [],
        charBackstory: draft.charBackstory || '', charGear: draft.charGear || '',
        charMythos: draft.charMythos || '', charSpells: draft.charSpells || '', charCompanions: draft.charCompanions || '',
        charAssets: draft.charAssets || '',
        charTag: draft.charTag || '',
        _loadIndex: undefined,
        canNext: step === 1 ? !!draft.allRolled : true,
        isCompleted: false, playMode: false,
      }, () => {
        if (step === 3) this.filterOccs(this.data.occSearch || '');
        if (step === 4 && this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
        if (step === 5) this._refreshSheet();
        this.updateOccSpecMissing();
        this.refreshSkillValidation();
      });
      this.loadSavedList();
    } catch (e) {
      wx.showToast({ title: '草稿读取失败', icon: 'none' });
      this.clearDraft();
    }
  },

  discardDraft() {
    wx.showModal({
      title: '放弃草稿',
      content: '确定放弃未完成的创建进度吗？此操作无法撤销。',
      confirmText: '放弃',
      success: (res) => {
        if (res.confirm) { this.clearDraft(); wx.showToast({ title: '已放弃草稿', icon: 'none' }); }
      }
    });
  },

  // ---------- 标签管理 ----------
  setTagFilter(e) {
    this.setData({ tagFilter: e.currentTarget.dataset.tag || '' }, () => this.loadSavedList());
  },
  onCharSearch(e) {
    this.setData({ charSearch: e.detail.value }, () => this.loadSavedList());
  },
  openTagDialog(e) {
    const idx = e.currentTarget.dataset.index;
    if (idx == null) return;
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      const tag = (list[idx] && list[idx].tag) || '';
      this.setData({ showTagDialog: true, tagEditIdx: idx, tagInput: tag });
    } catch (err) { /* ignore */ }
  },
  closeTagDialog() { this.setData({ showTagDialog: false, tagEditIdx: -1 }); },
  onTagInput(e) { this.setData({ tagInput: e.detail.value }); },
  saveTag() {
    const idx = this.data.tagEditIdx;
    if (idx < 0) return;
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      if (idx < list.length) {
        list[idx].tag = this.data.tagInput.trim();
        wx.setStorageSync('coc7_characters', list);
      }
    } catch (err) { /* ignore */ }
    this.setData({ showTagDialog: false, tagEditIdx: -1 });
    this.loadSavedList();
  },

  getVitalState(overrides = {}) {
    const d = { ...this.data, ...overrides };
    const pct = (value, max) => {
      const n = parseInt(value) || 0;
      const m = Math.max(1, parseInt(max) || 1);
      return Math.max(0, Math.min(100, Math.round((n / m) * 100)));
    };
    const sanStart = parseInt(d.sanDayStart) || parseInt(d.playSAN) || 0;
    return {
      hpPercent: pct(d.playHP, d.derived && d.derived.hp),
      sanPercent: pct(d.playSAN, d.maxSAN),
      mpPercent: pct(d.playMP, d.maxMP),
      luckPercent: pct(d.playLuck, 99),
      sanDailyLimit: Math.max(1, Math.ceil(sanStart / 5)),
    };
  },

  refreshPlayDashboard() {
    this.setData(this.getVitalState());
  },

  parseCreditRange(range) {
    const m = String(range || '').match(/(\d+)\s*-\s*(\d+)/);
    if (!m) return null;
    return { min: parseInt(m[1]), max: parseInt(m[2]) };
  },

  getCreditRatingValue() {
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    return getSkillBase('信用评级', edu, dex) + (this.data.occPts['信用评级'] || 0) + (this.data.intPts['信用评级'] || 0);
  },

  buildSkillValidation() {
    const warnings = [];
    const occRemain = this.data.totalOccPoints - this.data.usedOccPoints;
    const intRemain = this.data.totalIntPoints - this.data.usedIntPoints;
    const crValue = this.getCreditRatingValue();
    const crRange = this.data.selectedOcc ? this.data.selectedOcc.cr_range || '' : '';
    const parsedCR = this.parseCreditRange(crRange);
    let crState = 'neutral';
    let crHint = crRange ? `CR ${crValue} / ${crRange}` : `CR ${crValue}`;

    if (this.data.selectedOcc && parsedCR) {
      if (crValue < parsedCR.min) {
        crState = 'danger';
        warnings.push(`信用评级低于职业要求，还需要 ${parsedCR.min - crValue} 点。`);
      } else if (crValue > parsedCR.max) {
        crState = 'danger';
        warnings.push(`信用评级高于职业上限，需要降到 ${parsedCR.max} 或以下。`);
      } else {
        crState = 'ok';
        crHint = `CR ${crValue}，符合 ${crRange}`;
      }
    }

    if (this.data.usedOccPoints > this.data.totalOccPoints) {
      warnings.push(`职业技能点超出 ${this.data.usedOccPoints - this.data.totalOccPoints} 点。`);
    } else if (occRemain > 0) {
      warnings.push(`职业技能点还剩 ${occRemain} 点未分配。`);
    }

    if (this.data.usedIntPoints > this.data.totalIntPoints) {
      warnings.push(`兴趣技能点超出 ${this.data.usedIntPoints - this.data.totalIntPoints} 点。`);
    } else if (intRemain > 0) {
      warnings.push(`兴趣技能点还剩 ${intRemain} 点未分配。`);
    }

    const missingSpecs = this.getMissingRequiredSpecs();
    if (missingSpecs.length > 0) warnings.push(`专攻未完成：${missingSpecs.join('、')}。`);

    return { warnings, crValue, crRange, crState, crHint, occRemain, intRemain };
  },

  refreshSkillValidation() {
    this.setData({ skillValidation: this.buildSkillValidation() });
  },

  getBlockingCreationMessages() {
    const messages = [];
    const parsedCR = this.data.selectedOcc ? this.parseCreditRange(this.data.selectedOcc.cr_range) : null;
    const crValue = this.getCreditRatingValue();
    if (!this.data.overrideLimits && this.data.usedOccPoints > this.data.totalOccPoints) messages.push('职业技能点已超出上限');
    if (!this.data.overrideLimits && this.data.usedIntPoints > this.data.totalIntPoints) messages.push('兴趣技能点已超出上限');
    if (!this.data.overrideLimits && parsedCR && (crValue < parsedCR.min || crValue > parsedCR.max)) {
      messages.push(`信用评级需在 ${this.data.selectedOcc.cr_range} 内`);
    }
    const missingSpecs = this.getMissingRequiredSpecs();
    if (missingSpecs.length > 0) messages.push(`请先选择专攻：${missingSpecs[0]}`);
    return messages;
  },

  formatLogTime() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  addPlayLog(entry) {
    const log = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: this.formatLogTime(),
      type: entry.type || 'note',
      title: entry.title || '记录',
      meta: entry.meta || '',
    };
    this.setData({ playLog: [log, ...(this.data.playLog || [])].slice(0, 80) });
  },

  clearPlayLog() {
    this.setData({ playLog: [] });
  },

  buildCharacterData(completed) {
    const derived = calcDerivedFrom(this.data.attrValues, this.data.charInfo);
    const derivedItems = makeDerivedItems(derived);
    return {
      schemaVersion: 2,
      attrValues: this.data.attrValues, attrRolls: this.data.attrRolls,
      attrDesc: this.data.attrDesc, attrDisplay: this.data.attrDisplay,
      charInfo: this.data.charInfo, selectedOcc: this.data.selectedOcc,
      occPts: this.data.occPts, intPts: this.data.intPts, skillSpecs: this.data.skillSpecs,
      freeOccSkills: (this.data.freeOccSlots || []).map(s => s.skill).filter(Boolean),
      usedOccPoints: this.data.usedOccPoints, totalOccPoints: this.data.totalOccPoints,
      usedIntPoints: this.data.usedIntPoints, totalIntPoints: this.data.totalIntPoints,
      derived, derivedItems,
      sortedSkillsByCat: this.data.sortedSkillsByCat,
      timestamp: Date.now(),
      tickedSkills: this.data.tickedSkills,
      playHP: this.data.playHP, playSAN: this.data.playSAN, playMP: this.data.playMP, playLuck: this.data.playLuck,
      majorWound: this.data.majorWound, dying: this.data.dying,
      sanDayStart: this.data.sanDayStart, sessionSanLoss: this.data.sessionSanLoss,
      playLog: this.data.playLog, diceHistory: this.data.diceHistory,
      charWeapons: this.data.charWeapons,
      charBackstory: this.data.charBackstory, charGear: this.data.charGear,
      charMythos: this.data.charMythos, charSpells: this.data.charSpells, charCompanions: this.data.charCompanions,
      charAssets: this.data.charAssets,
      tag: this.data.charTag || '',
      completed: completed !== undefined ? completed : this.data.isCompleted,
    };
  },

  persistCharacter(charData, toastTitle) {
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      const loadIdx = this.data._loadIndex;
      let savedIndex = loadIdx;
      if (typeof loadIdx === 'number' && loadIdx >= 0 && loadIdx < list.length) {
        list[loadIdx] = charData;
      } else {
        list.push(charData);
        savedIndex = list.length - 1;
      }
      wx.setStorageSync('coc7_characters', list);
      this.setData({ _loadIndex: savedIndex, savedAt: charData.timestamp });
      this.loadSavedList();
      if (toastTitle) wx.showToast({ title: toastTitle, icon: 'success', duration: 1500 });
      return true;
    } catch (e) {
      wx.showToast({ title: '保存失败，存储空间不足', icon: 'none' });
      return false;
    }
  },

  // ==================== STEP 0 ====================
  startNewCharacter() {
    // 已有未完成草稿时提醒，避免误触覆盖进度
    if (this.data.draftInfo && this.data.draftInfo.step >= 1) {
      wx.showModal({
        title: '已有未完成的进度',
        content: `「${this.data.draftInfo.name}」已创建到第 ${this.data.draftInfo.step} 步（${this.data.draftInfo.stepName}）。新建调查员会覆盖该草稿，确定继续吗？`,
        confirmText: '覆盖并新建',
        success: (res) => { if (res.confirm) this._resetNewCharacter(); }
      });
      return;
    }
    this._resetNewCharacter();
  },
  _resetNewCharacter() {
    this.setData({
      step: 1,
      attrValues: { str: 0, con: 0, dex: 0, app: 0, pow: 0, siz: 0, int: 0, edu: 0, luck: 0 },
      attrTraits: { str: '', con: '', dex: '', app: '', pow: '', siz: '', int: '', edu: '', luck: '' },
      attrDisplay: [],
      charTag: '',
      freeOccSlots: [],
      showFreeSlotDialog: false,
      attrRolls: { str: '', con: '', dex: '', app: '', pow: '', siz: '', int: '', edu: '', luck: '' },
      rolled: { str: false, con: false, dex: false, app: false, pow: false, siz: false, int: false, edu: false, luck: false },
      rolledCount: 0,
      attrRolling: false,
      allRolled: false,
      charInfo: { name: '', player: '', age: '25', gender: '男', era: '1920s' },
      ageIndex: 10, genderIndex: 0, eraIndex: 0,
      selectedOcc: null, occSearch: '', occSkillsText: '',
      occFixedSkills: [], occSpecRequired: [], occSpecMissing: [],
      occPts: {}, intPts: {}, skillSpecs: {}, usedOccPoints: 0, totalOccPoints: 0, usedIntPoints: 0, totalIntPoints: 0,
      skillGroups: [], dialogSkill: null, showDialog: false, canNext: false, overrideLimits: false,
      skillValidation: { warnings: [], crValue: 0, crRange: '', crState: 'neutral', crHint: '', occRemain: 0, intRemain: 0 },
      playLog: [], diceHistory: [], diceSelected: {}, diceResult: null,
      playMode: false, playHP: 0, playSAN: 0, playMP: 0, playLuck: 50,
      majorWound: false, dying: false, sanDayStart: 0, sessionSanLoss: 0,
      showSanDialog: false, sanRollResult: null, sanFormula: '0/1D6',
      hpPercent: 0, sanPercent: 0, mpPercent: 0, luckPercent: 50, sanDailyLimit: 1,
      // 新角色必须清空旧角色的残留状态（武器/文本/年龄修正/载入下标）
      charWeapons: [], charBackstory: '', charGear: '', charMythos: '', charSpells: '', charCompanions: '', charAssets: '',
      needAgeMod: false, ageModDone: false, ageModSummary: '', ageModType: '', ageModDecay: 0,
      ageModChoice: '', ageModBase: {}, ageModAlloc: { str: 0, con: 0, dex: 0 }, ageModRemaining: 0,
      attrRollMode: 'std', crAutoNote: '',
      _loadIndex: undefined, maxStep: 1,
    });
    this._scheduleDraft();
  },

  // 载入完整角色数据（存档或预置）到角色卡 Step 5
  applyCharData(char, loadIdx) {
    const pSkills = this.buildPreviewSkills(char.occPts || {}, char.intPts || {}, char.attrValues, char.skillSpecs || {});
    const attrVals = char.attrValues || { str: 0, con: 0, dex: 0, app: 0, pow: 0, siz: 0, int: 0, edu: 0, luck: 0 };
    const charInfo = char.charInfo || { name: '', player: '', age: '25', gender: '男', era: '1920s' };
    const d = calcDerivedFrom(attrVals, charInfo);
    const derivedItems = makeDerivedItems(d);
    const cm = (char.occPts && char.occPts['克苏鲁神话'] || 0) + (char.intPts && char.intPts['克苏鲁神话'] || 0);
    const cmBase = getSkillBase('克苏鲁神话', attrVals.edu || 50, attrVals.dex || 50);
    const maxSAN = 99 - (cmBase + cm);
    const playSAN = char.playSAN !== undefined ? char.playSAN : d.san;
    const sanDayStart = char.sanDayStart || playSAN;
    // 恢复自由职业技能槽：用职业数据重新解析槽位结构，再回填已保存的选择
    let freeSlots = [];
    if (char.selectedOcc) {
      freeSlots = buildFreeOccSlots((char.selectedOcc.skills || []).filter(s => s.mark === '★'));
      const savedFree = char.freeOccSkills || [];
      savedFree.forEach(sk => {
        // 回填校验：跳过限定列表不允许的技能（职业数据可能已变更）；槽位不足时扩展
        const slot = freeSlots.find(x => !x.skill && (!x.allowed || x.allowed.includes(sk)));
        if (slot) slot.skill = sk;
        else freeSlots.push({ skill: sk, hint: '已保存的自由技能', allowed: null, fixed: [] });
      });
    }
    this.setData({
      step: 5,
      attrValues: attrVals,
      attrTraits: makeAttrTraits(attrVals),
      attrDisplay: makeAttrDisplay(attrVals),
      attrDesc: char.attrDesc || '',
      attrRolls: char.attrRolls || {},
      rolled: { str: true, con: true, dex: true, app: true, pow: true, siz: true, int: true, edu: true, luck: true },
      rolledCount: 9,
      allRolled: true,
      charInfo: charInfo,
      selectedOcc: char.selectedOcc || null,
      occPts: char.occPts || {}, intPts: char.intPts || {}, skillSpecs: char.skillSpecs || {},
      freeOccSlots: freeSlots,
      showFreeSlotDialog: false,
      usedOccPoints: char.usedOccPoints || 0, totalOccPoints: char.totalOccPoints || 0,
      usedIntPoints: char.usedIntPoints || 0, totalIntPoints: char.totalIntPoints || 0,
      derived: d,
      derivedItems: derivedItems,
      sortedSkillsByCat: pSkills,
      _loadIndex: loadIdx,
      maxStep: 5,
      isCompleted: char.completed || false,
      tickedSkills: char.tickedSkills || {},
      charWeapons: char.charWeapons || [],
      charBackstory: char.charBackstory || '', charGear: char.charGear || '',
      charMythos: char.charMythos || '', charSpells: char.charSpells || '', charCompanions: char.charCompanions || '',
      charAssets: char.charAssets || '',
      charTag: char.tag || '',
      playHP: char.playHP !== undefined ? char.playHP : d.hp,
      playSAN: playSAN,
      playMP: char.playMP !== undefined ? char.playMP : d.mp,
      playLuck: char.playLuck !== undefined ? char.playLuck : (attrVals.luck || 50),
      maxSAN: maxSAN,
      maxMP: d.mp,
      majorWound: char.majorWound || false, dying: char.dying || false,
      playLog: char.playLog || [],
      diceHistory: char.diceHistory || [],
      sessionSanLoss: char.sessionSanLoss || 0,
      sanDayStart: sanDayStart,
      sanRollResult: null,
      showSanDialog: false,
      savedAt: char.timestamp || 0,
    }, () => {
      this.refreshPlayDashboard();
      this.refreshSkillValidation();
    });
  },

  loadCharacter(e) {
    const idx = e.currentTarget.dataset.index;
    if (idx == null) return;
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      if (idx < 0 || idx >= list.length) return;
      this.applyCharData(list[idx], idx);
    } catch (e) { wx.showToast({ title: '读取失败', icon: 'none' }); }
  },

  // ==================== 预置调查员 ====================
  showPresetDialog() { this.setData({ showPresetDialog: true }); },
  closePresetDialog() { this.setData({ showPresetDialog: false }); },
  applyPresetCharacter(e) {
    const idx = e.currentTarget.dataset.index;
    const preset = PRESET_CHARACTERS[idx];
    if (!preset) return;
    try {
      const p = preset.data;
      const charData = Object.assign({}, p);
      charData.derived = calcDerivedFrom(p.attrValues, p.charInfo);
      charData.derivedItems = makeDerivedItems(charData.derived);
      charData.sortedSkillsByCat = this.buildPreviewSkills(p.occPts || {}, p.intPts || {}, p.attrValues, p.skillSpecs || {});
      charData.timestamp = Date.now();
      charData.completed = true;
      const list = wx.getStorageSync('coc7_characters') || [];
      list.push(charData);
      wx.setStorageSync('coc7_characters', list);
      this.setData({ showPresetDialog: false });
      this.loadSavedList();
      this.applyCharData(charData, list.length - 1);
      wx.showToast({ title: '✅ 已载入：' + p.charInfo.name, icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '载入失败', icon: 'none' });
    }
  },

  deleteCharacter(e) {
    const idx = e.currentTarget.dataset.index;
    if (idx == null) return;
    const list = wx.getStorageSync('coc7_characters') || [];
    if (idx < 0 || idx >= list.length) return;
    wx.showModal({
      title: '确认删除', content: '确定要删除这个角色吗？',
      success: (res) => { if (res.confirm) { list.splice(idx, 1); wx.setStorageSync('coc7_characters', list); this.loadSavedList(); } }
    });
  },

  // 复制角色（做变体/备份/同团 NPC 常用）
  duplicateCharacter(e) {
    const idx = e.currentTarget.dataset.index;
    if (idx == null) return;
    try {
      const list = wx.getStorageSync('coc7_characters') || [];
      if (idx < 0 || idx >= list.length) return;
      const copy = JSON.parse(JSON.stringify(list[idx]));
      copy.timestamp = Date.now();
      const oldName = (copy.charInfo && copy.charInfo.name) || '未命名';
      copy.charInfo = Object.assign({}, copy.charInfo || {}, { name: oldName + '（副本）' });
      delete copy._idx; delete copy._timeStr;
      list.unshift(copy);
      wx.setStorageSync('coc7_characters', list);
      this.loadSavedList();
      wx.showToast({ title: '✅ 已复制', icon: 'success', duration: 1200 });
    } catch (err) {
      wx.showToast({ title: '复制失败', icon: 'none' });
    }
  },

  // ==================== 导入调查员 ====================
  importCharacter() {
    wx.getClipboardData({
      success: (res) => {
        try {
          const charData = JSON.parse(res.data);
          if (!charData.attrValues || !charData.charInfo) {
            wx.showToast({ title: '剪贴板内容不是有效的调查员数据', icon: 'none' });
            return;
          }
          charData.derived = calcDerivedFrom(charData.attrValues, charData.charInfo);
          charData.derivedItems = makeDerivedItems(charData.derived);
          charData.completed = true;
          charData.timestamp = Date.now();
          const list = wx.getStorageSync('coc7_characters') || [];
          list.push(charData);
          wx.setStorageSync('coc7_characters', list);
          this.loadSavedList();
          wx.showToast({ title: '✅ 导入成功', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '数据解析失败，请检查剪贴板内容', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '读取剪贴板失败，请先复制调查员数据', icon: 'none' });
      }
    });
  },

  // ==================== STEP 1：属性掷骰 ====================
  // 按当前建卡法掷单个属性：英雄模式下 STR/CON/DEX/APP/POW/LUCK 用 4D6 舍最低
  _rollAttr(a) {
    if (this.data.attrRollMode === 'hero' && a !== 'siz' && a !== 'int' && a !== 'edu') {
      return roll4D6DropLowestX5();
    }
    return (a === 'siz' || a === 'int' || a === 'edu') ? roll2D6plus6x5() : roll3D6x5();
  },
  setAttrRollMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.attrRollMode) return;
    this.setData({ attrRollMode: mode });
    if (this.data.rolledCount > 0) {
      wx.showToast({ title: mode === 'hero' ? '已切换 4D6 舍最低，建议全部重掷' : '已切换标准 3D6，建议全部重掷', icon: 'none' });
    }
    this._scheduleDraft();
  },
  rollAllAttrs() {
    if (this.data.attrRolling) return;
    const attrs = ['str','con','dex','app','pow','siz','int','edu','luck'];
    let count = 0;
    this.setData({ attrRolling: true });
    attrs.forEach((a, i) => {
      setTimeout(() => {
        const result = this._rollAttr(a);
        count++;
        this.setData({
          attrValues: { ...this.data.attrValues, [a]: result.value },
          attrTraits: { ...this.data.attrTraits, [a]: getTraitText(a, result.value) },
          attrRolls: { ...this.data.attrRolls, [a]: result.rolls.join(',') },
          rolled: { ...this.data.rolled, [a]: true },
          rolledCount: count,
          // 依次高亮当前属性，最后一个掷完后清空
          attrDiceRolling: (i < attrs.length - 1) ? a : '',
        });
        if (i === attrs.length - 1) {
          this.setData({ allRolled: true, attrDiceRolling: '', attrRolling: false, canNext: true, attrDisplay: makeAttrDisplay(this.data.attrValues) });
          this._invalidateAgeMod();
          this._scheduleDraft();
        }
      }, i * 300);
    });
  },
  rerollAttr(e) {
    const attr = e.currentTarget.dataset.attr;
    const result = this._rollAttr(attr);
    this.setData({ attrDiceRolling: attr });
    setTimeout(() => {
      const newVal = { ...this.data.attrValues, [attr]: result.value };
      this.setData({ attrValues: newVal, attrTraits: { ...this.data.attrTraits, [attr]: getTraitText(attr, result.value) }, attrRolls: { ...this.data.attrRolls, [attr]: result.rolls.join(',') }, attrDiceRolling: '', attrDisplay: makeAttrDisplay(newVal) });
      this._invalidateAgeMod();
      this._scheduleDraft();
    }, 200);
  },

  // 属性重掷后，已应用的年龄修正作废，回到年龄页时需重新确认
  _invalidateAgeMod() {
    if (this.data.needAgeMod && this.data.ageModDone) {
      this.setData({ ageModDone: false, ageModSummary: '' });
      wx.showToast({ title: '属性已重掷，请重新进行年龄修正', icon: 'none', duration: 2000 });
    }
  },

  // ---------- 点数购买（官方可选规则：8 项属性共 460 点，每项 40-90） ----------
  openPointBuy() {
    const av = this.data.attrValues;
    const def = v => (v > 0 ? v : 50);
    const pb = { str: def(av.str), con: def(av.con), dex: def(av.dex), app: def(av.app), pow: def(av.pow), siz: def(av.siz), int: def(av.int), edu: def(av.edu) };
    const sum = pb.str + pb.con + pb.dex + pb.app + pb.pow + pb.siz + pb.int + pb.edu;
    const luck = roll3D6x5();
    this.setData({ showPointBuy: true, pointBuy: pb, pointBuyRemaining: 460 - sum, pointBuyLuck: luck.value, pointBuyLuckRolls: luck.rolls.join(',') });
  },
  closePointBuy() { this.setData({ showPointBuy: false }); },
  onPointBuyInput(e) {
    const field = e.currentTarget.dataset.field;
    let val = parseInt(e.detail.value);
    if (isNaN(val)) val = 0;
    const pb = { ...this.data.pointBuy, [field]: val };
    const sum = pb.str + pb.con + pb.dex + pb.app + pb.pow + pb.siz + pb.int + pb.edu;
    this.setData({ pointBuy: pb, pointBuyRemaining: 460 - sum });
  },
  rerollPointBuyLuck() {
    const luck = roll3D6x5();
    this.setData({ pointBuyLuck: luck.value, pointBuyLuckRolls: luck.rolls.join(',') });
  },
  confirmPointBuy() {
    const pb = this.data.pointBuy;
    const keys = ['str', 'con', 'dex', 'app', 'pow', 'siz', 'int', 'edu'];
    const labels = { str: '力量', con: '体质', dex: '敏捷', app: '外貌', pow: '意志', siz: '体型', int: '智力', edu: '教育' };
    for (const k of keys) {
      const v = pb[k] || 0;
      if (v < 40 || v > 90) {
        wx.showToast({ title: `${labels[k]}需在 40-90 之间（当前 ${v}）`, icon: 'none' });
        return;
      }
    }
    const sum = keys.reduce((s, k) => s + (pb[k] || 0), 0);
    if (sum !== 460) {
      wx.showToast({ title: `总和需为 460（当前 ${sum}，${sum < 460 ? '还差 ' + (460 - sum) : '超出 ' + (sum - 460)}）`, icon: 'none', duration: 2200 });
      return;
    }
    const attrValues = { str: pb.str, con: pb.con, dex: pb.dex, app: pb.app, pow: pb.pow, siz: pb.siz, int: pb.int, edu: pb.edu, luck: this.data.pointBuyLuck };
    const attrRolls = { str: '购点', con: '购点', dex: '购点', app: '购点', pow: '购点', siz: '购点', int: '购点', edu: '购点', luck: this.data.pointBuyLuckRolls };
    this.setData({
      attrValues, attrRolls,
      attrTraits: makeAttrTraits(attrValues),
      attrDisplay: makeAttrDisplay(attrValues),
      rolled: { str: true, con: true, dex: true, app: true, pow: true, siz: true, int: true, edu: true, luck: true },
      rolledCount: 9, allRolled: true, canNext: true,
      showPointBuy: false,
    });
    this._invalidateAgeMod();
    this._scheduleDraft();
    wx.showToast({ title: '✅ 购点完成，LUCK 已掷出', icon: 'none' });
  },

  // ==================== STEP 2：基础信息 ====================
  onCharInfoChange(e) { this.setData({ [`charInfo.${e.currentTarget.dataset.field}`]: e.detail.value }); this.checkStep2CanNext(); this._scheduleDraft(); },
  randomMaleName() { const n = MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]; this.setData({ 'charInfo.name': n, 'charInfo.gender': '男', genderIndex: 0 }); this.checkStep2CanNext(); this._scheduleDraft(); },
  randomFemaleName() { const n = FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)]; this.setData({ 'charInfo.name': n, 'charInfo.gender': '女', genderIndex: 1 }); this.checkStep2CanNext(); this._scheduleDraft(); },
  onAgeChange(e) {
    const idx = parseInt(e.detail.value);
    const age = 15 + idx;
    const type = detectAgeModType(age);
    this.setData({
      ageIndex: idx, 'charInfo.age': age.toString(),
      needAgeMod: type !== 'none',
      ageModDone: false,
      ageModSummary: '',
      ageModType: type,
      ageModDecay: getAgeDecay(age),
      ageModChoice: '',
      ageModBase: { ...this.data.attrValues },
      ageModAlloc: { str: 0, con: 0, dex: 0 },
      ageModRemaining: getAgeDecay(age),
    });
    this.checkStep2CanNext();
    this._scheduleDraft();
  },
  onGenderChange(e) { this.setData({ genderIndex: parseInt(e.detail.value), 'charInfo.gender': ['男','女','其他'][parseInt(e.detail.value)] }); this._scheduleDraft(); },
  onEraChange(e) { this.setData({ eraIndex: parseInt(e.detail.value), 'charInfo.era': ['1920s','现代','维多利亚','1990s'][parseInt(e.detail.value)] }); this.checkStep2CanNext(); this._scheduleDraft(); },
  checkStep2CanNext() { this.setData({ canNext: this.data.charInfo.name.trim().length > 0 }); },

  // ==================== STEP 3：职业选择（合并职业 + 技能点数） ====================
  onOccSearch(e) {
    const val = e.detail.value;
    this.setData({ occSearch: val });
    this.filterOccs(val);
  },
  filterOccs(search) {
    const edu = this.data.attrValues.edu || 50;
    const app = this.data.attrValues.app || 50;
    const dex = this.data.attrValues.dex || 50;
    const str = this.data.attrValues.str || 50;
    const pow = this.data.attrValues.pow || 50;
    const int = this.data.attrValues.int || 50;
    let list = OCCUPATIONS.map(o => ({
      ...o,
      occPointValue: calcOccPoints(o.skill_formula, edu, app, dex, str, pow),
      intPointValue: int * 2,
    }));
    if (search) list = list.filter(o => o.name.includes(search));
    this.setData({ filteredOccs: list });
  },
  selectOccupation(e) {
    const idx = e.currentTarget.dataset.index;
    const occ = this.data.filteredOccs[idx];
    if (!occ) return;
    
    // Build display: separate fixed (★) and optional (☆)
    const fixedSkills = (occ.skills || []).filter(s => s.mark === '★');
    const optSkills = (occ.skills || []).filter(s => s.mark === '☆');
    
    // Group optional skills
    const optGroups = [];
    const seenGroups = {};
    optSkills.forEach(s => {
      const g = s.group || 'default';
      if (!seenGroups[g]) {
        seenGroups[g] = { group: g, count: s.count || 1, skills: [] };
        optGroups.push(seenGroups[g]);
      }
      seenGroups[g].skills.push({ name: s.name, selected: false, group: g });
    });
    
    const fixedText = fixedSkills.map(s => s.spec ? `${s.name}(${s.spec})` : s.name).join('、');
    const optText = optGroups.map(g =>
      `[选${g.count}项] ` + g.skills.map(s => s.name).join('、')
    ).join(' ； ');
    const skillsText = fixedText + (optText ? '\n▸ ' + optText : '');
    
    this.setData({
      selectedOcc: occ, canNext: true,
      occSkillsText: skillsText,
      occFixedSkills: fixedSkills,
      occOptGroups: optGroups,
      selectedOptSkills: {},
      freeOccSlots: buildFreeOccSlots(fixedSkills),
      showFreeSlotDialog: false,
      // Auto-populate specs from occupation data and track required ones
      skillSpecs: this.buildInitialSpecs(fixedSkills),
      occSpecRequired: this.buildOccSpecRequired(fixedSkills),
    });
    // Compute initially missing specs (after auto-fill, should be empty)
    this.updateOccSpecMissing();
    this.calcSkillPoints(occ);
    this._scheduleDraft();
  },

  calcSkillPoints(occ) {
    const edu = this.data.attrValues.edu || 50;
    const int = this.data.attrValues.int || 50;
    const dex = this.data.attrValues.dex || 50;
    const str = this.data.attrValues.str || 50;
    const app = this.data.attrValues.app || 50;
    const pow = this.data.attrValues.pow || 50;

    const occPoints = calcOccPoints(occ.skill_formula, edu, app, dex, str, pow);
    const intPoints = int * 2;

    // 信用评级：根据职业CR范围自动用兴趣点加到最低值
    let crAutoPts = 0;
    if (occ.cr_range) {
      const m = occ.cr_range.match(/(\d+)-(\d+)/);
      if (m) {
        const crLo = parseInt(m[1]), crHi = parseInt(m[2]);
        const crMid = Math.round((crLo + crHi) / 2);
        const crBase = getSkillBase('信用评级', edu, dex); // 0
        crAutoPts = Math.max(0, crMid - crBase);
        crAutoPts = Math.min(crAutoPts, intPoints);
      }
    }

    const intPts = crAutoPts > 0 ? { '信用评级': crAutoPts } : {};

    this.setData({
      totalOccPoints: occPoints, totalIntPoints: intPoints,
      usedOccPoints: 0, usedIntPoints: crAutoPts, occPts: {}, intPts,
      // 信用评级自动填充的透明化说明（让玩家知道这几点兴趣点用在了哪里）
      crAutoNote: crAutoPts > 0 ? `✨ 已自动用 ${crAutoPts} 点兴趣点把信用评级填到职业下限中值 ${crMid}%（基础 ${crBase}%），可在技能卡中再调整` : '',
    }, () => {
      this.buildSkillList(occ);
      this.refreshSkillValidation();
    });
  },

  buildSkillList(occ) {
    const occSkillNames = occ.skills.map(s => s.name);
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;

    // 按分类分组
    const groups = {};
    CAT_ORDER.forEach(c => { groups[c] = []; });

    ALL_SKILLS.forEach(sk => {
      const base = getSkillBase(sk.name, edu, dex, this.data.skillSpecs);
      const spec = this.data.skillSpecs[sk.name];
      const displayName = spec ? sk.name + '（' + spec + '）' : sk.name;
      const pts = (this.data.occPts[sk.name] || 0) + (this.data.intPts[sk.name] || 0);
      groups[sk.cat].push({
        name: sk.name,
        displayName: displayName,
        base: base,
        cat: sk.cat,
        isOcc: this.isOccSkill(sk.name),
        total: base + pts,
      });
    });

    // 转成数组
    const groupArray = CAT_ORDER.filter(c => groups[c].length > 0).map(c => ({
      catName: CAT_LABELS[c].label,
      cat: c,
      skills: groups[c],
    }));

    this.setData({ skillGroups: groupArray });
  },

  // Build initial skillSpecs from occupation's fixed skills
  buildInitialSpecs(fixedSkills) {
    const specs = { '母语': '英语' };
    fixedSkills.forEach(s => {
      if (s.spec) {
        specs[s.name] = s.spec;
      } else {
        // For options-type specs without occupation default, use first option name
        const skInfo = ALL_SKILLS.find(sk => sk.name === s.name);
        if (skInfo && skInfo.spec && skInfo.spec.options) {
          specs[s.name] = typeof skInfo.spec.options[0] === 'object' ? skInfo.spec.options[0].name : skInfo.spec.options[0];
        }
      }
    });
    return specs;
  },

  // Get list of fixed skills that have options-type spec (must be selected)
  buildOccSpecRequired(fixedSkills) {
    const required = [];
    fixedSkills.forEach(s => {
      const skInfo = ALL_SKILLS.find(sk => sk.name === s.name);
      if (skInfo && skInfo.spec && skInfo.spec.options) {
        required.push(s.name);
      }
    });
    return required;
  },

  // Get list of required specs that are not yet filled
  getMissingRequiredSpecs() {
    const specs = this.data.skillSpecs || {};
    const required = this.data.occSpecRequired || [];
    return required.filter(name => !specs[name]);
  },

  // Update occSpecMissing data for visual hint
  updateOccSpecMissing() {
    this.setData({ occSpecMissing: this.getMissingRequiredSpecs() });
  },

  isOccSkill(name) {
    if (!this.data.selectedOcc) return false;
    // ★ fixed occ skills
    if (this.data.selectedOcc.skills.some(s => s.name === name && s.mark === '★')) return true;
    // ☆ optional skills that have been selected
    if (this.data.selectedOcc.skills.some(s => s.name === name && s.mark === '☆')) {
      return !!this.data.selectedOptSkills[name];
    }
    // 自由职业技能槽中已选择的技能，以及条目隐含的固定技能（如巡警的“侦查”、除魅师的“潜行”）
    if ((this.data.freeOccSlots || []).some(s => s.skill === name || (s.fixed || []).includes(name))) return true;
    return false;
  },

  // ---------- 自由职业技能槽 ----------
  openFreeSlotDialog(e) {
    const idx = e.currentTarget.dataset.index;
    const slot = this.data.freeOccSlots[idx];
    if (!slot) return;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const occupied = this.data.freeOccSlots.map(s => s.skill).filter(Boolean);
    const list = ALL_SKILLS.filter(sk => {
      if (slot.allowed && !slot.allowed.includes(sk.name)) return false;
      if (occupied.includes(sk.name)) return false;
      return true;
    }).map(sk => ({ name: sk.name, base: getSkillBase(sk.name, edu, dex, this.data.skillSpecs) }));
    this.setData({ freeSlotEditing: idx, freeSlotDialogList: list, showFreeSlotDialog: true });
  },
  closeFreeSlotDialog() { this.setData({ showFreeSlotDialog: false, freeSlotEditing: -1 }); },
  pickFreeSlotSkill(e) {
    const skillName = e.currentTarget.dataset.name;
    const idx = this.data.freeSlotEditing;
    if (idx < 0 || !skillName) return;
    const slots = this.data.freeOccSlots.map((s, i) => (i === idx ? { ...s, skill: skillName } : s));
    this.setData({ freeOccSlots: slots, showFreeSlotDialog: false, freeSlotEditing: -1 });
    if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
    this.refreshSkillValidation();
    this._scheduleDraft();
  },
  clearFreeSlotSkill(e) {
    const idx = e.currentTarget.dataset.index;
    const slots = this.data.freeOccSlots.map((s, i) => (i === idx ? { ...s, skill: '' } : s));
    this.setData({ freeOccSlots: slots });
    if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
    this.refreshSkillValidation();
    this._scheduleDraft();
  },

  toggleOptSkill(e) {
    const name = e.currentTarget.dataset.name;
    const opt = { ...this.data.selectedOptSkills };
    
    // Update occOptGroups display state
    const groups = this.data.occOptGroups.map(g => ({
      ...g,
      skills: g.skills.map(s => ({
        ...s,
        selected: s.name === name ? !s.selected : s.selected,
      })),
    }));
    
    if (opt[name]) {
      delete opt[name];
      const occPts = { ...this.data.occPts };
      delete occPts[name];
      this.setData({ selectedOptSkills: opt, occPts, occOptGroups: groups }, () => {
        this.recalcTotals();
        this.buildSkillList(this.data.selectedOcc);
        this._scheduleDraft();
      });
      return;
    } else {
      opt[name] = true;
      this.setData({ selectedOptSkills: opt, occOptGroups: groups }, () => {
        this.buildSkillList(this.data.selectedOcc);
        this.refreshSkillValidation();
        this._scheduleDraft();
      });
      return;
    }
  },

  recalcTotals() {
    const occPts = this.data.occPts || {};
    const intPts = this.data.intPts || {};
    let newUsedOcc = 0, newUsedInt = 0;
    for (const sk of ALL_SKILLS) {
      newUsedOcc += occPts[sk.name] || 0;
      newUsedInt += intPts[sk.name] || 0;
    }
    this.setData({ usedOccPoints: newUsedOcc, usedIntPoints: newUsedInt }, () => {
      this.refreshSkillValidation();
    });
  },

  // ==================== STEP 4：技能分配（双池 slider） ====================
  openSkillDialog(e) {
    const name = e.currentTarget.dataset.name;
    const isOcc = this.isOccSkill(name);
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex, this.data.skillSpecs);
    const curOcc = this.data.occPts[name] || 0;
    const curInt = this.data.intPts[name] || 0;
    const { usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;

    // 计算各 slider 最大可加值
    const safeOccPad = totalOccPoints - usedOccPoints + curOcc;  // 最多还能从职业池加的
    const safeIntPad = totalIntPoints - usedIntPoints + curInt;   // 最多还能从兴趣池加的
    // 7 版规则：建卡时非信用评级技能不得超过 75%；编辑模式解除限制
    const cap = (!overrideLimits && name !== '信用评级') ? 75 : 100;
    const spaceToCap = cap - base - curOcc - curInt;              // 到上限还剩多少空间

    const maxOcc = isOcc ? Math.min(safeOccPad, spaceToCap + curOcc) : 0;
    const maxInt = isOcc ? Math.min(safeIntPad, spaceToCap + curInt) : Math.min(safeIntPad, spaceToCap + curInt);

    const skInfo = ALL_SKILLS.find(s => s.name === name);
    const catName = CAT_LABELS[skInfo ? skInfo.cat : 'knowledge'].label;
    const spec = skInfo ? skInfo.spec : null;
    const currentSpec = spec ? (this.data.skillSpecs[name] || (spec.options ? spec.options[0].name : '')) : null;
    const dialogSpecIndex = spec && spec.options ? spec.options.findIndex(o => (o.name || o) === currentSpec) : 0;

    this.setData({
      dialogSkill: { name, isOcc, base, desc: skInfo ? skInfo.desc : '', catName, spec, currentSpec },
      dialogSpecIndex: Math.max(0, dialogSpecIndex),
      dialogOccVal: curOcc,
      dialogIntVal: curInt,
      dialogOccMax: overrideLimits ? 99 : Math.max(curOcc, maxOcc),
      dialogIntMax: overrideLimits ? 99 : Math.max(curInt, maxInt),
      dialogBase: base,
      showDialog: true,
      dialogReadonly: false,
    });
  },

  openSkillInfo(e) {
    const name = e.currentTarget.dataset.name;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex, this.data.skillSpecs);
    const total = base + (this.data.occPts[name] || 0) + (this.data.intPts[name] || 0);
    const skInfo = ALL_SKILLS.find(s => s.name === name);
    const catName = CAT_LABELS[skInfo ? skInfo.cat : 'knowledge'].label;
    this.setData({
      dialogSkill: { name, isOcc: false, base, desc: skInfo ? skInfo.desc : '', catName, currentVal: total },
      showDialog: true,
      dialogReadonly: true,
    });
  },

  closeSkillDialog() {
    this.setData({ showDialog: false, dialogSkill: null, dialogReadonly: false });
  },

  onOccSliderChange(e) {
    this.setData({ dialogOccVal: parseInt(e.detail.value) });
  },
  onIntSliderChange(e) {
    this.setData({ dialogIntVal: parseInt(e.detail.value) });
  },
  onSpecChange(e) {
    const idx = parseInt(e.detail.value);
    const name = this.data.dialogSkill.name;
    const spec = this.data.dialogSkill.spec;
    const chosen = spec && spec.options ? (typeof spec.options[idx] === 'object' ? spec.options[idx].name : spec.options[idx]) : '';
    // Recalculate base with new spec
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const newSkillSpecs = { ...this.data.skillSpecs, [name]: chosen };
    const newBase = getSkillBase(name, edu, dex, newSkillSpecs);
    const curOcc = this.data.occPts[name] || 0;
    const curInt = this.data.intPts[name] || 0;
    const { usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;
    const safeOccPad = totalOccPoints - usedOccPoints + curOcc;
    const safeIntPad = totalIntPoints - usedIntPoints + curInt;
    const isOcc = this.isOccSkill(name);
    // 7 版规则：建卡时非信用评级技能不得超过 75%；编辑模式解除限制
    const cap = (!overrideLimits && name !== '信用评级') ? 75 : 100;
    const spaceToCap = cap - newBase - curOcc - curInt;
    const maxOcc = isOcc ? Math.min(safeOccPad, spaceToCap + curOcc) : 0;
    const maxInt = isOcc ? Math.min(safeIntPad, spaceToCap + curInt) : Math.min(safeIntPad, spaceToCap + curInt);

    this.setData({
      'dialogSkill.currentSpec': chosen,
      'dialogSkill.base': newBase,
      dialogSpecIndex: idx,
      dialogBase: newBase,
      dialogOccMax: overrideLimits ? 99 : Math.max(curOcc, maxOcc),
      dialogIntMax: overrideLimits ? 99 : Math.max(curInt, maxInt),
      skillSpecs: newSkillSpecs,
    });
    this.updateOccSpecMissing();
    if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
    this.refreshSkillValidation();
    this._scheduleDraft();
  },
  onSpecTextInput(e) {
    const val = e.detail.value;
    const name = this.data.dialogSkill.name;
    this.setData({
      'dialogSkill.currentSpec': val,
      skillSpecs: { ...this.data.skillSpecs, [name]: val },
    });
    this.updateOccSpecMissing();
    if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
    this.refreshSkillValidation();
    this._scheduleDraft();
  },

  confirmSkillDialog() {
    const { dialogSkill, dialogOccVal, dialogIntVal } = this.data;
    if (!dialogSkill) return;
    const name = dialogSkill.name;
    const isOcc = dialogSkill.isOcc;
    const prevOcc = this.data.occPts[name] || 0;
    const prevInt = this.data.intPts[name] || 0;
    const newOcc = isOcc ? dialogOccVal : 0;
    const newInt = dialogIntVal;
    const diffOcc = newOcc - prevOcc;
    const diffInt = newInt - prevInt;
    if (diffOcc === 0 && diffInt === 0) { this.closeSkillDialog(); return; }

    const { usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;
    // 检查点数（编辑模式不限制）
    if (!overrideLimits && diffOcc > 0 && usedOccPoints + diffOcc > totalOccPoints) {
      wx.showToast({ title: '职业技能点不足', icon: 'none' }); return;
    }
    if (!overrideLimits && diffInt > 0 && usedIntPoints + diffInt > totalIntPoints) {
      wx.showToast({ title: '兴趣技能点不足', icon: 'none' }); return;
    }

    const occPts = { ...this.data.occPts, [name]: newOcc };
    const intPts = { ...this.data.intPts, [name]: newInt };

    // 重算总使用点数
    let newUsedOcc = 0, newUsedInt = 0;
    for (const sk of ALL_SKILLS) {
      newUsedOcc += occPts[sk.name] || 0;
      newUsedInt += intPts[sk.name] || 0;
    }

    // 更新分组显示
    const groups = this.data.skillGroups.map(g => ({
      ...g,
      skills: g.skills.map(s => ({
        ...s,
        total: s.base + (occPts[s.name] || 0) + (intPts[s.name] || 0),
      })),
    }));

    this.setData({
      occPts, intPts,
      usedOccPoints: newUsedOcc,
      usedIntPoints: newUsedInt,
      skillGroups: groups,
      showDialog: false,
      dialogSkill: null,
      canNext: newUsedOcc > 0 || newUsedInt > 0,
    }, () => {
      this.refreshSkillValidation();
      this._scheduleDraft();
    });
  },

  // 技能点内联快捷加减（+5/−5）：职业技能优先用职业池，不足时自动补兴趣池
  quickSkillAdjust(e) {
    const name = e.currentTarget.dataset.name;
    const delta = parseInt(e.currentTarget.dataset.delta) || 0;
    if (!name || !delta) return;
    const isOcc = this.isOccSkill(name);
    const { occPts, intPts, usedOccPoints, totalOccPoints, usedIntPoints, totalIntPoints, overrideLimits } = this.data;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex, this.data.skillSpecs);
    const curOcc = occPts[name] || 0;
    const curInt = intPts[name] || 0;
    const cap = (!overrideLimits && name !== '信用评级') ? 75 : 100;
    const space = cap - base - curOcc - curInt;

    let newOcc = curOcc, newInt = curInt;
    if (delta > 0) {
      const remaining = Math.max(0, Math.min(delta, space));
      if (isOcc) {
        const occAdd = Math.min(remaining, Math.max(0, totalOccPoints - usedOccPoints));
        newOcc = curOcc + occAdd;
        newInt = curInt + Math.min(remaining - occAdd, Math.max(0, totalIntPoints - usedIntPoints));
      } else {
        newInt = curInt + Math.min(remaining, Math.max(0, totalIntPoints - usedIntPoints));
      }
    } else {
      if (isOcc) newOcc = Math.max(0, curOcc + delta);
      else newInt = Math.max(0, curInt + delta);
    }
    if (newOcc === curOcc && newInt === curInt) {
      if (delta > 0) wx.showToast({ title: '技能点不足或已达上限', icon: 'none', duration: 1200 });
      return;
    }
    const newOccPts = { ...occPts, [name]: newOcc };
    const newIntPts = { ...intPts, [name]: newInt };
    let newUsedOcc = 0, newUsedInt = 0;
    for (const sk of ALL_SKILLS) {
      newUsedOcc += newOccPts[sk.name] || 0;
      newUsedInt += newIntPts[sk.name] || 0;
    }
    const groups = this.data.skillGroups.map(g => ({
      ...g,
      skills: g.skills.map(s => s.name === name
        ? { ...s, total: s.base + (newOccPts[s.name] || 0) + (newIntPts[s.name] || 0) }
        : s),
    }));
    this.setData({ occPts: newOccPts, intPts: newIntPts, usedOccPoints: newUsedOcc, usedIntPoints: newUsedInt, skillGroups: groups }, () => {
      this.refreshSkillValidation();
      this._scheduleDraft();
    });
  },

  // ==================== STEP 5：角色卡预览 ====================
  calcDerived() {
    return calcDerivedFrom(this.data.attrValues, this.data.charInfo);
  },

  buildPreviewSkills(occPts, intPts, attrVals, specsOverride) {
    const edu = attrVals.edu || 50;
    const dex = attrVals.dex || 50;
    const specs = specsOverride || this.data.skillSpecs || {};
    const groups = {};
    CAT_ORDER.forEach(c => { groups[c] = []; });
    ALL_SKILLS.forEach(sk => {
      const base = getSkillBase(sk.name, edu, dex, specs);
      const pt = (occPts[sk.name] || 0) + (intPts[sk.name] || 0);
      if (base + pt > 0) {
        const spec = specs[sk.name];
        const displayName = spec ? sk.name + '（' + spec + '）' : sk.name;
        const total = base + pt;
        groups[sk.cat].push({ name: sk.name, displayName, base, total, hard: Math.floor(total / 2), extreme: Math.floor(total / 5) });
      }
    });
    return CAT_ORDER.filter(c => groups[c].length > 0).map(c => ({
      catName: CAT_LABELS[c].label, cat: c, skills: groups[c],
    }));
  },

  // ==================== 导航 ====================
  nextStep() {
    if (!this.data.canNext) return;
    // 技能页离开前确认未分配点数（编辑模式与超点情况跳过，超点由阻塞校验拦截）
    if (this.data.step === 4 && !this.data.overrideLimits) {
      const v = this.buildSkillValidation();
      const remainOcc = Math.max(0, v.occRemain);
      const remainInt = Math.max(0, v.intRemain);
      const over = this.data.usedOccPoints > this.data.totalOccPoints || this.data.usedIntPoints > this.data.totalIntPoints;
      if (!over && (remainOcc > 0 || remainInt > 0)) {
        const parts = [];
        if (remainOcc > 0) parts.push('职业 ' + remainOcc);
        if (remainInt > 0) parts.push('兴趣 ' + remainInt);
        wx.showModal({
          title: '还有技能点未分配',
          content: parts.join('、') + ' 点未分配，确定继续吗？',
          confirmText: '继续',
          cancelText: '回去分配',
          success: (res) => { if (res.confirm) this._doNextStep(); }
        });
        return;
      }
    }
    this._doNextStep();
  },

  _doNextStep() {
    const next = this.data.step + 1;
    
    // 从 Step 3 进入 Step 4 时，校验可选技能选择数量
    // Step 2→3: 检查年龄修正
    if (this.data.step === 2) {
      if (this.data.needAgeMod && !this.data.ageModDone) {
        wx.showToast({ title: '请先完成年龄修正', icon: 'none' });
        return;
      }
    }

    if (this.data.step === 3 && this.data.occOptGroups && this.data.occOptGroups.length > 0) {
      const msgs = [];
      for (const g of this.data.occOptGroups) {
        const selected = g.skills.filter(s => s.selected).length;
        const need = g.count;
        const names = g.skills.map(s => s.name).join('、');
        if (selected < need) {
          msgs.push(`「${names}」需选${need}项，少选了${need - selected}项`);
        } else if (selected > need) {
          msgs.push(`「${names}」限选${need}项，多选了${selected - need}项`);
        }
      }
      if (msgs.length > 0) {
        wx.showToast({ title: msgs[0], icon: 'none', duration: 2500 });
        return;
      }
    }

    // 校验必填专攻技能（options 型 spec 必须选择）
    if (this.data.step === 3 || this.data.step === 4) {
      const missingSpecs = this.getMissingRequiredSpecs();
      if (missingSpecs.length > 0) {
        const label = missingSpecs[0];
        wx.showToast({ title: `「${label}」请选择专攻方向`, icon: 'none', duration: 2000 });
        return;
      }
    }

    if (this.data.step === 4) {
      const blockingMessages = this.getBlockingCreationMessages();
      if (blockingMessages.length > 0) {
        wx.showToast({ title: blockingMessages[0], icon: 'none', duration: 2200 });
        this.refreshSkillValidation();
        return;
      }
    }
    
    if (next === 5) {
      this._refreshSheet();
      this.setData({ step: next, maxStep: Math.max(this.data.maxStep, next) });
    } else {
      this.setData({ step: next, canNext: false, maxStep: Math.max(this.data.maxStep, next) });
      if (next === 3) this.filterOccs(this.data.occSearch || '');
    }
    this._scheduleDraft();
  },

  // 进入角色卡前统一重算衍生值/技能预览/默认文本（进入 Step 5 的唯一切换口）
  _refreshSheet() {
    const derived = this.calcDerived();
    const derivedItems = makeDerivedItems(derived);
    const sortedSkillsByCat = this.buildPreviewSkills(this.data.occPts, this.data.intPts, this.data.attrValues);
    const cm = (this.data.occPts['克苏鲁神话'] || 0) + (this.data.intPts['克苏鲁神话'] || 0);
    const cmBase = getSkillBase('克苏鲁神话', this.data.attrValues.edu || 50, this.data.attrValues.dex || 50);
    const maxSAN = 99 - (cmBase + cm);
    // 角色创建完成时，若背景故事/资产为空则填入默认模板
    const backstory = this.data.charBackstory || this.getDefaultBackstory();
    const cr = (this.data.occPts['信用评级'] || 0) + (this.data.intPts['信用评级'] || 0);
    const assets = this.data.charAssets || this.getDefaultAssets(cr);
    const nextHP = this.data.isCompleted ? (this.data.playHP !== undefined ? this.data.playHP : derived.hp) : derived.hp;
    const nextSAN = this.data.isCompleted ? (this.data.playSAN !== undefined ? this.data.playSAN : derived.san) : derived.san;
    const nextMP = this.data.isCompleted ? (this.data.playMP !== undefined ? this.data.playMP : derived.mp) : derived.mp;
    const nextLuck = this.data.isCompleted ? (this.data.playLuck !== undefined ? this.data.playLuck : (this.data.attrValues.luck || 50)) : (this.data.attrValues.luck || 50);
    const nextSanDayStart = this.data.sanDayStart || nextSAN;
    const vitalState = this.getVitalState({
      derived, playHP: nextHP, playSAN: nextSAN, playMP: nextMP, playLuck: nextLuck,
      maxSAN: maxSAN, maxMP: derived.mp, sanDayStart: nextSanDayStart,
    });
    this.setData({
      derived, derivedItems, sortedSkillsByCat,
      attrDisplay: makeAttrDisplay(this.data.attrValues),
      playHP: nextHP, playSAN: nextSAN, playMP: nextMP, playLuck: nextLuck,
      maxSAN: maxSAN, maxMP: derived.mp, sanDayStart: nextSanDayStart,
      ...vitalState,
      charBackstory: backstory, charAssets: assets,
    });
  },
  getDefaultBackstory() {
    return '形象描述：\n思想与信念：\n重要之人：\n意义非凡之地：\n宝贵之物：\n特质：\n创伤和疤痕：\n恐惧症和躁狂症：\n典籍、法术和神话造物：\n第三类接触：';
  },
  getDefaultAssets(cr) {
    let cash, assets, spending;
    if (cr <= 0) {
      cash = '$0.50'; assets = '无'; spending = '$0.50';
    } else if (cr <= 9) {
      cash = '$' + (cr * 1); assets = '$' + (cr * 10); spending = '$2';
    } else if (cr <= 49) {
      cash = '$' + (cr * 2); assets = '$' + (cr * 50); spending = '$10';
    } else if (cr <= 89) {
      cash = '$' + (cr * 5); assets = '$' + (cr * 500); spending = '$50';
    } else if (cr <= 98) {
      cash = '$' + (cr * 20); assets = '$' + (cr * 2000); spending = '$250';
    } else {
      cash = '$50,000'; assets = '$5,000,000+'; spending = '$5,000';
    }
    return '消费水平：' + spending + '\n现金：' + cash + '\n资产：' + assets;
  },
  // 状态校准层：所有步骤切换统一走这里，进入时补齐该步骤的派生状态
  _enterStep(s) {
    const prev = this.data.step;
    const opts = { step: s };
    if (s === 0) {
      opts.canNext = false;
      opts.playMode = false;
      opts.isCompleted = false;
    } else {
      opts.canNext = true;
    }
    this.setData(opts);
    if (s === 3) this.filterOccs(this.data.occSearch || '');
    if (s === 4 && this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
    if (s === 5 && prev !== 5) this._refreshSheet();
    this._scheduleDraft();
  },
  prevStep() {
    const prev = this.data.step - 1;
    if (prev >= 0) this._enterStep(prev);
  },
  goToStep(e) {
    const s = parseInt(e.currentTarget.dataset.step);
    if (!(s >= 1 && s <= 5)) return;
    if (s > this.data.maxStep) {
      wx.showToast({ title: '请先按顺序完成前面的步骤', icon: 'none' });
      return;
    }
    // 直接跳到完成页时，同样执行阻塞校验，避免生成不完整角色卡
    if (s === 5 && this.data.step !== 5) {
      const missingSpecs = this.getMissingRequiredSpecs();
      if (missingSpecs.length > 0) {
        wx.showToast({ title: `「${missingSpecs[0]}」请选择专攻方向`, icon: 'none', duration: 2000 });
        return;
      }
      const blocking = this.getBlockingCreationMessages();
      if (blocking.length > 0) {
        wx.showToast({ title: blocking[0], icon: 'none', duration: 2200 });
        return;
      }
    }
    this._enterStep(s);
  },

  // ==================== 保存角色 ====================
  saveCharacter() {
    const charData = this.buildCharacterData(true);
    if (this.persistCharacter(charData)) {
      this.clearDraft();
      this.setData({ isCompleted: true, savedAt: charData.timestamp, showSaveSuccess: true });
      setTimeout(() => { this.setData({ showSaveSuccess: false }); }, 2000);
    }
  },

  // ==================== 导出角色 ====================
  toggleExportDialog() {
    this.setData({ showExportDialog: !this.data.showExportDialog });
  },

  doExportClipboard() {
    const charData = this.buildCharacterData(true);
    wx.setClipboardData({
      data: JSON.stringify(charData, null, 2),
      success: () => { wx.showToast({ title: '已复制到剪贴板', icon: 'success' }); this.setData({ showExportDialog: false }); },
      fail: () => { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  doExportDice() {
    const text = this.generateDiceImport();
    wx.setClipboardData({
      data: text,
      success: () => { wx.showToast({ title: '已复制，可粘贴到骰娘', icon: 'success' }); this.setData({ showExportDialog: false }); }
    });
  },

  // 可读文本角色卡（贴群 / 打印 / 交给 KP）
  doExportText() {
    const v = this.data.attrValues;
    const d = this.data.derived || this.calcDerived();
    const lines = [];
    lines.push('【' + (this.data.charInfo.name || '未命名调查员') + '】' +
      (this.data.selectedOcc ? ' ' + this.data.selectedOcc.name : '') +
      ' | ' + (this.data.charInfo.era || '1920s'));
    lines.push('');
    lines.push('属性：STR ' + (v.str || 0) + ' CON ' + (v.con || 0) + ' DEX ' + (v.dex || 0) + ' APP ' + (v.app || 0) + ' POW ' + (v.pow || 0) + ' SIZ ' + (v.siz || 0) + ' INT ' + (v.int || 0) + ' EDU ' + (v.edu || 0) + ' LUCK ' + (v.luck || 0));
    lines.push('衍生：HP ' + d.hp + ' SAN ' + d.san + ' MP ' + d.mp + ' DB ' + d.db + ' 体格 ' + d.build + ' MOV ' + d.mov);
    lines.push('');
    const groups = this.data.sortedSkillsByCat || [];
    groups.forEach(g => {
      lines.push('◆ ' + g.catName);
      g.skills.forEach(s => lines.push('  ' + (s.displayName || s.name) + ' ' + s.total + '%'));
    });
    if (this.data.charWeapons && this.data.charWeapons.length > 0) {
      lines.push('');
      lines.push('武器：');
      this.data.charWeapons.forEach(w => lines.push('  ' + w.name + ' | ' + w.skill + ' | ' + w.damage + ' | 射程 ' + w.range + ' | 弹药 ' + (w.ammo || '——')));
    }
    const blocks = [
      ['背景故事', this.data.charBackstory], ['随身物品', this.data.charGear],
      ['神话相关', this.data.charMythos], ['法术', this.data.charSpells],
      ['调查员伙伴', this.data.charCompanions], ['资产', this.data.charAssets]
    ];
    blocks.forEach(b => {
      if (b[1]) { lines.push(''); lines.push(b[0] + '：'); lines.push(b[1]); }
    });
    wx.setClipboardData({
      data: lines.join('\n'),
      success: () => { wx.showToast({ title: '已复制文本角色卡', icon: 'success' }); this.setData({ showExportDialog: false }); }
    });
  },

  // ==================== 骰娘导入 ====================
  // 海豹骰（Sealdice）官方 .st 格式：`.st 角色名-力量60 敏捷70 ...`，空格分隔、中文主键，
  // 英文缩写为同义词（参考 https://docs.sealdice.com/use/coc7.html）；塔塔等骰娘兼容该格式。
  generateDiceImport() {
    const v = this.data.attrValues;
    const occPts = this.data.occPts || {};
    const intPts = this.data.intPts || {};
    const specs = this.data.skillSpecs || {};
    const name = this.data.charInfo.name || '调查员';
    const edu = v.edu || 50;
    const dex = v.dex || 50;

    const total = (skName) => {
      const sk = ALL_SKILLS.find(s => s.name === skName);
      const base = sk ? getSkillBase(sk.name, edu, dex, specs) : 0;
      return base + (occPts[skName] || 0) + (intPts[skName] || 0);
    };

    const parts = [];
    // 九项属性（含力量）+ 衍生值
    parts.push('力量' + (v.str || 0));
    parts.push('敏捷' + (v.dex || 0));
    parts.push('意志' + (v.pow || 0));
    parts.push('体质' + (v.con || 0));
    parts.push('外貌' + (v.app || 0));
    parts.push('教育' + (v.edu || 0));
    parts.push('体型' + (v.siz || 0));
    parts.push('智力' + (v.int || 0));
    parts.push('幸运' + (v.luck || 0));
    const san = v.pow || 50;
    const mp = Math.floor(san / 5);
    const hp = Math.floor(((v.con || 50) + (v.siz || 50)) / 10);
    parts.push('hp' + hp, '理智' + san, 'mp' + mp);

    const skillOrder = [
      '会计','人类学','估价','考古学','技艺①','技艺②','取悦','攀爬','计算机使用',
      '信用评级','克苏鲁神话','乔装','闪避','驾驶①','电气维修','电子学','话术',
      '格斗①','射击①','射击②','射击③','急救','历史','恐吓','跳跃','母语',
      '法律','图书馆使用','聆听','锁匠','机械维修','医学','博物学','导航','神秘学',
      '操作重型机械','说服','精神分析','心理学','骑术','妙手','科学','侦查',
      '潜行','生存','游泳','投掷','追踪','催眠','爆破','潜水','读唇','动物驯养','药学'
    ];

    for (const skName of skillOrder) {
      const t = total(skName);
      if (t <= 0) continue;

      // 专攻技能：必须有专攻名才导出，否则跳过
      const needsSpec = ['格斗①','格斗②','射击①','射击②','射击③','技艺①','技艺②','技艺③','驾驶①','科学','外语①','外语②','外语③'].includes(skName);
      const spec = specs[skName];
      if (needsSpec && !spec) continue;

      // 母语始终用技能名，专攻技能有专攻时用专攻名（规则书技能名）
      const key = (skName === '母语') ? '母语' : (needsSpec && spec) ? spec : skName;
      parts.push(key + t);
    }

    return '.st ' + name + '-' + parts.join(' ');
  },

  // ==================== 游玩模式 ====================
  togglePlayMode() {
    if (this.data.playMode) {
      // 退出游玩：自动保存
      this.persistCharacter(this.buildCharacterData(this.data.isCompleted), '已自动保存');
    } else if (!this.data.sanDayStart) {
      const sanStart = parseInt(this.data.playSAN) || parseInt(this.data.derived.san) || 0;
      this.setData({ sanDayStart: sanStart, sessionSanLoss: 0 }, () => {
        this.refreshPlayDashboard();
      });
    }
    this.setData({ playMode: !this.data.playMode });
  },

  toggleThresholds() {
    this.setData({ showThresholds: !this.data.showThresholds });
  },

  toggleOverride() {
    this.setData({ overrideLimits: !this.data.overrideLimits }, () => {
      this.refreshSkillValidation();
      if (this.data.selectedOcc) this.buildSkillList(this.data.selectedOcc);
      this._scheduleDraft();
    });
  },

  toggleSkillTick(e) {
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    const ticked = { ...this.data.tickedSkills };
    if (ticked[name]) {
      delete ticked[name];
    } else {
      ticked[name] = true;
    }
    this.setData({ tickedSkills: ticked });
  },

  onHPChange(e) {
    const val = Math.max(0, parseInt(e.detail.value) || 0);
    this.setData({ playHP: val, ...this.getVitalState({ playHP: val }) });
  },
  onSANChange(e) {
    const val = Math.max(0, parseInt(e.detail.value) || 0);
    this.setData({ playSAN: val, ...this.getVitalState({ playSAN: val }) });
  },
  onMPChange(e) {
    const val = Math.max(0, parseInt(e.detail.value) || 0);
    this.setData({ playMP: val, ...this.getVitalState({ playMP: val }) });
  },
  toggleMajorWound() {
    const next = !this.data.majorWound;
    this.setData({ majorWound: next });
    if (this.data.playMode) this.addPlayLog({ type: next ? 'harm' : 'note', title: next ? '标记重伤' : '解除重伤', meta: this.data.charInfo.name || '调查员' });
  },
  toggleDying() {
    const next = !this.data.dying;
    this.setData({ dying: next });
    if (this.data.playMode) this.addPlayLog({ type: next ? 'harm' : 'note', title: next ? '标记濒死' : '解除濒死', meta: this.data.charInfo.name || '调查员' });
  },
  onLuckChange(e) {
    const val = parseInt(e.detail.value) || 0;
    const newAttr = { ...this.data.attrValues, luck: val };
    this.setData({ playLuck: val, attrValues: newAttr, attrDisplay: makeAttrDisplay(newAttr), ...this.getVitalState({ playLuck: val }) });
  },
  adjustStat(e) {
    const field = e.currentTarget.dataset.field;
    const delta = parseInt(e.currentTarget.dataset.delta) || 0;
    const map = {
      hp: { key: 'playHP', label: 'HP', max: this.data.derived.hp || 99 },
      san: { key: 'playSAN', label: 'SAN', max: this.data.maxSAN || 99 },
      mp: { key: 'playMP', label: 'MP', max: this.data.maxMP || 99 },
      luck: { key: 'playLuck', label: '幸运', max: 99 },
    };
    const cfg = map[field];
    if (!cfg) return;
    const oldVal = parseInt(this.data[cfg.key]) || 0;
    const newVal = Math.max(0, Math.min(cfg.max, oldVal + delta));
    if (newVal === oldVal) return;
    const update = { [cfg.key]: newVal };
    if (field === 'luck') {
      const attrValues = { ...this.data.attrValues, luck: newVal };
      update.attrValues = attrValues;
      update.attrDisplay = makeAttrDisplay(attrValues);
    }
    if (field === 'san' && delta < 0) {
      update.sessionSanLoss = (this.data.sessionSanLoss || 0) + Math.abs(delta);
    }
    this.setData({ ...update, ...this.getVitalState(update) });
    this.addPlayLog({
      type: delta < 0 ? 'harm' : 'heal',
      title: `${cfg.label} ${delta > 0 ? '+' : ''}${delta}`,
      meta: `${oldVal} → ${newVal}`,
    });
  },
  resetSanDay() {
    const start = parseInt(this.data.playSAN) || 0;
    this.setData({ sanDayStart: start, sessionSanLoss: 0, ...this.getVitalState({ sanDayStart: start, sessionSanLoss: 0 }) });
    this.addPlayLog({ type: 'note', title: '重置理智日累计', meta: `当日起始 SAN ${start}` });
  },

  openSanDialog() {
    this.setData({ showSanDialog: true, sanRollResult: null });
  },
  closeSanDialog() {
    this.setData({ showSanDialog: false, sanRollResult: null });
  },
  setSanFormula(e) {
    const formula = e.currentTarget.dataset.formula;
    this.setData({ sanFormula: formula, sanRollResult: null });
  },
  onSanFormulaInput(e) {
    this.setData({ sanFormula: e.detail.value, sanRollResult: null });
  },
  parseSanFormula(formula) {
    const raw = String(formula || '0/1D6').replace(/\s/g, '').toUpperCase();
    const parts = raw.split('/');
    return {
      raw,
      successLoss: parts[0] || '0',
      failLoss: parts[1] || parts[0] || '0',
    };
  },
  rollLossExpression(expr) {
    const raw = String(expr || '0').replace(/\s/g, '').toUpperCase();
    if (!raw || raw === '0' || raw === '-') return { total: 0, detail: '0' };
    const terms = raw.replace(/-/g, '+-').split('+').filter(Boolean);
    let total = 0;
    const details = [];

    for (const term of terms) {
      const sign = term[0] === '-' ? -1 : 1;
      const body = sign < 0 ? term.slice(1) : term;
      const diceMatch = body.match(/^(\d*)D(\d+)$/);
      if (diceMatch) {
        const count = Math.min(parseInt(diceMatch[1] || '1'), 20);
        const sides = Math.min(parseInt(diceMatch[2]), 100);
        const rolls = [];
        for (let i = 0; i < count; i++) rolls.push(this.roll(sides));
        const subtotal = rolls.reduce((sum, n) => sum + n, 0);
        total += sign * subtotal;
        details.push(`${sign < 0 ? '-' : ''}${body}(${rolls.join(',')})`);
      } else {
        const n = parseInt(body);
        if (!isNaN(n)) {
          total += sign * n;
          details.push(`${sign < 0 ? '-' : ''}${n}`);
        }
      }
    }

    return { total: Math.max(0, total), detail: details.join(' + ') || '0' };
  },
  rollSanCheck() {
    const san = parseInt(this.data.playSAN) || 0;
    const formula = this.parseSanFormula(this.data.sanFormula);
    const roll = this.rollDice();
    const level = this.getSuccessLevel(roll, san);
    const success = ['critical', 'extreme', 'hard', 'normal'].includes(level.level);
    const lossExpr = success ? formula.successLoss : formula.failLoss;
    const lossRoll = this.rollLossExpression(lossExpr);
    const oldSAN = san;
    const newSAN = Math.max(0, Math.min(this.data.maxSAN || 99, oldSAN - lossRoll.total));
    const sessionSanLoss = (this.data.sessionSanLoss || 0) + lossRoll.total;
    const sanDayStart = this.data.sanDayStart || oldSAN;
    const dailyLimit = Math.max(1, Math.ceil(sanDayStart / 5));
    // 7 版规则：单次损失 ≥ 最大理智的 1/5 → 临时疯狂
    const tempThreshold = Math.max(1, Math.ceil((this.data.maxSAN || san) / 5));
    const result = {
      roll,
      success,
      levelLabel: level.label,
      loss: lossRoll.total,
      lossDetail: lossRoll.detail,
      oldSAN,
      newSAN,
      tempInsanity: lossRoll.total > 0 && lossRoll.total >= tempThreshold,
      indefiniteRisk: sessionSanLoss >= dailyLimit,
    };

    this.setData({
      playSAN: newSAN,
      sessionSanLoss,
      sanDayStart,
      sanRollResult: result,
      ...this.getVitalState({ playSAN: newSAN, sessionSanLoss, sanDayStart }),
    });
    this.addPlayLog({
      type: lossRoll.total > 0 ? 'san' : 'roll',
      title: `SAN 检定${success ? '成功' : '失败'}`,
      meta: `投 ${roll} / ${oldSAN}，损失 ${lossRoll.total}，SAN ${oldSAN} → ${newSAN}`,
    });
  },

  rollDice() {
    // d100: tens (0-9) + ones (0-9), 00+0 = 100
    const tens = Math.floor(Math.random() * 10);
    const ones = Math.floor(Math.random() * 10);
    return tens === 0 && ones === 0 ? 100 : tens * 10 + ones;
  },

  getSuccessLevel(roll, skill) {
    if (roll === 1) return { level: 'critical', label: '🌟 大成功', color: '#ff6600' };
    if (skill >= 50 && roll === 100) return { level: 'fumble', label: '💀 大失败', color: '#cc0000' };
    if (skill < 50 && roll >= 96) return { level: 'fumble', label: '💀 大失败', color: '#cc0000' };
    if (roll > skill) return { level: 'fail', label: '❌ 失败', color: '#999' };
    if (roll <= Math.floor(skill / 5)) return { level: 'extreme', label: '✨ 极难成功', color: '#00aa44' };
    if (roll <= Math.floor(skill / 2)) return { level: 'hard', label: '⭐ 困难成功', color: '#3388dd' };
    return { level: 'normal', label: '✅ 常规成功', color: '#66aa33' };
  },

  openRollDialog(e) {
    const name = e.currentTarget.dataset.name;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase(name, edu, dex, this.data.skillSpecs);
    const total = base + (this.data.occPts[name] || 0) + (this.data.intPts[name] || 0);
    this.setData({
      rollSkill: { name, value: total },
      rollResult: null,
      rollBonus: 0,
      showRollDialog: true,
    });
  },

  openAttrRoll(e) {
    const name = e.currentTarget.dataset.name;
    const value = parseInt(e.currentTarget.dataset.value) || 50;
    this.setData({
      rollSkill: { name, value },
      rollResult: null,
      rollBonus: 0,
      showRollDialog: true,
    });
  },

  doRoll() {
    const skill = this.data.rollSkill.value;
    const bonus = this.data.rollBonus || 0;
    
    // 1 个个位骰 (0-9)
    const ones = Math.floor(Math.random() * 10);
    
    // (1 + |bonus|) 个十位骰
    const count = 1 + Math.abs(bonus);
    const tensDice = [];
    for (let i = 0; i < count; i++) {
      tensDice.push(Math.floor(Math.random() * 10));
    }
    
    // 组合：每个十位 × 10 + 个位，00+0=100
    const results = tensDice.map(t => (t === 0 && ones === 0) ? 100 : t * 10 + ones);
    
    // 奖励骰：取最小；惩罚骰：取最大
    let roll;
    if (bonus > 0) roll = Math.min(...results);
    else if (bonus < 0) roll = Math.max(...results);
    else roll = results[0];
    
    const level = this.getSuccessLevel(roll, skill);
    const extraDice = tensDice.length > 1 ? tensDice.slice(1).map(d => d * 10).join('、') : '';
    
    const rollName = this.data.rollSkill.name;
    const isSkillRoll = ALL_SKILLS.some(s => s.name === rollName);
    const canTick = isSkillRoll && rollName !== '克苏鲁神话' && ['critical','extreme','hard','normal'].includes(level.level);
    const update = {
      rollResult: {
        roll,
        tensDice,
        ones,
        results,
        level,
        extraDice,
        bonus,
      }
    };
    if (canTick) update.tickedSkills = { ...this.data.tickedSkills, [rollName]: true };

    this.setData(update);
    if (this.data.playMode) {
      this.addPlayLog({
        type: level.level,
        title: `${rollName} ${level.label}`,
        meta: `投 ${roll} / 目标 ${skill}${bonus ? `，${bonus > 0 ? '奖励' : '惩罚'}骰 ${Math.abs(bonus)}` : ''}`,
      });
    }
  },

  setBonus(e) {
    this.setData({ rollBonus: parseInt(e.currentTarget.dataset.bonus) || 0 }, () => {
      this.doRoll();
    });
  },

  preventTouchMove() {},

  closeRollDialog() {
    this.setData({ showRollDialog: false, rollSkill: null, rollResult: null, rollBonus: 0 });
  },

  // ==================== 掷骰模块 ====================
  roll(d) { return Math.floor(Math.random() * d) + 1; },

  _lastDicePress: 0,
  selectDice(e) {
    if (this.data.diceRolling) return;
    const now = Date.now();
    if (now - this._lastDicePress < 400) return;
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = { ...this.data.diceSelected };
    sel[d] = (sel[d] || 0) + 1;
    this.setData({ diceSelected: sel, diceResult: null });
  },
  deselectDice(e) {
    if (this.data.diceRolling) return;
    this._lastDicePress = Date.now();
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = { ...this.data.diceSelected };
    if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; }
    this.setData({ diceSelected: sel, diceResult: null });
  },
  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },
  clearDiceHistory() { this.setData({ diceHistory: [] }); },
  rollDiceSelected() {
    const sel = this.data.diceSelected, keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null });
    wx.vibrateShort({ type: 'medium' });
    const dice = []; let total = 0;
    keys.forEach(k => {
      const sides = parseInt(k), count = sel[k];
      for (let i = 0; i < count; i++) { const r = this.roll(sides); dice.push({ sides, result: r }); total += r; }
    });
    setTimeout(() => {
      const result = { dice, total, time: new Date().toLocaleTimeString() };
      const history = [result, ...this.data.diceHistory].slice(0, 50);
      this.setData({ diceRolling: false, diceResult: result, diceHistory: history });
      if (this.data.playMode) {
        this.addPlayLog({
          type: 'dice',
          title: `通用掷骰 ${total}`,
          meta: dice.map(r => `d${r.sides}=${r.result}`).join('，'),
        });
      }
    }, 700);
  },


  // ==================== 幕间成长 ====================
  openGrowth() {
    const ticked = this.data.tickedSkills || {};
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    
    // Build list of ticked skills with current values
    const specs = this.data.skillSpecs || {};
    const list = Object.keys(ticked).filter(k => ticked[k]).map(name => {
      const sk = ALL_SKILLS.find(s => s.name === name);
      if (!sk || name === '克苏鲁神话') return null;
      const base = sk ? getSkillBase(sk.name, edu, dex, specs) : 0;
      const total = base + (this.data.occPts[name] || 0) + (this.data.intPts[name] || 0);
      return { name, value: total, removed: false };
    }).filter(Boolean);
    
    this.setData({
      showGrowth: true,
      growthLocked: false,
      growthPhase: 0,
      growthSkills: list,
      growthResults: [],
      growthSANBonus: 0,
    growthSANOld: 0,
    growthSANMax: 99,
    growthLuckOld: 0,
    growthLuckGain: 0,
      growthSANInput: 0,
      growthCredInput: (this.data.occPts['信用评级'] || 0) + (this.data.intPts['信用评级'] || 0),
    });
  },
  finishGrowth() {
    this.applyCredit(() => {
      const log = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: this.formatLogTime(),
        type: 'growth',
        title: '幕间成长完成',
        meta: `成长技能 ${this.data.growthResults.length} 项，SAN ${this.data.playSAN}，幸运 ${this.data.playLuck}`,
      };
      this.setData({ playLog: [log, ...(this.data.playLog || [])].slice(0, 80), growthLocked: false }, () => {
        this.closeGrowth();
      });
    });
  },
  closeGrowth() {
    if (this.data.growthLocked) {
      wx.showToast({ title: '请完成幕间成长', icon: 'none' });
      return;
    }
    // Save all current state
    this.persistCharacter(this.buildCharacterData(this.data.isCompleted));
    
    // Rebuild skill display with updated points
    const grouped = this.buildPreviewSkills(this.data.occPts, this.data.intPts, this.data.attrValues);
    this.setData({ showGrowth: false, sortedSkillsByCat: grouped }, () => {
      this.refreshPlayDashboard();
    });
  },
  
  removeGrowthSkill(e) {
    const name = e.currentTarget.dataset.name;
    const skills = this.data.growthSkills.map(s => 
      s.name === name ? { ...s, removed: !s.removed } : s
    );
    this.setData({ growthSkills: skills });
  },
  
  startGrowth() {
    const skills = this.data.growthSkills.filter(s => !s.removed);
    const results = [];
    let reached90 = false;
    const intPts = { ...this.data.intPts };
    const occPts = this.data.occPts || {};
    
    for (const sk of skills) {
      const roll = Math.floor(Math.random() * 100) + 1;
      const success = roll > sk.value || roll >= 96;
      let gain = 0, newVal = sk.value;
      if (success) {
        gain = Math.floor(Math.random() * 10) + 1;
        newVal = Math.min(99, sk.value + gain);
        if (newVal >= 90) reached90 = true;
        // Update skill points (add to intPts)
        const currentPts = (occPts[sk.name] || 0) + (intPts[sk.name] || 0);
        const diff = newVal - (getSkillBase(sk.name, this.data.attrValues.edu || 50, this.data.attrValues.dex || 50, this.data.skillSpecs) + currentPts);
        if (diff > 0) {
          intPts[sk.name] = (intPts[sk.name] || 0) + diff;
        }
      }
      results.push({ name: sk.name, roll, success, gain, newVal });
    }
    let usedOccPoints = 0;
    let usedIntPoints = 0;
    for (const sk of ALL_SKILLS) {
      usedOccPoints += occPts[sk.name] || 0;
      usedIntPoints += intPts[sk.name] || 0;
    }
    
    // Clear ticked and lock
    this.setData({ intPts, usedOccPoints, usedIntPoints, tickedSkills: {}, growthLocked: true, growthPhase: 1, growthResults: results, growthReached90: reached90 });
  },
  
  nextGrowthPhase() {
    // Set SAN max for display
    const cm = (this.data.occPts['克苏鲁神话'] || 0) + (this.data.intPts['克苏鲁神话'] || 0);
    const cmBase = getSkillBase('克苏鲁神话', this.data.attrValues.edu || 50, this.data.attrValues.dex || 50);
    const maxSAN = 99 - (cmBase + cm);
    this.setData({ growthPhase: 2, growthSANMax: maxSAN });
  },

  applySAN() {
    const oldSAN = this.data.playSAN;
    const cm = (this.data.occPts['克苏鲁神话'] || 0) + (this.data.intPts['克苏鲁神话'] || 0);
    const cmBase = getSkillBase('克苏鲁神话', this.data.attrValues.edu || 50, this.data.attrValues.dex || 50);
    const cmVal = cmBase + cm;
    const maxSAN = 99 - cmVal;
    let bonus = parseInt(this.data.growthSANInput) || 0;
    if (this.data.growthReached90) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      bonus += d1 + d2;
    }
    const newSAN = Math.min(maxSAN, oldSAN + bonus);
    this.setData({
      playSAN: newSAN,
      growthPhase: 3,
      growthSANOld: oldSAN,
      growthSANBonus: bonus,
      growthSANMax: maxSAN,
      ...this.getVitalState({ playSAN: newSAN, maxSAN }),
    });
  },
  
  doLuckGrowth() {
    const oldLuck = this.data.playLuck;
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll > oldLuck;
    let gain = 0, newLuck = oldLuck;
    if (success) {
      gain = Math.floor(Math.random() * 10) + 1;
      newLuck = Math.min(99, oldLuck + gain);
      const newAttr = { ...this.data.attrValues, luck: newLuck };
      this.setData({ playLuck: newLuck, attrValues: newAttr, attrDisplay: makeAttrDisplay(newAttr), ...this.getVitalState({ playLuck: newLuck }) });
    }
    this.setData({ growthPhase: 4, growthLuckOld: oldLuck, growthLuckRoll: roll, growthLuckSuccess: success, growthLuckGain: gain, growthLuckNew: newLuck });
  },
  
  applyCredit(callback) {
    const val = parseInt(this.data.growthCredInput) || 0;
    const edu = this.data.attrValues.edu || 50;
    const dex = this.data.attrValues.dex || 50;
    const base = getSkillBase('信用评级', edu, dex);
    const diff = val - base;
    let intPts = { ...this.data.intPts };
    let occPts = { ...this.data.occPts };
    delete occPts['信用评级'];
    if (diff > 0) {
      intPts['信用评级'] = diff;
    } else {
      delete intPts['信用评级'];
    }
    const grouped = this.buildPreviewSkills(occPts, intPts, this.data.attrValues);
    let usedOccPoints = 0;
    let usedIntPoints = 0;
    for (const sk of ALL_SKILLS) {
      usedOccPoints += occPts[sk.name] || 0;
      usedIntPoints += intPts[sk.name] || 0;
    }
    this.setData({ intPts, occPts, usedOccPoints, usedIntPoints, sortedSkillsByCat: grouped, growthPhase: 5 }, () => {
      this.refreshSkillValidation();
      if (callback) callback();
    });
  },
  
  onGrowthSANInput(e) { this.setData({ growthSANInput: parseInt(e.detail.value) || 0 }); },
  onGrowthCredInput(e) { this.setData({ growthCredInput: parseInt(e.detail.value) || 0 }); },

  goHome() {
    // 回首页前先把进行中的进度落盘为草稿（已保存角色无需草稿）
    if (this.data.step >= 1 && this.data.step <= 5 && !this.data.isCompleted && typeof this.data._loadIndex !== 'number') {
      this._saveDraft();
    }
    this.setData({
      step: 0, playMode: false, isCompleted: false, overrideLimits: false,
      selectedOcc: null, occPts: {}, intPts: {}, skillSpecs: {},
      selectedOptSkills: {}, occOptGroups: [], occFixedSkills: [], occSpecRequired: [], occSpecMissing: [],
      skillValidation: { warnings: [], crValue: 0, crRange: '', crState: 'neutral', crHint: '', occRemain: 0, intRemain: 0 },
      showSanDialog: false, sanRollResult: null,
    });
    this.loadSavedList();
  },

  // ==================== 规则速查（复用守密人帷幕数据） ====================
  openRules() {
    const sections = this.data.rulesSections || KEEPER_RULES;
    const first = sections[0];
    this.setData({
      showRules: true,
      rulesSections: sections,
      rulesCat: first.id,
      rulesCatIndex: 0,
      rulesItems: first.items || [],
      rulesTable: first.table || [],
    });
  },
  closeRules() { this.setData({ showRules: false }); },
  switchRulesCat(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const sections = this.data.rulesSections || [];
    const sec = sections[idx];
    if (!sec) return;
    this.setData({ rulesCat: sec.id, rulesCatIndex: idx, rulesItems: sec.items || [], rulesTable: sec.table || [] });
  },

  // ==================== 分享卡片（canvas 生成角色卡图片） ====================
  generateShareCard() {
    wx.showLoading({ title: '生成中…' });
    const q = wx.createSelectorQuery();
    q.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        wx.showToast({ title: '当前环境不支持生成', icon: 'none' });
        return;
      }
      try {
        this._drawShareCard(res[0].node);
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  _drawShareCard(canvas) {
    const d = this.data;
    const W = 750;
    const M = 48;
    // 收集内容
    const attrs = d.attrDisplay && d.attrDisplay.length ? d.attrDisplay : makeAttrDisplay(d.attrValues);
    const derivedItems = d.derivedItems && d.derivedItems.length ? d.derivedItems : makeDerivedItems(calcDerivedFrom(d.attrValues, d.charInfo));
    const skillCats = d.sortedSkillsByCat || [];
    const weapons = d.charWeapons || [];
    const totalSkills = skillCats.reduce((n, g) => n + (g.skills ? g.skills.length : 0), 0);
    const skillRows = skillCats.reduce((n, g) => n + (g.skills && g.skills.length ? Math.ceil(g.skills.length / 2) : 0), 0);

    const headerH = 300;                       // 标题 + 角色名 + 职业行
    const attrsH = 3 * 96 + 40;                // 3 行 × 3 列属性
    const derivH = 2 * 56 + 30;                // 衍生值两行
    const skillTitleH = 64;
    const skillH = skillCats.length * 60 + skillRows * 46 + (skillCats.length > 0 ? 10 : 0);
    const weaponH = weapons.length > 0 ? 64 + weapons.length * 44 + 12 : 0;
    const footerH = 90;
    const H = Math.min(headerH + attrsH + derivH + skillTitleH + skillH + weaponH + footerH, 4096);

    const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#16181d';
    ctx.fillRect(0, 0, W, H);
    // 顶部装饰条
    ctx.fillStyle = '#c9a45c';
    ctx.fillRect(0, 0, W, 10);

    const F = {
      big: 'bold 44px "PingFang SC", "Microsoft YaHei", sans-serif',
      mid: 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif',
      base: '28px "PingFang SC", "Microsoft YaHei", sans-serif',
      small: '24px "PingFang SC", "Microsoft YaHei", sans-serif',
      tiny: '20px "PingFang SC", "Microsoft YaHei", sans-serif',
    };
    const C = { title: '#c9a45c', main: '#e8e2d4', sub: '#9aa3b2', dim: '#6b7280' };

    const fit = (text, font, maxW) => {
      ctx.font = font;
      let t = String(text == null ? '' : text);
      if (ctx.measureText(t).width <= maxW) return t;
      while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t + '…';
    };

    let y = 0;
    // 头部
    y += 84;
    ctx.fillStyle = C.title; ctx.font = F.small;
    ctx.fillText('CALL OF CTHULHU 7E · 调查员档案', M, y);
    y += 64;
    ctx.fillStyle = C.main; ctx.font = F.big;
    const nameText = fit(d.charInfo && d.charInfo.name ? d.charInfo.name : '未命名调查员', F.big, W - M * 2);
    ctx.fillText(nameText, M, y);
    y += 66;
    ctx.fillStyle = C.sub; ctx.font = F.base;
    const occLine = fit((d.selectedOcc ? d.selectedOcc.name + ' · ' : '') + (d.charInfo.era || '') + (d.charTag ? ' · ' + d.charTag : ''), F.base, W - M * 2);
    ctx.fillText(occLine, M, y);
    y += 54;
    ctx.fillStyle = C.dim; ctx.font = F.tiny;
    ctx.fillText('生成于 ' + new Date().toLocaleString() + ' · 桌面冒险工具集', M, y);

    // 属性（3 列）
    y = headerH - 30;
    ctx.fillStyle = C.title; ctx.font = F.mid;
    ctx.fillText('属性', M, y);
    y += 26;
    const cellW = (W - M * 2) / 3;
    for (let i = 0; i < attrs.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = M + col * cellW;
      const cy = y + 10 + row * 96;
      ctx.fillStyle = C.sub; ctx.font = F.small;
      ctx.fillText(fit(attrs[i].label, F.small, cellW - 24), cx, cy);
      ctx.fillStyle = C.main; ctx.font = F.mid;
      ctx.fillText(String(attrs[i].value), cx, cy + 52);
    }

    // 衍生值（两行三列）
    y += 3 * 96 + 30;
    ctx.fillStyle = C.title; ctx.font = F.mid;
    ctx.fillText('状态', M, y);
    y += 26;
    const dCellW = (W - M * 2) / 3;
    for (let i = 0; i < Math.min(derivedItems.length, 6); i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = M + col * dCellW;
      const cy = y + 8 + row * 56;
      ctx.fillStyle = C.sub; ctx.font = F.small;
      ctx.fillText(fit(derivedItems[i].l, F.small, dCellW - 24), cx, cy);
      ctx.fillStyle = C.main; ctx.font = F.base;
      ctx.fillText(String(derivedItems[i].v), cx, cy + 38);
    }

    // 技能（双栏）
    y += 2 * 56 + 30;
    ctx.fillStyle = C.title; ctx.font = F.mid;
    ctx.fillText('技能', M, y);
    y += 30;
    const colW = (W - M * 2 - 24) / 2;
    for (const g of skillCats) {
      if (y + 60 > H - footerH) break;
      ctx.fillStyle = C.sub; ctx.font = F.small;
      ctx.fillText(fit(g.catName, F.small, W - M * 2), M, y);
      y += 58;
      const skills = g.skills || [];
      for (let i = 0; i < skills.length; i += 2) {
        if (y + 44 > H - footerH) break;
        for (let k = 0; k < 2; k++) {
          const sk = skills[i + k];
          if (!sk) break;
          const cx = M + k * (colW + 24);
          const name = fit(sk.displayName || sk.name, F.tiny, colW - 96);
          ctx.fillStyle = C.main; ctx.font = F.tiny;
          ctx.fillText(name, cx, y);
          ctx.fillStyle = C.sub;
          ctx.fillText(String(sk.total) + '%', cx + colW - 90, y);
        }
        y += 44;
      }
      y += 10;
    }

    // 武器
    if (weapons.length > 0 && y + 100 < H) {
      y += 16;
      ctx.fillStyle = C.title; ctx.font = F.mid;
      ctx.fillText('武器', M, y);
      y += 30;
      for (const w of weapons.slice(0, 12)) {
        if (y + 42 > H - footerH) break;
        ctx.fillStyle = C.main; ctx.font = F.tiny;
        const wname = fit(w.name, F.tiny, colW - 24);
        ctx.fillText(wname, M, y);
        ctx.fillStyle = C.sub; ctx.font = F.tiny;
        ctx.fillText(fit((w.damage || '') + ' · ' + (w.skill || ''), F.tiny, W - M * 2 - colW), M + colW + 24, y);
        y += 42;
      }
    }

    // 底部
    ctx.fillStyle = '#1f232b';
    ctx.fillRect(0, H - footerH, W, footerH);
    ctx.fillStyle = C.dim; ctx.font = F.tiny;
    ctx.fillText('在黑暗与疯狂之间，保留一张清晰的卡。', M, H - footerH / 2 + 8);

    // 导出图片
    wx.canvasToTempFilePath({
      canvas,
      success: (res) => {
        wx.hideLoading();
        wx.previewImage({ urls: [res.tempFilePath] });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '图片生成失败', icon: 'none' });
      },
    });
  },

  openAgeModDialog() {
    this.setData({ showAgeModDialog: true });
  },
  closeAgeModDialog() {
    this.setData({ showAgeModDialog: false });
  },
  setAgeModChoice(e) {
    this.setData({ ageModChoice: e.currentTarget.dataset.choice });
  },
  onAgeAllocInput(e) {
    var field = e.currentTarget.dataset.field;
    var val = parseInt(e.detail.value) || 0;
    var alloc = {};
    alloc.str = this.data.ageModAlloc.str;
    alloc.con = this.data.ageModAlloc.con;
    alloc.dex = this.data.ageModAlloc.dex;
    alloc[field] = val;
    var sum = alloc.str + alloc.con + alloc.dex;
    this.setData({ ageModAlloc: alloc, ageModRemaining: this.data.ageModDecay - sum });
  },
  confirmAgeMod() {
    var age = parseInt(this.data.charInfo.age) || 25;
    var type = this.data.ageModType;
    var ok = true;
    if (type === 'teen' && !this.data.ageModChoice) ok = false;
    if (type === 'decay' && this.data.ageModRemaining !== 0) ok = false;
    if (!ok) { wx.showToast({ title: '请完成选择', icon: 'none' }); return; }

    var result = applyAgeModifiers(age, this.data.attrValues, this.data.ageModChoice, this.data.ageModAlloc);
    this.setData({
      attrValues: result.attrValues,
      attrTraits: makeAttrTraits(result.attrValues),
      attrDisplay: makeAttrDisplay(result.attrValues),
      ageModSummary: result.summary,
      ageModDone: true,
      showAgeModDialog: false,
    });
    this._scheduleDraft();
  },

  // 生成唯一 id（Date.now 同毫秒会重复，批量添加武器时避免 wx:key 冲突）
  _wid() {
    this._widSeq = (this._widSeq || 0) + 1;
    return Date.now() * 1000 + (this._widSeq % 1000);
  },

  // ==================== 武器管理 ====================
  openWeaponPicker() {
    const groups = groupWeapons(WEAPONS_1920S);
    this.setData({ showWeaponPicker: true, weaponSearch: '', weaponGroups: groups });
  },
  closeWeaponPicker() {
    this.setData({ showWeaponPicker: false, showCustomWeapon: false,
      customWName: '', customWSkill: '', customWDamage: '', customWRange: '',
      customWAttacks: '1', customWAmmo: '', customWMalfunction: '100', customWImpale: '√' });
  },
  onWeaponSearch(e) {
    const val = e.detail.value;
    const list = val ? WEAPONS_1920S.filter(w => w.name.includes(val)) : WEAPONS_1920S;
    const groups = groupWeapons(list);
    this.setData({ weaponSearch: val, weaponGroups: groups });
  },
  addWeapon(e) {
    const name = e.currentTarget.dataset.name;
    const weapon = WEAPONS_1920S.find(w => w.name === name);
    if (!weapon) return;
    const charWeapons = [...this.data.charWeapons, { ...weapon, _id: this._wid() }];
    this.setData({ charWeapons, showWeaponPicker: false });
    this._scheduleDraft();
  },
  removeWeapon(e) {
    const id = e.currentTarget.dataset.id;
    const charWeapons = this.data.charWeapons.filter(w => w._id !== id);
    this.setData({ charWeapons });
    this._scheduleDraft();
  },

  onCharFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    const map = { backstory: 'charBackstory', gear: 'charGear', mythos: 'charMythos', spells: 'charSpells', companions: 'charCompanions', assets: 'charAssets' };
    this.setData({ [map[field]]: e.detail.value });
    this._scheduleDraft();
  },

  openCustomWeapon() {
    this.setData({ showCustomWeapon: true });
  },
  cancelCustomWeapon() {
    this.setData({ showCustomWeapon: false });
  },
  onCustomWField(e) {
    const field = e.currentTarget.dataset.field;
    const val = e.detail.value;
    const map = {
      name: 'customWName', skill: 'customWSkill', damage: 'customWDamage',
      range: 'customWRange', attacks: 'customWAttacks',
      ammo: 'customWAmmo', malfunction: 'customWMalfunction', impale: 'customWImpale',
    };
    this.setData({ [map[field]]: val });
  },
  confirmCustomWeapon() {
    const { customWName, customWSkill, customWDamage, customWRange, customWAttacks, customWAmmo, customWMalfunction, customWImpale } = this.data;
    if (!customWName || !customWSkill || !customWDamage) {
      wx.showToast({ title: '请填写名称、技能和伤害', icon: 'none' });
      return;
    }
    const weapon = {
      name: customWName, skill: customWSkill, skillId: '格斗①',
      damage: customWDamage, range: customWRange || '接触',
      impale: customWImpale || '——', attacks: customWAttacks || '1', ammo: customWAmmo || '——',
      malfunction: customWMalfunction || '——', rare: false, _id: this._wid(),
    };
    const charWeapons = [...this.data.charWeapons, weapon];
    this.setData({
      charWeapons, showWeaponPicker: false, showCustomWeapon: false,
      customWName: '', customWSkill: '', customWDamage: '', customWRange: '',
      customWAttacks: '1', customWAmmo: '', customWMalfunction: '100', customWImpale: '√',
    });
    this._scheduleDraft();
  },

});
