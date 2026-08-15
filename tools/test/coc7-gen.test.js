// tools/test/coc7-gen.test.js — COC 调查员工具回归测试（真实数据全流程）
const H = require('./harness');

module.exports.run = function () {
  console.log('== coc7-gen 流程回归 ==');
  const suite = H.makeSuite('coc7-gen');
  const { ok, fail } = suite;

  const { storage } = H.createContext();
  const captured = H.loadPage('pages/coc7-gen/coc7-gen.js');
  const makePage = () => H.makePage(captured);

  // ---------- WXML handler 引用 ----------
  {
    const wxml = H.readWxml('pages/coc7-gen/coc7-gen.wxml');
    const handlers = H.extractHandlers(wxml);
    const missing = [...handlers].filter(h => typeof captured[h] !== 'function');
    ok(missing.length === 0, 'WXML 引用的 ' + handlers.size + ' 个 handler 全部存在' + (missing.length ? '（缺失: ' + missing.join(',') + '）' : ''));
  }

  // ---------- 建卡全流程 ----------
  let p = makePage();
  p.onLoad();
  p.data.step = 1; p.data.maxStep = 1; p.data.canNext = true;
  H.setFullAttrs(p);
  p.data.charInfo = { name: '哈维', player: '', age: '25', gender: '男', era: '1920s' };
  p.data.step = 2;
  p._doNextStep();
  ok(p.data.step === 3 && p.data.filteredOccs.length === 114, '进入职业步，职业列表 114 个');
  p.selectOccupation({ currentTarget: { dataset: { index: 0 } } });
  ok(p.data.selectedOcc && p.data.selectedOcc.name === '会计师', '选中会计师');
  ok(p.data.totalOccPoints === 280 && p.data.totalIntPoints === 120, '点数计算：职业 280 / 兴趣 120');
  ok((p.data.intPts['信用评级'] || 0) === 50, 'CR 自动填充 50 点兴趣点');
  ok(p.data.crAutoNote.indexOf('50') >= 0, 'CR 透明化说明存在');
  ok(p.data.skillGroups.length > 0, '技能列表构建');
  p.data.step = 4; p.data.canNext = true;
  p.data.occPts['会计'] = 40; p.data.usedOccPoints = 40;
  p._doNextStep();
  ok(p.data.step === 5, '进入完成页');
  ok(p.data.derived.hp === 11 && p.data.derived.san === 65 && p.data.derived.mp === 13, '衍生值 HP/SAN/MP 正确');
  ok(p.data.maxSAN === 99, 'maxSAN = 99 - 克苏鲁神话');
  ok(p.data.charBackstory.length > 0 && p.data.charAssets.length > 0, '默认背景/资产模板填充');
  ok(p.data.maxStep === 5, 'maxStep 推进到 5');

  // ---------- 全职业遍历 ----------
  {
    const OCC = require('../../pages/coc7-gen/data/occupations.js').OCCUPATIONS;
    let bad = [];
    for (const occ of OCC) {
      const q = makePage();
      q.data.attrValues = { str: 55, con: 60, dex: 50, app: 45, pow: 65, siz: 55, int: 60, edu: 70, luck: 40 };
      try {
        q.calcSkillPoints(occ);
        if (!(q.data.totalOccPoints > 0)) bad.push(occ.seq + ' ' + occ.name + ': 职业点=0');
        if (!(q.data.totalIntPoints > 0)) bad.push(occ.seq + ' ' + occ.name + ': 兴趣点=0');
        if ((q.data.intPts['信用评级'] || 0) > q.data.totalIntPoints) bad.push(occ.seq + ' ' + occ.name + ': CR 填充超池');
      } catch (e) { bad.push(occ.seq + ' ' + occ.name + ': 异常 ' + e.message); }
    }
    ok(bad.length === 0, '全部 ' + OCC.length + ' 个职业点数计算正常' + (bad.length ? '（' + bad[0] + '）' : ''));
  }

  // ---------- 75% 封顶 / 解除限制 ----------
  {
    const q = makePage();
    q.data.attrValues = { str: 55, con: 60, dex: 50, app: 45, pow: 65, siz: 55, int: 60, edu: 70, luck: 40 };
    q.filterOccs('');
    q.selectOccupation({ currentTarget: { dataset: { index: 0 } } });
    q.openSkillDialog({ currentTarget: { dataset: { name: '会计' } } });
    ok(q.data.dialogOccMax === 70, '非 CR 技能受 75% 封顶（基础 5 → 上限 70）');
    q.openSkillDialog({ currentTarget: { dataset: { name: '信用评级' } } });
    ok(q.data.dialogOccMax >= 0 && q.data.dialogSkill.name === '信用评级', '信用评级可打开 dialog');
    q.toggleOverride();
    ok(q.data.overrideLimits === true, '解除限制开关');
    q.openSkillDialog({ currentTarget: { dataset: { name: '会计' } } });
    ok(q.data.dialogOccMax === 99, '解除限制后上限 99');
  }

  // ---------- 可选建卡法 ----------
  {
    const q = makePage();
    q.data.step = 1;
    q.setAttrRollMode({ currentTarget: { dataset: { mode: 'hero' } } });
    ok(q.data.attrRollMode === 'hero', '切换 4D6 舍最低');
    let legal = true;
    for (let i = 0; i < 100; i++) {
      const r = q._rollAttr('str');
      if (r.value < 15 || r.value > 90) legal = false;
    }
    ok(legal, '4D6 舍最低结果区间合法（15-90）');
    const siz = q._rollAttr('siz');
    ok(siz.value >= 40 && siz.value <= 90, 'SIZ 仍用 2D6+6');
  }
  {
    const q = makePage();
    q.data.step = 1;
    q.openPointBuy();
    ok(q.data.showPointBuy && q.data.pointBuyRemaining === 60, '点数购买打开，剩余 60');
    q.onPointBuyInput({ currentTarget: { dataset: { field: 'str' } }, detail: { value: '70' } });
    ok(q.data.pointBuy.str === 70 && q.data.pointBuyRemaining === 40, '购点输入联动剩余');
    q.data.pointBuy = { str: 60, con: 60, dex: 60, app: 50, pow: 60, siz: 50, int: 60, edu: 60 };
    q.data.pointBuyRemaining = 0;
    q.confirmPointBuy();
    ok(q.data.allRolled && q.data.attrValues.str === 60 && q.data.attrValues.luck > 0, '合法购点应用成功');
    const q2 = makePage();
    q2.openPointBuy();
    q2.data.pointBuy.str = 10;
    q2.confirmPointBuy();
    ok(q2.data.allRolled === false, '40 以下购点被拦截');
  }

  // ---------- 年龄修正 ----------
  {
    const q = makePage();
    H.setFullAttrs(q);
    q.onAgeChange({ detail: { value: String(40 - 15) } });  // 40 岁 → decay 5 点
    ok(q.data.needAgeMod && q.data.ageModDecay === 5, '40 岁触发衰老修正 5 点');
    q.setAgeModChoice({ currentTarget: { dataset: { choice: 'str' } } });
    q.data.ageModType = 'decay';
    q.data.ageModAlloc = { str: 5, con: 0, dex: 0 };
    q.data.ageModRemaining = 0;
    q.confirmAgeMod();
    ok(q.data.ageModDone && q.data.attrValues.str === 50, '年龄修正应用（STR 55→50）');
    // 属性重掷后年龄修正作废（rerollAttr 内部有 200ms 延时，直接验证其调用的失效逻辑）
    q.data.needAgeMod = true;
    q.data.ageModDone = true;
    q._invalidateAgeMod();
    ok(q.data.needAgeMod && q.data.ageModDone === false, '重掷后年龄修正作废');
  }

  // ---------- 草稿 ----------
  {
    const q = makePage();
    q.onLoad();
    q.startNewCharacter(); // 进入 creating 模式
    q.data.step = 2; q.data.maxStep = 2;
    q.data.charInfo.name = '草稿测试'; q.data.charInfo.age = '25'; q.data.charInfo.era = '1920s';
    H.setFullAttrs(q);
    q._saveDraft();
    ok(storage['coc7_draft'] && storage['coc7_draft'].charInfo.name === '草稿测试', '草稿落盘');
    ok(q.data.draftInfo && q.data.draftInfo.stepName === '信息', 'draftInfo 同步');
    const q2 = makePage();
    q2.onLoad();
    q2.continueDraft();
    ok(q2.data.step === 2 && q2.data.charInfo.name === '草稿测试', '草稿恢复');
    ok(typeof q2.data._loadIndex !== 'number', '恢复草稿后 _loadIndex 为空');
    // 编辑已保存角色不生成草稿
    const q3 = makePage();
    q3.data._loadIndex = 0; q3.data.step = 4;
    q3._saveDraft();
    ok(!storage['coc7_draft'] || storage['coc7_draft'].charInfo.name === '草稿测试', '编辑存档时不覆盖草稿');
    q2.clearDraft();
    ok(storage['coc7_draft'] === '' || storage['coc7_draft'] === undefined, '放弃草稿删除存储');
  }

  // ---------- 新建角色不残留旧数据 / 不覆盖旧存档 ----------
  {
    const q = makePage();
    q.onLoad();
    q.data.draftInfo = null;
    q.startNewCharacter();
    ok(q.data.step === 1 && q.data.maxStep === 1, '新建进入第 1 步');
    ok(q.data.charWeapons.length === 0 && q.data.charBackstory === '', '清空旧武器/文本');
    ok(typeof q.data._loadIndex !== 'number', '清空 _loadIndex');
    ok(q.data.needAgeMod === false && q.data.ageModDone === false, '清空年龄修正状态');
    // 有草稿时新建需确认（showModal 桩自动 confirm）
    storage['coc7_draft'] = { step: 3, charInfo: { name: '旧草稿' } };
    const q2 = makePage();
    q2.onLoad();
    q2.startNewCharacter();
    ok(q2.data.step === 1, '有草稿时确认后新建');
  }

  // ---------- 保存/读档往返 + _loadIndex 覆盖防护 ----------
  {
    const q = makePage();
    q.data.step = 5; q.data.isCompleted = false;
    q.data.charInfo = { name: '角色A', player: '', age: '25', gender: '男', era: '1920s' };
    H.setFullAttrs(q);
    q.data.selectedOcc = { seq: 999, name: '调查员', cr_range: '9-30', skill_formula: '教育×4', skills: [] };
    q.data.derived = q.calcDerived();
    q.data.derivedItems = [];
    q.saveCharacter();
    ok(storage['coc7_characters'] && storage['coc7_characters'].length === 1, '保存到列表');
    ok(storage['coc7_draft'] === '' || storage['coc7_draft'] === undefined, '保存后草稿清除');
    ok(q.data.isCompleted === true && q.data.mode === 'editing', '保存后 isCompleted=true 且进入编辑模式');
    // 载入后编辑保存应更新同一条，而不是追加
    const q2 = makePage();
    q2.onLoad();
    q2.loadCharacter({ currentTarget: { dataset: { index: 0 } } });
    ok(q2.data.charInfo.name === '角色A' && q2.data.maxStep === 5, '读档进入完成页');
    q2.data.charInfo.name = '角色A改';
    q2.saveCharacter();
    ok(storage['coc7_characters'].length === 1 && storage['coc7_characters'][0].charInfo.name === '角色A改', '编辑保存覆盖原记录不追加');
  }

  // ---------- 步骤指示器跳转 ----------
  {
    const q = makePage();
    q.data.step = 1; q.data.maxStep = 1;
    q.goToStep({ currentTarget: { dataset: { step: '3' } } });
    ok(q.data.step === 1, '未解锁步骤不可跳');
    q.data.step = 4; q.data.maxStep = 5;
    q.data.selectedOcc = { name: '作家', skills: [], cr_range: '9-30', skill_formula: '教育×4' };
    q.data.attrValues = { str: 55, con: 60, dex: 50, app: 45, pow: 65, siz: 55, int: 60, edu: 70, luck: 40 };
    q.data.charInfo = { name: 'T', age: '25', era: '1920s' };
    q.data.occPts = {}; q.data.intPts = { '信用评级': 20 };
    q.data.usedIntPoints = 20; q.data.totalIntPoints = 120; q.data.totalOccPoints = 280;
    q.goToStep({ currentTarget: { dataset: { step: '5' } } });
    ok(q.data.step === 5 && q.data.derived.hp === 11, '跳完成页经 _refreshSheet 重算衍生值');
  }

  // ---------- 规则速查 ----------
  {
    const q = makePage();
    q.openRules();
    ok(q.data.showRules && q.data.rulesItems.length > 0, '规则速查默认分类');
    q.switchRulesCat({ currentTarget: { dataset: { index: '2' } } });
    ok(q.data.rulesCat === 'damage' && q.data.rulesTable.length > 0, '伤害分类含表格');
    q.closeRules();
    ok(q.data.showRules === false, '关闭规则速查');
  }

  // ---------- 自由技能弹窗分组 ----------
  {
    const q = makePage();
    q.data.attrValues = { str: 55, con: 60, dex: 50, app: 45, pow: 65, siz: 55, int: 60, edu: 70, luck: 40 };
    q.filterOccs('');
    q.selectOccupation({ currentTarget: { dataset: { index: 0 } } });
    q.openFreeSlotDialog({ currentTarget: { dataset: { index: 0 } } });
    const groups = q.data.freeSlotDialogGroups;
    ok(groups.length >= 4, '弹窗按分类分组（' + groups.length + ' 类）');
    const SK = require('../../pages/coc7-gen/data/skills.js');
    const cats = groups.map(g => g.cat);
    ok(JSON.stringify(cats) === JSON.stringify(SK.CAT_ORDER.filter(c => cats.includes(c))), '分类顺序符合 CAT_ORDER');
    const acc = groups.flatMap(g => g.skills).find(s => s.name === '会计');
    ok(acc && acc.isOcc === true, '本职技能带标记');
    q.pickFreeSlotSkill({ currentTarget: { dataset: { name: groups[0].skills[0].name } } });
    ok(q.data.freeOccSlots[0].skill === groups[0].skills[0].name, '选择写入槽位');
    q.openFreeSlotDialog({ currentTarget: { dataset: { index: 1 } } });
    ok(!q.data.freeSlotDialogGroups.some(g => g.skills.some(s => s.name === groups[0].skills[0].name)), '已占用技能排除');
  }

  // ---------- 游玩模式数据流 ----------
  {
    const q = makePage();
    q.data.step = 5; q.data.isCompleted = false;
    q.data.charInfo = { name: 'P', age: '25', era: '1920s' };
    H.setFullAttrs(q);
    q.data.selectedOcc = { name: '调查员', cr_range: '9-30', skills: [] };
    q._refreshSheet();
    ok(q.data.playHP === 11 && q.data.playSAN === 65 && q.data.playMP === 13, '进入前 HP/SAN/MP 就绪');
    q.togglePlayMode();
    ok(q.data.playMode === true && q.data.sanDayStart === 65, '进入游玩模式并设定当日 SAN');
    q.adjustStat({ currentTarget: { dataset: { field: 'hp', delta: '-1' } } });
    ok(q.data.playHP === 10, 'HP -1');
    q.onHPChange({ detail: { value: '9' } });
    ok(q.data.playHP === 9, 'HP 输入生效');
    q.togglePlayMode();
    ok(q.data.playMode === false, '退出游玩模式');
  }

  // ---------- 预置/复制/删除/导入 ----------
  {
    storage['coc7_characters'] = [];
    const q = makePage();
    q.onLoad();
    q.applyPresetCharacter({ currentTarget: { dataset: { index: 0 } } });
    ok(storage['coc7_characters'].length === 1, '预置角色入库');
    ok(q.data.step === 5 && q.data.charInfo.name.length > 0, '预置角色载入完成页');
    q.duplicateCharacter({ currentTarget: { dataset: { index: 0 } } });
    ok(storage['coc7_characters'].length === 2 && storage['coc7_characters'][0].charInfo.name.includes('副本'), '复制角色');
    q.deleteCharacter({ currentTarget: { dataset: { index: 1 } } });
    ok(storage['coc7_characters'].length === 1, '删除角色');
  }

  // ---------- 状态机（mode 单一事实来源） ----------
  {
    const q = makePage();
    q.onLoad();
    ok(q.data.mode === 'home', '初始为 home 模式');
    q.startNewCharacter();
    ok(q.data.mode === 'creating' && q.data.playMode === false && q.data.isCompleted === false, '新建 → creating');
    q._enterStep(0);
    ok(q.data.mode === 'home' && q.data.playMode === false, '回第 0 步 → home');
    // 读档 → editing
    storage['coc7_characters'] = [{ schemaVersion: 2, attrValues: { str: 55, con: 60, dex: 50, app: 45, pow: 65, siz: 55, int: 60, edu: 70, luck: 40 }, charInfo: { name: 'S', age: '25', era: '1920s' }, completed: true }];
    const q2 = makePage();
    q2.onLoad();
    q2.loadCharacter({ currentTarget: { dataset: { index: 0 } } });
    ok(q2.data.mode === 'editing' && q2.data.isCompleted === true && q2.data.playMode === false, '读档 → editing');
    // 游玩往返
    q2.togglePlayMode();
    ok(q2.data.mode === 'playing' && q2.data.playMode === true && q2.data.modeBeforePlay === 'editing', '编辑态进游玩 → playing，记住来源');
    q2.togglePlayMode();
    ok(q2.data.mode === 'editing' && q2.data.playMode === false, '退出游玩 → 恢复 editing');
    // 新建态游玩往返
    const q3 = makePage();
    q3.onLoad();
    q3.startNewCharacter();
    H.setFullAttrs(q3);
    q3.data.charInfo = { name: 'P', age: '25', era: '1920s' };
    q3.data.step = 5; q3.data.selectedOcc = null;
    q3._refreshSheet();
    q3.togglePlayMode();
    ok(q3.data.mode === 'playing' && q3.data.modeBeforePlay === 'creating', '新建态进游玩记住 creating');
    q3.togglePlayMode();
    ok(q3.data.mode === 'creating' && q3.data.playMode === false, '退出游玩 → 恢复 creating');
    // creating 模式才存草稿
    const q4 = makePage();
    q4.onLoad();
    q4.data.step = 2; q4.data.mode = 'editing'; q4.data.isCompleted = true;
    q4._saveDraft();
    ok(storage['coc7_draft'] === '' || storage['coc7_draft'] === undefined, 'editing 模式不生成草稿');
  }

  return suite.done();
};
