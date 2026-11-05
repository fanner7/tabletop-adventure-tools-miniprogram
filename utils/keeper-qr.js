// utils/keeper-qr.js — 调查员角色卡二维码：编码 / 解码 / 绘制
// ============================================================
// 对应设计文档：docs/qr-keeper-transfer-design.md（C7K2 格式 v2）
// 编码端：pages/coc7-gen（分享卡片内嵌二维码）
// 解码端：pages/coc-keeper（扫码导入调查员）
// 依赖：./weapp-qrcode.js（vendored 二维码生成库，本模块只取矩阵）
// ============================================================

var QR = require('./weapp-qrcode.js');
var SK = require('../pages/coc7-gen/data/skills.js');
var W_DATA = require('../pages/coc7-gen/data/weapons.js').WEAPONS_1920S;

// ---------- CRC16（encode 与 decode 必须同一实现） ----------
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

// ---------- 转义：载荷保留字符统一替换为 _（解码端不还原，显示即 _） ----------
function esc(s) {
  return String(s == null ? '' : s).replace(/[|;,=.]/g, '_');
}

var ATTR_KEYS = ['str', 'con', 'dex', 'app', 'pow', 'siz', 'int', 'edu', 'luck'];

// 表指纹：技能表 + 武器表（两张表都做索引编码，都需防版本漂移）
function tableFingerprint() {
  return crc16(SK.ALL_SKILLS.map(function (s) { return s.name; }).join('')
    + '|' + W_DATA.map(function (w) { return w.name; }).join(''));
}

// 技能基础值（与 coc7-gen.js getSkillBase 等价实现，解码端反推基础值技能用）
// 母语=EDU、闪避=DEX/2、options 专攻用所选子项 base，否则用表 base
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

// ==================================================================
// 编码：charData（buildCharacterData 产物）→ C7K2 载荷字符串
// ==================================================================
function encodeKeeperQR(charData) {
  var cd = charData || {};
  var byName = {};
  SK.ALL_SKILLS.forEach(function (sk, i) { byName[sk.name] = i; });

  var parts = [
    'C7K2',
    tableFingerprint(),
    esc(cd.charInfo && cd.charInfo.name),
    esc(cd.charInfo && cd.charInfo.player),
    esc(cd.selectedOcc ? cd.selectedOcc.name : ''),
    esc(cd.charInfo && cd.charInfo.era),
  ];

  // 九属性（固定顺序 CSV）
  var a = cd.attrValues || {};
  parts.push(ATTR_KEYS.map(function (k) { return a[k] || 0; }).join(','));

  // 衍生值 hp,san,mp,db,build,mov
  var d = cd.derived || {};
  parts.push([d.hp, d.san, d.mp, d.db, d.build, d.mov].join(','));

  // 技能：code=total 列表
  // 只编码「投入过点数」或「携带专攻」的技能；未投入的基础值技能由解码端
  // 用 EDU/DEX + 专攻反推（载荷显著变小，二维码版本更低、更易扫）
  var edu = (cd.attrValues && cd.attrValues.edu) || 50;
  var dex = (cd.attrValues && cd.attrValues.dex) || 50;
  var specsMap = cd.skillSpecs || {};
  var items = [];
  (cd.sortedSkillsByCat || []).forEach(function (gr) {
    (gr.skills || []).forEach(function (sk) {
      var dn = sk.displayName || sk.name;
      var base = getSkillBase(sk.name, edu, dex, specsMap);
      var invested = sk.total !== base;
      var hasSpec = dn !== sk.name;
      if (!invested && !hasSpec) return;   // 基础值技能：解码端重建
      var code = null;
      if (dn === sk.name) {
        var idx = byName[sk.name];
        if (idx !== undefined) code = String(idx);
      } else {
        // 专攻显示名（全角括号）：格斗①（斗殴）→ 槽位下标 + 专攻编码
        var m = dn.match(/^(.*)（(.*)）$/);
        if (m) {
          var slotIdx = byName[m[1]];
          var slot = slotIdx !== undefined ? SK.ALL_SKILLS[slotIdx] : null;
          if (slot && slot.spec) {
            if (slot.spec.type === 'options') {
              var oi = slot.spec.options.findIndex(function (o) { return o.name === m[2]; });
              if (oi >= 0) code = slotIdx + '.' + oi;
            } else {
              code = slotIdx + '.' + esc(m[2]);   // text 型：专攻文本内联
            }
          }
        }
      }
      if (code === null) code = 'n' + esc(dn);   // 兜底：未知技能名内联
      items.push(code + '=' + sk.total);
    });
  });
  parts.push(items.join(','));

  // 武器：表内武器只存索引（解码端查表还原全部字段），自定义武器全字段内联
  var wIdxByName = {};
  W_DATA.forEach(function (w, i) { wIdxByName[w.name] = i; });
  parts.push((cd.charWeapons || []).map(function (w) {
    var idx = wIdxByName[w.name];
    if (idx !== undefined) return 'w' + idx;
    return 'c' + esc(w.name) + '=' + esc(w.skill || '') + '=' + esc(w.damage || '')
      + '=' + esc(w.range || '') + '=' + esc(w.attacks || '') + '=' + esc(w.ammo || '')
      + '=' + esc(w.malfunction || '') + '=' + esc(w.impale || '');
  }).join(';'));

  var body = parts.join('|');
  return body + '*' + crc16(body);
}

