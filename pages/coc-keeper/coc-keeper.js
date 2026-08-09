// pages/coc-keeper/coc-keeper.js — COC 守密人助手
const STORAGE_KEY = 'coc_keeper_tasks';

// ========== 疯狂发作 — 表6: 即时症状 ==========
var IMMEDIATE_SYMPTOMS = {
  1:{name:'失忆',desc:'调查员对自己上一次抵达安全的场所后发生的事一无所知。在其看来上一刻他还在吃着早餐，而下一刻就已经身处怪物面前。',duration:{dice:'1D10',unit:'轮'}},
  2:{name:'假性残疾',desc:'调查员陷入因心理作用引起的失明、耳聋或肢体失能中。',duration:{dice:'1D10',unit:'轮'}},
  3:{name:'暴力倾向',desc:'调查员沉浸于狂怒，开始对四周的一切施加失控的暴力与破坏行为，无论敌友。',duration:{dice:'1D10',unit:'轮'}},
  4:{name:'偏执妄想',desc:'调查员陷入严重的偏执妄想之中。所有人都正在与他为敌！没人值得信任！他正在被窥视着，有人背叛了他，他所看见的皆是虚伪的幻象。',duration:{dice:'1D10',unit:'轮'}},
  5:{name:'人际依赖',desc:'浏览调查员背景故事的"重要之人"条目。调查员会将当前场景中的另一人误当做他的重要之人。调查员将依照他与重要之人之间关系的性质行事。',duration:{dice:'1D10',unit:'轮'}},
  6:{name:'昏厥',desc:'调查员会立即昏倒，并在1D10轮后苏醒。',duration:{dice:'1D10',unit:'轮',note:'后苏醒'}},
  7:{name:'惊慌逃窜',desc:'调查员会无法自制地用一切可能的方法远远逃开，即使这意味着他需要开走唯一的一辆车并抛下其他所有人。',duration:{dice:'1D10',unit:'轮'}},
  8:{name:'歇斯底里',desc:'调查员情不自禁地开始狂笑、哭泣、尖叫，等等。',duration:{dice:'1D10',unit:'轮'}},
  9:{name:'恐惧症',desc:'调查员患上一项新的恐惧症。即使引发这些恐惧症的源头并不在身边，调查员仍会在持续时间内想象那些东西正在那里。',needsPhobia:true,duration:{dice:'1D10',unit:'轮'}},
  10:{name:'躁狂症',desc:'调查员患上一项新的躁狂症。调查员会在接下来的持续时间内沉浸在他新的躁狂症中。',needsMania:true,duration:{dice:'1D10',unit:'轮'}}
};

// ========== 表7: 总结症状 ==========
var SUMMARY_SYMPTOMS = {
  1:{name:'失忆',desc:'调查员恢复神志时身处陌生地点，连自己是谁都不记得。记忆会随时间流逝逐渐恢复。',duration:null},
  2:{name:'被劫',desc:'调查员恢复神志时，财物已遭人打劫，但没有受到人身伤害。如果其携带着宝贵之物（参考调查员背景故事），进行一次幸运检定决定它是否被盗。其他所有值钱的物品都会自动丢失。',duration:{dice:'1D10',unit:'小时',note:'后恢复神志'}},
  3:{name:'遍体鳞伤',desc:'调查员恢复神志时，遍体鳞伤，浑身淤青。生命值降低至疯狂前的一半，但这不会造成重伤。调查员的财物没有被劫走。这些伤害如何造成由守秘人决定。',duration:{dice:'1D10',unit:'小时',note:'后恢复神志'}},
  4:{name:'暴力',desc:'调查员的情绪在暴力和破坏的冲动中爆发。调查员恢复神志时可能记得自己做过的事，也可能不记得。调查员对谁、对什么东西施以暴力，是杀死还是仅仅造成伤害，这些都由守秘人决定。',duration:null},
  5:{name:'思想与信念',desc:'浏览调查员背景故事的"思想与信念"条目。调查员选择其中一项，将它以极端、疯魔、形之于色的方式展现出来。例如，信仰宗教的人后来可能在地铁上大声宣讲福音。',duration:null},
  6:{name:'重要之人',desc:'浏览调查员背景故事的"重要之人"条目，及其重要的原因。在略过的时间中，调查员会尽一切努力接近重要之人，并以某种行动展现他们之间的关系。',duration:{dice:'1D10',unit:'小时',note:'或更久'}},
  7:{name:'被收容',desc:'调查员恢复神志时身处精神病房或者警局拘留室当中。调查员会逐渐回想起他们身处此地的原因。',duration:null},
  8:{name:'惊慌逃窜',desc:'调查员恢复神志时已经身处很远的地方，可能在荒野中迷失了方向，或是正坐在火车或长途巴士上。',duration:null},
  9:{name:'恐惧症',desc:'调查员患上一项新的恐惧症。调查员恢复神志后，会采取一切预防措施逃避新患上的恐惧症。',needsPhobia:true,duration:{dice:'1D10',unit:'小时',note:'后恢复神志'}},
  10:{name:'躁狂症',desc:'调查员患上一项新的躁狂症。在疯狂发作期间，调查员完全沉溺于新的躁狂症状当中。症状对其他人是否明显由守秘人和玩家决定。',needsMania:true,duration:{dice:'1D10',unit:'小时',note:'后恢复神志'}}
};

// ========== 表9: 范例恐惧症 (1D100) ==========
var PHOBIAS = [
  {name:'沐浴恐惧症',desc:'害怕洗漱和洗澡'},{name:'恐高症',desc:'害怕高处'},{name:'高空恐惧症',desc:'害怕飞行'},
  {name:'广场恐惧症',desc:'害怕开放、人多的公共场所'},{name:'恐鸡症',desc:'害怕鸡'},{name:'恐蒜症',desc:'害怕大蒜'},
  {name:'乘车恐惧症',desc:'害怕进入车辆或乘车出行'},{name:'恐风症',desc:'害怕风'},{name:'恐男症',desc:'害怕男人'},
  {name:'恐英症',desc:'害怕英国、英国文化等'},{name:'恐花症',desc:'害怕花'},{name:'截肢恐惧症',desc:'害怕截过肢的人'},
  {name:'蜘蛛恐惧症',desc:'害怕蜘蛛'},{name:'闪电恐惧症',desc:'害怕闪电'},{name:'遗迹恐惧症',desc:'害怕遗迹和遗址'},
  {name:'长笛恐惧症',desc:'害怕长笛'},{name:'细菌恐惧症',desc:'害怕细菌'},{name:'飞弹恐惧症',desc:'害怕子弹和炮弹'},
  {name:'步行恐惧症',desc:'害怕摔倒'},{name:'书籍恐惧症',desc:'害怕书'},{name:'植物恐惧症',desc:'害怕植物'},
  {name:'美女恐惧症',desc:'害怕美女'},{name:'寒冷恐惧症',desc:'害怕寒冷'},{name:'钟表恐惧症',desc:'害怕钟表'},
  {name:'幽闭恐惧症',desc:'害怕封闭空间'},{name:'小丑恐惧症',desc:'害怕小丑'},{name:'恐犬症',desc:'害怕犬类'},
  {name:'恶魔恐惧症',desc:'害怕鬼魂和恶魔'},{name:'人群恐惧症',desc:'害怕人群'},{name:'牙医恐惧症',desc:'害怕牙医'},
  {name:'弃物恐惧症',desc:'害怕扔掉东西（囤积狂）'},{name:'毛皮恐惧症',desc:'害怕毛皮'},{name:'过街恐惧症',desc:'害怕过马路'},
  {name:'教堂恐惧症',desc:'害怕教堂'},{name:'窥镜恐惧症',desc:'害怕镜子'},{name:'尖端恐惧症',desc:'害怕针尖和钉尖'},
  {name:'昆虫恐惧症',desc:'害怕昆虫'},{name:'恐猫症',desc:'害怕猫类'},{name:'过桥恐惧症',desc:'害怕过桥'},
  {name:'恐老症',desc:'害怕老人、害怕衰老'},{name:'恐女症',desc:'害怕女人'},{name:'恐血症',desc:'害怕血液'},
  {name:'犯罪恐惧症',desc:'害怕犯下罪过'},{name:'触摸恐惧症',desc:'害怕触摸'},{name:'爬虫恐惧症',desc:'害怕爬行动物'},
  {name:'恐雾症',desc:'害怕雾气'},{name:'枪械恐惧症',desc:'害怕枪械'},{name:'恐水症',desc:'害怕水'},
  {name:'睡眠恐惧症',desc:'害怕睡眠或被催眠'},{name:'恐医症',desc:'害怕医生'},{name:'恐鱼症',desc:'害怕鱼'},
  {name:'雷电恐惧症',desc:'害怕打雷'},{name:'冰寒恐惧症',desc:'害怕寒冷的事物'},{name:'蔬菜恐惧症',desc:'害怕蔬菜'},
  {name:'噪音恐惧症',desc:'害怕噪音'},{name:'湖泊恐惧症',desc:'害怕湖泊'},{name:'机械恐惧症',desc:'害怕机器和机械设备'},
  {name:'蟑螂恐惧症',desc:'害怕蟑螂'},{name:'巨物恐惧症',desc:'害怕巨大的东西'},{name:'束缚恐惧症',desc:'害怕被束缚、捆绑'},
  {name:'陨石恐惧症',desc:'害怕流星、陨石'},{name:'孤独恐惧症',desc:'害怕独处'},{name:'不洁恐惧症',desc:'害怕尘土和污染'},
  {name:'黏液恐惧症',desc:'害怕黏液'},{name:'死亡恐惧症',desc:'害怕尸体'},{name:'八恐惧症',desc:'害怕数字八'},
  {name:'牙齿恐惧症',desc:'害怕牙齿'},{name:'恐梦症',desc:'害怕做梦'},{name:'称名恐惧症',desc:'害怕听到某个字或词'},
  {name:'恐蛇症',desc:'害怕蛇类'},{name:'恐鸟症',desc:'害怕鸟类'},{name:'寄生虫恐惧症',desc:'害怕寄生虫'},
  {name:'人偶恐惧症',desc:'害怕人偶'},{name:'吞咽恐惧症',desc:'害怕吞咽、进食和被吃'},{name:'药物恐惧症',desc:'害怕药物'},
  {name:'鬼魂恐惧症',desc:'害怕鬼魂'},{name:'日光恐惧症',desc:'害怕日光'},{name:'胡须恐惧症',desc:'害怕胡须'},
  {name:'河流恐惧症',desc:'害怕河流'},{name:'酒精恐惧症',desc:'害怕酒和含酒精的饮料'},{name:'恐火症',desc:'害怕火'},
  {name:'魔术恐惧症',desc:'害怕魔术'},{name:'暗影恐惧症',desc:'害怕黑暗或夜晚'},{name:'恐月症',desc:'害怕月亮'},
  {name:'铁路恐惧症',desc:'害怕坐火车旅行'},{name:'恐星症',desc:'害怕星星'},{name:'狭室恐惧症',desc:'害怕狭小的事物和地点'},
  {name:'对称恐惧症',desc:'害怕对称'},{name:'活埋恐惧症',desc:'害怕被活埋、害怕墓地'},{name:'恐牛症',desc:'害怕牛'},
  {name:'电话恐惧症',desc:'害怕电话'},{name:'畸形恐惧症',desc:'害怕怪物'},{name:'海洋恐惧症',desc:'害怕海洋'},
  {name:'手术恐惧症',desc:'害怕外科手术'},{name:'十三恐惧症',desc:'害怕数字13'},{name:'衣物恐惧症',desc:'害怕衣服'},
  {name:'女巫恐惧症',desc:'害怕女巫和巫术'},{name:'恐黄症',desc:'害怕黄颜色和"黄"字'},{name:'外语恐惧症',desc:'害怕外国语'},
  {name:'排外症',desc:'害怕陌生人或外国人'}
];

