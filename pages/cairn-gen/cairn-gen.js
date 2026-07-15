// pages/cairn-gen/cairn-gen.js — 石冢 Cairn 角色生成器 & 游玩工具
const STORAGE_KEY = 'cairn_characters';

// 拼音首字母映射表 — 覆盖100道法术名称中所有用字
const PINYIN_MAP = {
  '黏':'N','附':'F','锚':'M','丝':'S','活':'H','化':'H','物':'W','体':'T',
  '拟':'N','人':'R','奥':'A','术':'S','眼':'Y','星':'X','界':'J','监':'J',
  '狱':'Y','磁':'C','吸':'X','幻':'H','听':'T','乱':'L','语':'Y','饵':'E',
  '花':'H','兽':'S','形':'X','迷':'M','糊':'H','换':'H','身':'S','魅':'M',
  '惑':'H','命':'M','令':'L','领':'L','悟':'W','泡':'P','沫':'M','锥':'Z',
  '操':'C','控':'K','植':'Z','天':'T','气':'Q','治':'Z','愈':'Y','创':'C',
  '伤':'S','耳':'E','聋':'L','侦':'Z','测':'C','魔':'M','法':'F','拆':'C',
  '卸':'X','伪':'W','装':'Z','移':'Y','位':'W','地':'D','震':'Z','弹':'D',
  '性':'X','元':'Y','墙':'Q','取':'Q','炽':'C','光':'G','雾':'W','云':'Y',
  '狂':'K','暴':'B','异':'Y','门':'M','重':'Z','力':'L','转':'Z','贪':'T',
  '婪':'L','加':'J','速':'S','仇':'C','恨':'H','聆':'L','悬':'X','浮':'F',
  '催':'C','眠':'M','冰':'B','触':'C','鉴':'J','别':'B','主':'Z','照':'Z',
  '明':'M','隐':'Y','系':'X','绳':'S','敲':'Q','击':'J','跳':'T','跃':'Y',
  '液':'Y','态':'T','空':'K','缓':'H','冲':'C','宅':'Z','珠':'Z','欢':'H',
  '假':'J','面':'M','微':'W','缩':'S','镜':'J','影':'Y','行':'X','多':'D',
  '臂':'B','夜':'Y','球':'Q','泥':'N','安':'A','抚':'F','恐':'K','惧':'J',
  '症':'Z','陷':'X','坑':'K','原':'Y','始':'S','澎':'P','湃':'P','推':'T',
  '拉':'L','复':'F','苏':'S','死':'S','者':'Z','魂':'H','灵':'L','读':'D',
  '心':'X','斥':'C','视':'S','卜':'B','雕':'D','塑':'S','感':'G','知':'Z',
  '护':'H','盾':'D','遮':'Z','蔽':'B','易':'Y','睡':'S','溜':'L','烟':'Y',
  '嗅':'X','熄':'X','灭':'M','排':'P','序':'X','奇':'Q','观':'G','锯':'J',
  '爬':'P','召':'Z','唤':'H','块':'K','群':'Q','遥':'Y','传':'C','送':'S',
  '靶':'B','灌':'G','丛':'C','偶':'O','间':'J','真':'Z','涌':'Y','泉':'Q',
  '结':'J','网':'W','部':'B','件':'J','标':'B','记':'J','像':'X',
  '素':'S','住':'Z','滑':'H','闻':'W','蛛':'Z','方':'F','应':'Y','石':'S',
  '时':'S','透':'T',
};
function spellPinyin(name) {
  let r = '';
  for (const ch of name) {
    if (ch === '/') continue;
    r += PINYIN_MAP[ch] || ch;
  }
  return r;
}

