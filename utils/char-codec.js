// utils/char-codec.js — COC 调查员角色码：编码 / 解码（C7C2 明文版 / 兼容 C7C1）
// ============================================================
// 对应设计文档：docs/char-codec-design.md（研究：docs/char-import-export-research.md）
// 编码端：pages/coc7-gen（剪贴板导出）
// 解码端：pages/coc7-gen（剪贴板导入）、pages/coc-keeper（守密人剪贴板导入）
// 依赖：pages/coc7-gen/data/{skills,occupations,weapons}.js（单一数据源）
//
// C7C2（现行）：职业与六文本块（背景/随身/神话/法术/伙伴/资产）以明文段编码，
//   便于人眼辨认与手工修改；**无 CRC / 无表指纹校验**（用户需求：不需要那么严谨，
//   校验可能导致实际使用问题，如技能表更新后旧角色码被拒）。
// C7C1（旧版）：带 *crc 尾段 + 表指纹；解码端保留兼容（已导出的旧角色码仍可导入）。
// ============================================================

var SK = require('../pages/coc7-gen/data/skills.js');
var OCC = require('../pages/coc7-gen/data/occupations.js').OCCUPATIONS;
var W_DATA = require('../pages/coc7-gen/data/weapons.js').WEAPONS_1920S;

var ATTR_KEYS = ['str', 'con', 'dex', 'app', 'pow', 'siz', 'int', 'edu', 'luck'];
var MAGIC = 'C7C2';
var MAGIC_V1 = 'C7C1';

// ---------- CRC16（仅 C7C1 旧码兼容解码使用；C7C2 无校验） ----------
function crc16(str) {
  var crc = 0xFFFF;
  for (var i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) & 0xFF;
    for (var j = 0; j < 8; j++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1);
    }
  }
  return (crc & 0xFFFF).toString(16).padStart(4, '0');
}

// ---------- 表指纹（仅 C7C1 旧码兼容解码使用） ----------
function tableFingerprint() {
  return crc16(SK.ALL_SKILLS.map(function (s) { return s.name; }).join('')
    + '|' + W_DATA.map(function (w) { return w.name; }).join('')
    + '|' + OCC.map(function (o) { return o.name; }).join(''));
}

// ---------- 可逆转义（先转反斜杠再转保留字符，保证输出中不存在误切序列；中文与普通文本保持明文） ----------
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/=/g, '\\=').replace(/\./g, '\\.')
    .replace(/\n/g, '\\n').replace(/\r/g, '');
}
function unesc(s) {
  var out = '', i = 0;
  while (i < s.length) {
    var c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      var n = s[i + 1];
      if (n === 'n') { out += '\n'; i += 2; continue; }
      out += n; i += 2; continue;
    }
    out += c; i++;
  }
  return out;
}

