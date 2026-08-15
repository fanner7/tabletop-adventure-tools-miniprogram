// pages/coc-keeper/data/npc-templates.js — 静态数据表（由 coc-keeper.js 引入，请勿手改数据）
// 数据拆分说明：本文件由机械脚本从原页面拆分而来，内容与拆分前完全一致。

// ========== NPC 模板库（分类） ==========
// 生成模板数据文本（与导入解析格式兼容：首行名字 + STR/CON/... + HP/MP + 攻击行）
function tplData(name, o) {
  var s = name + '\n';
  s += 'STR ' + o.str + ' CON ' + o.con + ' SIZ ' + o.siz + ' DEX ' + o.dex + ' INT ' + o.int + ' APP ' + o.app + ' POW ' + o.pow + ' EDU ' + o.edu + '\n';
  s += 'HP ' + o.hp + ' MP ' + o.mp + ' 幸运 ' + (o.luck === undefined ? 50 : o.luck) + '\n';
  if (o.extra) s += o.extra + '\n';
  s += '技能：' + o.skills + '\n';
  s += '攻击：' + (o.attack || '——') + '\n';
  if (o.spells) s += '法术：' + o.spells + '\n';
  s += '描述：' + o.desc;
  return s;
}

var NPC_TEMPLATES = [
  // ===== 🏙️ 城市居民 =====
  { id: 'cop', cat: 'urban', icon: '🚓', name: '巡警', dex: 55, hp: 12, mp: 10, desc: '例行巡逻的城市警察',
    data: tplData('巡警', { str: 60, con: 60, siz: 60, dex: 55, int: 60, app: 50, pow: 50, edu: 60, hp: 12, mp: 10, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 50% 手枪 45% 闪避 27% 聆听 40% 侦查 45%', attack: '斗殴 1D3+DB / 手枪 1D10', desc: '例行巡逻的城市警察，随身携带警棍与左轮手枪，遇到怪事时优先呼叫支援。' }) },
  { id: 'detective', cat: 'urban', icon: '🕵️', name: '私家侦探', dex: 60, hp: 11, mp: 10, desc: '见多识广的调查老手',
    data: tplData('私家侦探', { str: 55, con: 55, siz: 55, dex: 60, int: 70, app: 55, pow: 55, edu: 65, hp: 11, mp: 11, luck: 60, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 手枪 55% 闪避 30% 侦查 60% 聆听 50% 心理学 50% 潜行 45%', attack: '斗殴 1D3+DB / 手枪 1D10', desc: '见多识广的调查老手，对线索有着敏锐直觉，口袋里总揣着笔记本。' }) },
  { id: 'thug', cat: 'urban', icon: '🦹', name: '混混', dex: 55, hp: 13, mp: 8, desc: '街头的麻烦制造者',
    data: tplData('混混', { str: 65, con: 70, siz: 65, dex: 55, int: 45, app: 45, pow: 45, edu: 40, hp: 13, mp: 9, luck: 45, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 55% 恐吓 50% 闪避 27% 潜行 40%', attack: '斗殴 1D3+DB / 匕首 55% 1D4+DB', desc: '街头的麻烦制造者，容易受雇办事，也容易在恐惧面前四散奔逃。' }) },
  { id: 'doctor', cat: 'urban', icon: '🏥', name: '医生', dex: 55, hp: 11, mp: 12, desc: '冷静理性的医者',
    data: tplData('医生', { str: 50, con: 55, siz: 55, dex: 55, int: 75, app: 55, pow: 60, edu: 75, hp: 11, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 40% 医学 75% 急救 70% 闪避 27% 侦查 45% 说服 50%', attack: '斗殴 1D3+DB / 手术刀 40% 1D4', desc: '冷静理性的医者，见惯了生死，面对伤者总能保持镇定。' }) },
  { id: 'librarian', cat: 'urban', icon: '📖', name: '图书馆员', dex: 50, hp: 10, mp: 12, desc: '知识殿堂的守护者',
    data: tplData('图书馆员', { str: 45, con: 50, siz: 55, dex: 50, int: 70, app: 55, pow: 55, edu: 70, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 图书馆使用 75% 母语 70% 侦查 45% 历史 55% 神秘学 35%', attack: '斗殴 1D3+DB', desc: '知识殿堂的守护者，熟知馆藏的每一角落，对反常的借阅记录格外敏感。' }) },
  { id: 'banker', cat: 'urban', icon: '🏦', name: '银行职员', dex: 50, hp: 11, mp: 11, desc: '柜台后谨慎刻板的职员',
    data: tplData('银行职员', { str: 50, con: 55, siz: 55, dex: 50, int: 65, app: 55, pow: 55, edu: 70, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 40% 会计 60% 侦查 40% 母语 70%', attack: '斗殴 1D3+DB', desc: '柜台后的银行职员，谨慎而刻板，对每一笔账目都记得清清楚楚。' }) },
  { id: 'cabby', cat: 'urban', icon: '🚕', name: '出租车司机', dex: 60, hp: 12, mp: 11, desc: '熟悉每条街道的老司机',
    data: tplData('出租车司机', { str: 55, con: 60, siz: 60, dex: 60, int: 55, app: 50, pow: 55, edu: 45, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 驾驶 70% 侦查 45% 闪避 30%', attack: '斗殴 1D3+DB', desc: '熟悉城市每条街道的老司机，深夜载客时听到过不少怪事。' }) },
  { id: 'barkeep', cat: 'urban', icon: '🍺', name: '酒吧老板', dex: 50, hp: 13, mp: 12, desc: '消息灵通的地下酒吧老板',
    data: tplData('酒吧老板', { str: 60, con: 65, siz: 65, dex: 50, int: 55, app: 55, pow: 60, edu: 50, hp: 13, mp: 12, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 50% 恐吓 50% 话术 55% 聆听 50%', attack: '斗殴 1D3+DB', desc: '禁酒令下经营地下酒吧的老板，三教九流都认识，消息灵通。' }) },
  { id: 'reporter', cat: 'urban', icon: '📰', name: '记者', dex: 55, hp: 11, mp: 11, desc: '追着线索跑的报社记者',
    data: tplData('记者', { str: 50, con: 55, siz: 55, dex: 55, int: 65, app: 55, pow: 55, edu: 65, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 30% 侦查 60% 聆听 50% 说服 50% 母语 65%', attack: '斗殴 1D3+DB', desc: '追着线索跑的报社记者，为了头条可以冒险。' }) },
  { id: 'undertaker', cat: 'urban', icon: '⚰️', name: '殡仪馆主', dex: 50, hp: 12, mp: 12, desc: '与死亡打交道的人',
    data: tplData('殡仪馆主', { str: 55, con: 60, siz: 60, dex: 50, int: 60, app: 50, pow: 60, edu: 60, hp: 12, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 医学 30% 侦查 45% 神秘学 25%', attack: '斗殴 1D3+DB', desc: '与死亡打交道的殡仪馆主人，见过太多不该见的状态。' }) },
  { id: 'antiquary', cat: 'urban', icon: '🏺', name: '古董商', dex: 50, hp: 10, mp: 11, desc: '眼光毒辣的古董店老板',
    data: tplData('古董商', { str: 45, con: 50, siz: 55, dex: 50, int: 65, app: 55, pow: 55, edu: 65, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 估价 60% 历史 55% 侦查 50%', attack: '斗殴 1D3+DB', desc: '眼光毒辣的古董店老板，店里有些东西不该摆在明面上。' }) },
  { id: 'priest', cat: 'urban', icon: '⛪', name: '神父', dex: 45, hp: 11, mp: 14, desc: '教堂里的神职人员',
    data: tplData('神父', { str: 50, con: 55, siz: 55, dex: 45, int: 65, app: 55, pow: 70, edu: 70, hp: 11, mp: 14, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 心理学 55% 说服 60% 母语 70%', attack: '斗殴 1D3+DB', desc: '教堂里的神职人员，也许知道些不该知道的事。' }) },
  { id: 'nurse', cat: 'urban', icon: '🩺', name: '护士', dex: 55, hp: 11, mp: 12, desc: '医院里忙碌的护士',
    data: tplData('护士', { str: 50, con: 60, siz: 50, dex: 55, int: 65, app: 55, pow: 60, edu: 65, hp: 11, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 急救 70% 医学 50% 聆听 50%', attack: '斗殴 1D3+DB', desc: '医院里忙碌的护士，见过太多奇怪的病症。' }) },
  { id: 'maid', cat: 'urban', icon: '🧹', name: '女仆', dex: 60, hp: 10, mp: 11, desc: '大户人家里的女仆',
    data: tplData('女仆', { str: 45, con: 55, siz: 50, dex: 60, int: 55, app: 55, pow: 55, edu: 45, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 聆听 55% 潜行 50% 侦查 45%', attack: '斗殴 1D3+DB', desc: '大户人家里的女仆，耳朵很灵，知道主人家不少秘密。' }) },
  { id: 'newsboy', cat: 'urban', icon: '👦', name: '报童', dex: 60, hp: 9, mp: 10, desc: '街头叫卖的报童',
    data: tplData('报童', { str: 40, con: 50, siz: 45, dex: 60, int: 55, app: 55, pow: 50, edu: 40, hp: 9, mp: 10, extra: 'DB +0 体格 0 护甲 0', skills: '闪避 40% 聆听 55% 攀爬 50%', attack: '——', desc: '街头叫卖的报童，跑得飞快，城市里的流言他都知道一半。' }) },
  { id: 'dog', cat: 'urban', icon: '🐕', name: '守卫犬', dex: 55, hp: 9, mp: 6, desc: '忠诚而凶猛的看门犬',
    data: tplData('守卫犬', { str: 40, con: 50, siz: 40, dex: 55, int: 40, app: 40, pow: 40, edu: 20, hp: 9, mp: 8, luck: 40, extra: 'DB -1 体格 -1 护甲 0', skills: '侦查 50% 聆听 55% 潜行 40%', attack: '撕咬 30% 1D10', desc: '忠诚而凶猛的看门犬，会在陌生人靠近时发出警告。' }) },
  { id: 'jazzman', cat: 'urban', icon: '🎷', name: '爵士乐手', dex: 65, hp: 11, mp: 12, desc: '夜总会里的爵士乐手',
    data: tplData('爵士乐手', { str: 50, con: 55, siz: 55, dex: 65, int: 55, app: 55, pow: 60, edu: 50, hp: 11, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 演奏 70% 聆听 55% 话术 45%', attack: '斗殴 1D3+DB', desc: '夜总会里的爵士乐手，见证了这座城市最喧闹也最黑暗的夜晚。' }) },

  // ===== 🌾 乡村居民 =====
  { id: 'farmer', cat: 'rural', icon: '🧑‍🌾', name: '农夫', dex: 55, hp: 13, mp: 11, desc: '面朝黄土背朝天的农夫',
    data: tplData('农夫', { str: 65, con: 70, siz: 65, dex: 55, int: 50, app: 50, pow: 55, edu: 45, hp: 13, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 55% 农业 60% 侦查 45%', attack: '干草叉 55% 1D8 / 斗殴 1D3+DB', desc: '面朝黄土背朝天的农夫，庄稼地边发生的事他比谁都清楚。' }) },
  { id: 'gamekeeper', cat: 'rural', icon: '🪓', name: '猎场看守', dex: 60, hp: 12, mp: 11, desc: '熟悉林地的猎场看守',
    data: tplData('猎场看守', { str: 60, con: 65, siz: 60, dex: 60, int: 55, app: 50, pow: 55, edu: 50, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 步枪 60% 追踪 55% 侦查 55%', attack: '猎枪 60% 1D10 / 斗殴 1D3+DB', desc: '熟悉林地每一寸土地的猎场看守，夜里听到过不该有的动静。' }) },
  { id: 'blacksmith', cat: 'rural', icon: '🔨', name: '铁匠', dex: 55, hp: 13, mp: 11, desc: '炉火旁臂力惊人的铁匠',
    data: tplData('铁匠', { str: 70, con: 70, siz: 65, dex: 55, int: 55, app: 50, pow: 55, edu: 45, hp: 13, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 60% 机械维修 50%', attack: '铁锤 60% 1D8+DB / 斗殴 1D3+DB', desc: '炉火旁的铁匠，臂力惊人，脾气和铁砧一样硬。' }) },
  { id: 'fisherman', cat: 'rural', icon: '🐟', name: '渔夫', dex: 55, hp: 12, mp: 11, desc: '靠海为生的渔夫',
    data: tplData('渔夫', { str: 60, con: 65, siz: 60, dex: 55, int: 50, app: 50, pow: 55, edu: 40, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 游泳 60% 捕捞 55% 侦查 45%', attack: '鱼叉 45% 1D8 / 斗殴 1D3+DB', desc: '靠海为生的渔夫，见过海里的怪东西，只是不愿多提。' }) },
  { id: 'forester', cat: 'rural', icon: '🌲', name: '守林人', dex: 55, hp: 12, mp: 11, desc: '独居林中小屋的守林人',
    data: tplData('守林人', { str: 60, con: 65, siz: 60, dex: 55, int: 55, app: 50, pow: 55, edu: 50, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '步枪 55% 追踪 60% 侦查 50%', attack: '猎枪 55% 1D10', desc: '独居林中小屋的守林人，话不多，枪法很准。' }) },
  { id: 'groom', cat: 'rural', icon: '🐎', name: '马夫', dex: 60, hp: 11, mp: 10, desc: '照看马匹的马夫',
    data: tplData('马夫', { str: 55, con: 60, siz: 55, dex: 60, int: 50, app: 50, pow: 50, edu: 40, hp: 11, mp: 10, extra: 'DB +0 体格 0 护甲 0', skills: '动物驯养 60% 斗殴 45%', attack: '鞭子 45% 1D3+DB', desc: '照看马匹的马夫，马厩里的传闻他最清楚。' }) },
  { id: 'innkeeper', cat: 'rural', icon: '🏨', name: '旅店老板', dex: 50, hp: 12, mp: 11, desc: '村里消息的集散地',
    data: tplData('旅店老板', { str: 55, con: 60, siz: 60, dex: 50, int: 55, app: 55, pow: 55, edu: 50, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '话术 55% 聆听 55% 斗殴 45%', attack: '斗殴 1D3+DB', desc: '乡村旅店的老板，村里的消息都从他这儿过。' }) },
  { id: 'schoolteacher', cat: 'rural', icon: '🧑‍🏫', name: '乡村教师', dex: 50, hp: 10, mp: 11, desc: '一人教全校的教师',
    data: tplData('乡村教师', { str: 45, con: 55, siz: 50, dex: 50, int: 65, app: 55, pow: 55, edu: 65, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 30% 母语 65% 历史 50% 心理学 40%', attack: '斗殴 1D3+DB', desc: '一人教全校的乡村教师，是村里最有学问的人。' }) },
  { id: 'vet', cat: 'rural', icon: '🐄', name: '兽医', dex: 55, hp: 11, mp: 11, desc: '给牲口看病的兽医',
    data: tplData('兽医', { str: 50, con: 55, siz: 55, dex: 55, int: 65, app: 50, pow: 55, edu: 65, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 35% 医学 55% 动物驯养 60% 急救 50%', attack: '斗殴 1D3+DB', desc: '给牲口看病的兽医，常被请去处理些说不清的怪事。' }) },
  { id: 'midwife', cat: 'rural', icon: '👵', name: '产婆', dex: 55, hp: 10, mp: 12, desc: '村里接生的产婆',
    data: tplData('产婆', { str: 45, con: 55, siz: 50, dex: 55, int: 60, app: 50, pow: 60, edu: 45, hp: 10, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 30% 急救 65% 医学 45% 聆听 55%', attack: '斗殴 1D3+DB', desc: '村里接生的产婆，懂得不少土方，也听过不少婴儿的怪啼。' }) },
  { id: 'miller', cat: 'rural', icon: '🌾', name: '磨坊主', dex: 50, hp: 12, mp: 10, desc: '守着水磨坊的磨坊主',
    data: tplData('磨坊主', { str: 60, con: 65, siz: 60, dex: 50, int: 50, app: 50, pow: 50, edu: 40, hp: 12, mp: 10, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 50% 机械维修 50%', attack: '斗殴 1D3+DB / 木棍 50% 1D6', desc: '守着水磨坊的磨坊主，磨盘底下压着不少秘密。' }) },

  // ===== 🐟 深海派系（深潜者） =====
  { id: 'deepone', cat: 'deep', icon: '🐸', name: '深潜者', dex: 50, hp: 14, mp: 12, desc: '深海派系·杂兵',
    data: tplData('深潜者 (Deep One)', { str: 70, con: 70, siz: 70, dex: 50, int: 65, app: 60, pow: 60, edu: 40, hp: 14, mp: 12, extra: 'DB +1D4 体格 1 护甲 1（皮肤）', skills: '侦查 45% 潜行 60% 游泳 65%', attack: '爪击 25% 1D6+DB / 撕咬 25% 1D4+DB', desc: '来自深海的可怖人形鱼，能水下呼吸，信仰大衮与海德拉。SAN 损失 0/1D6。' }) },
  { id: 'deeponehalf', cat: 'deep', icon: '🐟', name: '深潜者混血', dex: 55, hp: 11, mp: 11, desc: '深海派系·杂兵',
    data: tplData('深潜者混血 (Deep One Hybrid)', { str: 55, con: 60, siz: 55, dex: 55, int: 60, app: 55, pow: 55, edu: 45, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '潜行 60% 游泳 55% 侦查 40%', attack: '爪击 25% 1D6+DB', desc: '外表似人的混血儿，会逐渐向深潜者转变，混迹于沿海小镇。SAN 损失 0/1D4。' }) },
  { id: 'deeponeelder', cat: 'deep', icon: '🧙', name: '深潜者长老', dex: 45, hp: 16, mp: 14, desc: '深海派系·精英·知晓法术',
    data: tplData('深潜者长老 (Deep One Elder)', { str: 80, con: 80, siz: 80, dex: 45, int: 70, app: 40, pow: 70, edu: 60, hp: 16, mp: 14, extra: 'DB +1D4 体格 1 护甲 2（皮肤）', skills: '潜行 70% 游泳 70% 侦查 50%', attack: '爪击 30% 1D6+DB / 撕咬 30% 1D4+DB', spells: '召唤深潜者（1D4 MP / 1D6 SAN，施法 1 小时，唤来 1D10 只）；束缚深潜者（1D4 MP / 1D6 SAN，施法 1 小时）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '活了数百年的深潜者长老，指挥着整支族群，知晓多种法术。SAN 损失 1/1D10。' }) },

  // ===== 🧟 食尸鬼派系 =====
  { id: 'ghoul', cat: 'ghoul', icon: '🧟', name: '食尸鬼', dex: 70, hp: 13, mp: 10, desc: '食尸鬼派系·杂兵',
    data: tplData('食尸鬼 (Ghoul)', { str: 70, con: 70, siz: 60, dex: 70, int: 55, app: 40, pow: 50, edu: 40, hp: 13, mp: 10, extra: 'DB +1D4 体格 1 护甲 1（毛皮）', skills: '攀爬 80% 潜行 70% 侦查 55%', attack: '爪击 40% 1D6+DB / 撕咬 40% 1D4+DB', desc: '掘墓食尸的异形生物，面孔扭曲，爪牙锋利，在墓穴与地下通道中出没。SAN 损失 0/1D6。' }) },
  { id: 'ghoulhound', cat: 'ghoul', icon: '🐕', name: '食尸鬼猎犬', dex: 65, hp: 11, mp: 9, desc: '食尸鬼派系·杂兵',
    data: tplData('食尸鬼猎犬 (Ghoul Hound)', { str: 55, con: 55, siz: 55, dex: 65, int: 35, app: 30, pow: 45, edu: 20, hp: 11, mp: 9, extra: 'DB +0 体格 0 护甲 1（毛皮）', skills: '潜行 70% 追踪 60%', attack: '撕咬 45% 1D6+DB', desc: '食尸鬼豢养的猎犬，嗅觉敏锐，成群出没于墓园。SAN 损失 0/1D4。' }) },
  { id: 'ghoulelder', cat: 'ghoul', icon: '👑', name: '食尸鬼长老', dex: 65, hp: 14, mp: 12, desc: '食尸鬼派系·精英',
    data: tplData('食尸鬼长老 (Ghoul Elder)', { str: 75, con: 75, siz: 65, dex: 65, int: 65, app: 35, pow: 60, edu: 50, hp: 14, mp: 12, extra: 'DB +1D4 体格 1 护甲 1（毛皮）', skills: '潜行 75% 攀爬 80% 侦查 60%', attack: '爪击 50% 1D8+DB', desc: '年迈而狡诈的食尸鬼首领，统领着地下的族群。SAN 损失 0/1D6。' }) },

  // ===== 🦀 米·戈派系 =====
  { id: 'migo', cat: 'migo', icon: '🦀', name: '米·戈', dex: 70, hp: 12, mp: 12, desc: '米·戈派系·杂兵',
    data: tplData('米·戈 (Mi-Go)', { str: 55, con: 60, siz: 60, dex: 70, int: 75, app: 40, pow: 60, edu: 75, hp: 12, mp: 12, extra: 'DB +0 体格 0 护甲 4（甲壳）', skills: '侦查 60% 潜行 70% 科学 60%', attack: '钳爪 35% 1D6+DB', desc: '来自犹格斯的真菌生物，形似甲壳类，可飞行，拥有远超人类的技术。SAN 损失 0/1D6。' }) },
  { id: 'migosurgeon', cat: 'migo', icon: '🧠', name: '米·戈医师', dex: 70, hp: 12, mp: 14, desc: '米·戈派系·精英·知晓法术',
    data: tplData('米·戈医师 (Mi-Go Surgeon)', { str: 60, con: 65, siz: 60, dex: 70, int: 85, app: 40, pow: 70, edu: 80, hp: 12, mp: 14, extra: 'DB +0 体格 0 护甲 4（甲壳）', skills: '医学 70% 科学 70% 潜行 70%', attack: '钳爪 40% 1D6+DB', spells: '头脑交换术（2+ MP / 1D4 SAN，与目标交换意识）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '精通脑叶切除术的米·戈医师，收藏着人类的大脑标本，知晓法术。SAN 损失 0/1D6。' }) },

  // ===== 🦇 空中派系（拜亚基 / 哈斯塔系） =====
  { id: 'byakhee', cat: 'sky', icon: '🦇', name: '拜亚基', dex: 55, hp: 14, mp: 9, desc: '空中派系·杂兵',
    data: tplData('拜亚基 (Byakhee)', { str: 85, con: 60, siz: 85, dex: 55, int: 45, app: 40, pow: 45, edu: 30, hp: 14, mp: 9, extra: 'DB +1D6 体格 2 护甲 0', skills: '侦查 45% 潜行 40%', attack: '爪击 40% 1D8+DB', desc: '星际间翱翔的恐怖猎手，可被特定咒文召唤，能携带骑手穿越宇宙。SAN 损失 0/1D6。' }) },
  { id: 'nightgaunt', cat: 'sky', icon: '👻', name: '夜魇', dex: 60, hp: 14, mp: 9, desc: '空中派系·杂兵',
    data: tplData('夜魇 (Nightgaunt)', { str: 75, con: 65, siz: 80, dex: 60, int: 40, app: 30, pow: 45, edu: 30, hp: 14, mp: 9, extra: 'DB +1D4 体格 1 护甲 0', skills: '潜行 80% 飞行 60%', attack: '擒抱 40%（窒息 1D6/轮）', desc: '无面无声的黑色生物，喜欢把人抓上高空再丢下。SAN 损失 0/1D6。' }) },
  { id: 'huntinghorror', cat: 'sky', icon: '🐉', name: '恐怖猎手', dex: 55, hp: 16, mp: 11, desc: '空中派系·精英',
    data: tplData('恐怖猎手 (Hunting Horror)', { str: 100, con: 75, siz: 90, dex: 55, int: 40, app: 30, pow: 55, edu: 30, hp: 16, mp: 11, extra: 'DB +1D6 体格 2 护甲 0', skills: '侦查 50% 潜行 60%', attack: '撕咬 50% 1D10+DB', desc: '哈斯塔的信使，长着爪翼的巨大怪物，循着咒文狩猎目标。SAN 损失 1/1D10。' }) },

  // ===== 🐙 克苏鲁系 =====
  { id: 'starspawn', cat: 'cthulhu', icon: '⭐', name: '星之眷族', dex: 55, hp: 14, mp: 13, desc: '克苏鲁系·精英·知晓法术',
    data: tplData('星之眷族 (Star Spawn)', { str: 75, con: 65, siz: 80, dex: 55, int: 60, app: 30, pow: 65, edu: 40, hp: 14, mp: 13, extra: 'DB +1D4 体格 1 护甲 无（免疫普通武器）', skills: '侦查 50% 潜行 40%', attack: '爪击 60% 1D6+DB / 撕咬 60% 1D6+DB', spells: '召唤/束缚克苏鲁（1D10 MP / 1D10 SAN，施法 1 小时以上）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '克苏鲁的仆从，巨大而扭曲，免疫非魔法武器，知晓多种法术。SAN 损失 1/1D10。' }) },
  { id: 'shoggoth', cat: 'cthulhu', icon: '🫧', name: '修格斯', dex: 65, hp: 16, mp: 12, desc: '克苏鲁系·精英',
    data: tplData('修格斯 (Shoggoth)', { str: 85, con: 80, siz: 85, dex: 65, int: 40, app: 20, pow: 60, edu: 20, hp: 16, mp: 12, extra: 'DB +1D6 体格 2 护甲 无（免疫普通武器）', skills: '潜行 70%', attack: '碾压 80% 1D8+DB', desc: '形如巨大黑色变形虫的古老造物，由修格斯奴仆演化而来。SAN 损失 1/1D10。' }) },

  // ===== 🐍 蛇人派系 =====
  { id: 'serpent', cat: 'serpent', icon: '🐍', name: '蛇人', dex: 65, hp: 12, mp: 13, desc: '蛇人派系·杂兵·知晓法术',
    data: tplData('蛇人 (Serpent Person)', { str: 70, con: 65, siz: 60, dex: 65, int: 70, app: 45, pow: 65, edu: 55, hp: 12, mp: 13, extra: 'DB +1D4 体格 1 护甲 1（鳞片）', skills: '潜行 60% 侦查 55%', attack: '匕首 40% 1D4+DB', spells: '人类支配术（1+ MP / 1 SAN，与目标对视并成功检定后，目标服从命令 1 轮/点 MP）', desc: '曾统治地球的爬虫类种族，佩戴蛇形徽记，隐匿于人类社会，知晓 1-2 个法术。SAN 损失 0/1D6。' }) },
  { id: 'serpentsage', cat: 'serpent', icon: '🧙', name: '蛇人学者', dex: 65, hp: 11, mp: 15, desc: '蛇人派系·精英·精通法术',
    data: tplData('蛇人学者 (Serpent Sage)', { str: 65, con: 60, siz: 55, dex: 65, int: 85, app: 45, pow: 75, edu: 80, hp: 11, mp: 15, extra: 'DB +0 体格 0 护甲 1（鳞片）', skills: '神秘学 65% 潜行 60% 心理学 55%', attack: '匕首 40% 1D4+DB', spells: '人类支配术（1+ MP / 1 SAN，目标服从命令 1 轮/点 MP）；记忆编织（5+ MP / 1D4 SAN，改写目标记忆）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '精通古老法术的蛇人学者，知晓深埋地下的远古秘密。SAN 损失 0/1D6。' }) },

  // ===== 🌑 异形生物 =====
  { id: 'hound', cat: 'alien', icon: '🐺', name: '廷达罗斯猎犬', dex: 65, hp: 13, mp: 12, desc: '异形生物·精英',
    data: tplData('廷达罗斯猎犬 (Hound of Tindalos)', { str: 70, con: 80, siz: 55, dex: 65, int: 45, app: 20, pow: 60, edu: 20, hp: 13, mp: 12, extra: 'DB +1D4 体格 1 护甲 无（免疫普通武器）', skills: '追踪 90% 潜行 70%', attack: '撕咬 45% 1D8+DB', desc: '能从几何角度现身的空间猎手，唯有锐角能让它止步。SAN 损失 1/1D10。' }) },
  { id: 'formless', cat: 'alien', icon: '🫠', name: '无形之子', dex: 65, hp: 14, mp: 11, desc: '异形生物·精英',
    data: tplData('无形之子 (Formless Spawn)', { str: 70, con: 75, siz: 65, dex: 65, int: 50, app: 20, pow: 55, edu: 20, hp: 14, mp: 11, extra: 'DB +1D4 体格 1 护甲 无（免疫普通武器）', skills: '潜行 80%', attack: '攫抓 50% 1D6+DB', desc: '无形无质的原生质生物，能穿过任何缝隙，是修格斯的后代。SAN 损失 0/1D6。' }) },
  { id: 'ratthing', cat: 'alien', icon: '🐀', name: '人面鼠', dex: 70, hp: 4, mp: 11, desc: '异形生物·杂兵',
    data: tplData('人面鼠 (Rat-Thing)', { str: 25, con: 25, siz: 20, dex: 70, int: 60, app: 30, pow: 55, edu: 40, hp: 4, mp: 11, extra: 'DB -2 体格 -2 护甲 0', skills: '潜行 75% 侦查 50%', attack: '撕咬 40% 1D4', desc: '长着人脸的怪鼠，成群出没于陋巷与地窖，是黄衣之王的信使。SAN 损失 0/1D4。' }) }
];

// 模板分类
var NPC_TEMPLATE_CATS = [
  { id: 'urban', icon: '🏙️', name: '城市居民' },
  { id: 'rural', icon: '🌾', name: '乡村居民' },
  { id: 'deep', icon: '🐟', name: '深海派系' },
  { id: 'ghoul', icon: '🧟', name: '食尸鬼派系' },
  { id: 'migo', icon: '🦀', name: '米·戈派系' },
  { id: 'sky', icon: '🦇', name: '空中派系' },
  { id: 'cthulhu', icon: '🐙', name: '克苏鲁系' },
  { id: 'serpent', icon: '🐍', name: '蛇人派系' },
  { id: 'alien', icon: '🌑', name: '异形生物' }
];

// 按分类分组
var NPC_TEMPLATES_BY_CAT = {};
NPC_TEMPLATES.forEach(function (t) {
  (NPC_TEMPLATES_BY_CAT[t.cat] = NPC_TEMPLATES_BY_CAT[t.cat] || []).push(t);
});

// 剪贴板导入格式样例（模组传统格式，兼容 PDF 复制 / 拍照识别后整理）
var NPC_SAMPLE_TEXT = '巡警\n' +
  'STR 60 CON 60 SIZ 60 DEX 55 INT 60 APP 50 POW 50 EDU 60\n' +
  'HP 12 MP 10 幸运 50\n' +
  'DB +0 体格 0 护甲 0\n' +
  '技能：斗殴 50% 手枪 45% 闪避 27% 聆听 40% 侦查 45%\n' +
  '攻击：斗殴 1D3+DB / 手枪 1D10\n' +
  '描述：例行巡逻的城市警察。';


module.exports = {
  tplData: tplData,
  NPC_TEMPLATES: NPC_TEMPLATES,
  NPC_TEMPLATE_CATS: NPC_TEMPLATE_CATS,
  NPC_TEMPLATES_BY_CAT: NPC_TEMPLATES_BY_CAT,
  NPC_SAMPLE_TEXT: NPC_SAMPLE_TEXT
};
