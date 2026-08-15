// tools/test/data-integrity.test.js — 静态数据完整性校验
const H = require('./harness');

module.exports.run = function () {
  console.log('== 数据完整性 ==');
  const suite = H.makeSuite('data-integrity');
  const { ok } = suite;

  // ---------- 技能 ----------
  {
    const SK = require('../../pages/coc7-gen/data/skills.js');
    ok(Array.isArray(SK.CAT_ORDER) && SK.CAT_ORDER.length > 0, 'CAT_ORDER 存在');
    ok(SK.CAT_ORDER.every(c => SK.CAT_LABELS[c] && SK.CAT_LABELS[c].label), '每个分类都有标签');
    const names = SK.ALL_SKILLS.map(s => s.name);
    ok(names.length === new Set(names).size, 'ALL_SKILLS 名称唯一（' + names.length + ' 个）');
    ok(SK.ALL_SKILLS.every(s => SK.CAT_ORDER.includes(s.cat) && typeof s.name === 'string'), '技能分类合法');
    ok(Object.keys(SK.FREE_SKILL_ALIAS).length > 0, 'FREE_SKILL_ALIAS 非空');
  }

  // ---------- 职业 ----------
  {
    const OCC = require('../../pages/coc7-gen/data/occupations.js').OCCUPATIONS;
    ok(OCC.length === 114, '职业数量 114');
    ok(new Set(OCC.map(o => o.seq)).size === OCC.length, '职业序号唯一');
    ok(new Set(OCC.map(o => o.name)).size === OCC.length, '职业名称唯一');
    const SK = require('../../pages/coc7-gen/data/skills.js');
    const skillNames = new Set(SK.ALL_SKILLS.map(s => s.name));
    // 自由槽占位符（"两项其他技能"等）由 parseFreeSkillSlots 在运行时解析，不算真实技能；
    // 规则镜像 parseFreeSkillSlots 的 1/2/3/4/5/6 号分支
    const isKeywordPlaceholder = n => /其他|任意|任选|下面|特长|个人|专业书籍主题|其他技能|时代|克苏鲁神话|催眠/.test(n) || /(一|两|二|三|四|五|六|七|八|九|十|\d+)[项种个]/.test(n);
    const isSlotPlaceholder = n => isKeywordPlaceholder(n) || n.includes('、');
    // 镜像页面的 normalizeSkillName，校验组合条目中的每个技能名
    const norm = (n) => {
      if (skillNames.has(n)) return n;
      const base = n.replace(/[（(].*?[)）]/g, '').trim();
      if (skillNames.has(base)) return base;
      if (base.includes('外语')) return '外语①';
      if (base.includes('驾驶')) return '驾驶①';
      if (base.includes('科学')) return '科学';
      if (base.includes('母语')) return '母语';
      const pre = [...skillNames].find(s => base.startsWith(s) || s.startsWith(base));
      return pre || '';
    };
    let bad = [];
    for (const o of OCC) {
      if (!o.skill_formula || !o.name || !o.seq) bad.push(o.seq + ': 缺基础字段');
      if (!/^\d+-\d+$/.test(String(o.cr_range || ''))) bad.push(o.seq + ' ' + o.name + ': cr_range 格式异常 "' + o.cr_range + '"');
      for (const s of (o.skills || [])) {
        if (!['★', '☆'].includes(s.mark)) bad.push(o.seq + ' ' + o.name + ': 技能标记异常 ' + s.name);
        if (skillNames.has(s.name)) continue;
        if (!isSlotPlaceholder(s.name)) { bad.push(o.seq + ' ' + o.name + ': 技能不存在于 ALL_SKILLS: ' + s.name); continue; }
        // 组合条目（"急救、医学、外语（拉丁文）…"）逐个校验成员（先按 、拆分，再剥离括号后按 ；拆分）；
        // 含占位符关键词的组合（如"时代特长（如计算机、…）"）由 parseFreeSkillSlots 整体解析，不校验成员
        if (s.name.includes('、') && !isKeywordPlaceholder(s.name)) {
          const parts = s.name.split(/、/).flatMap(p => p.replace(/[（(].*?[)）]/g, '').split(/；/)).filter(Boolean);
          for (const part of parts) {
            if (!norm(part)) bad.push(o.seq + ' ' + o.name + ': 组合条目含未知技能: ' + part);
          }
        }
      }
    }
    ok(bad.length === 0, '全部职业字段/CR 范围/技能引用合法' + (bad.length ? '（' + bad.slice(0, 3).join('；') + '）' : ''));
  }

  // ---------- 武器 ----------
  {
    const W = require('../../pages/coc7-gen/data/weapons.js').WEAPONS_1920S;
    ok(W.length >= 50, '武器表规模正常（' + W.length + '）');
    ok(new Set(W.map(w => w.name)).size === W.length, '武器名称唯一');
    ok(W.every(w => w.name && w.skill && w.damage && w.range), '武器基础字段齐全');
  }

  // ---------- 预置角色 ----------
  {
    const P = require('../../pages/coc7-gen/data/presets.js').PRESET_CHARACTERS;
    const OCC = require('../../pages/coc7-gen/data/occupations.js').OCCUPATIONS;
    const SK = require('../../pages/coc7-gen/data/skills.js');
    const occNames = new Set(OCC.map(o => o.name));
    const skillNames = new Set(SK.ALL_SKILLS.map(s => s.name));
    ok(P.length === 8, '预置角色 8 个');
    let bad = [];
    const attrKeys = ['str', 'con', 'dex', 'app', 'pow', 'siz', 'int', 'edu', 'luck'];
    for (const pc of P) {
      const d = pc.data || {};
      if (!d.charInfo || !d.charInfo.name) bad.push(pc.id + ': 缺角色名');
      if (!attrKeys.every(k => typeof (d.attrValues || {})[k] === 'number')) bad.push(pc.id + ': 属性不全');
      if (!d.selectedOcc || !occNames.has(d.selectedOcc.name)) bad.push(pc.id + ': 职业无效');
      for (const k of Object.keys(d.occPts || {})) if (!skillNames.has(k)) bad.push(pc.id + ': occPts 未知技能 ' + k);
      for (const k of Object.keys(d.intPts || {})) if (!skillNames.has(k)) bad.push(pc.id + ': intPts 未知技能 ' + k);
    }
    ok(bad.length === 0, '预置角色数据合法' + (bad.length ? '（' + bad.slice(0, 3).join('；') + '）' : ''));
  }

  // ---------- 名字 / 描述 / 守密人规则 ----------
  {
    const N = require('../../pages/coc7-gen/data/names.js');
    ok(N.MALE_NAMES.length >= 20 && N.FEMALE_NAMES.length >= 20, '随机名字库充足');
    const T = require('../../pages/coc7-gen/data/traits.js');
    ok(Object.keys(T.traits_dictionary || {}).length > 0, '属性描述词典非空');
    const R = require('../../pages/coc-keeper/data/rules.js').RULES_SECTIONS;
    ok(R.length >= 5 && R.every(s => s.id && s.name && (s.items || s.table)), '守密人规则速查结构合法');
  }

  return suite.done();
};
