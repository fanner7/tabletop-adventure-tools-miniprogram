// tools/test/dice-st.test.js — 骰娘 .st 角色卡导入回归
// 覆盖：与 generateDiceImport 导出的格式往返、九属性/衍生值映射、专攻解析
//       （options 专攻 / text 专攻启发式 / 精确名优先防撞车）、钳位、错误分支、
//       coc7-gen 导入集成、coc-keeper 导入集成
const H = require('./harness');
const DS = require('../../utils/dice-st.js');
const W_DATA = require('../../pages/coc7-gen/data/weapons.js').WEAPONS_1920S;

// ---------- 用测试脚手架构建一张真实完整卡（返回页面实例 + charData） ----------
function buildCard() {
  const { storage } = H.createContext();
  const captured = H.loadPage('pages/coc7-gen/coc7-gen.js');
  const p = H.makePage(captured);
  p.onLoad();
  p.data.step = 1; p.data.maxStep = 1; p.data.canNext = true;
  H.setFullAttrs(p, { str: 60, con: 65, dex: 70, app: 55, pow: 80, siz: 62, int: 75, edu: 85, luck: 50 });
  p.data.charInfo = { name: '哈维·怀特', player: '小明', age: '25', gender: '男', era: '1920s' };
  p.data.step = 2;
  p._doNextStep();
  const occIdx = p.data.filteredOccs.findIndex(o => o.name === '律师');
  p.selectOccupation({ currentTarget: { dataset: { index: occIdx } } });
  p.data.step = 4; p.data.canNext = true;
  p.data.occPts['会计'] = 40; p.data.usedOccPoints = 40;
  p.data.occPts['侦查'] = 30; p.data.usedOccPoints += 30;
  p.data.intPts['聆听'] = 35; p.data.usedIntPoints = 35;
  p.data.intPts['图书馆使用'] = 30; p.data.usedIntPoints += 30;
  p.data.intPts['心理学'] = 40; p.data.usedIntPoints += 40;
  p.data.intPts['闪避'] = 15; p.data.usedIntPoints += 15;
  p.data.skillSpecs = { '格斗①': '斗殴', '射击①': '手枪', '技艺①': '写作', '外语①': '拉丁语' };
  p._refreshSheet();
  p.data.charWeapons = [Object.assign({}, W_DATA.find(w => w.name === '.38(9mm)左轮手枪'), { _id: 1 })];
  p.data.charBackstory = '背景文本';
  return { p, card: p.buildCharacterData(true) };
}

// ---------- 深层相等（忽略对象键序） ----------
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
}