// ---------- 转义感知分隔符拆分（不可用裸 split：转义序列内可能含分隔符） ----------
function splitUnescaped(s, sep) {
  var parts = [], cur = '', escaped = false;
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (escaped) { cur += c; escaped = false; continue; }
    if (c === '\\') { cur += c; escaped = true; continue; }
    if (c === sep) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

// ---------- 解码端显示字段重建（与 coc7-gen 内部实现等价，供守密人/调查员直接渲染） ----------
function getSkillBase(name, edu, dex, specs) {
  if (name === '母语') return edu;
  if (name === '闪避') return Math.floor(dex / 2);
  var sk = null;
  for (var i = 0; i < SK.ALL_SKILLS.length; i++) {
    if (SK.ALL_SKILLS[i].name === name) { sk = SK.ALL_SKILLS[i]; break; }
  }
  if (!sk) return 0;
  if (specs && sk.spec && sk.spec.options) {
    var chosen = specs[name];
    if (chosen) {
      for (var k = 0; k < sk.spec.options.length; k++) {
        if (sk.spec.options[k].name === chosen) return sk.spec.options[k].base;
      }
    }
  }
  return sk.base;
}

function makeAttrDisplay(values) {
  var labels = { str: '力量 STR', con: '体质 CON', dex: '敏捷 DEX', app: '外貌 APP', pow: '意志 POW', siz: '体型 SIZ', int: '智力 INT', edu: '教育 EDU', luck: '幸运 LUCK' };
  return ATTR_KEYS.map(function (k) {
    var v = values[k] || 0;
    return { label: labels[k], value: v, hard: Math.floor(v / 2), extreme: Math.floor(v / 5) };
  });
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

function calcDB(strSiz) {
  if (strSiz <= 64) return { db: '-2', build: -2 };
  if (strSiz <= 84) return { db: '-1', build: -1 };
  if (strSiz <= 124) return { db: '0', build: 0 };
  if (strSiz <= 164) return { db: '+1D4', build: 1 };
  if (strSiz <= 204) return { db: '+1D6', build: 2 };
  return { db: '+2D6', build: 3 };
}

function calcDerivedFrom(attrVals, charInfo) {
  var v = attrVals || {};
  var n = function (key) { return parseInt(v[key], 10) || 50; };
  var age = parseInt(charInfo && charInfo.age, 10) || 25;
  var hp = Math.floor((n('con') + n('siz')) / 10);
  var san = n('pow');
  var mp = Math.floor(n('pow') / 5);
  var dbInfo = calcDB(n('str') + n('siz'));
  var baseMov = (n('str') >= n('siz') && n('dex') >= n('siz')) ? 7 : (n('str') >= n('siz') || n('dex') >= n('siz')) ? 8 : 9;
  var agePen = age >= 80 ? 5 : age >= 70 ? 4 : age >= 60 ? 3 : age >= 50 ? 2 : age >= 40 ? 1 : 0;
  return { hp: hp, san: san, mp: mp, db: dbInfo.db, build: dbInfo.build, mov: Math.max(1, baseMov - agePen) };
}

// 按 CAT_ORDER + 表内顺序重建技能分组（与建卡器 buildPreviewSkills 同序同规则）
function rebuildSkills(attrValues, occPts, intPts, skillSpecs) {
  var edu = attrValues.edu || 50;
  var dex = attrValues.dex || 50;
  var groups = {};
  SK.CAT_ORDER.forEach(function (c) { groups[c] = []; });
  SK.ALL_SKILLS.forEach(function (sk) {
    var base = getSkillBase(sk.name, edu, dex, skillSpecs);
    var pt = (occPts[sk.name] || 0) + (intPts[sk.name] || 0);
    if (base + pt > 0) {
      var spec = skillSpecs[sk.name];
      var displayName = spec ? sk.name + '（' + spec + '）' : sk.name;
      var total = base + pt;
      groups[sk.cat].push({ name: sk.name, displayName: displayName, base: base, total: total, hard: Math.floor(total / 2), extreme: Math.floor(total / 5) });
    }
  });
  return SK.CAT_ORDER.filter(function (c) { return groups[c].length > 0; })
    .map(function (c) { return { catName: SK.CAT_LABELS[c].label, cat: c, skills: groups[c] }; });
}

// ==================================================================
// 编码：charData（buildCharacterData 产物）→ C7C2 角色码字符串（明文、无校验）
// ==================================================================
function encode(charData) {
  var cd = charData || {};
  var byName = {};
  SK.ALL_SKILLS.forEach(function (sk, i) { byName[sk.name] = i; });
  var info = cd.charInfo || {};
  var occName = (cd.selectedOcc && cd.selectedOcc.name) ? cd.selectedOcc.name : '';

  // 技能点表 / 专攻 / 自由技能 / 成长勾选：技能名 → 表下标（未知技能 n<名> 兜底）
  var pts = function (map) {
    return Object.keys(map || {}).filter(function (k) { return map[k]; }).map(function (k) {
      return byName[k] !== undefined ? byName[k] + '=' + map[k] : 'n' + esc(k) + '=' + map[k];
    }).join(',');
  };
  var specs = Object.keys(cd.skillSpecs || {}).map(function (k) {
    return byName[k] !== undefined ? byName[k] + '.' + esc(cd.skillSpecs[k]) : 'n' + esc(k) + '=' + esc(cd.skillSpecs[k]);
  }).join(',');
  var idxList = function (list) {
    return (list || []).map(function (k) { return byName[k] !== undefined ? String(byName[k]) : 'n' + esc(k); }).join(',');
  };

  // 武器：表内 w<idx>；自定义 c<name>=<skill>=<damage>=<range>=<attacks>=<ammo>=<malfunction>=<impale>
  var wIdxByName = {};
  W_DATA.forEach(function (w, i) { wIdxByName[w.name] = i; });
  var weapons = (cd.charWeapons || []).map(function (w) {
    var idx = wIdxByName[w.name];
    if (idx !== undefined) return 'w' + idx;
    return 'c' + esc(w.name) + '=' + esc(w.skill || '') + '=' + esc(w.damage || '')
      + '=' + esc(w.range || '') + '=' + esc(w.attacks || '') + '=' + esc(w.ammo || '')
      + '=' + esc(w.malfunction || '') + '=' + esc(w.impale || '');
  }).join(';');

  // 六文本块：独立明文段（esc 仅转义分隔符/换行，正文可读）；伙伴数组按行连接
  var textBlock = function (v) {
    return Array.isArray(v) ? v.join('\n') : String(v == null ? '' : v);
  };

  // 游玩日志：type 单字母 + 三字段
  var typeCode = { note: 'n', harm: 'h', heal: 'g', dice: 'd' };
  var log = (cd.playLog || []).map(function (l) {
    return [typeCode[l.type] || 'x', l.title || '', l.meta || '', l.time || ''].map(esc).join('=');
  }).join(';');

  // 骰子历史：total.time.d6:3,1;d100:42
  var dice = (cd.diceHistory || []).map(function (h) {
    return [(h.total || 0), esc(h.time || ''), (h.dice || []).map(function (r) { return 'd' + r.sides + ':' + r.result; }).join(',')].join('.');
  }).join(';');

  var a = cd.attrValues || {};
  var rolls = cd.attrRolls || {};
  var parts = [
    MAGIC,
    esc(info.name), esc(info.player), esc(info.age), esc(info.gender), esc(info.era),
    esc(occName),
    ATTR_KEYS.map(function (k) { return a[k] || 0; }).join(','),
    ATTR_KEYS.map(function (k) { return esc(rolls[k]); }).join(','),
    esc(cd.attrDesc || ''),
    pts(cd.occPts), pts(cd.intPts), specs,
    idxList(cd.freeOccSkills), idxList(Object.keys(cd.tickedSkills || {})),
    [cd.usedOccPoints || 0, cd.totalOccPoints || 0, cd.usedIntPoints || 0, cd.totalIntPoints || 0].join(','),
    weapons,
    [cd.playHP !== undefined ? cd.playHP : '', cd.playSAN !== undefined ? cd.playSAN : '',
     cd.playMP !== undefined ? cd.playMP : '', cd.playLuck !== undefined ? cd.playLuck : '',
     cd.majorWound ? 1 : 0, cd.dying ? 1 : 0,
     cd.sanDayStart !== undefined ? cd.sanDayStart : '', cd.sessionSanLoss || 0].join(','),
    esc(cd.tag || ''), cd.completed ? 1 : 0, cd.timestamp || 0,
    esc(textBlock(cd.charBackstory)), esc(textBlock(cd.charGear)), esc(textBlock(cd.charMythos)),
    esc(textBlock(cd.charSpells)), esc(textBlock(cd.charCompanions)), esc(textBlock(cd.charAssets)),
    log, dice,
  ];
  return parts.join('|');
}

// ==================================================================
// 解码：角色码 → { player } | { error: 'CRC'|'TABLE'|'FORMAT'|'VERSION' }
// 优先 C7C2（明文、无校验），失败回退 C7C1 旧码（*crc + 表指纹）。
// 产物含全部原卡字段 + 显示字段重建（derived/attrDisplay/derivedItems/sortedSkillsByCat）。
// ==================================================================
function decode(text) {
  if (!text || typeof text !== 'string') return { error: 'FORMAT' };

  // ---- C7C2：29 段，无校验 ----
  var seg2 = splitUnescaped(text, '|');
  if (seg2.length === 29 && seg2[0] === MAGIC) return buildPlayerV2(seg2);

  // ---- C7C1 旧码兼容：25 段 + *crc + 表指纹 ----
  var star = text.lastIndexOf('*');
  if (star > 0) {
    var body = text.slice(0, star);
    var crc = text.slice(star + 1);
    if (/^[0-9a-fA-F]{4}$/.test(crc) && crc16(body).toLowerCase() === crc.toLowerCase()) {
      var seg1 = splitUnescaped(body, '|');
      if (seg1.length === 25 && seg1[0] === MAGIC_V1) {
        if (tableFingerprint() !== seg1[1]) return { error: 'TABLE' };
        return buildPlayerV1(seg1);
      }
    }
  }
  return { error: 'FORMAT' };
}

// ---------- 公共解析器 ----------
function num(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }

// 点表：<idx>=<val> 或 n<名>=<val>
function parsePtsMap(s) {
  var m = {};
  splitUnescaped(s, ',').filter(Boolean).forEach(function (item) {
    var eq = item.indexOf('=');
    if (eq <= 0) return;
    var code = item.slice(0, eq);
    var val = num(item.slice(eq + 1), 0);
    if (/^\d+$/.test(code)) {
      var sk = SK.ALL_SKILLS[num(code, -1)];
      if (sk) m[sk.name] = val;
    } else if (code.charAt(0) === 'n') {
      m[unesc(code.slice(1))] = val;
    }
  });
  return m;
}

// 专攻：<idx>.<专攻名> 或 n<名>=<专攻名>
function parseSpecs(s) {
  var specs = {};
  splitUnescaped(s, ',').filter(Boolean).forEach(function (item) {
    if (/^\d+\./.test(item)) {
      var dot = item.indexOf('.');
      var sk = SK.ALL_SKILLS[num(item.slice(0, dot), -1)];
      if (sk) specs[sk.name] = unesc(item.slice(dot + 1));
    } else if (item.charAt(0) === 'n') {
      var eq = item.indexOf('=');
      specs[unesc(item.slice(1, eq))] = unesc(item.slice(eq + 1));
    }
  });
  return specs;
}

// 技能下标列表 → 技能名列表
function parseIdxList(s) {
  return splitUnescaped(s, ',').filter(Boolean).map(function (code) {
    if (/^\d+$/.test(code)) {
      var sk = SK.ALL_SKILLS[num(code, -1)];
      return sk ? sk.name : '';
    }
    return code.charAt(0) === 'n' ? unesc(code.slice(1)) : '';
  }).filter(Boolean);
}

// 武器段：w<idx> 表内 / c<name>=... 自定义
function parseWeapons(s) {
  return splitUnescaped(s, ';').filter(Boolean).map(function (item, i) {
    var wid = 'qr' + i;   // WXML 武器行 wx:key="_id"
    if (item.charAt(0) === 'w') {
      var w = W_DATA[num(item.slice(1), -1)];
      if (w) return Object.assign({}, w, { _id: wid });
      return null;
    }
    if (item.charAt(0) === 'c') {
      var f = splitUnescaped(item.slice(1), '=').map(unesc);
      return {
        name: f[0] || '', skill: f[1] || '', damage: f[2] || '',
        range: f[3] || '——', attacks: f[4] || '1', ammo: f[5] || '——',
        malfunction: f[6] || '——', impale: f[7] || '——', _id: wid,
      };
    }
    return null;
  }).filter(Boolean);
}

// 游玩日志段：<typeCode>=<title>=<meta>=<time>;...
function parseLog(s) {
  var typeMap = { n: 'note', h: 'harm', g: 'heal', d: 'dice', x: 'note' };
  return splitUnescaped(s, ';').filter(Boolean).map(function (item) {
    var f = splitUnescaped(item, '=').map(unesc);
    return {
      id: 'imp-' + Math.random().toString(36).slice(2, 8),
      time: f[3] || '', type: typeMap[f[0]] || 'note', title: f[1] || '', meta: f[2] || '',
    };
  });
}

// 骰子历史段：<total>.<time>.<d6:3,d100:42>;...
function parseDice(s) {
  return splitUnescaped(s, ';').filter(Boolean).map(function (item) {
    var d = splitUnescaped(item, '.');
    return {
      total: num(d[0], 0), time: unesc(d[1] || ''),
      dice: splitUnescaped(d[2] || '', ',').filter(Boolean).map(function (p) {
        var m = p.match(/^d(\d+):(\d+)$/);
        return m ? { sides: num(m[1], 0), result: num(m[2], 0) } : { sides: 0, result: 0 };
      }),
    };
  });
}

function makePlayer(fields) {
  var derived = calcDerivedFrom(fields.attrValues, fields.charInfo);
  return {
    player: {
      schemaVersion: 2,
      charInfo: fields.charInfo,
      selectedOcc: fields.selectedOcc,
      attrValues: fields.attrValues,
      attrDisplay: makeAttrDisplay(fields.attrValues),
      attrRolls: fields.attrRolls,
      attrDesc: fields.attrDesc,
      derived: derived,
      derivedItems: makeDerivedItems(derived),
      occPts: fields.occPts, intPts: fields.intPts, skillSpecs: fields.skillSpecs,
      freeOccSkills: fields.freeOccSkills,
      usedOccPoints: fields.pts4[0], totalOccPoints: fields.pts4[1], usedIntPoints: fields.pts4[2], totalIntPoints: fields.pts4[3],
      tickedSkills: fields.tickedSkills,
      sortedSkillsByCat: rebuildSkills(fields.attrValues, fields.occPts, fields.intPts, fields.skillSpecs),
      charWeapons: fields.charWeapons,
      playHP: fields.optNum(fields.vitals[0]), playSAN: fields.optNum(fields.vitals[1]),
      playMP: fields.optNum(fields.vitals[2]), playLuck: fields.optNum(fields.vitals[3]),
      majorWound: fields.vitals[4] === '1', dying: fields.vitals[5] === '1',
      sanDayStart: fields.optNum(fields.vitals[6]), sessionSanLoss: num(fields.vitals[7], 0),
      tag: fields.tag, completed: fields.completed, timestamp: fields.timestamp,
      charBackstory: fields.texts[0], charGear: fields.texts[1], charMythos: fields.texts[2],
      charSpells: fields.texts[3], charCompanions: fields.texts[4], charAssets: fields.texts[5],
      playLog: fields.playLog, diceHistory: fields.diceHistory,
      source: 'c7c',
    },
  };
}

// ---------- C7C2（29 段） ----------
// 段布局：0魔数 1名 2玩家 3年龄 4性别 5时代 6职业 7属性 8掷骰 9属性描述
//          10职业点 11兴趣点 12专攻 13自由技能 14成长勾选 15点预算 16武器 17状态
//          18标签 19完成 20时间戳 21背景 22随身 23神话 24法术 25伙伴 26资产 27日志 28骰子
function buildPlayerV2(seg) {
  var attrValues = {};
  splitUnescaped(seg[7], ',').forEach(function (v, i) { attrValues[ATTR_KEYS[i]] = num(v, 0); });
  var attrRolls = {};
  splitUnescaped(seg[8], ',').forEach(function (v, i) { attrRolls[ATTR_KEYS[i]] = unesc(v); });

  var occPts = parsePtsMap(seg[10]);
  var intPts = parsePtsMap(seg[11]);
  var skillSpecs = parseSpecs(seg[12]);
  var freeOccSkills = parseIdxList(seg[13]);
  var tickedSkills = {};
  parseIdxList(seg[14]).forEach(function (k) { tickedSkills[k] = true; });
  var pts4 = splitUnescaped(seg[15], ',').map(function (v) { return num(v, 0); });
  var charWeapons = parseWeapons(seg[16]);
  var vitals = splitUnescaped(seg[17], ',');

  // 职业：明文名字 → 职业表还原整对象；表内找不到时降级为 { name }（保留显示，编辑降级）
  var occName = unesc(seg[6]);
  var selectedOcc;
  if (occName) {
    selectedOcc = OCC.find(function (o) { return o.name === occName; });
    if (!selectedOcc) selectedOcc = { name: occName };
  }

  var charInfo = { name: unesc(seg[1]), player: unesc(seg[2]), age: unesc(seg[3]), gender: unesc(seg[4]), era: unesc(seg[5]) };

  return makePlayer({
    charInfo: charInfo,
    selectedOcc: selectedOcc,
    attrValues: attrValues,
    attrRolls: attrRolls,
    attrDesc: unesc(seg[9] || ''),
    occPts: occPts, intPts: intPts, skillSpecs: skillSpecs,
    freeOccSkills: freeOccSkills, tickedSkills: tickedSkills,
    pts4: pts4, charWeapons: charWeapons,
    vitals: vitals,
    optNum: function (v) { return v === '' ? undefined : num(v, 0); },
    tag: unesc(seg[18] || ''), completed: seg[19] === '1', timestamp: num(seg[20], 0),
    texts: [unesc(seg[21]), unesc(seg[22]), unesc(seg[23]), unesc(seg[24]), unesc(seg[25]), unesc(seg[26])],
    playLog: parseLog(seg[27]), diceHistory: parseDice(seg[28]),
  });
}

// ---------- C7C1 旧码（25 段 + *crc + 指纹） ----------
// 段布局：0魔数 1指纹 2名 3玩家 4年龄 5性别 6时代 7职业idx 8属性 9掷骰
//          10属性描述 11职业点 12兴趣点 13专攻 14自由技能 15成长勾选 16点预算
//          17武器 18状态 19标签 20完成 21时间戳 22文本块 23游玩日志 24骰子历史
function buildPlayerV1(seg) {
  var attrValues = {};
  splitUnescaped(seg[8], ',').forEach(function (v, i) { attrValues[ATTR_KEYS[i]] = num(v, 0); });
  var attrRolls = {};
  splitUnescaped(seg[9], ',').forEach(function (v, i) { attrRolls[ATTR_KEYS[i]] = unesc(v); });

  var occPts = parsePtsMap(seg[11]);
  var intPts = parsePtsMap(seg[12]);
  var skillSpecs = parseSpecs(seg[13]);
  var freeOccSkills = parseIdxList(seg[14]);
  var tickedSkills = {};
  parseIdxList(seg[15]).forEach(function (k) { tickedSkills[k] = true; });
  var pts4 = splitUnescaped(seg[16], ',').map(function (v) { return num(v, 0); });
  var charWeapons = parseWeapons(seg[17]);
  var vitals = splitUnescaped(seg[18], ',');

  var occIdx = num(seg[7], -1);
  var selectedOcc = (occIdx >= 0 && OCC[occIdx]) ? OCC[occIdx] : undefined;

  var textBlocks = ['', '', '', '', '', ''];
  try { textBlocks = JSON.parse(unesc(seg[22])); } catch (e) { /* 损坏的文本段降级为空 */ }

  var charInfo = { name: unesc(seg[2]), player: unesc(seg[3]), age: unesc(seg[4]), gender: unesc(seg[5]), era: unesc(seg[6]) };

  return makePlayer({
    charInfo: charInfo,
    selectedOcc: selectedOcc,
    attrValues: attrValues,
    attrRolls: attrRolls,
    attrDesc: unesc(seg[10] || ''),
    occPts: occPts, intPts: intPts, skillSpecs: skillSpecs,
    freeOccSkills: freeOccSkills, tickedSkills: tickedSkills,
    pts4: pts4, charWeapons: charWeapons,
    vitals: vitals,
    optNum: function (v) { return v === '' ? undefined : num(v, 0); },
    tag: unesc(seg[19] || ''), completed: seg[20] === '1', timestamp: num(seg[21], 0),
    texts: textBlocks,
    playLog: parseLog(seg[23]), diceHistory: parseDice(seg[24]),
  });
}

module.exports = {
  encode: encode,
  decode: decode,
  crc16: crc16,
  tableFingerprint: tableFingerprint,
  esc: esc,
  unesc: unesc,
  splitUnescaped: splitUnescaped,
  ATTR_KEYS: ATTR_KEYS,
  // 显示字段重建（供 dice-st 等导入通道复用；与 coc7-gen 内部实现等价）
  getSkillBase: getSkillBase,
  makeAttrDisplay: makeAttrDisplay,
  makeDerivedItems: makeDerivedItems,
  calcDerivedFrom: calcDerivedFrom,
  rebuildSkills: rebuildSkills,
};