// ==================================================================
// 解码：载荷字符串 → 守密人 player 对象
// 返回 { player } 或 { error: 'CRC' | 'TABLE' | 'FORMAT' | 'VERSION' }
// ==================================================================
function decodeKeeperQR(text) {
  if (!text || typeof text !== 'string') return { error: 'FORMAT' };

  var star = text.lastIndexOf('*');
  if (star <= 0) return { error: 'FORMAT' };
  var body = text.slice(0, star);
  var crc = text.slice(star + 1);
  if (!/^[0-9a-fA-F]{4}$/.test(crc)) return { error: 'FORMAT' };
  if (crc16(body).toLowerCase() !== crc.toLowerCase()) return { error: 'CRC' };

  var seg = body.split('|');
  if (seg.length !== 10) return { error: 'FORMAT' };
  if (seg[0] !== 'C7K2') return { error: 'VERSION' };
  if (tableFingerprint() !== seg[1]) {
    return { error: 'TABLE' };
  }

  // ---- 属性 ----
  var attrValues = {};
  var av = (seg[6] || '').split(',');
  ATTR_KEYS.forEach(function (k, i) {
    var v = parseInt(av[i], 10);
    attrValues[k] = isNaN(v) ? 0 : v;
  });

  // ---- 衍生值 ----
  var dv = (seg[7] || '').split(',');
  var intPart = function (s, def) {
    var v = parseInt(s, 10);
    return isNaN(v) ? def : v;
  };
  var derived = {
    hp: intPart(dv[0], 0), san: intPart(dv[1], 0), mp: intPart(dv[2], 0),
    db: dv[3] === undefined ? '0' : String(dv[3]),
    build: intPart(dv[4], 0), mov: intPart(dv[5], 0),
  };

  // ---- 技能 ----
  var totals = {};        // idx → {displayName, total, name, spec}
  var inlineSkills = [];  // 未知技能名
  var slotRe = /^(\d+)(?:\.(.*))?$/;
  (seg[8] || '').split(',').forEach(function (item) {
    if (!item) return;
    var eq = item.indexOf('=');
    if (eq <= 0) return;
    var code = item.slice(0, eq);
    var total = intPart(item.slice(eq + 1), 0);
    var m = code.match(slotRe);
    if (m) {
      var idx = parseInt(m[1], 10);
      if (idx < 0 || idx >= SK.ALL_SKILLS.length) return;
      var entry = SK.ALL_SKILLS[idx];
      var spec = null;
      var suffix = m[2];
      if (suffix !== undefined) {
        if (/^\d+$/.test(suffix)) {
          var oi = parseInt(suffix, 10);
          if (entry.spec && entry.spec.type === 'options' && entry.spec.options[oi]) {
            spec = entry.spec.options[oi].name;
          }
        } else {
          spec = suffix;   // text 型专攻（已转义）
        }
      }
      totals[idx] = {
        name: entry.name,
        displayName: spec ? entry.name + '（' + spec + '）' : entry.name,
        total: total,
        spec: spec,
      };
    } else if (code.charAt(0) === 'n') {
      inlineSkills.push({ name: code.slice(1), displayName: code.slice(1), total: total });
    }
  });

  // 解码端基础值重建：载荷只含「投入/带专攻」技能，
  // 其余技能按 母语=EDU、闪避=DEX/2、专攻子项/表 base 反推（与建卡器 inclusion 规则一致）
  var edu = attrValues.edu || 50;
  var dex = attrValues.dex || 50;
  var skillSpecs = {};
  SK.ALL_SKILLS.forEach(function (sk, idx) {
    var t = totals[idx];
    if (!t) return;
    if (t.spec) skillSpecs[sk.name] = t.spec;   // 供重编码/后续使用
  });

  // 按 ALL_SKILLS 顺序重建分组（与建卡器 buildPreviewSkills 同序：CAT_ORDER + 表内顺序）
  var groups = {};
  SK.CAT_ORDER.forEach(function (c) { groups[c] = []; });
  SK.ALL_SKILLS.forEach(function (sk, idx) {
    var t = totals[idx];
    var base = getSkillBase(sk.name, edu, dex, skillSpecs);
    if (!t) {
      if (base <= 0) return;                     // 未投入且基础值为 0：建卡器同样排除
    }
    var displayName = t ? t.displayName : sk.name;
    var total = t ? t.total : base;
    groups[sk.cat].push({
      name: sk.name, displayName: displayName, base: base,
      total: total, hard: Math.floor(total / 2), extreme: Math.floor(total / 5),
    });
  });
  var sortedSkillsByCat = SK.CAT_ORDER.filter(function (c) { return groups[c].length > 0; })
    .map(function (c) { return { catName: SK.CAT_LABELS[c].label, cat: c, skills: groups[c] }; });
  if (inlineSkills.length > 0) {
    sortedSkillsByCat.push({
      catName: '其他', cat: 'other',
      skills: inlineSkills.map(function (s) {
        return { name: s.name, displayName: s.displayName, base: 0, total: s.total,
          hard: Math.floor(s.total / 2), extreme: Math.floor(s.total / 5) };
      }),
    });
  }

  // ---- 武器 ----
  // w<idx>：表内武器（查 WEAPONS_1920S 还原全部字段）
  // c<name>=<skill>=<damage>=<range>=<attacks>=<ammo>=<malfunction>=<impale>：自定义武器
  var charWeapons = (seg[9] || '').split(';').filter(Boolean).map(function (item, i) {
    var wid = 'qr' + i;   // WXML 武器行 wx:key="_id"
    if (item.charAt(0) === 'w') {
      var idx = parseInt(item.slice(1), 10);
      var w = W_DATA[idx];
      if (w) return Object.assign({}, w, { _id: wid });
      return null;
    }
    if (item.charAt(0) === 'c') {
      var f = item.slice(1).split('=');
      return {
        name: f[0] || '', skill: f[1] || '', damage: f[2] || '',
        range: f[3] || '——', attacks: f[4] || '1', ammo: f[5] || '——',
        malfunction: f[6] || '——', impale: f[7] || '——', _id: wid,
      };
    }
    return null;
  }).filter(Boolean);

  // ---- 守密人兼容字段 ----
  var player = {
    charInfo: {
      name: seg[2] || '',
      player: seg[3] || '',
      era: seg[5] || '',
    },
    selectedOcc: seg[4] ? { name: seg[4] } : undefined,
    attrValues: attrValues,
    attrDisplay: makeAttrDisplay(attrValues),
    derived: derived,
    derivedItems: makeDerivedItems(derived),
    skillSpecs: skillSpecs,
    sortedSkillsByCat: sortedSkillsByCat,
    charWeapons: charWeapons,
    source: 'qr',
    qrVersion: 2,
  };
  return { player: player };
}