// ========== 表10: 范例躁狂症 (1D100) ==========
var MANIAS = [
  {name:'沐浴狂',desc:'强迫性地清洁身体'},{name:'意志缺失狂',desc:'病态的优柔寡断'},{name:'黑暗狂',desc:'过度喜爱黑暗'},
  {name:'登高狂',desc:'强迫性地登高'},{name:'亲切狂',desc:'病态的友好行为'},{name:'旷野狂',desc:'强烈渴望进入开放空间'},
  {name:'尖端狂',desc:'痴迷于尖锐锋利的物体'},{name:'嗜猫狂',desc:'反常地热爱猫类'},{name:'疼痛狂',desc:'痴迷于疼痛'},
  {name:'大蒜狂',desc:'痴迷大蒜'},{name:'乘车狂',desc:'痴迷乘车'},{name:'欣喜狂',desc:'非理性的愉悦'},
  {name:'花卉狂',desc:'痴迷花卉'},{name:'计数狂',desc:'强迫性的专心计数'},{name:'消费狂',desc:'冲动或鲁莽地消费'},
  {name:'孤独狂',desc:'过度喜爱独处'},{name:'芭蕾狂',desc:'反常地热爱芭蕾舞'},{name:'盗书狂',desc:'强迫性地偷书'},
  {name:'藏书狂',desc:'痴迷于书籍和读书'},{name:'磨牙狂',desc:'强迫性的磨牙'},{name:'鬼附身妄想狂',desc:'病态地相信自己被恶鬼缠身'},
  {name:'美貌妄想狂',desc:'痴迷于自己的美貌'},{name:'地图狂',desc:'不可控制强迫性地到处看地图'},{name:'蹦极狂',desc:'痴迷于从高处往下跳'},
  {name:'寒冷狂',desc:'对寒冷或寒冷物体的异常渴望'},{name:'舞蹈狂',desc:'无法控制地疯狂热衷跳舞'},{name:'卧床狂',desc:'过度想要呆在床上'},
  {name:'墓地狂',desc:'痴迷于墓地'},{name:'色彩狂',desc:'痴迷于某种颜色'},{name:'小丑狂',desc:'痴迷于小丑'},
  {name:'反抗狂',desc:'强迫性地体验令人恐惧的情境'},{name:'杀戮狂',desc:'痴迷于杀戮'},{name:'恶魔妄想狂',desc:'病态地相信自己被恶魔缠身'},
  {name:'撕皮狂',desc:'强迫性地撕自己的皮肤'},{name:'正义狂',desc:'痴迷伸张正义'},{name:'嗜酒狂',desc:'反常地渴望饮酒'},
  {name:'毛皮狂',desc:'痴迷于收藏毛皮'},{name:'送礼狂',desc:'痴迷于赠送礼物'},{name:'逃脱狂',desc:'强迫性地逃脱'},
  {name:'流浪狂',desc:'痴迷于流浪'},{name:'自大狂',desc:'非理性的自我中心态度或者自我崇拜'},{name:'升官狂',desc:'渴望担任公职，不知满足'},
  {name:'自罪妄想狂',desc:'病态地相信自己有罪过'},{name:'学识狂',desc:'痴迷掌握知识'},{name:'寂静狂',desc:'强迫性地保持安静'},
  {name:'乙醚成瘾狂',desc:'渴望乙醚'},{name:'求偶狂',desc:'痴迷于提出奇怪的求婚'},{name:'狂笑狂',desc:'无法控制强迫性地大笑'},
  {name:'巫术狂',desc:'痴迷于女巫和巫术'},{name:'书写狂',desc:'痴迷于写下每一件事'},{name:'裸露狂',desc:'强迫性地裸体'},
  {name:'欣快狂',desc:'反常地倾向于产生愉快的幻觉（而非认清现实）'},{name:'蠕虫狂',desc:'过度喜爱蠕虫'},{name:'枪械狂',desc:'痴迷枪械'},
  {name:'嗜水狂',desc:'非理性地渴求水分'},{name:'嗜鱼狂',desc:'痴迷鱼类'},{name:'画像狂',desc:'痴迷画像和肖像'},
  {name:'偶像狂',desc:'痴迷或忠于偶像'},{name:'情报狂',desc:'过度热爱收集信息'},{name:'呐喊狂',desc:'非理性强迫性地大叫'},
  {name:'偷窃狂',desc:'非理性强迫性地盗窃'},{name:'噪音狂',desc:'无法控制强迫性地发出巨大尖厉的噪音'},{name:'嗜绳狂',desc:'痴迷于线绳和琴弦'},
  {name:'博彩狂',desc:'极度渴望参与博彩'},{name:'悲伤狂',desc:'异常的忧郁倾向'},{name:'巨石狂',desc:'周围有巨石圈或矗立的巨石时，异常倾向于产生怪异想法'},
  {name:'音乐狂',desc:'痴迷于音乐或者某种曲调'},{name:'赋诗狂',desc:'无法满足的诗歌创作欲'},{name:'憎恶狂',desc:'憎恶一切事物，痴迷于憎恶某个问题或某群人'},
  {name:'单一偏执狂',desc:'反常地痴迷于一个想法或念头'},{name:'虚言狂',desc:'不正常地说谎或夸大其辞'},{name:'疑病妄想狂',desc:'妄想自己得了想象中的病'},
  {name:'记录狂',desc:'强迫性地记录每件事（如摄影）'},{name:'嗜名狂',desc:'痴迷于名称（人名、地名、事物名）'},{name:'称名狂',desc:'无法抗拒渴望重复某些字词'},
  {name:'剔甲狂',desc:'强迫性地抠指甲'},{name:'偏食狂',desc:'反常地喜欢一种食物'},{name:'牢骚狂',desc:'发牢骚时会得到非正常的愉悦'},
  {name:'面具狂',desc:'强迫性地佩戴面具'},{name:'嗜鬼狂',desc:'痴迷于鬼魂'},{name:'杀人狂',desc:'病态的杀人倾向'},
  {name:'嗜光狂',desc:'病态地渴求照明'},{name:'漂泊狂',desc:'反常地想要违背社会准则'},{name:'豪富狂',desc:'痴迷渴望财富'},
  {name:'谎语狂',desc:'非理性强迫性的撒谎'},{name:'纵火狂',desc:'强迫性地点火'},{name:'提问狂',desc:'强迫性的提问冲动'},
  {name:'抠鼻狂',desc:'强迫性地抠鼻孔'},{name:'涂鸦狂',desc:'痴迷于涂鸦、乱写乱画'},{name:'铁路狂',desc:'对火车和铁路旅行的强烈入迷'},
  {name:'大智妄想狂',desc:'妄想自己智慧超凡'},{name:'技术狂',desc:'痴迷于新技术'},{name:'死亡妄想狂',desc:'妄信自己被死亡魔法诅咒了'},
  {name:'神格妄想狂',desc:'妄信自己是神'},{name:'搔痒狂',desc:'强迫性地给自己搔痒'},{name:'手术狂',desc:'非理性地喜爱进行外科手术'},
  {name:'拔毛狂',desc:'渴望拔掉自己的毛发'},{name:'盲目狂',desc:'精神性失明'},{name:'亲外狂',desc:'痴迷于外国、外界的事物'},
  {name:'动物狂',desc:'疯狂地喜爱动物'}
];