const CAIRN_SPELLS = [
  {name:'黏附',desc:'一件物体会覆上极其粘稠的黏液。'},
  {name:'锚丝',desc:'从你双臂中伸出坚固的丝线，固定在每侧 50\' 范围内的两个点上。'},
  {name:'活化物体',desc:'一件物体尽可能服从你的命令。'},
  {name:'拟人',desc:'一只动物获得人类的智力或外貌，持续一天。'},
  {name:'奥术眼',desc:'你能通过一个随你命令飞动的魔法浮空眼球来视物。'},
  {name:'星界监狱',desc:'将一件物体在时空层面上冻结在坚不可摧的水晶外壳里面。'},
  {name:'磁吸',desc:'两件物体若靠近 10\' 内，就会因为强磁力互相吸引。'},
  {name:'幻听',desc:'你创造出仿佛源于选定方向的虚幻声音。'},
  {name:'乱语',desc:'某一生物必须高声清晰地重复你所想的一切。否则就无法说话。'},
  {name:'饵花',desc:'从地里萌发出一株植物，散发出腐肉的气味。'},
  {name:'兽形',desc:'你带着自己的所有物一同变成一只凡俗动物。'},
  {name:'迷糊',desc:'你选定的某一生物在法术期间无法形成新的短期记忆。'},
  {name:'换身',desc:'你与你触摸的生物交换身体。若其中一具身躯死亡，另一具也会随之逝去。'},
  {name:'魅惑',desc:'某一生物视你为友。'},
  {name:'命令',desc:'某一目标会遵从一个不会伤害到自身的命令（限三个词）。'},
  {name:'领悟',desc:'你会短暂通晓所有语言。'},
  {name:'泡沫锥',desc:'从你手中喷出密集的泡沫，覆盖目标。'},
  {name:'操控植物',desc:'附近的植物和树木都会对你唯命是从，并且能缓慢移动。'},
  {name:'操控天气',desc:'你能随意改变天气类型，但无法加以控制。'},
  {name:'治愈创伤',desc:'每日为你能触摸的某一生物恢复 1d4 力量。'},
  {name:'耳聋',desc:'所有附近生物陷入耳聋。'},
  {name:'侦测魔法',desc:'你能看见或听到附近的魔法灵气。'},
  {name:'拆卸',desc:'你身体的任何部分都能随意拆分和重连，而且不会造成疼痛和伤害。你仍能控制它们。'},
  {name:'伪装',desc:'你能随意改变一名角色的外观（但仍得保持是类人种）。尝试模仿其他角色会让外表变得诡异。'},
  {name:'移位',desc:'某一物体会显现在至多相距实际位置 15\' 远的地方。'},
  {name:'地震',desc:'地面开始剧烈震动。建筑可能会受损或坍塌。'},
  {name:'弹性',desc:'你的身躯可以伸展到 10\'。'},
  {name:'元素墙',desc:'从地里升起一段长 50\'、高 10\' 冰/火直墙。'},
  {name:'取物',desc:'将一件可见物品传送至你手里。'},
  {name:'炽光弹',desc:'一个明亮光球在空中划出一条尾迹，为敌友揭示你的位置。'},
  {name:'雾云',desc:'浓雾从你身上弥漫开来。'},
  {name:'狂暴',desc:'一只附近生物陷入嗜战狂暴。'},
  {name:'异界门',desc:'开启一道通向随机位面的传送门。'},
  {name:'重力转移',desc:'你能改变重力方向（仅限自身）。'},
  {name:'贪婪',desc:'某一生物会无法自控地想要占有你选择的可见物品。'},
  {name:'加速',desc:'你的移动速度升到三倍。'},
  {name:'仇恨',desc:'某一生物对另一只或一群生物产生想将对方碎尸万段的刻骨仇恨。'},
  {name:'聆听耳语',desc:'你能清楚听到微弱声响。'},
  {name:'悬浮',desc:'一件物体在地面 2\' 上悬浮，毫无摩擦。能承载至多一只类人种。'},
  {name:'催眠',desc:'某一生物陷入恍惚，并会如实回答一道你提出的问题（仅限是/否）。'},
  {name:'冰触',desc:'你触摸的表面会覆盖上一道厚冰层，至多 10\' 半径。'},
  {name:'鉴别物主',desc:'你触摸的物体上浮现字母，拼出其主人（如有）的名字。'},
  {name:'照明',desc:'一团漂浮光源随你命令移动。'},
  {name:'隐形系绳',desc:'相距 10\' 内的两件物体无法移动相离 10\'。'},
  {name:'敲击',desc:'附近一道凡俗或魔法锁会响亮地打开。'},
  {name:'跳跃',desc:'你跳到至多 10\' 高，仅限一次。'},
  {name:'液态空气',desc:'你周围的空气变得可以游泳。'},
  {name:'魔法缓冲',desc:'所有附近魔法的效果减半。'},
  {name:'住宅',desc:'出现一栋坚固、配备家具的小屋，维持至多 12 小时。你能随意准许或禁止进入。'},
  {name:'弹珠狂欢',desc:'你的口袋装满了弹珠，而且每 30 秒都会恢复到满。'},
  {name:'假面',desc:'一名角色的外貌和声音变得和你触摸的一名角色相同。'},
  {name:'微缩',desc:'一只你触摸的生物缩小到和老鼠无异。'},
  {name:'镜影',desc:'出现一个你控制的自我复制幻影。'},
  {name:'镜行',desc:'一面镜子变成连接你今天见过的另一面镜子的通道。'},
  {name:'多臂',desc:'你临时获得一条额外手臂。'},
  {name:'夜球',desc:'出现一个宽 50\'，夜空闪烁其上的黑暗球体。'},
  {name:'物化',desc:'你会变成大小在大钢琴和苹果之间的任何物体。'},
  {name:'泥形',desc:'你变成活果冻。'},
  {name:'安抚',desc:'附近某一生物变得厌恶暴力。'},
  {name:'恐惧症',desc:'附近某一生物变得害怕你选定的一件物体。'},
  {name:'陷坑',desc:'地上敞开一个宽 10\'、深 10\' 的陷坑。'},
  {name:'原始澎湃',desc:'某一生物迅速进化成其物种的未来版本。'},
  {name:'推/拉',desc:'一件任意大小的物体被径直推开你（相当于一个人的力量）。'},
  {name:'复苏死者',desc:'一具骷髅从地上复苏为你效力。它们蠢得离谱，只能服从简单的指令。'},
  {name:'复苏魂灵',desc:'一具附近死尸的魂灵显现，并会回答 1 道问题。'},
  {name:'读心',desc:'你能听到附近生物的表层思绪。'},
  {name:'磁斥',desc:'两件物体若在 10\' 内，彼此之间就会产生强烈磁力排斥。'},
  {name:'视卜',desc:'你能通过今天早些触摸过的生物的眼睛来视物。'},
  {name:'雕塑元素',desc:'无生命材料在你手中仿佛泥土。'},
  {name:'感知',desc:'选择一样物体。你能感知到最近的同类存在。'},
  {name:'护盾',desc:'保护你触摸的某一生物免受凡俗攻击，持续一分钟。'},
  {name:'遮蔽',desc:'让某一生物在移动前能隐形。'},
  {name:'易位',desc:'两名你可见的生物立即互换位置。'},
  {name:'睡眠',desc:'你可见的某一生物陷入浅睡。'},
  {name:'滑溜',desc:'半径 30\' 范围内的所有表面都变得非常光滑。'},
  {name:'烟形',desc:'你的身体变成自己能控制的活烟雾。'},
  {name:'嗅闻',desc:'你能闻到甚至最轻微的气味。'},
  {name:'熄灭',desc:'你可见的任何凡俗光源都会瞬间熄灭。'},
  {name:'排序',desc:'无生命物品会根据你设定的类别自行排序。'},
  {name:'奇观',desc:'出现一道由你所选，完全可控，明显虚假，但仍然震撼人心的幻象。至多可达宫殿大小，并有完整动态和声音。'},
  {name:'法术锯',desc:'从你的胸口飞出一把旋转刀刃，清除挡路的植物材料。除此之外属于无害。'},
  {name:'蛛爬',desc:'你能像蜘蛛一样攀爬表面。'},
  {name:'召唤方块',desc:'每秒一次，你能召唤或驱散一个宽 3\' 的泥土方块。新方块必须固定在土地或其他方块上。'},
  {name:'化群',desc:'你变成一群乌鸦、老鼠或食人鲳。你只会遭受群攻伤害。'},
  {name:'心灵遥控',desc:'你能用心灵移动 1 件 60 磅以下的物品。'},
  {name:'心灵感应',desc:'两名生物能无视距离听到彼此的思绪。'},
  {name:'传送',desc:'你可见的一个物体或人物从一处传送至半径 50\' 内的另一处。'},
  {name:'标靶',desc:'你触摸的一件物体成为附近任何法术的目标。'},
  {name:'灌丛',desc:'突然长出一片宽 50\' 的树丛和茂密灌木丛。'},
  {name:'召唤石偶',desc:'一座骡子大小的石头雕像拔地而起。'},
  {name:'时间操控',desc:'50\' 泡泡内的时间流速提升或下降 10%，持续 30 秒。'},
  {name:'真视',desc:'你能看穿周遭所有幻象。'},
  {name:'涌泉',desc:'出现一道海水泉。'},
  {name:'视控',desc:'你完全控制某一生物看到什么。'},
  {name:'幻视',desc:'出现一道由你选定，静止无声，卧室大小的幻象。'},
  {name:'结界',desc:'地上出现一个直径 50\' 的银圈。选择一项无法穿越的物种。'},
  {name:'蛛网',desc:'你的手腕射出厚厚的蛛网。'},
  {name:'部件',desc:'所绘制的工具和物品的原始版本会出现在你面前，片刻后消失。'},
  {name:'法术标记',desc:'你的手指可以射出一道超色颜料流。只有你能看到这种颜料（无视距离，甚至能穿透固体）。'},
  {name:'X光透视',desc:'你能看穿墙壁、尘土、衣物等等。'},
];

