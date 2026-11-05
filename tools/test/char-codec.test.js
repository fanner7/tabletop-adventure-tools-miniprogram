// tools/test/char-codec.test.js — 剪贴板角色码（C7C1 格式）编解码回归
// 覆盖：体积压缩、全字段无损往返、重编码幂等、边界字符字节级保真、
//       CRC/指纹/格式错误分支、coc7-gen 导入集成、coc-keeper 剪贴板导入集成、旧 JSON 兼容
const H = require('./harness');
const CC = require('../../utils/char-codec.js');
const W_DATA = require('../../pages/coc7-gen/data/weapons.js').WEAPONS_1920S;

// ---------- 用测试脚手架构建一张真实完整卡（含文本/游玩状态/日志/骰子历史） ----------
function buildRealCard() {
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
  const revolver = W_DATA.find(w => w.name === '.38(9mm)左轮手枪');
  const knife = W_DATA.find(w => w.name === '小型刀具(弹簧折叠刀等)');
  p.data.charWeapons = [
    Object.assign({}, revolver, { _id: 1 }),
    Object.assign({}, knife, { _id: 2 }),
    { name: '秘制毒药瓶', skill: '科学', skillId: '格斗①', damage: '1D4', range: '投掷6码',
      impale: '×', attacks: '1', ammo: '一次性', malfunction: '100', rare: false, _id: 3 },
  ];
  p.data.charBackstory = '哈维·怀特出生于波士顿一个律师世家。\n祖父的日记里夹着一张泛黄的照片。';
  p.data.charGear = '笔记本、钢笔、怀表、手电筒、旧报纸剪报、皮夹克';
  p.data.charMythos = '曾在阿卡姆图书馆的禁书区瞥见《死灵之书》的残页，从此噩梦缠身。';
  p.data.charSpells = '无（暂未习得任何法术）';
  p.data.charCompanions = ['委托人：艾米丽·卡特', '线人：码头工人老约翰', '旧友：记者弗兰克'];
  p.data.charAssets = '银行存款 $2,400；祖父遗留的怀表；律师事务所合伙份额 1/3';
  p.data.charTag = '主调查员';
  p.data.playHP = 10; p.data.playSAN = 62; p.data.playMP = 14; p.data.playLuck = 30;
  p.data.majorWound = false; p.data.dying = false;
  p.data.sanDayStart = 70; p.data.sessionSanLoss = 8;
  p.data.tickedSkills = { '侦查': true, '图书馆使用': true };
  for (let i = 0; i < 10; i++) p.addPlayLog({ type: 'harm', title: '理智损失', meta: '70 → 68' });
  p.addPlayLog({ type: 'heal', title: '急救恢复', meta: '1D3 → +2' });
  p.data.diceHistory = Array.from({ length: 8 }, (_, i) => ({
    dice: [{ sides: 100, result: 42 + i }], total: 42 + i, time: '21:3' + (i % 10),
  }));
  return p.buildCharacterData(true);
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
  console.log('== char-codec 剪贴板角色码（C7C2 明文版 / C7C1 兼容） ==');
  const suite = H.makeSuite('char-codec');
  const { ok } = suite;
  const B = s => Buffer.byteLength(s, 'utf8');

  const card = buildRealCard();
  const pretty = JSON.stringify(card, null, 2);
  const enc = CC.encode(card);

  // ---------- 体积与压缩比 ----------
  ok(enc.indexOf('C7C2|') === 0, '角色码以 C7C2 魔数开头');
  ok(B(enc) <= 4000, '典型完整卡 ≤ 4000B（实测 ' + B(enc) + 'B）');
  ok(B(pretty) / B(enc) >= 5, '压缩比 ≥ 5x（实测 ' + (B(pretty) / B(enc)).toFixed(1) + 'x）');

  // ---------- 明文可读（无校验，职业/文本块人眼可辨） ----------
  ok(!/\*[0-9a-f]{4}$/.test(enc), '无 CRC 校验尾段');
  ok(enc.indexOf('|律师|') > 0, '职业明文段（|律师|）');
  ok(enc.indexOf('哈维·怀特出生于波士顿') > 0, '背景故事明文可见');
  ok(enc.indexOf('笔记本、钢笔、怀表') > 0, '随身物品明文可见');
  ok(enc.indexOf('死灵之书') > 0, '神话相关明文可见');
  ok(enc.indexOf('委托人：艾米丽·卡特') > 0, '调查员伙伴明文可见');
  ok(enc.indexOf('祖父遗留的怀表') > 0, '资产明文可见');

  // ---------- 全字段无损往返 ----------
  const r = CC.decode(enc);
  ok(!r.error, '解码无错误' + (r.error ? '（' + r.error + '）' : ''));
  if (r.error) return suite.done();
  const pl = r.player;

  ok(deepEq(pl.attrValues, card.attrValues), 'attrValues 往返');
  ok(deepEq(pl.attrRolls, card.attrRolls), 'attrRolls 往返');
  ok(deepEq(pl.attrDesc, card.attrDesc), 'attrDesc 往返');
  ok(deepEq(pl.charInfo, card.charInfo), 'charInfo 往返');
  ok(pl.selectedOcc && pl.selectedOcc.name === card.selectedOcc.name && pl.selectedOcc.cr_range === card.selectedOcc.cr_range
    && deepEq(pl.selectedOcc.skills, card.selectedOcc.skills), 'selectedOcc 表内字段往返');
  ok(deepEq(pl.occPts, card.occPts) && deepEq(pl.intPts, card.intPts), '职业/兴趣点表往返');
  ok(deepEq(pl.skillSpecs, card.skillSpecs), 'skillSpecs 往返');
  ok(deepEq(pl.freeOccSkills, card.freeOccSkills), 'freeOccSkills 往返');
  ok(pl.usedOccPoints === card.usedOccPoints && pl.totalOccPoints === card.totalOccPoints
    && pl.usedIntPoints === card.usedIntPoints && pl.totalIntPoints === card.totalIntPoints, '点预算往返');
  ok(deepEq(pl.tickedSkills, card.tickedSkills), 'tickedSkills 往返');
  ok(pl.charWeapons.length === card.charWeapons.length
    && deepEq(pl.charWeapons.map(w => ({ name: w.name, skill: w.skill, damage: w.damage, range: w.range, attacks: w.attacks, ammo: w.ammo, malfunction: w.malfunction, impale: w.impale })),
      card.charWeapons.map(w => ({ name: w.name, skill: w.skill, damage: w.damage, range: w.range, attacks: w.attacks, ammo: w.ammo, malfunction: w.malfunction, impale: w.impale }))), '武器往返（表内索引 + 自定义内联）');
  ok(pl.charWeapons.every(w => !!w._id), '武器 _id 生成（WXML wx:key）');
  ok(pl.playHP === card.playHP && pl.playSAN === card.playSAN && pl.playMP === card.playMP && pl.playLuck === card.playLuck, '游玩 HP/SAN/MP/LUCK 往返');
  ok(pl.majorWound === card.majorWound && pl.dying === card.dying, '重伤/濒死标记往返');
  ok(pl.sanDayStart === card.sanDayStart && pl.sessionSanLoss === card.sessionSanLoss, 'SAN 日累计往返');
  ok(pl.tag === card.tag, '标签往返');
  ok(pl.completed === card.completed && pl.timestamp === card.timestamp, 'completed/timestamp 往返');
  ok(pl.charBackstory === card.charBackstory && pl.charGear === card.charGear && pl.charMythos === card.charMythos
    && pl.charSpells === card.charSpells && pl.charAssets === card.charAssets, '文本块往返（背景/随身/神话/法术/资产）');
  ok(pl.charCompanions === card.charCompanions.join('\n'), '调查员伙伴往返（数组按行连接为文本）');
  ok(deepEq(pl.diceHistory, card.diceHistory), 'diceHistory 往返');
  ok(deepEq(pl.playLog.map(l => ({ type: l.type, title: l.title, meta: l.meta, time: l.time })),
    card.playLog.map(l => ({ type: l.type, title: l.title, meta: l.meta, time: l.time }))), 'playLog 往返（id 重生成属预期）');

  // ---------- 显示字段重建（守密人直接渲染） ----------
  ok(pl.derived.hp === card.derived.hp && pl.derived.san === card.derived.san && pl.derived.mp === card.derived.mp
    && pl.derived.db === card.derived.db && pl.derived.build === card.derived.build && pl.derived.mov === card.derived.mov, 'derived 重算一致');
  ok(pl.derivedItems.length === 6 && pl.derivedItems[0].l === '生命 HP', 'derivedItems 重建');
  ok(pl.attrDisplay.length === 9 && pl.attrDisplay[0].label === '力量 STR', 'attrDisplay 重建');
  const allS = pl.sortedSkillsByCat.flatMap(g => g.skills);
  const origS = card.sortedSkillsByCat.flatMap(g => g.skills);
  ok(allS.length === origS.length, '技能全量重建（' + allS.length + ' 项）');
  ok(allS.every(s => {
    const o = origS.find(x => x.name === s.name);
    return o && o.total === s.total && o.displayName === s.displayName;
  }), '技能 total/displayName 逐项一致');

  // ---------- 重编码幂等（decode → encode 与原载荷一致） ----------
  ok(CC.encode(pl) === enc, '解码产物重编码与原始角色码一致');

  // ---------- 边界字符（字节级保真，区别于 C7K2 的 _ 替换） ----------
  const weird = JSON.parse(JSON.stringify(card));
  weird.charInfo.name = '张|三;李=四.五\\六';
  weird.charBackstory = '含|管道;分号,逗号=等号.句点\\反斜杠\n换行 的文本';
  weird.charGear = '工具\\箱、绳索|滑轮';
  weird.charCompanions = ['线人：码头\\工人', 'a|b;c=d.e'];
  const wDec = CC.decode(CC.encode(weird));
  ok(!wDec.error && wDec.player.charInfo.name === '张|三;李=四.五\\六', '姓名保留字符字节级往返');
  ok(!wDec.error && wDec.player.charBackstory === weird.charBackstory, '背景文本（含 \\n 与保留字符）字节级往返');
  ok(!wDec.error && wDec.player.charCompanions === weird.charCompanions.join('\n'), '伙伴列表保留字符往返');

  // ---------- 错误分支（C7C2 无校验：结构错误才拒绝；内容篡改宽容） ----------
  ok(CC.decode('').error === 'FORMAT', '空串 → FORMAT');
  ok(CC.decode('hello world').error === 'FORMAT', '乱文本 → FORMAT');
  ok(CC.decode('C7C3|' + enc.slice(5)).error === 'FORMAT', '未知魔数 → FORMAT');
  ok(CC.decode(enc.split('|').slice(0, 10).join('|')).error === 'FORMAT', '截断（段数不足）→ FORMAT');
  {
    // 无校验：篡改职业名不报错，职业降级为 { name } 保留显示
    const seg = CC.splitUnescaped(enc, '|');
    seg[6] = '不存在职业';
    const tampered = seg.join('|');
    const td = CC.decode(tampered);
    ok(!td.error && td.player.selectedOcc && td.player.selectedOcc.name === '不存在职业', '篡改职业名 → 降级 { name } 不报错（无校验）');
  }

  // ---------- C7C1 旧角色码兼容解码（*crc + 表指纹路径） ----------
  {
    const v1Seg = ['C7C1', CC.tableFingerprint(), '旧码测试', '', '25', '男', '1920s', '70',
      '60,65,70,55,80,62,75,85,50', ',,,,,,,,', '', '0=40', '', '', '', '', '0,0,0,0', '',
      '10,62,14,30,0,0,70,8', '', '1', '1780000000000',
      '["背景故事文本","随身","神话","法术","伙伴","资产"]', '', ''];
    const v1Body = v1Seg.join('|');
    const v1Enc = v1Body + '*' + CC.crc16(v1Body);
    const v1d = CC.decode(v1Enc);
    ok(!v1d.error && v1d.player.charInfo.name === '旧码测试' && v1d.player.charBackstory === '背景故事文本'
      && v1d.player.selectedOcc.name === '律师' && v1d.player.occPts['会计'] === 40, 'C7C1 旧角色码兼容解码');
    const badFp = ['C7C1', '0000'].concat(v1Seg.slice(2)).join('|');
    ok(CC.decode(badFp + '*' + CC.crc16(badFp)).error === 'TABLE', 'C7C1 旧码表指纹不匹配 → TABLE');
  }

  // ---------- 缺字段降级 ----------
  const minimal = { attrValues: card.attrValues, charInfo: card.charInfo };
  const mDec = CC.decode(CC.encode(minimal));
  ok(!mDec.error && mDec.player.selectedOcc === undefined && mDec.player.charWeapons.length === 0
    && mDec.player.playHP === undefined, '最小卡降级不报错（无职业/武器/游玩状态）');

  // ---------- coc7-gen 导入集成（双通道） ----------
  {
    const ctx = H.createContext();
    const captured = H.loadPage('pages/coc7-gen/coc7-gen.js');
    const p = H.makePage(captured);
    ctx.wx.getClipboardData = (o) => o.success({ data: CC.encode(card) });
    p.onLoad();
    p.importCharacter();
    const list = ctx.storage['coc7_characters'];
    ok(Array.isArray(list) && list.length === 1 && list[0].charInfo.name === '哈维·怀特', 'C7C 角色码导入成功入库');
    if (Array.isArray(list) && list[0]) {
      const loaded = H.makePage(captured);
      loaded.onLoad();
      loaded.applyCharData(list[0], 0);
      const d = loaded.data;
      ok(deepEq(d.occPts, card.occPts) && deepEq(d.intPts, card.intPts) && deepEq(d.skillSpecs, card.skillSpecs), '导入后点表/专攻可编辑');
      ok(deepEq(d.charWeapons.map(w => w.name), card.charWeapons.map(w => w.name)), '导入后武器齐全');
      ok(deepEq(d.diceHistory, card.diceHistory), '导入后骰子历史保留');
      ok(d.playHP === card.playHP && d.playSAN === card.playSAN && d.charTag === card.tag, '导入后游玩状态/标签保留');
    }
  }
  {
    // 旧 JSON 导出仍可导入（历史兼容）
    const ctx = H.createContext();
    const captured = H.loadPage('pages/coc7-gen/coc7-gen.js');
    const p = H.makePage(captured);
    ctx.wx.getClipboardData = (o) => o.success({ data: JSON.stringify(card) });
    p.onLoad();
    p.importCharacter();
    const list = ctx.storage['coc7_characters'];
    ok(Array.isArray(list) && list.length === 1 && list[0].charInfo.name === '哈维·怀特', '旧版 JSON 导出仍可导入（兼容）');
  }
  {
    // 非数据文本 → 拒绝
    const ctx = H.createContext();
    const captured = H.loadPage('pages/coc7-gen/coc7-gen.js');
    const p = H.makePage(captured);
    let toast = '';
    ctx.wx.showToast = (o) => { toast = o.title; };
    ctx.wx.getClipboardData = (o) => o.success({ data: '随便一段文字' });
    p.onLoad();
    p.importCharacter();
    ok(toast.indexOf('不是有效的调查员数据') >= 0, '乱文本导入被拒绝并提示');
  }

  // ---------- coc-keeper 剪贴板导入集成（双通道） ----------
  {
    const ctx = H.createContext();
    const captured = H.loadPage('pages/coc-keeper/coc-keeper.js');
    const p = H.makePage(captured);
    p.data.tasks = [{ id: 't1', name: '测试团', createdAt: Date.now(), players: [], npcs: [] }];
    p.data.currentTaskId = 't1';
    p.saveTasks = function (tasks) { ctx.storage['coc_keeper_tasks'] = JSON.parse(JSON.stringify(tasks)); };
    p.setData = function (patch, cb) {
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
    ctx.wx.getClipboardData = (o) => o.success({ data: CC.encode(card) });
    p.doImportPlayer();
    const task = ctx.storage['coc_keeper_tasks'][0];
    ok(task && task.players.length === 1 && task.players[0].charInfo.name === '哈维·怀特', '守密人剪贴板导入 C7C 成功');
    const pl0 = task.players[0];
    ok(pl0.sortedSkillsByCat.length === 6 && pl0.attrDisplay.length === 9 && pl0.derivedItems.length === 6, '守密人渲染字段（技能/属性/衍生）就绪');
  }

  return suite.done();
};