// ========== 掷骰工具 ==========
function rollD10() { return Math.floor(Math.random() * 10) + 1; }
function rollD100() { return Math.floor(Math.random() * 100) + 1; }

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
    data: tplData('混混', { str: 65, con: 70, siz: 65, dex: 55, int: 45, app: 45, pow: 45, edu: 40, hp: 13, mp: 9, luck: 45, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 55% 恐吓 50% 闪避 27% 潜行 40%', attack: '斗殴 1D3+DB / 匕首 1D4+DB', desc: '街头的麻烦制造者，容易受雇办事，也容易在恐惧面前四散奔逃。' }) },
  { id: 'doctor', cat: 'urban', icon: '🏥', name: '医生', dex: 55, hp: 11, mp: 12, desc: '冷静理性的医者',
    data: tplData('医生', { str: 50, con: 55, siz: 55, dex: 55, int: 75, app: 55, pow: 60, edu: 75, hp: 11, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '医学 75% 急救 70% 闪避 27% 侦查 45% 说服 50%', attack: '斗殴 1D3+DB / 手术刀 1D4', desc: '冷静理性的医者，见惯了生死，面对伤者总能保持镇定。' }) },
  { id: 'librarian', cat: 'urban', icon: '📖', name: '图书馆员', dex: 50, hp: 10, mp: 12, desc: '知识殿堂的守护者',
    data: tplData('图书馆员', { str: 45, con: 50, siz: 55, dex: 50, int: 70, app: 55, pow: 55, edu: 70, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '图书馆使用 75% 母语 70% 侦查 45% 历史 55% 神秘学 35%', attack: '斗殴 1D3+DB', desc: '知识殿堂的守护者，熟知馆藏的每一角落，对反常的借阅记录格外敏感。' }) },
  { id: 'banker', cat: 'urban', icon: '🏦', name: '银行职员', dex: 50, hp: 11, mp: 11, desc: '柜台后谨慎刻板的职员',
    data: tplData('银行职员', { str: 50, con: 55, siz: 55, dex: 50, int: 65, app: 55, pow: 55, edu: 70, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 40% 会计 60% 侦查 40% 母语 65%', attack: '斗殴 1D3+DB', desc: '柜台后的银行职员，谨慎而刻板，对每一笔账目都记得清清楚楚。' }) },
  { id: 'cabby', cat: 'urban', icon: '🚕', name: '出租车司机', dex: 60, hp: 12, mp: 11, desc: '熟悉每条街道的老司机',
    data: tplData('出租车司机', { str: 55, con: 60, siz: 60, dex: 60, int: 55, app: 50, pow: 55, edu: 45, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 驾驶 70% 侦查 45% 闪避 30%', attack: '斗殴 1D3+DB', desc: '熟悉城市每条街道的老司机，深夜载客时听到过不少怪事。' }) },
  { id: 'barkeep', cat: 'urban', icon: '🍺', name: '酒吧老板', dex: 50, hp: 13, mp: 12, desc: '消息灵通的地下酒吧老板',
    data: tplData('酒吧老板', { str: 60, con: 65, siz: 65, dex: 50, int: 55, app: 55, pow: 60, edu: 50, hp: 13, mp: 12, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 50% 恐吓 50% 话术 55% 聆听 50%', attack: '斗殴 1D3+DB', desc: '禁酒令下经营地下酒吧的老板，三教九流都认识，消息灵通。' }) },
  { id: 'reporter', cat: 'urban', icon: '📰', name: '记者', dex: 55, hp: 11, mp: 11, desc: '追着线索跑的报社记者',
    data: tplData('记者', { str: 50, con: 55, siz: 55, dex: 55, int: 65, app: 55, pow: 55, edu: 65, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '侦查 60% 聆听 50% 说服 50% 母语 60%', attack: '斗殴 1D3+DB', desc: '追着线索跑的报社记者，为了头条可以冒险。' }) },
  { id: 'undertaker', cat: 'urban', icon: '⚰️', name: '殡仪馆主', dex: 50, hp: 12, mp: 12, desc: '与死亡打交道的人',
    data: tplData('殡仪馆主', { str: 55, con: 60, siz: 60, dex: 50, int: 60, app: 50, pow: 60, edu: 60, hp: 12, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '斗殴 45% 医学 30% 侦查 45% 神秘学 25%', attack: '斗殴 1D3+DB', desc: '与死亡打交道的殡仪馆主人，见过太多不该见的状态。' }) },
  { id: 'antiquary', cat: 'urban', icon: '🏺', name: '古董商', dex: 50, hp: 10, mp: 11, desc: '眼光毒辣的古董店老板',
    data: tplData('古董商', { str: 45, con: 50, siz: 55, dex: 50, int: 65, app: 55, pow: 55, edu: 65, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '估价 60% 历史 55% 侦查 50%', attack: '斗殴 1D3+DB', desc: '眼光毒辣的古董店老板，店里有些东西不该摆在明面上。' }) },
  { id: 'priest', cat: 'urban', icon: '⛪', name: '神父', dex: 45, hp: 11, mp: 14, desc: '教堂里的神职人员',
    data: tplData('神父', { str: 50, con: 55, siz: 55, dex: 45, int: 65, app: 55, pow: 70, edu: 70, hp: 11, mp: 14, extra: 'DB +0 体格 0 护甲 0', skills: '心理学 55% 说服 60% 母语 65%', attack: '斗殴 1D3+DB', desc: '教堂里的神职人员，也许知道些不该知道的事。' }) },
  { id: 'nurse', cat: 'urban', icon: '🩺', name: '护士', dex: 55, hp: 11, mp: 12, desc: '医院里忙碌的护士',
    data: tplData('护士', { str: 50, con: 60, siz: 50, dex: 55, int: 65, app: 55, pow: 60, edu: 65, hp: 11, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '急救 70% 医学 50% 聆听 50%', attack: '斗殴 1D3+DB', desc: '医院里忙碌的护士，见过太多奇怪的病症。' }) },
  { id: 'maid', cat: 'urban', icon: '🧹', name: '女仆', dex: 60, hp: 10, mp: 11, desc: '大户人家里的女仆',
    data: tplData('女仆', { str: 45, con: 55, siz: 50, dex: 60, int: 55, app: 55, pow: 55, edu: 45, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '聆听 55% 潜行 50% 侦查 45%', attack: '斗殴 1D3+DB', desc: '大户人家里的女仆，耳朵很灵，知道主人家不少秘密。' }) },
  { id: 'newsboy', cat: 'urban', icon: '👦', name: '报童', dex: 60, hp: 9, mp: 10, desc: '街头叫卖的报童',
    data: tplData('报童', { str: 40, con: 50, siz: 45, dex: 60, int: 55, app: 55, pow: 50, edu: 40, hp: 9, mp: 10, extra: 'DB +0 体格 0 护甲 0', skills: '闪避 40% 聆听 55% 攀爬 50%', attack: '——', desc: '街头叫卖的报童，跑得飞快，城市里的流言他都知道一半。' }) },
  { id: 'dog', cat: 'urban', icon: '🐕', name: '守卫犬', dex: 55, hp: 9, mp: 6, desc: '忠诚而凶猛的看门犬',
    data: tplData('守卫犬', { str: 40, con: 50, siz: 40, dex: 55, int: 40, app: 40, pow: 40, edu: 20, hp: 9, mp: 8, luck: 40, extra: 'DB +0 体格 0 护甲 0', skills: '侦查 50% 聆听 55% 潜行 40%', attack: '撕咬 30% 1D10', desc: '忠诚而凶猛的看门犬，会在陌生人靠近时发出警告。' }) },
  { id: 'jazzman', cat: 'urban', icon: '🎷', name: '爵士乐手', dex: 65, hp: 11, mp: 12, desc: '夜总会里的爵士乐手',
    data: tplData('爵士乐手', { str: 50, con: 55, siz: 55, dex: 65, int: 55, app: 55, pow: 60, edu: 50, hp: 11, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '演奏 70% 聆听 55% 话术 45%', attack: '斗殴 1D3+DB', desc: '夜总会里的爵士乐手，见证了这座城市最喧闹也最黑暗的夜晚。' }) },

  // ===== 🌾 乡村居民 =====
  { id: 'farmer', cat: 'rural', icon: '🧑‍🌾', name: '农夫', dex: 55, hp: 13, mp: 11, desc: '面朝黄土背朝天的农夫',
    data: tplData('农夫', { str: 65, con: 70, siz: 65, dex: 55, int: 50, app: 50, pow: 55, edu: 45, hp: 13, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 55% 农业 60% 侦查 45%', attack: '干草叉 1D8 / 斗殴 1D3+DB', desc: '面朝黄土背朝天的农夫，庄稼地边发生的事他比谁都清楚。' }) },
  { id: 'gamekeeper', cat: 'rural', icon: '🪓', name: '猎场看守', dex: 60, hp: 12, mp: 11, desc: '熟悉林地的猎场看守',
    data: tplData('猎场看守', { str: 60, con: 65, siz: 60, dex: 60, int: 55, app: 50, pow: 55, edu: 50, hp: 12, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '步枪 60% 追踪 55% 侦查 55%', attack: '猎枪 1D10 / 斗殴 1D3+DB', desc: '熟悉林地每一寸土地的猎场看守，夜里听到过不该有的动静。' }) },
  { id: 'blacksmith', cat: 'rural', icon: '🔨', name: '铁匠', dex: 55, hp: 13, mp: 11, desc: '炉火旁臂力惊人的铁匠',
    data: tplData('铁匠', { str: 70, con: 70, siz: 65, dex: 55, int: 55, app: 50, pow: 55, edu: 45, hp: 13, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 60% 机械维修 50%', attack: '铁锤 1D8+DB / 斗殴 1D3+DB', desc: '炉火旁的铁匠，臂力惊人，脾气和铁砧一样硬。' }) },
  { id: 'fisherman', cat: 'rural', icon: '🐟', name: '渔夫', dex: 55, hp: 12, mp: 11, desc: '靠海为生的渔夫',
    data: tplData('渔夫', { str: 60, con: 65, siz: 60, dex: 55, int: 50, app: 50, pow: 55, edu: 40, hp: 12, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '游泳 60% 捕捞 55% 侦查 45%', attack: '鱼叉 1D8 / 斗殴 1D3+DB', desc: '靠海为生的渔夫，见过海里的怪东西，只是不愿多提。' }) },
  { id: 'forester', cat: 'rural', icon: '🌲', name: '守林人', dex: 55, hp: 12, mp: 11, desc: '独居林中小屋的守林人',
    data: tplData('守林人', { str: 60, con: 65, siz: 60, dex: 55, int: 55, app: 50, pow: 55, edu: 50, hp: 12, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '步枪 55% 追踪 60% 侦查 50%', attack: '猎枪 1D10', desc: '独居林中小屋的守林人，话不多，枪法很准。' }) },
  { id: 'groom', cat: 'rural', icon: '🐎', name: '马夫', dex: 60, hp: 11, mp: 10, desc: '照看马匹的马夫',
    data: tplData('马夫', { str: 55, con: 60, siz: 55, dex: 60, int: 50, app: 50, pow: 50, edu: 40, hp: 11, mp: 10, extra: 'DB +0 体格 0 护甲 0', skills: '动物驯养 60% 斗殴 45%', attack: '鞭子 1D3+DB', desc: '照看马匹的马夫，马厩里的传闻他最清楚。' }) },
  { id: 'innkeeper', cat: 'rural', icon: '🏨', name: '旅店老板', dex: 50, hp: 12, mp: 11, desc: '村里消息的集散地',
    data: tplData('旅店老板', { str: 55, con: 60, siz: 60, dex: 50, int: 55, app: 55, pow: 55, edu: 50, hp: 12, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '话术 55% 聆听 55% 斗殴 45%', attack: '斗殴 1D3+DB', desc: '乡村旅店的老板，村里的消息都从他这儿过。' }) },
  { id: 'schoolteacher', cat: 'rural', icon: '🧑‍🏫', name: '乡村教师', dex: 50, hp: 10, mp: 11, desc: '一人教全校的教师',
    data: tplData('乡村教师', { str: 45, con: 55, siz: 50, dex: 50, int: 65, app: 55, pow: 55, edu: 65, hp: 10, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '母语 65% 历史 50% 心理学 40%', attack: '斗殴 1D3+DB', desc: '一人教全校的乡村教师，是村里最有学问的人。' }) },
  { id: 'vet', cat: 'rural', icon: '🐄', name: '兽医', dex: 55, hp: 11, mp: 11, desc: '给牲口看病的兽医',
    data: tplData('兽医', { str: 50, con: 55, siz: 55, dex: 55, int: 65, app: 50, pow: 55, edu: 65, hp: 11, mp: 11, extra: 'DB +0 体格 0 护甲 0', skills: '医学 55% 动物驯养 60% 急救 50%', attack: '斗殴 1D3+DB', desc: '给牲口看病的兽医，常被请去处理些说不清的怪事。' }) },
  { id: 'midwife', cat: 'rural', icon: '👵', name: '产婆', dex: 55, hp: 10, mp: 12, desc: '村里接生的产婆',
    data: tplData('产婆', { str: 45, con: 55, siz: 50, dex: 55, int: 60, app: 50, pow: 60, edu: 45, hp: 10, mp: 12, extra: 'DB +0 体格 0 护甲 0', skills: '急救 65% 医学 45% 聆听 55%', attack: '斗殴 1D3+DB', desc: '村里接生的产婆，懂得不少土方，也听过不少婴儿的怪啼。' }) },
  { id: 'miller', cat: 'rural', icon: '🌾', name: '磨坊主', dex: 50, hp: 12, mp: 10, desc: '守着水磨坊的磨坊主',
    data: tplData('磨坊主', { str: 60, con: 65, siz: 60, dex: 50, int: 50, app: 50, pow: 50, edu: 40, hp: 12, mp: 10, extra: 'DB +1D4 体格 1 护甲 0', skills: '斗殴 50% 机械维修 50%', attack: '斗殴 1D3+DB / 木棍 1D6', desc: '守着水磨坊的磨坊主，磨盘底下压着不少秘密。' }) },

  // ===== 🐟 深海派系（深潜者） =====
  { id: 'deepone', cat: 'deep', icon: '🐸', name: '深潜者', dex: 50, hp: 14, mp: 12, desc: '深海派系·杂兵',
    data: tplData('深潜者 (Deep One)', { str: 70, con: 70, siz: 70, dex: 50, int: 65, app: 60, pow: 60, edu: 40, hp: 14, mp: 12, extra: 'DB +1D4 体格 1 护甲 1（皮肤）', skills: '侦查 45% 潜行 60% 游泳 65%', attack: '爪击 25% 1D6+DB / 撕咬 25% 1D4+DB', desc: '来自深海的可怖人形鱼，能水下呼吸，信仰大衮与海德拉。SAN 损失 0/1D6。' }) },
  { id: 'deeponehalf', cat: 'deep', icon: '🐟', name: '深潜者混血', dex: 55, hp: 11, mp: 11, desc: '深海派系·杂兵',
    data: tplData('深潜者混血 (Deep One Hybrid)', { str: 55, con: 60, siz: 55, dex: 55, int: 60, app: 55, pow: 55, edu: 45, hp: 11, mp: 11, extra: 'DB +1D4 体格 1 护甲 0', skills: '潜行 60% 游泳 55% 侦查 40%', attack: '爪击 25% 1D6+DB', desc: '外表似人的混血儿，会逐渐向深潜者转变，混迹于沿海小镇。SAN 损失 0/1D4。' }) },
  { id: 'deeponeelder', cat: 'deep', icon: '🧙', name: '深潜者长老', dex: 45, hp: 16, mp: 14, desc: '深海派系·精英·知晓法术',
    data: tplData('深潜者长老 (Deep One Elder)', { str: 80, con: 80, siz: 80, dex: 45, int: 70, app: 40, pow: 70, edu: 60, hp: 16, mp: 14, extra: 'DB +1D6 体格 2 护甲 2（皮肤）', skills: '潜行 70% 游泳 70% 侦查 50%', attack: '爪击 30% 1D6+DB / 撕咬 30% 1D4+DB', spells: '召唤深潜者（1D4 MP / 1D6 SAN，施法 1 小时，唤来 1D10 只）；束缚深潜者（1D4 MP / 1D6 SAN，施法 1 小时）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '活了数百年的深潜者长老，指挥着整支族群，知晓多种法术。SAN 损失 1/1D10。' }) },

  // ===== 🧟 食尸鬼派系 =====
  { id: 'ghoul', cat: 'ghoul', icon: '🧟', name: '食尸鬼', dex: 70, hp: 13, mp: 10, desc: '食尸鬼派系·杂兵',
    data: tplData('食尸鬼 (Ghoul)', { str: 70, con: 70, siz: 60, dex: 70, int: 55, app: 40, pow: 50, edu: 40, hp: 13, mp: 10, extra: 'DB +1D4 体格 1 护甲 1（毛皮）', skills: '攀爬 80% 潜行 70% 侦查 55%', attack: '爪击 40% 1D6+DB / 撕咬 40% 1D4+DB', desc: '掘墓食尸的异形生物，面孔扭曲，爪牙锋利，在墓穴与地下通道中出没。SAN 损失 0/1D6。' }) },
  { id: 'ghoulhound', cat: 'ghoul', icon: '🐕', name: '食尸鬼猎犬', dex: 65, hp: 11, mp: 9, desc: '食尸鬼派系·杂兵',
    data: tplData('食尸鬼猎犬 (Ghoul Hound)', { str: 55, con: 55, siz: 55, dex: 65, int: 35, app: 30, pow: 45, edu: 20, hp: 11, mp: 9, extra: 'DB +1D4 体格 1 护甲 1（毛皮）', skills: '潜行 70% 追踪 60%', attack: '撕咬 45% 1D6+DB', desc: '食尸鬼豢养的猎犬，嗅觉敏锐，成群出没于墓园。SAN 损失 0/1D4。' }) },
  { id: 'ghoulelder', cat: 'ghoul', icon: '👑', name: '食尸鬼长老', dex: 65, hp: 14, mp: 12, desc: '食尸鬼派系·精英',
    data: tplData('食尸鬼长老 (Ghoul Elder)', { str: 75, con: 75, siz: 65, dex: 65, int: 65, app: 35, pow: 60, edu: 50, hp: 14, mp: 12, extra: 'DB +1D6 体格 1 护甲 1（毛皮）', skills: '潜行 75% 攀爬 80% 侦查 60%', attack: '爪击 50% 1D8+DB', desc: '年迈而狡诈的食尸鬼首领，统领着地下的族群。SAN 损失 0/1D6。' }) },

  // ===== 🦀 米·戈派系 =====
  { id: 'migo', cat: 'migo', icon: '🦀', name: '米·戈', dex: 70, hp: 12, mp: 12, desc: '米·戈派系·杂兵',
    data: tplData('米·戈 (Mi-Go)', { str: 55, con: 60, siz: 60, dex: 70, int: 75, app: 40, pow: 60, edu: 75, hp: 12, mp: 12, extra: 'DB +1D4 体格 1 护甲 4（甲壳）', skills: '侦查 60% 潜行 70% 科学 60%', attack: '钳爪 35% 1D6+DB', desc: '来自犹格斯的真菌生物，形似甲壳类，可飞行，拥有远超人类的技术。SAN 损失 0/1D6。' }) },
  { id: 'migosurgeon', cat: 'migo', icon: '🧠', name: '米·戈医师', dex: 70, hp: 12, mp: 14, desc: '米·戈派系·精英·知晓法术',
    data: tplData('米·戈医师 (Mi-Go Surgeon)', { str: 60, con: 65, siz: 60, dex: 70, int: 85, app: 40, pow: 70, edu: 80, hp: 12, mp: 14, extra: 'DB +1D4 体格 1 护甲 4（甲壳）', skills: '医学 70% 科学 70% 潜行 70%', attack: '钳爪 40% 1D6+DB', spells: '头脑交换术（2+ MP / 1D4 SAN，与目标交换意识）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '精通脑叶切除术的米·戈医师，收藏着人类的大脑标本，知晓法术。SAN 损失 0/1D6。' }) },

  // ===== 🦇 空中派系（拜亚基 / 哈斯塔系） =====
  { id: 'byakhee', cat: 'sky', icon: '🦇', name: '拜亚基', dex: 55, hp: 14, mp: 9, desc: '空中派系·杂兵',
    data: tplData('拜亚基 (Byakhee)', { str: 70, con: 60, siz: 85, dex: 55, int: 45, app: 40, pow: 45, edu: 30, hp: 14, mp: 9, extra: 'DB +1D6 体格 2 护甲 0', skills: '侦查 45% 潜行 40%', attack: '爪击 40% 1D8+DB', desc: '星际间翱翔的恐怖猎手，可被特定咒文召唤，能携带骑手穿越宇宙。SAN 损失 0/1D6。' }) },
  { id: 'nightgaunt', cat: 'sky', icon: '👻', name: '夜魇', dex: 60, hp: 14, mp: 9, desc: '空中派系·杂兵',
    data: tplData('夜魇 (Nightgaunt)', { str: 75, con: 65, siz: 80, dex: 60, int: 40, app: 30, pow: 45, edu: 30, hp: 14, mp: 9, extra: 'DB +1D6 体格 2 护甲 0', skills: '潜行 80% 飞行 60%', attack: '擒抱 40%（窒息 1D6/轮）', desc: '无面无声的黑色生物，喜欢把人抓上高空再丢下。SAN 损失 0/1D6。' }) },
  { id: 'huntinghorror', cat: 'sky', icon: '🐉', name: '恐怖猎手', dex: 55, hp: 16, mp: 11, desc: '空中派系·精英',
    data: tplData('恐怖猎手 (Hunting Horror)', { str: 100, con: 75, siz: 90, dex: 55, int: 40, app: 30, pow: 55, edu: 30, hp: 16, mp: 11, extra: 'DB +1D6 体格 2 护甲 0', skills: '侦查 50% 潜行 60%', attack: '撕咬 50% 1D10+DB', desc: '哈斯塔的信使，长着爪翼的巨大怪物，循着咒文狩猎目标。SAN 损失 1/1D10。' }) },

  // ===== 🐙 克苏鲁系 =====
  { id: 'starspawn', cat: 'cthulhu', icon: '⭐', name: '星之眷族', dex: 55, hp: 14, mp: 13, desc: '克苏鲁系·精英·知晓法术',
    data: tplData('星之眷族 (Star Spawn)', { str: 75, con: 65, siz: 80, dex: 55, int: 60, app: 30, pow: 65, edu: 40, hp: 14, mp: 13, extra: 'DB +1D6 体格 2 护甲 无（免疫普通武器）', skills: '侦查 50% 潜行 40%', attack: '爪击 60% 1D6+DB / 撕咬 60% 1D6+DB', spells: '召唤/束缚克苏鲁（1D10 MP / 1D10 SAN，施法 1 小时以上）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '克苏鲁的仆从，巨大而扭曲，免疫非魔法武器，知晓多种法术。SAN 损失 1/1D10。' }) },
  { id: 'shoggoth', cat: 'cthulhu', icon: '🫧', name: '修格斯', dex: 65, hp: 16, mp: 12, desc: '克苏鲁系·精英',
    data: tplData('修格斯 (Shoggoth)', { str: 85, con: 80, siz: 85, dex: 65, int: 40, app: 20, pow: 60, edu: 20, hp: 16, mp: 12, extra: 'DB +1D6 体格 2 护甲 无（免疫普通武器）', skills: '潜行 70%', attack: '碾压 80% 1D8+DB', desc: '形如巨大黑色变形虫的古老造物，由修格斯奴仆演化而来。SAN 损失 1/1D10。' }) },

  // ===== 🐍 蛇人派系 =====
  { id: 'serpent', cat: 'serpent', icon: '🐍', name: '蛇人', dex: 65, hp: 12, mp: 13, desc: '蛇人派系·杂兵·知晓法术',
    data: tplData('蛇人 (Serpent Person)', { str: 70, con: 65, siz: 60, dex: 65, int: 70, app: 45, pow: 65, edu: 55, hp: 12, mp: 13, extra: 'DB +1D4 体格 1 护甲 1（鳞片）', skills: '潜行 60% 侦查 55%', attack: '匕首 40% 1D4+DB', spells: '人类支配术（1+ MP / 1 SAN，与目标对视并成功检定后，目标服从命令 1 轮/点 MP）', desc: '曾统治地球的爬虫类种族，佩戴蛇形徽记，隐匿于人类社会，知晓 1-2 个法术。SAN 损失 0/1D6。' }) },
  { id: 'serpentsage', cat: 'serpent', icon: '🧙', name: '蛇人学者', dex: 65, hp: 11, mp: 15, desc: '蛇人派系·精英·精通法术',
    data: tplData('蛇人学者 (Serpent Sage)', { str: 65, con: 60, siz: 55, dex: 65, int: 85, app: 45, pow: 75, edu: 80, hp: 11, mp: 15, extra: 'DB +1D4 体格 1 护甲 1（鳞片）', skills: '神秘学 65% 潜行 60% 心理学 55%', attack: '匕首 40% 1D4+DB', spells: '人类支配术（1+ MP / 1 SAN，目标服从命令 1 轮/点 MP）；记忆编织（5+ MP / 1D4 SAN，改写目标记忆）；克苏鲁之触（1D4 MP / 1D6 SAN，施法 1 小时）', desc: '精通古老法术的蛇人学者，知晓深埋地下的远古秘密。SAN 损失 0/1D6。' }) },

  // ===== 🌑 异形生物 =====
  { id: 'hound', cat: 'alien', icon: '🐺', name: '廷达罗斯猎犬', dex: 65, hp: 13, mp: 12, desc: '异形生物·精英',
    data: tplData('廷达罗斯猎犬 (Hound of Tindalos)', { str: 70, con: 80, siz: 55, dex: 65, int: 45, app: 20, pow: 60, edu: 20, hp: 13, mp: 12, extra: 'DB +1D4 体格 1 护甲 无（免疫普通武器）', skills: '追踪 90% 潜行 70%', attack: '撕咬 45% 1D8+DB', desc: '能从几何角度现身的空间猎手，唯有锐角能让它止步。SAN 损失 1/1D10。' }) },
  { id: 'formless', cat: 'alien', icon: '🫠', name: '无形之子', dex: 65, hp: 14, mp: 11, desc: '异形生物·精英',
    data: tplData('无形之子 (Formless Spawn)', { str: 70, con: 75, siz: 65, dex: 65, int: 50, app: 20, pow: 55, edu: 20, hp: 14, mp: 11, extra: 'DB +1D4 体格 1 护甲 无（免疫普通武器）', skills: '潜行 80%', attack: '攫抓 50% 1D6+DB', desc: '无形无质的原生质生物，能穿过任何缝隙，是修格斯的后代。SAN 损失 0/1D6。' }) },
  { id: 'ratthing', cat: 'alien', icon: '🐀', name: '人面鼠', dex: 70, hp: 4, mp: 11, desc: '异形生物·杂兵',
    data: tplData('人面鼠 (Rat-Thing)', { str: 25, con: 25, siz: 20, dex: 70, int: 60, app: 30, pow: 55, edu: 40, hp: 4, mp: 11, extra: 'DB +0 体格 -2 护甲 0', skills: '潜行 75% 侦查 50%', attack: '撕咬 40% 1D4', desc: '长着人脸的怪鼠，成群出没于陋巷与地窖，是黄衣之王的信使。SAN 损失 0/1D4。' }) }
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

// 从数据文本提取护甲（如「护甲 1（皮肤）」「护甲 无（免疫普通武器）」「护甲 0」）
function extractArmor(text) {
  var m = (text || '').match(/护甲\s*([0-9零无]+(?:\s*[（(][^)）]*[)）])?)/);
  return m ? m[1].trim() : '';
}

// ========== 克苏鲁风格词汇表（备团 / 现场氛围描述用） ==========
var KEEPERS_LEXICON = {
  atm: { icon: '🌫️', name: '雾与光', items: [
    { w: '浓稠的雾', d: '像浸了水的棉絮，贴地蠕动，吞没脚步声' },
    { w: '铅灰色的天光', d: '日光被滤成死灰，万物失去轮廓' },
    { w: '煤气灯滋滋作响', d: '昏黄光晕在湿漉漉的街面上抖动' },
    { w: '烛火忽明忽暗', d: '没有风，火苗却自己矮了下去' },
    { w: '黑暗有了重量', d: '它不是缺席的光，而是压下来的东西' },
    { w: '雾气贴着地面爬', d: '像某种活物，缓慢地蔓延过门槛' },
    { w: '昏黄的窗格', d: '整栋楼只有那一扇窗亮着' },
    { w: '影子比物体更长', d: '路灯下的影子拖向不该去的方向' },
    { w: '灰蒙蒙的轮廓', d: '远处的东西只能看清大概的形状' },
    { w: '油灯摇曳的阴影', d: '墙上的影子在每一次晃动中变形' },
    { w: '月光冷得发蓝', d: '照在石头上像一层薄霜' },
    { w: '光线照不到角落', d: '角落里总有什么半隐在暗处' }
  ] },
  building: { icon: '🏚️', name: '建筑与室内', items: [
    { w: '维多利亚式宅邸', d: '尖顶、窄窗、爬满常春藤的旧屋' },
    { w: '吱呀作响的地板', d: '每一步都像在踩谁的叹息' },
    { w: '发霉的墙纸', d: '花纹在潮斑下扭曲成不存在的图案' },
    { w: '积灰的阁楼', d: '开门时灰尘扑面，像惊醒了什么' },
    { w: '幽深的走廊', d: '尽头的光总是比想象中远' },
    { w: '生锈的门铰', d: '推开时发出漫长的呻吟' },
    { w: '地下室的水渍', d: '墙壁上干涸的痕迹顺着砖缝向下爬' },
    { w: '封死的窗户', d: '木板从外面钉死，却钉得毫无章法' },
    { w: '落满灰尘的钢琴', d: '琴键上有一个清晰的指印' },
    { w: '蛛网密布的角落', d: '蛛网上挂着不该有的细小碎屑' },
    { w: '倾斜的屋脊', d: '整栋房子像在慢慢塌向一侧' },
    { w: '厚重的木门', d: '门缝底下透出潮湿的凉气' },
    { w: '剥落的油漆', d: '露出底下深色的旧涂层' },
    { w: '通往地窖的台阶', d: '台阶比外面冷得多，越往下越冷' }
  ] },
  sea: { icon: '🌊', name: '海洋与海滨', items: [
    { w: '咸腥的海风', d: '风里夹着鱼、盐和某种说不清的腐味' },
    { w: '退潮后的泥滩', d: '裸露的泥面上留着巨大的拖痕' },
    { w: '雾笛长鸣', d: '声音在海面上回荡，像某种生物的呼唤' },
    { w: '海面下若隐若现的黑影', d: '比鱼大得多，缓慢地游过' },
    { w: '缠着海藻的船锚', d: '捞起来时海藻里缠着骨头' },
    { w: '湿漉漉的码头', d: '木板湿滑，缝隙里渗着黑色的水' },
    { w: '鱼鳞的冷光', d: '鱼肚在昏暗的光下发着珍珠母的光泽' },
    { w: '搁浅的死鱼', d: '整片海滩一夜之间全是死鱼' },
    { w: '浪涛拍打岩石的低吼', d: '声音低沉，像什么东西在岩石下翻身' },
    { w: '海风中的低语', d: '风灌进礁石缝隙时，隐约像人声' },
    { w: '咸涩的水汽', d: '空气湿得能拧出水，衣角发黏' },
    { w: '渔网里的异物', d: '网里拖着不属于这片海的东西' }
  ] },
  wild: { icon: '🌲', name: '荒野与林间', items: [
    { w: '扭曲盘虬的枝干', d: '树枝长得像攥紧的指节' },
    { w: '腐叶的霉气', d: '林子的气味让人想起地窖和坟墓' },
    { w: '无风而动的树梢', d: '树梢在晃，风却是静止的' },
    { w: '幽暗的林间小径', d: '小径上留着湿漉漉的脚印' },
    { w: '苔藓覆盖的墓碑', d: '碑上的名字被青苔啃得模糊不清' },
    { w: '鸟鸣骤止', d: '你踏进林子的一瞬，所有鸟同时安静了' },
    { w: '浓得化不开的树影', d: '树影重叠，像有东西藏在每一层阴影里' },
    { w: '溪水倒映着不存在的影子', d: '水面晃动时，倒影里的树多了一棵' },
    { w: '踩断的枯枝声', d: '那声音近得不像你自己的脚步' },
    { w: '苔原上的石阵', d: '石头排成古老的圆圈，中央是焦黑的地面' },
    { w: '缠绕墓碑的藤蔓', d: '藤蔓勒进石碑的刻痕里' },
    { w: '林间的雾在聚拢', d: '雾从四面围过来，路在身后消失' }
  ] },
  eldritch: { icon: '🐙', name: '异形与蠕动', items: [
    { w: '黏滑的触感', d: '皮肤擦过的东西湿冷而富有弹性' },
    { w: '不成形的蠕动', d: '它在移动，但没有四肢，也没有方向' },
    { w: '复眼的反光', d: '黑暗中亮起一排细小的冷光' },
    { w: '半透明的外膜', d: '能隐约看见膜下缓缓搏动的东西' },
    { w: '无骨的肢体', d: '它弯折的方式不符合任何关节' },
    { w: '湿漉漉的爬行声', d: '像巨大的软体在石板上拖行' },
    { w: '不属于已知动物的轮廓', d: '你认得清它的每个部分，却拼不出它是什么' },
    { w: '缓缓鼓动的囊体', d: '某种器官在呼吸，而它没有头' },
    { w: '细碎的节肢声', d: '密密麻麻的足爪在暗处交替爬动' },
    { w: '流质的移动', d: '它流过门槛，像水，却留下黏稠的痕迹' },
    { w: '畸形的手指', d: '指节比常人多出一截' },
    { w: '鳞片下的蠕动', d: '皮肤表面的鳞片在轻微地起伏' }
  ] },
  mind: { icon: '🧠', name: '精神与感知', items: [
    { w: '无端的既视感', d: '这个场景你明明从未见过，却觉得经历过' },
    { w: '后颈发凉', d: '说不清为什么，但你想回头看看' },
    { w: '耳鸣渐渐尖锐', d: '嗡鸣声盖过所有声音，又突然消失' },
    { w: '视野边缘的动静', d: '余光里总有什么，转头却什么都没有' },
    { w: '时间仿佛变慢', d: '脚步声在走廊里拖出回声' },
    { w: '莫名想回头', d: '理智告诉你别回头，但你还是回了' },
    { w: '汗毛倒竖', d: '皮肤上的汗毛一根根立起来' },
    { w: '理智像细线般绷紧', d: '再有一点刺激，它就会断' },
    { w: '似曾相识的恐惧', d: '你怕的不是眼前的东西，是想起它' },
    { w: '记不起如何来到这里', d: '你记得出发，却不记得路' },
    { w: '声音在耳边变轻', d: '世界像蒙了一层布，说话声变得遥远' },
    { w: '寒意顺着脊椎爬', d: '从尾椎一直凉到后脑勺' }
  ] },
  ritual: { icon: '📜', name: '仪式与神秘', items: [
    { w: '烧焦的蜡烛', d: '烛泪凝成奇怪的形状，堆在符号上' },
    { w: '蜡泪凝结的符号', d: '地上的符号是用蜡和灰画的' },
    { w: '粉末画成的圆圈', d: '圈内的地板比圈外干净得多' },
    { w: '干涸的深色污渍', d: '污渍顺着地板缝渗进木头里' },
    { w: '发黄的羊皮纸', d: '纸上的字迹歪斜，像是用左手写的' },
    { w: '歪斜的铭文', d: '刻痕深浅不一，有些笔画多到不该存在' },
    { w: '残缺的雕像', d: '雕像的头没了，底座上留着抓痕' },
    { w: '祭坛上的凹槽', d: '凹槽正好接住某种液体的流向' },
    { w: '灰烬中的指印', d: '壁炉灰烬里压着一个清晰的手印' },
    { w: '低声的呢喃', d: '声音在重复一个听不懂的词' },
    { w: '铜碗里的残液', d: '液体泛着不自然的油彩光泽' },
    { w: '用血写的字', d: '字迹已经发黑，但还看得清收笔时的颤抖' }
  ] },
  era: { icon: '🕰️', name: '年代与物件', items: [
    { w: '黄铜座钟', d: '钟摆每一下都像在倒数什么' },
    { w: '老式留声机', d: '唱针跳在同一个音上，咔哒、咔哒' },
    { w: '煤气灯', d: '灯罩里的火光在墙上投出巨大的影子' },
    { w: '褪色的全家福', d: '照片里的人脸被水渍泡得模糊' },
    { w: '珍珠母贝的烟盒', d: '盒盖上镶着细小的螺钿' },
    { w: '磨损的怀表链', d: '表链在口袋里发出细碎的声响' },
    { w: '黑胶唱片', d: '唱片上有一道划痕，划过歌手的喉咙' },
    { w: '樟脑丸的气味', d: '衣橱里混着樟脑和旧棉布的味道' },
    { w: '皮面笔记本', d: '本子里夹着一张褪色的车票' },
    { w: '打字机', d: '键盘上留着深深的手指印' },
    { w: '铜制听诊器', d: '听诊器的胶管已经老化开裂' },
    { w: '煤油灯', d: '灯芯烧得只剩一点，烟熏黑了玻璃罩' }
  ] },
  face: { icon: '🎭', name: '人物与神情', items: [
    { w: '惨白的脸', d: '白得不正常，像在水里泡过很久' },
    { w: '眼窝深陷', d: '眼睛嵌在阴影里，几乎看不见瞳仁' },
    { w: '呆滞的凝视', d: '他看着你，但目光穿过了你' },
    { w: '嘴角不自然的抽动', d: '他笑的时候，只有半边脸在动' },
    { w: '干燥开裂的嘴唇', d: '嘴唇上结着干皮，说话时裂开渗血' },
    { w: '指尖的颤抖', d: '他端茶杯的手一直在抖' },
    { w: '过长的指甲', d: '指甲缝里嵌着洗不掉的黑泥' },
    { w: '神经质的笑', d: '笑声尖细，戛然而止' },
    { w: '空洞的眼神', d: '像看着什么很远的东西' },
    { w: '皮笑肉不笑', d: '脸上的笑没有抵达眼睛' },
    { w: '喉咙里的咕哝', d: '他想说什么，却只发出含混的声音' },
    { w: '湿漉漉的衣角', d: '他全身干燥，只有衣角在滴水' }
  ] },
  death: { icon: '💀', name: '死亡与腐烂', items: [
    { w: '蛆虫攒动的伤口', d: '伤口边缘在缓缓地动' },
    { w: '干枯萎缩的肢体', d: '像被抽干了水分，皮肤绷在骨头上' },
    { w: '凹陷的眼眶', d: '眼眶里空空的，或装着不该有的东西' },
    { w: '灰绿的肤色', d: '皮肤上浮着一层不健康的绿' },
    { w: '淡淡的尸臭', d: '气味被花香盖着，但盖不干净' },
    { w: '僵直的指尖', d: '手指弯曲成抓握的姿势，掰不开' },
    { w: '干涸的暗红痕迹', d: '痕迹从床边一直拖到门口' },
    { w: '苍蝇嗡鸣', d: '房间里明明什么都没有，苍蝇却在打转' },
    { w: '死不瞑目', d: '眼睛睁着，瞳孔里映着最后一刻的光' },
    { w: '衣料下的异物', d: '衣服鼓起一个不该有的弧度' },
    { w: '指甲缝里的泥土', d: '死者手指甲缝里是新鲜的湿土' },
    { w: '没有呼吸声的胸膛', d: '他躺着，胸膛却像还在起伏' }
  ] }
};

var KEEPERS_LEXICON_CATS = [
  { id: 'atm', icon: '🌫️', name: '雾与光' },
  { id: 'building', icon: '🏚️', name: '建筑与室内' },
  { id: 'sea', icon: '🌊', name: '海洋与海滨' },
  { id: 'wild', icon: '🌲', name: '荒野与林间' },
  { id: 'eldritch', icon: '🐙', name: '异形与蠕动' },
  { id: 'mind', icon: '🧠', name: '精神与感知' },
  { id: 'ritual', icon: '📜', name: '仪式与神秘' },
  { id: 'era', icon: '🕰️', name: '年代与物件' },
  { id: 'face', icon: '🎭', name: '人物与神情' },
  { id: 'death', icon: '💀', name: '死亡与腐烂' }
];

// ========== 随机生成器数据 ==========
var RANDOM_SURNAMES_CN = ['陈','林','黄','张','李','王','刘','赵','周','吴','徐','孙','马','朱','胡','郭','何','高','罗','郑','梁','谢','宋','唐','许','韩','冯','邓','曹','彭','曾','萧','田','董','潘','袁','蔡','蒋','余','于'];
var RANDOM_GIVEN_CN = ['伟','芳','娜','敏','静','磊','军','洋','勇','艳','杰','娟','涛','明','超','霞','平','刚','文','辉','力','华','雪','婷','宇','浩','凯','睿','欣','怡','子轩','雨欣','佳琪','思远','一鸣','若曦','天佑','芷若','亦可','景行','慕白','知微','念安','书瑶','承泽','清欢','望舒'];
// 西式姓名：en 为原文，cn 为约定俗成的中文译名（新华社/大众通用译法）
var RANDOM_FIRST_WEST_M = [
  {en:'James',cn:'詹姆斯'},{en:'John',cn:'约翰'},{en:'Robert',cn:'罗伯特'},{en:'Michael',cn:'迈克尔'},
  {en:'William',cn:'威廉'},{en:'David',cn:'大卫'},{en:'Richard',cn:'理查德'},{en:'Thomas',cn:'托马斯'},
  {en:'Henry',cn:'亨利'},{en:'Edward',cn:'爱德华'},{en:'George',cn:'乔治'},{en:'Arthur',cn:'亚瑟'},
  {en:'Charles',cn:'查尔斯'},{en:'Frank',cn:'弗兰克'},{en:'Jack',cn:'杰克'},{en:'Oliver',cn:'奥利弗'},
  {en:'Samuel',cn:'塞缪尔'},{en:'Walter',cn:'沃尔特'}
];
var RANDOM_FIRST_WEST_F = [
  {en:'Mary',cn:'玛丽'},{en:'Elizabeth',cn:'伊丽莎白'},{en:'Sarah',cn:'莎拉'},{en:'Margaret',cn:'玛格丽特'},
  {en:'Anna',cn:'安娜'},{en:'Emily',cn:'艾米丽'},{en:'Alice',cn:'爱丽丝'},{en:'Rose',cn:'萝丝'},
  {en:'Lucy',cn:'露西'},{en:'Grace',cn:'格蕾丝'},{en:'Helen',cn:'海伦'},{en:'Laura',cn:'劳拉'},
  {en:'Sophia',cn:'索菲亚'},{en:'Clara',cn:'克拉拉'},{en:'Violet',cn:'维奥莱特'},{en:'Irene',cn:'艾琳'},
  {en:'Dorothy',cn:'多萝西'},{en:'Ruth',cn:'露丝'}
];
var RANDOM_LAST_WEST = [
  {en:'Smith',cn:'史密斯'},{en:'Johnson',cn:'约翰逊'},{en:'Brown',cn:'布朗'},{en:'Williams',cn:'威廉姆斯'},
  {en:'Jones',cn:'琼斯'},{en:'Miller',cn:'米勒'},{en:'Davis',cn:'戴维斯'},{en:'Wilson',cn:'威尔逊'},
  {en:'Moore',cn:'摩尔'},{en:'Taylor',cn:'泰勒'},{en:'Anderson',cn:'安德森'},{en:'Jackson',cn:'杰克逊'},
  {en:'White',cn:'怀特'},{en:'Harris',cn:'哈里斯'},{en:'Martin',cn:'马丁'},{en:'Walker',cn:'沃克'},
  {en:'Wright',cn:'赖特'},{en:'Carter',cn:'卡特'},{en:'Green',cn:'格林'},{en:'Baker',cn:'贝克'}
];
var RANDOM_JOBS = ['店员','码头工人','记者','教师','药剂师','殡仪馆主','古董商','出租车司机','酒吧老板','图书馆员','护士','神父','银行职员','邮差','摄影师','作家','会计','电工','花匠','厨师','水手','渔夫','猎场看守','博物馆管理员','占卜师','钟表匠','旅店老板','打字员','售票员','杂货店主','报童','电报员','爵士乐手','私酒贩子','电影放映员','马夫','女仆','园丁'];
var RANDOM_CLUES = ['死者指甲缝里残留着海沙，带着咸腥味','现场地板上有一串湿漉漉的足迹，通向墙壁后消失','抽屉里有一张烧掉一半的旧报纸，日期是三年前','窗台上放着半杯凉透的茶，杯底沉着细小的黑色颗粒','书架后藏着一本用密码写成的日记','门锁是从外面被撬开的，但屋里没有翻动的痕迹','墙上用粉笔画着一个扭曲的符号，笔迹很新','死者衣袋里有一张船票，目的地是个地图上找不到的岛','电话机听筒里传出断断续续的电台杂音，夹杂着人声','地下室地板下埋着一只上了锁的锡盒','镜子上用指腹写着一个字：「逃」','桌上摆着一封未寄出的信，收信人是死者自己','壁炉灰烬里有一片烧焦的羽毛，漆黑发亮','走廊尽头传来滴水声，但那里并没有水管','死者生前最后一通电话打给了城外的疗养院','访客登记簿上有一个名字被反复涂改过','阁楼里挂着一幅画，画中人物的脸与死者一模一样','后院的老树根部露出一截锈蚀的铁链'];
var RANDOM_ITEMS = ['一枚磨得发亮的银币','一包皱巴巴的香烟和火柴','半块吃剩的干面包','一封未寄出的信','老式的黄铜怀表','一把折叠小刀','脏兮兮的手帕','写满数字的便签纸','一小瓶气味刺鼻的药水','褪色的全家福照片','一串陌生的钥匙','口袋圣经，书页间夹着干花','半截铅笔和记账本','一只装着泥土的旧袜子','木质烟斗','没电的手电筒','孩子的玩具弹珠','一团打不开的绳结','碎了一半的眼镜','来自远方的明信片','一支派克钢笔','一把口琴','铜制煤油打火机','油布雨衣','一本手抄乐谱'];
var RANDOM_TRAITS = ['个子不高，说话时习惯搓手','总是眯着眼，仿佛在打量什么','手指上有陈旧的灼伤疤痕','嗓音沙哑，语速很慢','衣着得体但袖口磨损','身上带着淡淡的药水味','笑起来只牵动一边嘴角','眼神涣散，似乎总是走神','走路几乎没有脚步声','口袋里叮当作响，装满了零碎物件','说话时喜欢引用报纸上的话','一紧张就开始咬指甲','戴着过时的圆框眼镜','对猫异常亲近','语速飞快，思维跳跃','左手无名指上有一道细疤'];

Page({
  data: {
    // --- 任务 ---
    tasks: [],
    filteredTasks: [],
    taskSearch: '',
    flashKey: '',
    currentTaskId: null,
    currentTask: null,
    viewingType: '',
    viewingData: null,
    viewingIndex: -1,
    detailScrollTop: 0,
    showCreateTask: false,
    createTaskName: '',
    showCombatDialog: false,
    combatOrder: [],
    combatHasTies: false,
    combatTieNames: '',
    combatCurrent: -1,
    showNpcDetail: false,
    npcDetail: null,
    showMadnessDialog: false,

    // --- NPC 编辑 ---
    showEditNPC: false,
    editNpcIndex: -1,
    editNpcName: '',
    editNpcDex: '',
    editNpcDb: '',
    editNpcArmor: '',
    editNpcHp: '',
    editNpcMp: '',
    editNpcAttack: '',
    editNpcData: '',

    // --- 手动新建调查员 ---
    showNewPlayer: false,
    newPlayerName: '',
    newPlayerOcc: '',
    newPlayerHp: '',
    newPlayerSan: '',
    newPlayerMp: '',
    newPlayerLuck: '',
    newPlayerDex: '',

    // --- 导入弹窗 ---
    showImportNpcDialog: false,
    showImportPlayerDialog: false,
    npcSampleText: NPC_SAMPLE_TEXT,

    // --- 疯狂发作 ---
    madnessType: 'immediate',
    madnessSteps: [],
    madnessStep: 0,
    madnessResult: null,
    madnessResultParts: [],
    madnessRolling: false,
    showMadnessSteps: false,

    // --- 掷骰 ---
    showDiceDialog: false,
    diceSelected: {},
    diceRolling: false,
    diceResult: null,
    diceHistory: [],
    dice100Mode: 'normal', // normal | bonus1 | bonus2 | penalty1 | penalty2

    // --- NPC 模板库 ---
    showNpcTemplates: false,
    npcTemplateCats: NPC_TEMPLATE_CATS,
    npcTemplatesByCat: NPC_TEMPLATES_BY_CAT,
    tplCat: 'urban',

    // --- 随机生成器 ---
    showRandomDialog: false,
    randomResult: null,
    randomNpc: null,

    // --- 词汇表 ---
    showLexiconDialog: false,
    lexiconCats: KEEPERS_LEXICON_CATS,
    lexiconByCat: KEEPERS_LEXICON,
    lexiconCat: 'atm',

    // --- 任务导入导出 ---
    showExportTaskDialog: false,

    // --- 检定助手 ---
    showCheckDialog: false,
    checkTitle: '',
    checkTotal: 50,
    checkMode: 'normal',
    checkDice: null,
    checkLevel: null,
    checkRolling: false,
    checkAttack: '',
    checkDb: '',
    checkDamage: null,
  },

  _lastDiceLongpress: 0,

  onLoad() { this.loadTasks(); },
  onShow() { this.loadTasks(); },

  // ==================== 任务存储 ====================
  loadTasks() {
    var tasks = wx.getStorageSync(STORAGE_KEY) || [];
    this._enrichTasks(tasks);
    this.setData({ tasks: tasks });
    this._applyTaskFilter();
    if (this.data.currentTaskId) {
      var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
      if (task) this.setData({ currentTask: task });
      else this.setData({ currentTaskId: null, currentTask: null });
    }
  },

  saveTasks(tasks) {
    var that = this;
    // 标记当前任务的最后编辑时间（用于列表排序展示）
    if (this.data.currentTaskId) {
      var cur = tasks.find(function (t) { return t.id === that.data.currentTaskId; });
      if (cur) cur.updatedAt = Date.now();
    }
    tasks.sort(function (a, b) { return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0); });
    this._enrichTasks(tasks);
    wx.setStorageSync(STORAGE_KEY, tasks);
    this.setData({ tasks: tasks });
    this._applyTaskFilter();
  },

  // 任务列表数据补充：攻击显示文本 / 预览摘要 / 时间文案
  _enrichTasks(tasks) {
    var that = this;
    tasks.forEach(function (t) {
      t.timeText = that._fmtTime(t.updatedAt || t.createdAt);
      (t.npcs || []).forEach(function (n) {
        n.attackDisplay = n.attack ? that._buildAttackDisplay(n.attack, n.data) : '';
        if (!n.armor) n.armor = extractArmor(n.data);
      });
    });
  },

  _fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var h = d.getHours(), m = d.getMinutes();
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },

  // 攻击显示文本：为没有百分比的攻击段补上技能值（如「斗殴 1D3+DB」→「斗殴 50% 1D3+DB」）
  _buildAttackDisplay(attack, data) {
    var skillsLine = (data || '').match(/(?:^|\n)\s*技能[：:]([^\n]*)/i);
    var skillsText = skillsLine ? skillsLine[1] : '';
    return attack.split('/').map(function (seg) {
      var s = seg.trim();
      if (/(\d+)%/.test(s)) return s;
      var name = s.split(/[\s\u3000]+/)[0].trim();
      var sm = skillsText.match(new RegExp(name + '\\s*(\\d+)%'));
      return sm ? name + ' ' + sm[1] + '% ' + s.slice(name.length).trim() : s;
    }).join(' / ');
  },

  _applyTaskFilter() {
    var q = (this.data.taskSearch || '').trim();
    var list = this.data.tasks;
    var filtered = q ? list.filter(function (t) { return t.name.indexOf(q) > -1; }) : list;
    this.setData({ filteredTasks: filtered });
  },

  // ==================== 任务管理 ====================
  createTask() {
    this.setData({ showCreateTask: true, createTaskName: '' });
  },

  closeCreateTask() {
    this.setData({ showCreateTask: false, createTaskName: '' });
  },

  onTaskNameInput(e) {
    this.setData({ createTaskName: e.detail.value });
  },

  confirmCreateTask() {
    var name = this.data.createTaskName.trim();
    if (!name) { wx.showToast({ title: '请输入任务名称', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = { id: Date.now(), name: name, createdAt: Date.now(), players: [], npcs: [] };
    tasks.unshift(task);
    this.saveTasks(tasks);
    this.selectTaskById(task.id);
    this.setData({ showCreateTask: false, createTaskName: '' });
  },

  selectTask(e) {
    this.selectTaskById(e.currentTarget.dataset.id);
  },

  selectTaskById(id) {
    var task = this.data.tasks.find(function (t) { return t.id === id; });
    if (task) {
      this._closeAllDialogs();
      this.setData({ currentTaskId: id, currentTask: task, viewingType: '', viewingData: null });
    }
  },

  deleteTask(e) {
    var id = e.currentTarget.dataset.id;
    var task = this.data.tasks.find(function (t) { return t.id === id; });
    var that = this;
    wx.showModal({
      title: '删除任务',
      content: '确定删除「' + (task ? task.name : '') + '」及其所有数据吗？',
      success: function (res) {
        if (!res.confirm) return;
        var tasks = that.data.tasks.filter(function (t) { return t.id !== id; });
        that.saveTasks(tasks);
        if (that.data.currentTaskId === id) {
          that._closeAllDialogs();
          that.setData({ currentTaskId: null, currentTask: null, viewingType: '', viewingData: null });
        }
      }
    });
  },

  onTaskSearchInput(e) {
    this.setData({ taskSearch: e.detail.value });
    this._applyTaskFilter();
  },

  duplicateTask(e) {
    var id = e.currentTarget.dataset.id;
    var task = this.data.tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    var copy = JSON.parse(JSON.stringify(task));
    copy.id = Date.now();
    copy.name = task.name + '（副本）';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    var tasks = this.data.tasks;
    tasks.unshift(copy);
    this.saveTasks(tasks);
    wx.showToast({ title: '✅ 已复制为「' + copy.name + '」', icon: 'success' });
  },

  backToList() {
    this._closeAllDialogs();
    this.setData({ currentTaskId: null, currentTask: null, viewingType: '', viewingData: null });
  },

  // ==================== 导入 ====================
  // ==================== 导入（弹窗入口） ====================
  openImportPlayerDialog() { this.setData({ showImportPlayerDialog: true }); },
  closeImportPlayerDialog() { this.setData({ showImportPlayerDialog: false }); },
  openImportNpcDialog() { this.setData({ showImportNpcDialog: true }); },
  closeImportNpcDialog() { this.setData({ showImportNpcDialog: false }); },

  copyNpcSample() {
    wx.setClipboardData({
      data: NPC_SAMPLE_TEXT,
      success: function () { wx.showToast({ title: '样例已复制', icon: 'success', duration: 1200 }); }
    });
  },

  doImportPlayer() {
    var that = this;
    wx.getClipboardData({
      success: function (res) {
        try {
          var data = JSON.parse(res.data);
          if (!data.attrValues || !data.charInfo) {
            wx.showToast({ title: '剪贴板内容不是有效的调查员数据', icon: 'none' }); return;
          }
          var tasks = that.data.tasks;
          var task = tasks.find(function (t) { return t.id === that.data.currentTaskId; });
          if (!task) return;
          var name = data.charInfo.name || '未命名';
          if (task.players.find(function (p) { return p.charInfo && p.charInfo.name === name; })) {
            wx.showToast({ title: '已存在同名调查员「' + name + '」', icon: 'none' }); return;
          }
          task.players.push(data);
          that.saveTasks(tasks);
          that.setData({ currentTask: task, showImportPlayerDialog: false });
          wx.showToast({ title: '✅ 已导入「' + name + '」', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '数据解析失败，请检查剪贴板', icon: 'none' });
        }
      },
      fail: function () { wx.showToast({ title: '读取剪贴板失败，请先复制调查员数据', icon: 'none' }); }
    });
  },

  doImportNpc() {
    var that = this;
    wx.getClipboardData({
      success: function (res) {
        var text = (res.data || '').trim();
        if (!text) { wx.showToast({ title: '剪贴板为空，请先复制 NPC 数据', icon: 'none' }); return; }
        var lines = text.split('\n');
        var name = lines[0].trim() || '未命名 NPC';
        var dexMatch = text.match(/DEX\s*(\d+)/i);
        var dex = dexMatch ? parseInt(dexMatch[1]) : null;
        var hpMatch = text.match(/\bHP[：:\s]*(\d+)/i);
        var hp = hpMatch ? parseInt(hpMatch[1]) : null;
        var mpMatch = text.match(/\bMP[：:\s]*(\d+)/i);
        var mp = mpMatch ? parseInt(mpMatch[1]) : null;
        // 尝试提取攻击方式行（如「攻击：斗殴 1D3+DB / 手枪 1D10」，行首匹配，避免误抓描述文字），提取不到则留空，可在编辑中手填
        var attackMatch = text.match(/(?:^|\n)\s*(?:攻击|攻撃|Attack)\s*[：:]\s*([^\n\r]+)/i);
        var attack = attackMatch ? attackMatch[1].trim() : '';
        // 尝试提取 DB（伤害加值，如「DB +1D4」）
        var dbMatch = text.match(/\bDB\s*([+\-−]?\d*D\d+|[+\-−]?0)\b/i);
        var db = dbMatch ? dbMatch[1].trim() : '';
        var tasks = that.data.tasks;
        var task = tasks.find(function (t) { return t.id === that.data.currentTaskId; });
        if (!task) return;
        task.npcs.push({ id: Date.now(), name: name, dex: dex, hp: hp, mp: mp, attack: attack, db: db, armor: extractArmor(text), data: text, visible: true });
        that.saveTasks(tasks);
        that.setData({ currentTask: task, showImportNpcDialog: false });
        var dexInfo = dex !== null ? ' (DEX ' + dex + ')' : '';
        wx.showToast({ title: '✅ 已导入「' + name + '」' + dexInfo, icon: 'success' });
      },
      fail: function () { wx.showToast({ title: '读取剪贴板失败，请先复制 NPC 数据', icon: 'none' }); }
    });
  },

  // ==================== 手动新建调查员 ====================
  openNewPlayer() {
    this.setData({
      showNewPlayer: true, showImportPlayerDialog: false,
      newPlayerName: '', newPlayerOcc: '', newPlayerHp: '', newPlayerSan: '', newPlayerMp: '', newPlayerLuck: '', newPlayerDex: ''
    });
  },
  closeNewPlayer() { this.setData({ showNewPlayer: false }); },
  onNewPlayerNameInput(e) { this.setData({ newPlayerName: e.detail.value }); },
  onNewPlayerOccInput(e) { this.setData({ newPlayerOcc: e.detail.value }); },
  onNewPlayerHpInput(e) { this.setData({ newPlayerHp: e.detail.value }); },
  onNewPlayerSanInput(e) { this.setData({ newPlayerSan: e.detail.value }); },
  onNewPlayerMpInput(e) { this.setData({ newPlayerMp: e.detail.value }); },
  onNewPlayerLuckInput(e) { this.setData({ newPlayerLuck: e.detail.value }); },
  onNewPlayerDexInput(e) { this.setData({ newPlayerDex: e.detail.value }); },

  confirmNewPlayer() {
    var name = this.data.newPlayerName.trim();
    if (!name) { wx.showToast({ title: '请输入调查员名称', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    if (task.players.find(function (p) { return p.charInfo && p.charInfo.name === name; })) {
      wx.showToast({ title: '已存在同名调查员「' + name + '」', icon: 'none' }); return;
    }
    // 数字字段：留空 = 不填（可选）；填了非法则提示
    var that = this;
    var parseNum = function (raw, label) {
      if (!raw.trim()) return null;
      var v = parseInt(raw.trim());
      if (isNaN(v) || v < 0) { wx.showToast({ title: label + ' 请输入有效数字', icon: 'none' }); return undefined; }
      return v;
    };
    var hp = parseNum(this.data.newPlayerHp, 'HP');
    if (hp === undefined) return;
    var san = parseNum(this.data.newPlayerSan, 'SAN');
    if (san === undefined) return;
    var mp = parseNum(this.data.newPlayerMp, 'MP');
    if (mp === undefined) return;
    var luck = parseNum(this.data.newPlayerLuck, 'LUCK');
    if (luck === undefined) return;
    var dex = parseNum(this.data.newPlayerDex, 'DEX');
    if (dex === undefined) return;

    var occ = this.data.newPlayerOcc.trim();
    var derived = {};
    if (hp !== null) derived.hp = hp;
    if (san !== null) derived.san = san;
    if (mp !== null) derived.mp = mp;
    var attrValues = {};
    if (dex !== null) attrValues.dex = dex;
    if (luck !== null) attrValues.luck = luck;

    task.players.push({
      charInfo: { name: name },
      selectedOcc: occ ? { name: occ } : null,
      derived: derived,
      attrValues: attrValues,
      playHP: hp !== null ? hp : undefined,
      playSAN: san !== null ? san : undefined,
      playMP: mp !== null ? mp : undefined,
      playLuck: luck !== null ? luck : undefined,
      visible: true
    });
    this.saveTasks(tasks);
    this.setData({ currentTask: task, showNewPlayer: false });
    wx.showToast({ title: '✅ 已添加「' + name + '」', icon: 'success' });
  },

  // ==================== 详情查看 ====================
  viewPlayer(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({ viewingType: 'player', viewingData: this.data.currentTask.players[index], viewingIndex: index });
  },
  viewNPC(e) {
    var index = e.currentTarget.dataset.index;
    var npc = this.data.currentTask && this.data.currentTask.npcs[index];
    if (!npc) return;
    // 只传轻量字段副本，避免整棵任务对象树参与序列化
    this.setData({
      viewingIndex: index,
      showNpcDetail: true,
      npcDetail: {
        name: npc.name, dex: npc.dex, hp: npc.hp, mp: npc.mp,
        db: npc.db, armor: npc.armor, attack: npc.attack,
        attackDisplay: npc.attackDisplay, data: npc.data || ''
      }
    });
  },

  closeNpcDetail() { this.setData({ showNpcDetail: false }); },
  onPlayerSwiperChange(e) {
    var index = e.detail.current;
    this.setData({ viewingIndex: index, viewingData: this.data.currentTask.players[index] });
  },
  onNPCSwiperChange(e) {
    var index = e.detail.current;
    this.setData({ viewingIndex: index, viewingData: this.data.currentTask.npcs[index] });
  },
  onDetailScroll(e) { this.setData({ detailScrollTop: e.detail.scrollTop }); },
  closeDetail() {
    this._closeAllDialogs();
    this.setData({ viewingType: '', viewingData: null, viewingIndex: -1, detailScrollTop: 0 });
  },

  // ==================== 守密人工具弹窗 ====================
  _closeAllDialogs() {
    this.setData({
      showCombatDialog: false, showMadnessDialog: false, showDiceDialog: false,
      showRandomDialog: false, showExportTaskDialog: false
    });
  },

  // ==================== 战斗轮排序 ====================
  openCombatOrder() {
    var task = this.data.currentTask;
    if (!task) return;
    // 保留上一次的行动状态（死亡标记 / 当前行动者），查阅其他信息后重新打开不重置
    var oldOrder = this.data.combatOrder || [];
    var oldDead = {};
    oldOrder.forEach(function (it) { if (it.dead) oldDead[it.key] = true; });
    var oldCurrentKey = (this.data.combatCurrent >= 0 && oldOrder[this.data.combatCurrent])
      ? oldOrder[this.data.combatCurrent].key : null;

    var items = [];
    task.players.forEach(function (p, i) {
      if (p.visible === false) return;
      var dex = (p.attrValues && p.attrValues.dex) ? p.attrValues.dex : 0;
      items.push({ key: 'p' + i, name: p.charInfo.name || '未命名', dex: dex, type: 'player', dead: !!oldDead['p' + i] });
    });
    task.npcs.forEach(function (n, i) {
      if (n.visible === false) return;
      var dex = n.dex !== null && n.dex !== undefined ? n.dex : 0;
      items.push({ key: 'n' + i, name: n.name, dex: dex, type: 'npc', dead: !!oldDead['n' + i] });
    });
    items.sort(function (a, b) { return b.dex - a.dex; });
    var ties = new Set();
    for (var i = 0; i < items.length - 1; i++) {
      if (items[i].dex === items[i + 1].dex && items[i].dex > 0) { ties.add(i); ties.add(i + 1); }
    }
    var tieNames = [];
    items.forEach(function (item, i) { item.tie = ties.has(i); if (item.tie) tieNames.push(item.name); });
    var newCurrent = -1;
    items.forEach(function (it, i) { if (it.key === oldCurrentKey && !it.dead) newCurrent = i; });
    this.setData({
      showCombatDialog: true, combatOrder: items, combatCurrent: newCurrent,
      combatHasTies: ties.size > 0, combatTieNames: Array.from(new Set(tieNames)).join('、')
    });
  },

  closeCombatDialog() { this.setData({ showCombatDialog: false }); },

  // 战斗轮推进：点名字设为当前行动者
  tapCombatTag(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var item = this.data.combatOrder[index];
    if (!item || item.dead) return;
    this.setData({ combatCurrent: index });
  },

  // 长按标记死亡/复活（战斗中跳过）
  toggleCombatDead(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var items = this.data.combatOrder;
    if (!items[index]) return;
    items[index].dead = !items[index].dead;
    var cur = this.data.combatCurrent;
    if (cur === index) cur = -1;
    this.setData({ combatOrder: items, combatCurrent: cur });
  },

  // 推进到下一个存活角色（循环）
  nextCombatTurn() {
    var items = this.data.combatOrder;
    var aliveIdx = [];
    items.forEach(function (it, i) { if (!it.dead) aliveIdx.push(i); });
    if (aliveIdx.length === 0) { wx.showToast({ title: '没有存活角色了', icon: 'none' }); return; }
    var pos = aliveIdx.indexOf(this.data.combatCurrent);
    var next = pos === -1 ? aliveIdx[0] : aliveIdx[(pos + 1) % aliveIdx.length];
    this.setData({ combatCurrent: next });
  },

  combatReset() {
    var items = this.data.combatOrder;
    items.forEach(function (it) { it.dead = false; });
    this.setData({ combatOrder: items, combatCurrent: -1 });
  },

  // ==================== 删除卡片 ====================
  deletePlayer(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var name = task.players[index].charInfo.name || '未命名';
    var that = this;
    wx.showModal({
      title: '删除调查员', content: '确定从任务中移除「' + name + '」吗？',
      success: function (res) {
        if (!res.confirm) return;
        task.players.splice(index, 1);
        that.saveTasks(tasks);
        that.setData({ currentTask: task, viewingType: '', viewingData: null, viewingIndex: -1 });
      }
    });
  },

  deleteNPC(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var name = task.npcs[index].name;
    var that = this;
    wx.showModal({
      title: '删除 NPC', content: '确定删除 NPC「' + name + '」吗？',
      success: function (res) {
        if (!res.confirm) return;
        task.npcs.splice(index, 1);
        that.saveTasks(tasks);
        that.setData({ currentTask: task, viewingType: '', viewingData: null, viewingIndex: -1 });
      }
    });
  },

  // ==================== NPC 可见性 ====================
  togglePlayerVisible(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.players[index]) return;
    task.players[index].visible = task.players[index].visible === false ? true : false;
    this.saveTasks(tasks);
    this.setData({ currentTask: task });
  },

  toggleNpcVisible(e) {
    var index = e.currentTarget.dataset.index;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.npcs[index]) return;
    // 默认视为可见，所以 undefined / true → false，false → true
    task.npcs[index].visible = task.npcs[index].visible === false ? true : false;
    this.saveTasks(tasks);
    this._flashStat('p' + index + '-' + key);
    this.setData({ currentTask: task });
  },

  // ==================== NPC 编辑 / 手动新建 ====================
  openNewNPC() {
    this.setData({
      showEditNPC: true, editNpcIndex: -1,
      editNpcName: '', editNpcDex: '', editNpcDb: '', editNpcArmor: '', editNpcHp: '', editNpcMp: '', editNpcAttack: '', editNpcData: ''
    });
  },

  editNPC(e) {
    var index = e.currentTarget.dataset.index;
    var task = this.data.currentTask;
    if (!task || !task.npcs[index]) return;
    var npc = task.npcs[index];
    this.setData({
      showEditNPC: true,
      editNpcIndex: index,
      editNpcName: npc.name || '',
      editNpcDex: npc.dex !== null && npc.dex !== undefined ? String(npc.dex) : '',
      editNpcDb: npc.db || '',
      editNpcArmor: npc.armor || '',
      editNpcHp: npc.hp !== null && npc.hp !== undefined ? String(npc.hp) : '',
      editNpcMp: npc.mp !== null && npc.mp !== undefined ? String(npc.mp) : '',
      editNpcAttack: npc.attack || '',
      editNpcData: npc.data || ''
    });
  },

  closeEditNPC() {
    this.setData({ showEditNPC: false, editNpcIndex: -1, editNpcName: '', editNpcDex: '', editNpcDb: '', editNpcArmor: '', editNpcHp: '', editNpcMp: '', editNpcAttack: '', editNpcData: '' });
  },

  onEditNpcNameInput(e) { this.setData({ editNpcName: e.detail.value }); },
  onEditNpcDexInput(e) { this.setData({ editNpcDex: e.detail.value }); },
  onEditNpcDbInput(e) { this.setData({ editNpcDb: e.detail.value }); },
  onEditNpcArmorInput(e) { this.setData({ editNpcArmor: e.detail.value }); },
  onEditNpcHpInput(e) { this.setData({ editNpcHp: e.detail.value }); },
  onEditNpcMpInput(e) { this.setData({ editNpcMp: e.detail.value }); },
  onEditNpcAttackInput(e) { this.setData({ editNpcAttack: e.detail.value }); },
  onEditNpcDataInput(e) { this.setData({ editNpcData: e.detail.value }); },

  confirmEditNPC() {
    var name = this.data.editNpcName.trim();
    if (!name) { wx.showToast({ title: '请输入 NPC 名称', icon: 'none' }); return; }
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var idx = this.data.editNpcIndex;
    var isNew = idx === -1;
    if (!isNew && !task.npcs[idx]) return;

    var dexRaw = this.data.editNpcDex.trim();
    var dex = dexRaw ? parseInt(dexRaw) : null;
    if (dexRaw && (isNaN(dex) || dex < 0)) {
      wx.showToast({ title: 'DEX 请输入有效数字', icon: 'none' }); return;
    }

    var hpRaw = this.data.editNpcHp.trim();
    var hp = hpRaw ? parseInt(hpRaw) : null;
    if (hpRaw && (isNaN(hp) || hp < 0)) {
      wx.showToast({ title: 'HP 请输入有效数字', icon: 'none' }); return;
    }

    var mpRaw = this.data.editNpcMp.trim();
    var mp = mpRaw ? parseInt(mpRaw) : null;
    if (mpRaw && (isNaN(mp) || mp < 0)) {
      wx.showToast({ title: 'MP 请输入有效数字', icon: 'none' }); return;
    }

    if (isNew) {
      task.npcs.push({
        id: Date.now(), name: name, dex: dex, hp: hp, mp: mp,
        db: this.data.editNpcDb.trim(),
        armor: this.data.editNpcArmor.trim(),
        attack: this.data.editNpcAttack.trim(),
        data: this.data.editNpcData,
        visible: true
      });
    } else {
      task.npcs[idx].name = name;
      task.npcs[idx].dex = dex;
      task.npcs[idx].db = this.data.editNpcDb.trim();
      task.npcs[idx].armor = this.data.editNpcArmor.trim();
      task.npcs[idx].hp = hp;
      task.npcs[idx].mp = mp;
      task.npcs[idx].attack = this.data.editNpcAttack.trim();
      task.npcs[idx].data = this.data.editNpcData;
    }

    this.saveTasks(tasks);
    this.setData({ currentTask: task });
    this.setData({ showEditNPC: false, editNpcIndex: -1, editNpcName: '', editNpcDex: '', editNpcDb: '', editNpcArmor: '', editNpcHp: '', editNpcMp: '', editNpcAttack: '', editNpcData: '' });
    wx.showToast({ title: isNew ? '✅ NPC 已创建' : '✅ NPC 已更新', icon: 'success' });
  },

  // ==================== NPC HP / MP 调节 ====================
  adjustNpcHp(e) {
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    this._adjustNpcStat('hp', delta);
  },
  adjustNpcMp(e) {
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    this._adjustNpcStat('mp', delta);
  },
  _adjustNpcStat(key, delta) {
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var idx = this.data.viewingIndex;
    var npc = task.npcs[idx];
    if (!npc) return;
    if (npc[key] === null || npc[key] === undefined) {
      npc[key] = Math.max(0, delta);
    } else {
      npc[key] = Math.max(0, npc[key] + delta);
    }
    this.saveTasks(tasks);
    this.setData({
      currentTask: task,
      npcDetail: { name: npc.name, dex: npc.dex, hp: npc.hp, mp: npc.mp, db: npc.db, armor: npc.armor, attack: npc.attack, attackDisplay: npc.attackDisplay, data: npc.data || '' }
    });
  },

  // 卡片快捷加减（无需进入详情页）
  adjustNpcCardStat(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var key = e.currentTarget.dataset.key;
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.npcs[index]) return;
    var npc = task.npcs[index];
    if (npc[key] === null || npc[key] === undefined) {
      npc[key] = Math.max(0, delta);
    } else {
      npc[key] = Math.max(0, npc[key] + delta);
    }
    this.saveTasks(tasks);
    this._flashStat('n' + index + '-' + key);
    this.setData({ currentTask: task });
  },

  // 数值变化动效：短暂高亮当前变化的属性值
  _flashStat(key) {
    var that = this;
    this.setData({ flashKey: key });
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(function () { that.setData({ flashKey: '' }); }, 500);
  },

  // 调查员卡片快捷加减（HP / SAN / MP）
  adjustPlayerStat(e) {
    var index = parseInt(e.currentTarget.dataset.index);
    var key = e.currentTarget.dataset.key; // hp | san | mp
    var delta = parseInt(e.currentTarget.dataset.delta) || 0;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task || !task.players[index]) return;
    var p = task.players[index];
    var derived = p.derived || {};
    var maxVal = key === 'hp' ? derived.hp : key === 'san' ? derived.san : derived.mp;
    var field = 'play' + key.toUpperCase();
    var cur = p[field] !== undefined ? p[field] : (maxVal !== undefined ? maxVal : 0);
    var next = Math.max(0, cur + delta);
    p[field] = next;

    if (key === 'hp' && next <= 0) {
      wx.showToast({ title: '💀 生命归零：昏迷 / 濒死', icon: 'none' });
    } else if (key === 'san') {
      var loss = cur - next;
      if (next <= 0) {
        wx.showToast({ title: '🧠 SAN 归零：永久疯狂', icon: 'none' });
      } else if (loss >= Math.floor(maxVal / 5)) {
        // 单次损失 ≥ 最大 SAN 的 1/5 → 临时疯狂，直连疯狂发作
        this.setData({
          showMadnessDialog: true, showMadnessSteps: false, madnessStep: 0,
          madnessSteps: [], madnessResult: null, madnessResultParts: []
        });
        wx.showToast({ title: '🌀 临时疯狂！已打开疯狂发作', icon: 'none', duration: 1800 });
      }
    }
    this.saveTasks(tasks);
    this.setData({ currentTask: task });
  },

  // ==================== 疯狂发作 ====================
  openMadness() {
    this.setData({ showMadnessDialog: true, showMadnessSteps: false, madnessStep: 0, madnessSteps: [], madnessResult: null, madnessResultParts: [] });
  },

  closeMadness() { this.setData({ showMadnessDialog: false }); },

  switchMadnessType(e) {
    var type = e.currentTarget.dataset.type;
    this.setData({ madnessType: type, showMadnessSteps: false, madnessStep: 0, madnessSteps: [], madnessResult: null, madnessResultParts: [] });
  },

  doMadnessRoll() {
    if (this.data.madnessRolling) return;
    var isImmediate = this.data.madnessType === 'immediate';
    var table = isImmediate ? IMMEDIATE_SYMPTOMS : SUMMARY_SYMPTOMS;
    var that = this;
    var DELAY = 500;

    this.setData({ madnessRolling: true, showMadnessSteps: true, madnessStep: 0, madnessSteps: [], madnessResult: null, madnessResultParts: [] });

    setTimeout(function () {
      var d10 = rollD10();
      var symptom = table[d10];
      var steps = [{ label: '1D10', value: d10, detail: symptom.name }];
      that.setData({ madnessStep: 1, madnessSteps: steps });

      if (symptom.needsPhobia || symptom.needsMania) {
        setTimeout(function () {
          var d100 = rollD100();
          var subEntry = symptom.needsPhobia ? PHOBIAS[d100 - 1] : MANIAS[d100 - 1];
          var subLabel = symptom.needsPhobia ? '恐惧症 1D100' : '躁狂症 1D100';
          steps.push({ label: subLabel, value: d100, detail: subEntry.name + '：' + subEntry.desc });
          that.setData({ madnessStep: 2, madnessSteps: steps });
          that._scheduleMadnessDuration(symptom, steps, isImmediate, DELAY);
        }, DELAY);
      } else {
        that._scheduleMadnessDuration(symptom, steps, isImmediate, DELAY);
      }
    }, DELAY);
  },

  _scheduleMadnessDuration(symptom, steps, isImmediate, delay) {
    var that = this;
    setTimeout(function () {
      var dur = symptom.duration;
      var durStep = null;
      if (dur) {
        var durRoll = rollD10();
        durStep = { label: '持续时间 ' + dur.dice, value: durRoll, detail: durRoll + ' ' + dur.unit + (dur.note || '') };
        steps.push(durStep);
      }
      var finalStep = durStep ? 3 : (symptom.needsPhobia || symptom.needsMania ? 2 : 1);
      that.setData({ madnessStep: finalStep, madnessSteps: steps, madnessRolling: false });
      that._buildMadnessResult(symptom, steps, isImmediate, durStep);
    }, delay);
  },

  _buildMadnessResult(symptom, steps, isImmediate, durStep) {
    var parts = [];
    var typeLabel = isImmediate ? '即时症状' : '总结症状';
    parts.push({ label: '疯狂类型', value: typeLabel });
    parts.push({ label: '1D10 结果', value: steps[0].value + ' — ' + symptom.name });
    parts.push({ label: '症状描述', value: symptom.desc });

    if (steps.length >= 2 && (symptom.needsPhobia || symptom.needsMania)) {
      var subLabel = symptom.needsPhobia ? '恐惧症' : '躁狂症';
      parts.push({ label: subLabel + ' 1D100', value: steps[1].value + ' — ' + steps[1].detail });
    }
    if (durStep) {
      parts.push({ label: '持续时间', value: durStep.detail });
    }

    var txt = '【' + typeLabel + '】\n';
    txt += '1D10 = ' + steps[0].value + '：' + symptom.name + '\n';
    txt += symptom.desc;
    if (steps.length >= 2 && (symptom.needsPhobia || symptom.needsMania)) {
      var sl = symptom.needsPhobia ? '恐惧症' : '躁狂症';
      txt += '\n\n' + sl + ' 1D100 = ' + steps[1].value + '：' + steps[1].detail;
    }
    if (durStep) txt += '\n\n持续时间：' + durStep.detail;

    this.setData({ madnessResult: txt, madnessResultParts: parts });
  },

  // ==================== 掷骰 ====================
  openDice() { this.setData({ showDiceDialog: true }); },
  closeDice() { this.setData({ showDiceDialog: false }); },

  // ==================== 检定助手 ====================
  _openCheck(title, total) {
    this.setData({
      showCheckDialog: true, checkTitle: title, checkTotal: total,
      checkMode: 'normal', checkDice: null, checkLevel: null, checkRolling: false
    });
  },

  closeCheckDialog() { this.setData({ showCheckDialog: false }); },

  // 调查员技能检定（详情页技能网格点击）
  openSkillCheck(e) {
    var skill = e.currentTarget.dataset.skill || '';
    var total = parseInt(e.currentTarget.dataset.total);
    if (isNaN(total)) return;
    this.setData({ checkAttack: '', checkDb: '', checkDamage: null });
    this._openCheck(skill, total);
  },

  // NPC 攻击检定（卡片/详情攻击行点击，自动提取技能值）
  // 优先取攻击文本里的百分比（如「爪击 25%」）；没有则按攻击名从数据「技能：」行匹配（如「斗殴 50%」）
  openAttackCheck(e) {
    var attack = e.currentTarget.dataset.attack;
    if (!attack) return;
    var index = parseInt(e.currentTarget.dataset.index);
    var first = attack.split('/')[0].trim();
    var attackName = first.split(/[\s\u3000]+/)[0].trim();
    var m = first.match(/(\d+)%/);
    var total = m ? parseInt(m[1]) : null;
    if (!total) {
      var task = this.data.currentTask;
      var npc = task && task.npcs[index];
      if (npc && npc.data) {
        var skillsLine = npc.data.match(/(?:^|\n)\s*技能[：:]([^\n]*)/i);
        if (skillsLine) {
          var sm = skillsLine[1].match(new RegExp(attackName + '\\s*(\\d+)%'));
          if (sm) total = parseInt(sm[1]);
        }
      }
    }
    if (!total) {
      wx.showToast({ title: '未找到「' + attackName + '」的技能值，可在编辑中补充', icon: 'none' }); return;
    }
    var npc = (this.data.currentTask && this.data.currentTask.npcs[index]) || null;
    this.setData({ checkAttack: attack, checkDb: (npc && npc.db) || '', checkDamage: null });
    this._openCheck(attackName || first, total);
  },

  setCheckMode(e) {
    if (this.data.checkRolling) return;
    this.setData({ checkMode: e.currentTarget.dataset.mode, checkDice: null, checkLevel: null });
  },

  // COC 7 判定：1 大成功；96-100 且高于技能 大失败；≤1/5 极难；≤1/2 困难；≤技能 普通；其余失败
  _judgeCheck(total, d100) {
    if (d100 === 1) return { text: '大成功！', cls: 'critical' };
    if (d100 >= 96 && d100 > total) return { text: '大失败！', cls: 'fumble' };
    if (d100 <= Math.floor(total / 5)) return { text: '极难成功', cls: 'extreme' };
    if (d100 <= Math.floor(total / 2)) return { text: '困难成功', cls: 'hard' };
    if (d100 <= total) return { text: '普通成功', cls: 'success' };
    return { text: '失败', cls: 'fail' };
  },

  doCheckRoll() {
    if (this.data.checkRolling) return;
    var mode = this.data.checkMode === 'bonus' ? 'bonus1' : this.data.checkMode === 'penalty' ? 'penalty1' : 'normal';
    var that = this;
    this.setData({ checkRolling: true, checkDice: null, checkLevel: null });
    wx.vibrateShort({ type: 'medium', fail: function () {} });
    setTimeout(function () {
      var dice = that._rollD100(mode);
      var level = that._judgeCheck(that.data.checkTotal, dice.result);
      that.setData({ checkRolling: false, checkDice: dice, checkLevel: level });
    }, 600);
  },

  // 掷伤害：从攻击文本解析伤害表达式，DB 自动代入（如 1D6+DB → 1D6+1D4）
  doDamageRoll() {
    var attack = this.data.checkAttack;
    if (!attack) return;
    var first = attack.split('/')[0];
    var m = first.match(/(\d+D\d+)(\s*[+\-−]\s*DB)?/i);
    if (!m) {
      wx.showToast({ title: '未能解析伤害表达式（如 1D6+DB）', icon: 'none' }); return;
    }
    var dbDice = (this.data.checkDb || '').match(/(\d+D\d+)/i);
    var rollExpr = m[0];
    if (m[2] && dbDice) rollExpr = rollExpr.replace(/DB/i, dbDice[1]);
    // 掷出所有 NdM 骰子并累加常数
    var total = 0;
    var parts = [];
    var re = /(\d+)D(\d+)/gi;
    var mm;
    while ((mm = re.exec(rollExpr)) !== null) {
      var n = parseInt(mm[1]), s = parseInt(mm[2]);
      var sum = 0;
      for (var i = 0; i < n; i++) sum += 1 + Math.floor(Math.random() * s);
      total += sum;
      parts.push(mm[0] + '=' + sum);
    }
    var constM = rollExpr.replace(re, ' ').match(/[+\-−]\s*\d+/g);
    if (constM) {
      constM.forEach(function (c) {
        var v = parseInt(c.replace(/[+\-−]/g, '').trim());
        total += c.indexOf('-') > -1 ? -v : v;
      });
    }
    wx.vibrateShort({ type: 'light', fail: function () {} });
    this.setData({ checkDamage: { expr: rollExpr, total: total, parts: parts, partsStr: parts.join(' · ') } });
  },

  _diceRoll(d) { return Math.floor(Math.random() * d) + 1; },

  selectDice(e) {
    if (this.data.diceRolling) return;
    var now = Date.now();
    if (now - this._lastDiceLongpress < 400) return;
    var d = parseInt(e.currentTarget.dataset.d);
    var sel = {};
    var keys = Object.keys(this.data.diceSelected);
    for (var i = 0; i < keys.length; i++) { sel[keys[i]] = this.data.diceSelected[keys[i]]; }
    sel[d] = (sel[d] || 0) + 1;
    this.setData({ diceSelected: sel, diceResult: null });
  },

  deselectDice(e) {
    if (this.data.diceRolling) return;
    this._lastDiceLongpress = Date.now();
    var d = parseInt(e.currentTarget.dataset.d);
    var sel = {};
    var keys = Object.keys(this.data.diceSelected);
    for (var i = 0; i < keys.length; i++) { sel[keys[i]] = this.data.diceSelected[keys[i]]; }
    if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; }
    this.setData({ diceSelected: sel, diceResult: null });
  },

  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },

  clearDiceHistory() { this.setData({ diceHistory: [] }); },

  // --- 百分骰奖励/惩罚骰模式 ---
  setDice100Mode(e) {
    if (this.data.diceRolling) return;
    var mode = e.currentTarget.dataset.mode;
    if (mode === this.data.dice100Mode) mode = 'normal'; // 再点一次取消
    this.setData({ dice100Mode: mode, diceResult: null });
  },

  // COC 规则：十位骰 0-90，个位骰 0-9；奖励骰多掷十位取小，惩罚骰取大；00+0 = 100
  _rollD100(mode) {
    var tensCount = mode === 'normal' ? 1 : (mode === 'bonus1' || mode === 'penalty1') ? 2 : 3;
    var tens = [];
    for (var i = 0; i < tensCount; i++) tens.push((this._diceRoll(10) - 1) * 10);
    var ones = this._diceRoll(10) - 1;
    var chosen;
    if (mode === 'bonus1' || mode === 'bonus2') chosen = Math.min.apply(null, tens);
    else if (mode === 'penalty1' || mode === 'penalty2') chosen = Math.max.apply(null, tens);
    else chosen = tens[0];
    var result = chosen + ones;
    if (chosen === 0 && ones === 0) result = 100;
    return { sides: 100, result: result, mode: mode, tens: tens, tensStr: tens.join('|'), chosen: chosen, ones: ones };
  },

  rollSelected() {
    var sel = this.data.diceSelected;
    var keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null });
    wx.vibrateShort({ type: 'medium', fail: function () {} });
    var that = this;
    var mode = this.data.dice100Mode;
    var dice = [];
    var total = 0;
    keys.forEach(function (k) {
      var sides = parseInt(k);
      var count = sel[k];
      for (var i = 0; i < count; i++) {
        var r = (sides === 100 && mode !== 'normal') ? that._rollD100(mode) : { sides: sides, result: that._diceRoll(sides) };
        dice.push(r);
        total += r.result;
      }
    });
    setTimeout(function () {
      var result = { dice: dice, total: total, time: new Date().toLocaleTimeString() };
      var history = [result].concat(that.data.diceHistory).slice(0, 50);
      // 奖励/惩罚是一次性的：投完自动回归普通，避免连续投掷误带模式
      that.setData({ diceRolling: false, diceResult: result, diceHistory: history, dice100Mode: 'normal' });
    }, 700);
  },

  // ==================== 任务导入导出 ====================
  openExportTask() { this.setData({ showExportTaskDialog: true }); },
  closeExportTask() { this.setData({ showExportTaskDialog: false }); },

  exportTask() {
    var task = this.data.currentTask;
    if (!task) return;
    var data = JSON.parse(JSON.stringify(task));
    var that = this;
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success: function () {
        wx.showToast({ title: '任务数据已复制到剪贴板', icon: 'success', duration: 1500 });
        that.setData({ showExportTaskDialog: false });
      },
      fail: function () { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  importTask() {
    var that = this;
    wx.getClipboardData({
      success: function (res) {
        var data;
        try { data = JSON.parse(res.data); } catch (e) {
          wx.showToast({ title: '剪贴板中没有有效的任务数据', icon: 'none', duration: 2000 });
          return;
        }
        if (!data.name || !data.players || !data.npcs || data.id === undefined) {
          wx.showToast({ title: '数据格式不符，非任务数据', icon: 'none', duration: 2000 });
          return;
        }
        // 赋予新 ID 避免冲突
        data.id = Date.now();
        data.createdAt = Date.now();
        var tasks = that.data.tasks;
        // 检查同名任务
        if (tasks.find(function (t) { return t.name === data.name; })) {
          wx.showToast({ title: '已存在同名任务「' + data.name + '」，请先重命名', icon: 'none', duration: 2000 });
          return;
        }
        tasks.unshift(data);
        that.saveTasks(tasks);
        that.setData({ showExportTaskDialog: false });
        wx.showToast({ title: '已导入任务「' + data.name + '」', icon: 'success', duration: 1500 });
      },
      fail: function () { wx.showToast({ title: '读取剪贴板失败', icon: 'none', duration: 2000 }); }
    });
  },

  // ==================== NPC 模板库 ====================
  openNpcTemplates() { this.setData({ showNpcTemplates: true }); },
  closeNpcTemplates() { this.setData({ showNpcTemplates: false }); },

  switchTplCat(e) {
    this.setData({ tplCat: e.currentTarget.dataset.id });
  },

  // 同名 NPC 自动编号（深潜者 → 深潜者 2 → 深潜者 3），支持多个同种怪
  _uniqueNpcName(task, name) {
    var base = name;
    var i = 1;
    var candidate = base;
    while (task.npcs.some(function (n) { return n.name === candidate; })) {
      candidate = base + ' ' + (i + 1);
      i++;
    }
    return candidate;
  },

  addNpcFromTemplate(e) {
    var id = e.currentTarget.dataset.id;
    var tpl = NPC_TEMPLATES.find(function (t) { return t.id === id; });
    if (!tpl) return;
    // 攻击方式优先取模板字段，否则从数据文本提取（兼容「攻击：xxx」行）；DB 从数据文本提取（「DB +1D4」）
    var attack = tpl.attack || ((tpl.data.match(/(?:^|\n)\s*(?:攻击|攻撃|Attack)\s*[：:]\s*([^\n\r]+)/i) || [])[1] || '').trim();
    var db = ((tpl.data.match(/\bDB\s*([+\-−]?\d*D\d+|[+\-−]?0)\b/i) || [])[1] || '').trim();
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var name = this._uniqueNpcName(task, tpl.name);
    task.npcs.push({ id: Date.now(), name: name, dex: tpl.dex, hp: tpl.hp, mp: tpl.mp, attack: attack, db: db, armor: extractArmor(tpl.data), data: tpl.data, visible: true });
    this.saveTasks(tasks);
    this.setData({ currentTask: task, showNpcTemplates: false });
    wx.showToast({ title: '✅ 已添加「' + name + '」', icon: 'success' });
  },

  // ==================== 随机生成器 ====================
  openRandom() {
    this.setData({ showRandomDialog: true, randomResult: null, randomNpc: null });
  },

  closeRandom() { this.setData({ showRandomDialog: false }); },

  _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  rollRandomName(e) {
    var type = e.currentTarget.dataset.type;
    var name;
    if (type === 'cn') {
      name = this._pick(RANDOM_SURNAMES_CN) + this._pick(RANDOM_GIVEN_CN);
    } else {
      var female = Math.random() < 0.5;
      var first = female ? this._pick(RANDOM_FIRST_WEST_F) : this._pick(RANDOM_FIRST_WEST_M);
      var last = this._pick(RANDOM_LAST_WEST);
      name = first.cn + '·' + last.cn + '（' + first.en + ' ' + last.en + '）';
    }
    this.setData({ randomResult: { type: type === 'cn' ? '中文名称' : '西式名称（中文译名）', value: name }, randomNpc: null });
  },

  rollRandomClue() {
    this.setData({ randomResult: { type: '随机线索', value: this._pick(RANDOM_CLUES) }, randomNpc: null });
  },

  rollRandomItem() {
    this.setData({ randomResult: { type: '随身物品', value: this._pick(RANDOM_ITEMS) }, randomNpc: null });
  },

  rollRandomNpc() {
    var female = Math.random() < 0.5;
    var name, nameEn = '';
    // 1920s 默认欧美背景：西式名为主（含中文译名），中文名小概率（唐人街等场景）
    if (Math.random() < 0.85) {
      var first = female ? this._pick(RANDOM_FIRST_WEST_F) : this._pick(RANDOM_FIRST_WEST_M);
      var last = this._pick(RANDOM_LAST_WEST);
      name = first.cn + '·' + last.cn;
      nameEn = first.en + ' ' + last.en;
    } else {
      name = this._pick(RANDOM_SURNAMES_CN) + this._pick(RANDOM_GIVEN_CN);
    }
    var job = this._pick(RANDOM_JOBS);
    var trait = this._pick(RANDOM_TRAITS);
    var item = this._pick(RANDOM_ITEMS);
    var clue = this._pick(RANDOM_CLUES);
    var dex = 30 + Math.floor(Math.random() * 40); // 30-69
    var hp = 8 + Math.floor(Math.random() * 7);   // 8-14
    var mp = 5 + Math.floor(Math.random() * 11);  // 5-15
    var data = name + (nameEn ? '（' + nameEn + '）' : '') + '（' + job + '）\n' +
      '外貌/举止：' + trait + '\n' +
      '随身物品：' + item + '\n' +
      '线索：' + clue + '\n' +
      '（守密人即兴 NPC，属性可自行调整）';
    this.setData({ randomNpc: { name: name, job: job, dex: dex, hp: hp, mp: mp, data: data }, randomResult: null });
  },

  copyRandomResult() {
    var value = this.data.randomResult ? this.data.randomResult.value : '';
    if (!value) return;
    wx.setClipboardData({
      data: value,
      success: function () { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  // ==================== 克苏鲁词汇表 ====================
  openLexicon() { this.setData({ showLexiconDialog: true }); },
  closeLexicon() { this.setData({ showLexiconDialog: false }); },
  switchLexiconCat(e) { this.setData({ lexiconCat: e.currentTarget.dataset.id }); },

  copyLexiconItem(e) {
    var w = e.currentTarget.dataset.w || '';
    var d = e.currentTarget.dataset.d || '';
    if (!w) return;
    wx.setClipboardData({
      data: d ? w + '：' + d : w,
      success: function () { wx.showToast({ title: '已复制「' + w + '」', icon: 'success', duration: 1200 }); }
    });
  },

  copyRandomNpc() {
    var npc = this.data.randomNpc;
    if (!npc) return;
    wx.setClipboardData({
      data: npc.data,
      success: function () { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  importRandomNpc() {
    var npc = this.data.randomNpc;
    if (!npc) return;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    task.npcs.push({ id: Date.now(), name: npc.name, dex: npc.dex, hp: npc.hp, mp: npc.mp, data: npc.data, visible: true });
    this.saveTasks(tasks);
    this.setData({ currentTask: task, randomNpc: null });
    wx.showToast({ title: '✅ 已导入「' + npc.name + '」', icon: 'success' });
  },

  // 随机遭遇：从怪物模板随机抽 1-3 个一键加入任务（杂兵为主，精英小概率应急）
  rollRandomEncounter() {
    var monsterCats = ['deep', 'ghoul', 'migo', 'sky', 'cthulhu', 'serpent', 'alien'];
    // 加权池：杂兵权重 5，精英权重 1 → 遭遇以杂兵为主
    var pool = [];
    NPC_TEMPLATES.forEach(function (t) {
      if (monsterCats.indexOf(t.cat) === -1) return;
      var w = t.desc.indexOf('杂兵') > -1 ? 5 : 1;
      for (var i = 0; i < w; i++) pool.push(t);
    });
    if (!pool.length) return;
    var tasks = this.data.tasks;
    var task = tasks.find(function (t) { return t.id === this.data.currentTaskId; }.bind(this));
    if (!task) return;
    var r = Math.random();
    var count = r < 0.3 ? 1 : r < 0.7 ? 2 : 3;
    var added = [];
    for (var i = 0; i < count; i++) {
      var tpl = this._pick(pool);
      var attack = ((tpl.data.match(/(?:^|\n)\s*(?:攻击|攻撃|Attack)\s*[：:]\s*([^\n\r]+)/i) || [])[1] || '').trim();
      var db = ((tpl.data.match(/\bDB\s*([+\-−]?\d*D\d+|[+\-−]?0)\b/i) || [])[1] || '').trim();
      var name = this._uniqueNpcName(task, tpl.name);
      task.npcs.push({ id: Date.now(), name: name, dex: tpl.dex, hp: tpl.hp, mp: tpl.mp, attack: attack, db: db, armor: extractArmor(tpl.data), data: tpl.data, visible: true });
      added.push(name);
    }
    if (!added.length) { wx.showToast({ title: '抽到的怪都已在场了，再试一次', icon: 'none' }); return; }
    this.saveTasks(tasks);
    this.setData({ currentTask: task });
    wx.showToast({ title: '⚔️ 遭遇：' + added.join('、'), icon: 'none', duration: 2000 });
  },

  preventTouchMove() {},
});