module.exports.run = function () {
  console.log('== dice-st 骰娘 .st 导入 ==');
  const suite = H.makeSuite('dice-st');
  const { ok } = suite;

  // ---------- 与骰娘导出格式往返 ----------
  {
    const { p, card } = buildCard();
    const stText = p.generateDiceImport();
    ok(/^\.st 哈维·怀特-/.test(stText), '导出格式：.st 名字-属性（' + stText.slice(0, 30) + '…）');
    const r = DS.parseSt(stText);
    ok(!r.error, '解析骰娘导出文本无错误' + (r.error ? '（' + r.error + '）' : ''));
    if (r.error) return suite.done();
    const pl = r.player;

    ok(pl.charInfo.name === '哈维·怀特', '角色名往返');
    ok(deepEq(pl.attrValues, card.attrValues), '九属性往返（' + JSON.stringify(pl.attrValues) + '）');
    ok(pl.playHP === card.derived.hp && pl.playSAN === card.derived.san && pl.playMP === card.derived.mp,
      '衍生值往返（hp ' + pl.playHP + ' / san ' + pl.playSAN + ' / mp ' + pl.playMP + '）');
    ok(pl.playLuck === card.attrValues.luck, '幸运同步到游玩幸运');

    // 每条导出技能的总值逐项一致（解析按 总值=基础值+兴趣点 重建）
    const parsedTotals = {};
    pl.sortedSkillsByCat.forEach(g => g.skills.forEach(s => { parsedTotals[s.name] = s.total; }));
    const specOk = pl.skillSpecs['格斗①'] === '斗殴' && pl.skillSpecs['射击①'] === '手枪'
      && pl.skillSpecs['技艺①'] === '写作';
    ok(specOk, '专攻解析（斗殴→格斗①、手枪→射击①、写作→技艺①）');
    // 注：外语① 不在骰娘导出的 skillOrder 中（导出端既有行为），roundtrip 不包含拉丁语
    const parts = stText.replace(/^\.st\s+[^-]*-/, '').split(/\s+/);
    const ATTR_KEYS = ['力量', '敏捷', '意志', '体质', '外貌', '教育', '体型', '智力', '幸运'];
    let mism = 0, total = 0;
    for (const part of parts) {
      const m = part.match(/^(.+?)(\d+)$/);
      if (!m) continue;
      const key = m[1], val = parseInt(m[2], 10);
      const lk = key.toLowerCase();
      if (ATTR_KEYS.indexOf(key) >= 0 || lk === 'hp' || lk === 'mp' || key === '理智' || lk === 'san') continue;   // 属性/衍生值由 parseSt 前置处理
      const r2 = DS.resolveSkill(key);
      if (!r2) continue;   // 未知技能（不导出）
      total++;
      const got = parsedTotals[r2.skillName];
      if (got !== val) mism++;
    }
    ok(mism === 0 && total >= 20, '导出技能总值逐项一致（' + total + ' 项，0 差异）');
    ok(pl.usedIntPoints > 0 && pl.totalIntPoints >= pl.usedIntPoints, '兴趣点预算合理（used ' + pl.usedIntPoints + ' / total ' + pl.totalIntPoints + '）');
    ok(pl.selectedOcc === undefined && pl.charWeapons.length === 0, '.st 无职业/武器信息 → 降级为空');
  }

  // ---------- 手写 .st：九属性 + 别名 + 兜底 ----------
  {
    const r = DS.parseSt('.st 测试员-力量40 敏捷50 意志60 体质70 外貌45 教育65 体型55 智力80 幸运30 hp12 理智60 mp12 会计30 斗殴40 拉丁语10 汽车驾驶25 驯鹰20');
    ok(!r.error && r.player.charInfo.name === '测试员', '手写 .st 名字解析');
    const a = r.player.attrValues;
    ok(a.str === 40 && a.dex === 50 && a.pow === 60 && a.con === 70 && a.app === 45
      && a.edu === 65 && a.siz === 55 && a.int === 80 && a.luck === 30, '九属性映射');
    ok(r.player.playHP === 12 && r.player.playSAN === 60 && r.player.playMP === 12, 'hp/理智/mp 映射');
    const all = {};
    r.player.sortedSkillsByCat.forEach(g => g.skills.forEach(s => { all[s.name] = s; }));
    ok(all['会计'] && all['会计'].total === 30, '普通技能会计 30%');
    ok(r.player.skillSpecs['格斗①'] === '斗殴' && all['格斗①'].total === 40, 'options 专攻：斗殴 → 格斗① 40%');
    ok(r.player.skillSpecs['外语①'] === '拉丁语' && all['外语①'].total === 10, 'text 专攻启发式：拉丁语 → 外语①');
    ok(r.player.skillSpecs['驾驶①'] === '汽车驾驶' && all['驾驶①'].total === 25, '别名：汽车驾驶 → 驾驶①（含专攻文本）');
    ok(r.player.skillSpecs['技艺①'] === '驯鹰' && all['技艺①'].total === 20, '未知技能归入 技艺①（驯鹰）保留总值');
  }

  // ---------- 括号专攻语法 / 冒号分隔（海豹骰常见变体） ----------
  {
    const r = DS.parseSt('.st 括号-力量:60 敏捷:70 意志50 体质50 外貌50 教育:85 体型50 智力50 幸运50 hp:12 理智80 mp16 格斗(斗殴)30 技艺①（写作）15 母语(中文)85 驾驶(汽车)25');
    ok(!r.error && r.player.attrValues.str === 60 && r.player.attrValues.edu === 85, '冒号分隔属性（力量:60 教育:85）');
    ok(r.player.playHP === 12 && r.player.playSAN === 80, '冒号分隔衍生值（hp:12）');
    const all = {};
    r.player.sortedSkillsByCat.forEach(g => g.skills.forEach(s => { all[s.name] = s; }));
    ok(r.player.skillSpecs['格斗①'] === '斗殴' && all['格斗①'].total === 30, '半角括号专攻：格斗(斗殴) → 格斗①（斗殴）');
    ok(r.player.skillSpecs['技艺①'] === '写作' && all['技艺①'].total === 15, '全角括号专攻：技艺①（写作）');
    ok(r.player.skillSpecs['驾驶①'] === '汽车' && all['驾驶①'].total === 25, '括号别名槽位：驾驶(汽车) → 驾驶①（汽车）');
    ok(all['母语'] && all['母语'].total === 85 && !r.player.skillSpecs['母语'], '无专攻技能括号忽略：母语(中文) → 母语 85%');
  }

  // ---------- 精确技能名优先于专攻选项（药学/人类学/心理学撞车） ----------
  {
    const r = DS.parseSt('.st 撞车-力量50 敏捷50 意志50 体质50 外貌50 教育50 体型50 智力50 幸运50 药学20 人类学5 心理学50');
    const all = {};
    r.player.sortedSkillsByCat.forEach(g => g.skills.forEach(s => { all[s.name] = s; }));
    ok(all['药学'] && all['药学'].total === 20, '药学 → 独立技能药学（非 科学（药学））');
    ok(all['人类学'] && all['人类学'].total === 5, '人类学 → 独立技能人类学（非 科学（人类学））');
    ok(all['心理学'] && all['心理学'].total === 50, '心理学 → 独立技能心理学（非 科学（心理学））');
    ok(deepEq(r.player.skillSpecs, {}), '撞车场景无错误专攻');
  }

  // ---------- 钳位：总值低于表内基础值 ----------
  {
    const r = DS.parseSt('.st 低值-力量50 敏捷50 意志50 体质50 外貌50 教育70 体型50 智力50 幸运50 闪避10');
    const all = {};
    r.player.sortedSkillsByCat.forEach(g => g.skills.forEach(s => { all[s.name] = s; }));
    ok(all['闪避'] && all['闪避'].total === 25, '闪避 10 < 基础 25 → 按基础值显示（钳 0 点）');
  }

  // ---------- 未命名 / 空 / 垃圾 ----------
  {
    const r = DS.parseSt('.st 力量60 敏捷70');
    ok(!r.error && r.player.charInfo.name === '未命名调查员' && r.player.attrValues.str === 60, '无名字 .st 仍解析属性');
    ok(DS.parseSt('').error === 'FORMAT', '空串 → FORMAT');
    ok(DS.parseSt('hello world').error === 'FORMAT', '乱文本 → FORMAT');
    ok(DS.parseSt('随便一段文字没有属性').error === 'FORMAT', '无属性文本 → FORMAT');
  }

  // ---------- coc7-gen 导入集成（三通道中的 .st 通道） ----------
  {
    const { p, card } = buildCard();
    const ctx = H.createContext();
    const captured = H.loadPage('pages/coc7-gen/coc7-gen.js');
    const page = H.makePage(captured);
    ctx.wx.getClipboardData = (o) => o.success({ data: p.generateDiceImport() });
    page.onLoad();
    page.importCharacter();
    const list = ctx.storage['coc7_characters'];
    ok(Array.isArray(list) && list.length === 1 && list[0].charInfo.name === '哈维·怀特', '.st 文本导入成功入库');
    if (Array.isArray(list) && list[0]) {
      const loaded = H.makePage(captured);
      loaded.onLoad();
      loaded.applyCharData(list[0], 0);
      const d = loaded.data;
      ok(d.playHP === card.derived.hp && d.playSAN === card.derived.san, '导入后衍生/游玩状态生效');
      const totals = {};
      d.sortedSkillsByCat.forEach(g => g.skills.forEach(s => { totals[s.name] = s.total; }));
      const acc = totals['会计'];
      ok(acc === 45, '导入后会计 45%（基础 5 + 兴趣 40，点表拆分保留可编辑）');
      ok(d.intPts['会计'] === 40 && deepEq(d.occPts, {}), '点数全部记入兴趣点（无职业信息）');
    }
  }

  // ---------- coc-keeper 导入集成 ----------
  {
    const { p } = buildCard();
    const ctx = H.createContext();
    const captured = H.loadPage('pages/coc-keeper/coc-keeper.js');
    const page = H.makePage(captured);
    page.data.tasks = [{ id: 't1', name: '测试团', createdAt: Date.now(), players: [], npcs: [] }];
    page.data.currentTaskId = 't1';
    page.saveTasks = function (tasks) { ctx.storage['coc_keeper_tasks'] = JSON.parse(JSON.stringify(tasks)); };
    page.setData = function (patch, cb) {
      for (const k of Object.keys(patch)) {
        const segs = k.replace(/\[(\d+)\]/g, '.$1').split('.');
        let t = this.data;
        for (let i = 0; i < segs.length - 1; i++) {
          if (t[segs[i]] === undefined || t[segs[i]] === null) t[segs[i]] = {};
          t = t[segs[i]];
        }
        t[segs[segs.length - 1]] = patch[k];
      }
      if (cb) cb();
    };
    ctx.wx.getClipboardData = (o) => o.success({ data: p.generateDiceImport() });
    page.doImportPlayer();
    const task = ctx.storage['coc_keeper_tasks'][0];
    ok(task && task.players.length === 1 && task.players[0].charInfo.name === '哈维·怀特', '守密人剪贴板导入 .st 成功');
    const pl0 = task.players[0];
    ok(pl0.sortedSkillsByCat.length === 6 && pl0.attrDisplay.length === 9 && pl0.derivedItems.length === 6, '守密人渲染字段就绪');
  }

  return suite.done();
};
