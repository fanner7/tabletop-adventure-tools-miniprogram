// utils/dice-st.js — 骰娘 .st 角色卡解析（海豹骰 Sealdice / 塔塔等兼容格式）
// ============================================================
// 对应设计文档：docs/dice-st-import-design.md
// 格式构造参照 pages/coc7-gen 的 generateDiceImport（骰娘导出）：
//   .st <角色名>-力量60 敏捷70 意志80 ... hp12 理智80 mp16 会计45 斗殴25 ...
// - 九属性：力量/敏捷/意志/体质/外貌/教育/体型/智力/幸运
// - 衍生值：hp / 理智 / mp（小写 hp/mp，与导出一致；兼容 san 别名）
// - 技能：技能名+总值；专攻技能导出专攻名（斗殴→格斗①、手枪→射击①、写作→技艺①、拉丁语→外语①）
// 解析产物与 char-codec 解码产物同构（含显示字段重建），coc7-gen / coc-keeper 均可直接消费。
// 已知限制（.st 本身无职业/点表拆分/武器/文本）：职业为空、点数全部记入兴趣点、
// 专攻槽位为最佳匹配（精确技能名优先 → options 专攻 → text 专攻启发式）。
// ============================================================

var SK = require('../pages/coc7-gen/data/skills.js');
var CC = require('./char-codec.js');

var ATTR_MAP = {
  '力量': 'str', '敏捷': 'dex', '意志': 'pow', '体质': 'con',
  '外貌': 'app', '教育': 'edu', '体型': 'siz', '智力': 'int', '幸运': 'luck',
};

// text 型专攻启发式（外语①：语言名；驾驶①：驾驶/载具术语）
var LANGUAGE_HINTS = [
  '拉丁语', '拉丁文', '英语', '法语', '德语', '俄语', '日语', '汉语', '中文',
  '西班牙语', '意大利语', '葡萄牙语', '希腊语', '希腊文', '阿拉伯语', '梵语',
  '埃及语', '古英语', '波兰语', '荷兰语', '瑞典语', '挪威语', '芬兰语', '土耳其语',
];
var DRIVE_HINTS = [
  '汽车驾驶', '飞行器', '船', '卡车', '摩托车', '运货马车', '马车', '赛车', '快艇',
];

// ---------- 技能名归一化（与 coc7-gen normalizeSkillName 等价） ----------
function normalizeSkillName(name) {
  if (SK.ALL_SKILLS.some(function (s) { return s.name === name; })) return name;
  if (SK.FREE_SKILL_ALIAS[name]) return SK.FREE_SKILL_ALIAS[name];
  if (name.indexOf('外语') >= 0) return '外语①';
  if (name.indexOf('驾驶') >= 0) return '驾驶①';
  if (name.indexOf('科学') >= 0) return '科学';
  if (name.indexOf('母语') >= 0) return '母语';
  var prefix = SK.ALL_SKILLS.find(function (s) { return name.startsWith(s.name) || s.name.startsWith(name); });
  return prefix ? prefix.name : '';
}

// 解析一条技能条目 → { skillName, spec } 或 null
// 优先级：精确技能名（药学/人类学/心理学等撞车场景）→ 括号专攻语法（格斗(斗殴)）
//         → 别名 → options 专攻 → text 专攻启发式
function resolveSkill(name) {
  // 1) 精确技能名
  var exact = SK.ALL_SKILLS.find(function (s) { return s.name === name; });
  if (exact) return { skillName: exact.name, spec: null };

  // 1.5) 括号专攻语法（骰娘常见：格斗(斗殴)25、技艺①（写作）25、驾驶(汽车)25）
  var pm = name.match(/^(.+?)[（(](.+?)[)）]$/);
  if (pm) {
    var slotName = normalizeSkillName(pm[1]);
    var slotSk = slotName ? SK.ALL_SKILLS.find(function (s) { return s.name === slotName; }) : null;
    if (slotSk && slotSk.spec) return { skillName: slotSk.name, spec: pm[2] };
    if (slotSk) return { skillName: slotSk.name, spec: null };   // 技能无专攻定义（如母语(中文)）：忽略括号
  }

  // 2) 别名（汽车驾驶→驾驶①、打字→技艺① 等）：别名目标带专攻时，原名作为专攻文本
  if (SK.FREE_SKILL_ALIAS[name]) {
    var alias = SK.FREE_SKILL_ALIAS[name];
    var aliasSk = SK.ALL_SKILLS.find(function (s) { return s.name === alias; });
    return { skillName: alias, spec: (aliasSk && aliasSk.spec) ? name : null };
  }

  // 3) options 型专攻：全技能表按序找首个同名选项
  for (var i = 0; i < SK.ALL_SKILLS.length; i++) {
    var sk = SK.ALL_SKILLS[i];
    if (sk.spec && sk.spec.options) {
      for (var j = 0; j < sk.spec.options.length; j++) {
        if (sk.spec.options[j].name === name) return { skillName: sk.name, spec: name };
      }
    }
  }

  // 4) text 型专攻启发式：语言名 → 外语①；驾驶术语 → 驾驶①；其余 → 技艺①
  var norm = normalizeSkillName(name);
  if (norm) return { skillName: norm, spec: name };
  if (LANGUAGE_HINTS.indexOf(name) >= 0) return { skillName: '外语①', spec: name };
  if (DRIVE_HINTS.indexOf(name) >= 0) return { skillName: '驾驶①', spec: name };
  return { skillName: '技艺①', spec: name };
}