// ---------- 守密人 WXML 兼容字段重建（与 coc7-gen 内部实现等价） ----------
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

// ==================================================================
// 绘制：在指定 2d 上下文的 (x,y) 处画 size×size 二维码（含白色静区）
// 不重置画布尺寸（区别于库自带 drawQrcode），可直接叠加在分享卡画布上
// 纠错级自适应：载荷 ≤ 322B（v16-Q 实测容量）用 Q（25%），否则用 M（15%）
//   —— 典型卡 v12-v16 Q，极限满卡 v17 M，均 ≤ 85 模块，267px 下 ≥2.8px/模块
// ==================================================================
function drawKeeperQR(ctx, text, x, y, size, correctLevel) {
  var str = String(text);
  var level = correctLevel !== undefined ? correctLevel
    : (QR.utf16to8(str).length <= 322 ? QR.QRErrorCorrectLevel.Q : QR.QRErrorCorrectLevel.M);
  var q = new QR.QRCode(-1, level);
  q.addData(QR.utf16to8(str));
  q.make();
  var n = q.getModuleCount();
  var quiet = Math.max(1, Math.round(size / (n + 8)));   // 约 4 模块静区
  var tile = (size - quiet * 2) / n;

  // 白色垫底（含静区）
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  // 深色模块
  ctx.fillStyle = '#000000';
  for (var r = 0; r < n; r++) {
    for (var c = 0; c < n; c++) {
      if (q.isDark(r, c)) {
        ctx.fillRect(x + quiet + c * tile, y + quiet + r * tile, Math.ceil(tile), Math.ceil(tile));
      }
    }
  }
}

module.exports = {
  encodeKeeperQR: encodeKeeperQR,
  decodeKeeperQR: decodeKeeperQR,
  drawKeeperQR: drawKeeperQR,
  crc16: crc16,
  tableFingerprint: tableFingerprint,
  ATTR_KEYS: ATTR_KEYS,
};