Page({
  data: {
    step: 0, characters: [], char: null, _loadIndex: -1,
    invUsed: 0,
    diceSelected: {}, diceRolling: false, diceResult: null, diceHistory: [],
    showCheck: false, checkLabel: '', checkTarget: 0, checkRoll: 0, checkSuccess: false,
    showSpells: false, notesExpanded: false, notesExpandable: false, spellList: [], spellSearch: '',
  },
  onLoad() { this.initGenData(); this.loadList(); },
  onShow() { this.loadList(); },

  loadList() { const list = wx.getStorageSync(STORAGE_KEY) || []; this.setData({ characters: list }); },
  saveList(list) { wx.setStorageSync(STORAGE_KEY, list); this.setData({ characters: list }); },

  startNew() { this._deletePending = null; const ch = this.generateRaw(); const list = this.data.characters; list.unshift(ch); this.saveList(list); this.openChar(0); },
  openChar(e) {
    const idx = typeof e === 'number' ? e : e.currentTarget.dataset.index;
    const list = this.data.characters; if (idx < 0 || idx >= list.length) return;
    const char = JSON.parse(JSON.stringify(list[idx]));
    const invUsed = char.inventory.filter(s => s && s.trim()).length;
    // 兼容旧数据：无 max 字段则用当前值
    if (!char.strMax) { char.strMax = char.str; char.dexMax = char.dex; char.wilMax = char.wil; char.hpMax = char.hp; }
    if (char.gp === undefined) { char.gp = char.gold || 0; char.sp = 0; char.cp = 0; }
    // 兼容旧数据：描述写入笔记（含背景和年龄）
    if (!char.notes && char.description) { char.notes = char.name + '，' + (char.background||'') + '，' + (char.age||'?') + '岁\n\n' + char.description; }
    const noteLen = (char.notes || '').length;
    this.setData({ step: 1, char, _loadIndex: idx, invUsed, diceSelected: {}, diceResult: null, notesExpanded: false, notesExpandable: noteLen > 120 });
    this._deletePending = null;
  },
  deleteChar(e) {
    const idx = e.currentTarget.dataset.index; const list = this.data.characters;
    wx.showModal({ title: '删除角色', content: '确定删除这个角色吗？', success: (res) => {
      if (!res.confirm) return; list.splice(idx, 1); this.saveList(list);
      if (this.data._loadIndex === idx) this.setData({ step: 0, char: null, _loadIndex: -1 });
    }});
  },
  saveChar() {
    const list = this.data.characters; const idx = this.data._loadIndex;
    if (idx >= 0 && idx < list.length) { list[idx] = JSON.parse(JSON.stringify(this.data.char)); this.saveList(list); wx.showToast({ title: '已保存', icon: 'success', duration: 1200 }); }
  },
  backToList() { this._deletePending = null; this.saveChar(); this.setData({ step: 0, char: null, _loadIndex: -1, diceSelected: {}, diceResult: null, diceHistory: [] }); },

  roll(d) { return Math.floor(Math.random() * d) + 1; },
  rollD(n, d) { let t = 0; for (let i = 0; i < n; i++) t += this.roll(d); return t; },

  generateRaw() {
    const D = this.gen_data;
    const sel = (t) => { const l = D[t]; if (!l) return ''; if (Array.isArray(l)) return l[Math.floor(Math.random() * l.length)]; return this.selectTable(l); };
    const expand = (s) => { let r = s, n = 50, m; while (n-- > 0 && (m = /\{(\w+)\}/.exec(r))) r = r.replace('{' + m[1] + '}', sel(m[1]) || m[1]); return r; };
    const desc = expand(sel('character'));
    const nm = desc.match(/^我叫(.+?)，曾任(.+?)。/);
    const armor = expand(sel('armor')), helmet = expand(sel('helmet')), weapons = expand(sel('weapons'));
    const tool = expand(sel('tool')), gear = expand(sel('gear')), trinket = expand(sel('trinket')), bonus = expand(sel('bonus'));
    let aTotal = 0; [armor, helmet].forEach(s => { if (s.includes('1')) aTotal += 1; else if (s.includes('2')) aTotal += 2; else if (s.includes('3')) aTotal += 3; });
    if (aTotal > 3) aTotal = 3;
    const inventory = ['口粮（3日份）', '火炬', '', '', '', '', '', '', '', ''];
    let slot = 2;
    for (const item of [armor, helmet, weapons, tool, gear, trinket, bonus]) {
      if (!item || item === '无上身防具' || item.startsWith('，')) continue;
      if (item.includes('笨重')) { if (slot < 10) inventory[slot++] = item; }
      else if (slot < 10) inventory[slot++] = item;
    }
    const strVal = this.rollD(3, 6), dexVal = this.rollD(3, 6), wilVal = this.rollD(3, 6), hpVal = this.roll(6);
    const name = nm ? nm[1] : '冒险者', bg = nm ? nm[2] : '', age = this.rollD(2, 20) + 10;
    const notes = name + '，' + bg + '，' + age + '岁\n\n' + desc;
    return { id: Date.now(), name, background: bg, description: desc,
      age,
      str: strVal, strMax: strVal, dex: dexVal, dexMax: dexVal, wil: wilVal, wilMax: wilVal,
      hp: hpVal, hpMax: hpVal, armor: aTotal,
      gp: this.rollD(3, 6), sp: 0, cp: 0,
      inventory, armorBody: armor, helmetShield: helmet, weapons, tool, gear, trinket, bonus, notes };
  },

  selectTable(list) {
    let len = 0; for (const k in list) { const r = this.keyRange(k); if (r[1] > len) len = r[1]; }
    if (!len) return ''; const idx = Math.floor(Math.random() * len) + 1;
    for (const k in list) { const r = this.keyRange(k); if (idx >= r[0] && idx <= r[1]) return list[k]; } return '';
  },
  keyRange(k) {
    const m1 = /(\d+)-00/.exec(k); if (m1) return [parseInt(m1[1]), 100];
    const m2 = /(\d+)-(\d+)/.exec(k); if (m2) return [parseInt(m2[1]), parseInt(m2[2])];
    if (k === '00') return [100, 100]; return [parseInt(k), parseInt(k)];
  },

  initGenData() {
    this.gen_data = {
      character: ['我叫{name}·{surname}，曾任{background}。我体格{physique}，皮肤{skin}，毛发{hair}，面容{face}。我言谈{speech}，衣物{clothing}。我{vice}但{virtue}，并公认{reputation}。我不幸遭受了{misfortune}。'],
      name: ['阿贡恩','碧翠丝','布瑞根','布朗温','坎诺拉','芝艾欧','埃吉欧','埃斯米','格瑞娅','赫奈恩','利兰','利拉瑟欧','丽莎白','莫拉利欧','莫格温','希泊','希欧恩','温内恩','伊格沃','伊斯伦','阿沃欧','拜文','博若斯','伯瑞德','布瑞苟','布瑞格勒','坎霍瑞欧','艾姆瑞斯','艾赛克斯','格林苟','格林维特','格鲁威德','格鲁斯','格威斯汀','曼诺格','麦欧纳克斯','奥萨克斯','崔安尼恩','温兰','伊尔米尔'],
      surname: ['阿伯纳西','阿德卡普','伯尔','坎德维克','科米克','克拉姆沃勒','邓斯沃洛','盖特瑞','格莱斯','哈克尼斯','哈珀','卢末','迈克斯谬克','斯迈斯','桑德曼','斯温尼','撒切尔','托尔门','韦弗','沃尔德'],
      background: ['炼金师','铁匠','窃贼','屠夫','木匠','牧师','赌徒','掘墓人','草药师','猎人','魔法师','佣兵','商人','矿工','亡命徒','演员','扒手','走私贩','仆从','游侠'],
      physique: ['匀称','健壮','高耸','矮胖','结实','运动','瘦长','矮小','骨瘦','软弱'], skin: ['深暗','胎记','晒黑','瘢麻','风霜','油滑','苍白','完美','玫红','纹身'],
      hair: ['光秃','编辫','油滑','波浪','卷毛','长发','稀疏','肮脏','拳曲','奢华'], face: ['棱角','方脸','骨感','锋利','凹沉','拉长','破碎','柔软','似鼠','圆润'],
      speech: ['粗钝','洪亮','单调','沙哑','隐晦','正式','结巴','严谨','尖锐','呢喃'], clothing: ['古朴','血腥','馊臭','污脏','老套','优雅','磨损','异域','制服','肮脏'],
      virtue: ['雄心','勇敢','自律','荣耀','沉着','仁慈','谦逊','宽容','合群','谨慎'], vice: ['好斗','刻薄','怯懦','狡诈','贪婪','记仇','懒惰','紧张','粗鲁','虚荣'],
      reputation: ['古怪','睿智','尊敬','雄心','丑恶','危险','诚实','粗野','懒散','逗趣'], misfortune: ['遗弃','成瘾','勒索','蒙罪','诅咒','遇骗','降职','辱没','决裂','流放'],
      armor: {'1-3':'无上身防具','4-14':'镶嵌甲（1 护甲，笨重）','15-19':'链甲（2 护甲，笨重）','20':'板甲（3 护甲，笨重）'},
      helmet: {'1-13':'，无头盔或盾牌','14-16':'，头盔（+1 护甲）','17-19':'，盾牌（+1 护甲）','20':'，头盔（+1 护甲）及盾牌（+1 护甲）'},
      weapons: {'1-10':'{wgroup1}','11-14':'{wgroup2}','15-19':'{wgroup3}','20':'{wgroup4}'},
      wgroup1: ['匕首（d6）','棍棒（d6）','杖（d6）'], wgroup2: ['剑（d8）','硬头锤（d8）','斧（d8）'],
      wgroup3: ['弓（d6，笨重）','弩（d6，笨重）','投石索（d4）'], wgroup4: ['戟（d10，笨重）','战锤（d10，笨重）','战斧（d10，笨重）'],
      armor_weapons: {'1-10':'{armor}','11-20':'{weapons}'}, tool_trinket: {'1-10':'{tool}','11-20':'{trinket}'},
      bonus: {'1-6':'{tool_trinket}','7-13':'{gear}','14-17':'{armor_weapons}','18-20':'魔典（包含法术「{spellbook}」）'},
      tool: ['风箱','水桶（叠放）','蒺藜','粉笔','凿子','炊具','撬棍','手动钻头','鱼竿','胶水（叠放）','油脂','锤子','沙漏','金属锉刀（叠放）','钉子（叠放）','网（叠放）','锯子','密封剂','铲子','钳子'],
      trinket: ['瓶子','牌组（叠放）','骰组（叠放）','脸彩','假珠宝（叠放）','号角','焚香（叠放）','乐器','透镜','弹珠（叠放）','镜子','香水','羽毛笔&墨水','盐袋（叠放）','小铃铛','肥皂（叠放）','海绵','焦油罐','细绳（叠放）','哨子'],
      gear: ['气囊','抗毒剂','板车（+4 栏位，笨重）','锁链（10\'）','道金棒','火油','抓钩','大麻袋','大陷阱','开锁器','手铐','镐子','长杆（10\'）','滑轮','驱虫剂','绳索（25\'）','结界法物','望远镜','火绒盒','狼毒草'],
      spellbook: ['黏附','锚丝','活化物体','拟人','奥术眼','星界监狱','磁吸','幻听','乱语','饵花','兽形','迷糊','换身','魅惑','命令','领悟','泡沫锥','操控植物','操控天气','治愈创伤','耳聋','侦测魔法','拆卸','伪装','移位','地震','弹性','元素墙','取物','炽光弹','雾云','狂暴','异界门','重力转移','贪婪','加速','仇恨','聆听耳语','悬浮','催眠','冰触','鉴别物主','照明','隐形系绳','敲击','跳跃','液态空气','魔法缓冲','住宅','弹珠狂欢','假面','微缩','镜影','镜行','多臂','夜球','物化','泥形','安抚','恐惧症','陷坑','原始澎湃','推/拉','复苏死者','复苏魂灵','读心','磁斥','视卜','雕塑元素','感知','护盾','遮蔽','易位','睡眠','滑溜','烟形','嗅闻','熄灭','排序','奇观','法术锯','蛛爬','召唤方块','化群','心灵遥控','心灵感应','传送','标靶','灌丛','召唤石偶','时间操控','真视','涌泉','视控','幻视','结界','蛛网','部件','法师标记','X 光透视'],
    };
  },

  doCheck(e) {
    const attr = e.currentTarget.dataset.attr; const c = this.data.char;
    const target = attr === 'str' ? c.str : attr === 'dex' ? c.dex : c.wil;
    const roll = this.roll(20); const success = roll <= target;
    this.setData({ showCheck: true, checkLabel: attr === 'str' ? '力量 STR' : attr === 'dex' ? '敏捷 DEX' : '意志 WIL', checkTarget: target, checkRoll: roll, checkSuccess: success });
  },
  closeCheck() { this.setData({ showCheck: false }); },

  statDelta(e) {
    const { field, delta } = e.currentTarget.dataset; const c = this.data.char; const d = parseInt(delta);
    if (field === 'hp') c.hp = Math.max(0, Math.min(c.hpMax, c.hp + d));
    else { c[field] = Math.max(0, c[field] + d); this.checkAttrZero(c); }
    this.setData({ char: c });
  },
  checkAttrZero(c) {
    if (c.str <= 0) wx.showToast({ title: '⚠ 力量归零：角色死亡！', icon: 'none', duration: 2500 });
    else if (c.dex <= 0) wx.showToast({ title: '⚠ 敏捷归零：角色麻痹！', icon: 'none', duration: 2500 });
    else if (c.wil <= 0) wx.showToast({ title: '⚠ 意志归零：角色昏迷！', icon: 'none', duration: 2500 });
  },

  onArmorInput(e) { let v = parseInt(e.detail.value) || 0; if (v > 3) v = 3; const c = this.data.char; c.armor = v; this.setData({ char: c }); },
  onCoinInput(e) { const field = e.currentTarget.dataset.field; const v = parseInt(e.detail.value) || 0; const c = this.data.char; c[field] = v; this.setData({ char: c }); },

  onInvInput(e) { const idx = e.currentTarget.dataset.index; const c = this.data.char; c.inventory[idx] = e.detail.value; const u = c.inventory.filter(s => s && s.trim()).length; this.checkInvFull(c, u); this.setData({ char: c, invUsed: u }); },
  deleteInvItem(e) {
    const idx = e.currentTarget.dataset.index;
    const now = Date.now();
    const prev = this._deletePending;
    // 同一槽位且在800ms内再次点击 → 执行删除
    if (prev && prev.idx === idx && now - prev.time < 800) {
      this._deletePending = null;
      const c = this.data.char;
      c.inventory[idx] = '';
      const u = c.inventory.filter(s => s && s.trim()).length;
      this.setData({ char: c, invUsed: u });
      return;
    }
    // 首次点击 → 记录并提示
    this._deletePending = { idx, time: now };
    wx.showToast({ title: '再次点击删除', icon: 'none', duration: 1200 });
  },
  addFatigue() { const c = this.data.char; for (let i = 0; i < 10; i++) { if (!c.inventory[i] || c.inventory[i].trim() === '') { c.inventory[i] = '疲乏'; break; } } const u = c.inventory.filter(s => s && s.trim()).length; this.checkInvFull(c, u); this.setData({ char: c, invUsed: u }); },
  addBulk() { const c = this.data.char; for (let i = 0; i < 10; i++) { if (!c.inventory[i] || c.inventory[i].trim() === '') { c.inventory[i] = '（笨重）'; break; } } const u = c.inventory.filter(s => s && s.trim()).length; this.checkInvFull(c, u); this.setData({ char: c, invUsed: u }); },
  checkInvFull(c, used) { if (used > 10 && c.hp > 0) { c.hp = 0; wx.showToast({ title: '⚠ 背包超载！HP 降至 0', icon: 'none', duration: 2500 }); } },

  _lastLongpress: 0,
  selectDice(e) { if (this.data.diceRolling) return; const now = Date.now(); if (now - this._lastLongpress < 400) return; const d = parseInt(e.currentTarget.dataset.d); const sel = { ...this.data.diceSelected }; sel[d] = (sel[d] || 0) + 1; this.setData({ diceSelected: sel, diceResult: null }); },
  deselectDice(e) { if (this.data.diceRolling) return; this._lastLongpress = Date.now(); const d = parseInt(e.currentTarget.dataset.d); const sel = { ...this.data.diceSelected }; if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; } this.setData({ diceSelected: sel, diceResult: null }); },
  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },
  clearHistory() { this.setData({ diceHistory: [] }); },
  rollSelected() {
    const sel = this.data.diceSelected, keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null }); wx.vibrateShort({ type: 'medium' });
    const dice = []; let total = 0;
    keys.forEach(k => { const sides = parseInt(k), count = sel[k]; for (let i = 0; i < count; i++) { const r = this.roll(sides); dice.push({ sides, result: r }); total += r; } });
    setTimeout(() => { const result = { dice, total, time: new Date().toLocaleTimeString() }; const history = [result, ...this.data.diceHistory].slice(0, 50); this.setData({ diceRolling: false, diceResult: result, diceHistory: history }); }, 700);
  },

  onNotesInput(e) {
    const c = this.data.char; c.notes = e.detail.value;
    const noteLen = (c.notes || '').length;
    this.setData({ char: c, notesExpandable: noteLen > 120 });
  },
  toggleNotes() { this.setData({ notesExpanded: !this.data.notesExpanded }); },

  openSpells() {
    const list = CAIRN_SPELLS.map((s, i) => ({ ...s, seq: i + 1 }));
    this.setData({ showSpells: true, spellList: list, spellSearch: '' });
  },
  closeSpells() { this.setData({ showSpells: false }); },
  onSpellSearch(e) {
    const v = e.detail.value;
    if (!v) {
      const list = CAIRN_SPELLS.map((s, i) => ({ ...s, seq: i + 1 }));
      this.setData({ spellSearch: v, spellList: list });
      return;
    }
    const q = v.toUpperCase();
    const list = CAIRN_SPELLS
      .map((s, i) => ({ ...s, seq: i + 1 }))
      .filter(s => s.name.includes(v) || s.desc.includes(v) || spellPinyin(s.name).includes(q));
    this.setData({ spellSearch: v, spellList: list });
  },
  appendSpell(e) {
    const name = e.currentTarget.dataset.name;
    const spell = CAIRN_SPELLS.find(s => s.name === name);
    if (!spell) return;
    const c = this.data.char;
    c.notes = (c.notes || '') + '\n【' + spell.name + '】' + spell.desc;
    this.setData({ char: c, notesExpandable: true, notesExpanded: true });
    wx.showToast({ title: '已添加「' + spell.name + '」', icon: 'success', duration: 1200 });
  },
  preventTouchMove() {},
});