// ---------- 主解析：.st 文本 → { player } | { error: 'FORMAT' } ----------
function parseSt(text) {
  if (!text || typeof text !== 'string') return { error: 'FORMAT' };
  var s = text.trim().replace(/^\.st\s+/i, '');
  var tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { error: 'FORMAT' };

  // 名字与属性拆分：名字为第一个含 '-' 的 token 之前的部分 + 该 token 破折号前内容
  // （与骰娘导出 '.st 名字-力量60 ...' 同构；无 '-' 视为未命名，全部为属性）
  var name = '';
  var attrTokens = [];
  var dashIdx = -1;
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].indexOf('-') >= 0) { dashIdx = i; break; }
  }
  if (dashIdx >= 0) {
    var head = tokens[dashIdx];
    var dash = head.indexOf('-');
    name = tokens.slice(0, dashIdx).concat(head.slice(0, dash)).join(' ');
    attrTokens = [head.slice(dash + 1)].concat(tokens.slice(dashIdx + 1));
  } else {
    attrTokens = tokens;
  }

  var attrValues = {};
  var playHP, playSAN, playMP;
  var intPts = {};
  var skillSpecs = {};
  var entryRe = /^(.+?)(\d+)$/;
  var seenAttr = {};

  for (var t = 0; t < attrTokens.length; t++) {
    var tok = attrTokens[t];
    if (!tok) continue;
    var m = tok.match(entryRe);
    if (!m) continue;
    var key = m[1].replace(/[:：]$/, '');   // 容忍冒号分隔（力量:60 / hp:12 等骰娘变体）
    var value = parseInt(m[2], 10);
    if (isNaN(value) || value < 0 || value > 999) continue;

    // ---- 九属性 ----
    if (ATTR_MAP[key]) {
      if (seenAttr[key]) continue;   // 重复条目取首个（防污染）
      seenAttr[key] = true;
      attrValues[ATTR_MAP[key]] = value;
      continue;
    }
    // ---- 衍生值 hp / 理智 / mp ----
    var lk = key.toLowerCase();
    if (lk === 'hp') { if (playHP === undefined) playHP = value; continue; }
    if (lk === 'mp') { if (playMP === undefined) playMP = value; continue; }
    if (key === '理智' || lk === 'san') { if (playSAN === undefined) playSAN = value; continue; }

    // ---- 技能 ----
    var r = resolveSkill(key);
    if (!r) continue;
    var base = CC.getSkillBase(r.skillName, attrValues.edu || 50, attrValues.dex || 50, skillSpecs);
    if (r.spec) skillSpecs[r.skillName] = r.spec;
    var pts = value - base;
    if (pts < 0) pts = 0;   // .st 无基础值信息：总值低于表内基础值时按基础值显示（钳 0）
    intPts[r.skillName] = (intPts[r.skillName] || 0) + pts;
  }

  if (Object.keys(attrValues).length === 0 && Object.keys(intPts).length === 0) {
    return { error: 'FORMAT' };   // 没有任何可识别条目
  }

  // ---- 点预算：全部计入兴趣点（无职业信息）；上限取 max(INT×2, 实际投入) 避免超支阻塞编辑 ----
  var usedIntPoints = Object.keys(intPts).reduce(function (s, k) { return s + intPts[k]; }, 0);
  var totalIntPoints = Math.max((attrValues.int || 50) * 2, usedIntPoints);

  var charInfo = { name: name || '未命名调查员', player: '', age: '25', gender: '男', era: '1920s' };
  var derived = CC.calcDerivedFrom(attrValues, charInfo);

  return {
    player: {
      schemaVersion: 2,
      charInfo: charInfo,
      selectedOcc: undefined,
      attrValues: attrValues,
      attrDisplay: CC.makeAttrDisplay(attrValues),
      attrRolls: {},
      attrDesc: '',
      derived: derived,
      derivedItems: CC.makeDerivedItems(derived),
      occPts: {}, intPts: intPts, skillSpecs: skillSpecs,
      freeOccSkills: [], tickedSkills: {},
      usedOccPoints: 0, totalOccPoints: 0,
      usedIntPoints: usedIntPoints, totalIntPoints: totalIntPoints,
      sortedSkillsByCat: CC.rebuildSkills(attrValues, {}, intPts, skillSpecs),
      charWeapons: [],
      playHP: playHP, playSAN: playSAN, playMP: playMP,
      playLuck: attrValues.luck,
      majorWound: false, dying: false,
      sanDayStart: playSAN, sessionSanLoss: 0,
      tag: '', completed: true, timestamp: Date.now(),
      charBackstory: '', charGear: '', charMythos: '', charSpells: '',
      charCompanions: [], charAssets: '',
      playLog: [], diceHistory: [],
      source: 'st',
    },
  };
}

module.exports = {
  parseSt: parseSt,
  resolveSkill: resolveSkill,
  normalizeSkillName: normalizeSkillName,
  ATTR_MAP: ATTR_MAP,
};
