// tools/test/keeper-qr.test.js — 守密人二维码（C7K2 格式）编解码回归
// 覆盖：真实卡往返、重编码一致性、CRC/表指纹/版本/格式错误分支、转义、缺字段降级
const H = require('./harness');
const KQ = require('../../utils/keeper-qr.js');

// ---------- 用测试脚手架构建一张真实完整卡 ----------
const W_DATA = require('../../pages/coc7-gen/data/weapons.js').WEAPONS_1920S;

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
  // 表内武器（.38 左轮、小刀类）+ 自定义武器（全字段），覆盖两条编码路径
  const revolver = W_DATA.find(w => w.name === '.38(9mm)左轮手枪');
  const knife = W_DATA.find(w => w.name === '小型刀具(弹簧折叠刀等)');
  p.data.charWeapons = [
    Object.assign({}, revolver, { _id: 1 }),
    Object.assign({}, knife, { _id: 2 }),
    { name: '秘制毒药瓶', skill: '科学', skillId: '格斗①', damage: '1D4', range: '投掷6码',
      impale: '×', attacks: '1', ammo: '一次性', malfunction: '100', rare: false, _id: 3 },
  ];
  return p.buildCharacterData(true);
}

module.exports.run = function () {
  console.log('== keeper-qr 二维码编解码 ==');
  const suite = H.makeSuite('keeper-qr');
  const { ok } = suite;

  const card = buildRealCard();
  const enc = KQ.encodeKeeperQR(card);
  const B = s => Buffer.byteLength(s, 'utf8');
  const QR = require('../../utils/weapp-qrcode.js');

  // ---------- 体积与版本预算 ----------
  ok(B(enc) <= 322, '载荷 ≤ v16-Q 容量 322B（实测 ' + B(enc) + 'B，Q 级即可容纳）');
  {
    const q = new QR.QRCode(-1, QR.QRErrorCorrectLevel.Q);
    q.addData(QR.utf16to8(enc));
    q.make();
    ok(q.getModuleCount() <= 81, 'Q 级二维码 ≤ v16（81 模块，实测 v' + ((q.getModuleCount() - 17) / 4) + '）');
  }

  // ---------- 往返 ----------
  const r = KQ.decodeKeeperQR(enc);
  ok(!r.error, '解码无错误' + (r.error ? '（' + r.error + '）' : ''));
  if (r.error) return suite.done();
  const pl = r.player;

  ok(pl.charInfo.name === '哈维·怀特' && pl.charInfo.player === '小明', '姓名/玩家名往返');
  ok(pl.selectedOcc && pl.selectedOcc.name === '律师' && pl.charInfo.era === '1920s', '职业/时代往返');
  ok(pl.attrValues.str === 60 && pl.attrValues.luck === 50, '九属性往返');
  ok(pl.derived.hp === 12 && pl.derived.san === 80 && pl.derived.mp === 16 && pl.derived.mov === 8, '衍生值往返');
  ok(pl.attrDisplay.length === 9 && pl.attrDisplay[0].label === '力量 STR' && pl.attrDisplay[0].value === 60, 'attrDisplay 重建');
  ok(pl.derivedItems.length === 6 && pl.derivedItems[0].l === '生命 HP', 'derivedItems 重建');
  const skillCount = pl.sortedSkillsByCat.reduce((n, g) => n + g.skills.length, 0);
  ok(skillCount >= 50, '技能全量保留（' + skillCount + ' 项）');
  ok(pl.sortedSkillsByCat.length === 6, '六分类分组（' + pl.sortedSkillsByCat.map(g => g.catName).join(' ') + '）');
  const acc = pl.sortedSkillsByCat.flatMap(g => g.skills).find(s => s.name === '会计');
  ok(acc && acc.total === 45, '会计 45%（基础5+职业40）');
  const dodge = pl.sortedSkillsByCat.flatMap(g => g.skills).find(s => s.name === '闪避');
  ok(dodge && dodge.total === 50, '闪避 50%（DEX/2=35+兴趣15）');

  // ---------- 基础值技能解码端反推（未投入点数，载荷不携带） ----------
  const allS = pl.sortedSkillsByCat.flatMap(g => g.skills);
  const anthro = allS.find(s => s.name === '人类学');
  ok(anthro && anthro.total === 1, '基础值技能反推：人类学 1%（未投入）');
  const mother = allS.find(s => s.name === '母语');
  ok(mother && mother.total === 85, '母语 = EDU 85（未投入反推）');
  const credit = allS.find(s => s.name === '信用评级');
  ok(credit && credit.total === 55, '投入技能保留：信用评级 55%（基础0）');
  ok(JSON.stringify(pl.skillSpecs) === JSON.stringify({ '格斗①': '斗殴', '射击①': '手枪', '技艺①': '写作', '外语①': '拉丁语' }), 'skillSpecs 重建');

  const slotSkills = allS.filter(s => s.displayName !== s.name);
  ok(slotSkills.length === 4, '专攻槽位技能 4 项');
  ok(slotSkills.some(s => s.displayName === '格斗①（斗殴）' && s.total === 25), 'options 型专攻全角括号重建（未投入也保留）');
  ok(slotSkills.some(s => s.displayName === '外语①（拉丁语）' && s.total === 1), 'text 型专攻内联重建');

  // ---------- 武器：表内索引化 + 自定义内联 ----------
  ok(pl.charWeapons.length === 3, '武器 3 件往返（2 表内 + 1 自定义）');
  const revolver = W_DATA.find(w => w.name === '.38(9mm)左轮手枪');
  const revIdx = W_DATA.indexOf(revolver);
  ok(enc.indexOf('w' + revIdx) >= 0, '表内武器编码为索引 w' + revIdx);
  const w1 = pl.charWeapons[0];
  ok(w1.name === revolver.name && w1.skill === revolver.skill && w1.damage === revolver.damage, '表内武器：名称/技能/伤害查表还原');
  ok(w1.range === revolver.range && w1.impale === revolver.impale && w1.attacks === revolver.attacks, '表内武器：射程/贯穿/次数查表还原');
  ok(w1.ammo === revolver.ammo && w1.malfunction === revolver.malfunction, '表内武器：弹药/故障查表还原');
  ok(!!w1._id, '武器带 _id（WXML wx:key 需要）');
  const w3 = pl.charWeapons[2];
  ok(w3.name === '秘制毒药瓶' && w3.skill === '科学' && w3.damage === '1D4', '自定义武器：名称/技能/伤害内联往返');
  ok(w3.range === '投掷6码' && w3.impale === '×' && w3.attacks === '1' && w3.ammo === '一次性' && w3.malfunction === '100', '自定义武器：全字段内联往返');

  // ---------- 重编码一致性（decode→encode 幂等） ----------
  ok(KQ.encodeKeeperQR(pl) === enc, '解码产物重编码与原始载荷一致');

  // ---------- 错误分支 ----------
  ok(KQ.decodeKeeperQR('').error === 'FORMAT', '空串 → FORMAT');
  ok(KQ.decodeKeeperQR('hello world').error === 'FORMAT', '乱文本 → FORMAT');
  ok(KQ.decodeKeeperQR(enc.slice(0, 20) + 'X' + enc.slice(21)).error === 'CRC', '载荷被篡改 → CRC');
  ok(KQ.decodeKeeperQR(enc.slice(0, -4) + '0000').error === 'CRC', '坏 CRC → CRC');

  // 表指纹不匹配：替换 fp 段并重算 CRC → TABLE
  const seg = enc.split('|');
  const fakeBody = ['C7K2', '0000'].concat(seg.slice(2)).join('|');
  const fakeEnc = fakeBody + '*' + KQ.crc16(fakeBody);
  ok(KQ.decodeKeeperQR(fakeEnc).error === 'TABLE', '技能表指纹不匹配 → TABLE');

  // 版本不匹配：C7K3 并重算 CRC → VERSION
  const v3Body = ('C7K3' + enc.slice(4)).split('*')[0];
  const v3Enc = v3Body + '*' + KQ.crc16(v3Body);
  ok(KQ.decodeKeeperQR(v3Enc).error === 'VERSION', '未知版本 → VERSION');

  // ---------- 转义 ----------
  const weird = JSON.parse(JSON.stringify(card));
  weird.charInfo.name = '张|三;李=四.五';
  const wEnc = KQ.encodeKeeperQR(weird);
  const wDec = KQ.decodeKeeperQR(wEnc);
  ok(!wDec.error && wDec.player.charInfo.name === '张_三_李_四_五', '保留字符转义为 _（' + wDec.player.charInfo.name + '）');

  // ---------- 缺字段降级（无职业/无武器/无名） ----------
  const minimal = JSON.parse(JSON.stringify(card));
  minimal.selectedOcc = null;
  minimal.charWeapons = [];
  minimal.charInfo.name = '';
  const mEnc = KQ.encodeKeeperQR(minimal);
  const mDec = KQ.decodeKeeperQR(mEnc);
  ok(!mDec.error && mDec.player.selectedOcc === undefined, '缺职业 → 降级不报错');
  ok(!mDec.error && mDec.player.charWeapons.length === 0, '缺武器 → 空列表');
  ok(!mDec.error && mDec.player.charInfo.name === '', '缺姓名 → 空串（守密人端显示未命名）');

  // ---------- 分号武器转义 ----------
  const w2 = JSON.parse(JSON.stringify(card));
  w2.charWeapons = [{ name: '破片;手雷', damage: '2d6' }];
  const w2Enc = KQ.encodeKeeperQR(w2);
  const w2Dec = KQ.decodeKeeperQR(w2Enc);
  ok(!w2Dec.error && w2Dec.player.charWeapons[0].name === '破片_手雷', '武器名分号转义');

  return suite.done();
};
