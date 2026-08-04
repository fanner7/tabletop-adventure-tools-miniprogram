// pages/liminal-horror-gen/liminal-horror-gen.js
// 阈限恐怖 Liminal Horror — 调查员生成 & 游玩工具
const STORAGE_KEY = 'lh_characters';

const BACKGROUNDS = [
  "流水线工人：工业围裙（+1 护甲），安全背带，保温瓶",
  "公交司机：饭盒，交通路线图，电击枪（d6，非致命）",
  "机械师：活动扳手（d6），便携工具箱，电工胶带，刹车清洁剂",
  "拾荒家：防割手套（+1 护甲），反光背心，拾物器，护目镜",
  "救护员：急救包，创伤剪，听诊器，卫生袋",
  "店员：开箱刀（d6），对讲机，胸牌，舒适无比的鞋子",
  "艺术家：自选艺术工具，笔记本，相机，小型热情粉丝圈",
  "运动员：自选运动器材，汗带，运动饮料粉",
  "滑板手：滑板，摄像机，断线钳",
  "键盘侠：笔记本电脑及背包，网络粉丝，假证件，能量饮料",
  "志愿消防员：折叠梯（笨重），斧头（d6），灭火器，手电筒",
  "单车快递员：自行车，头盔（+1 护甲），邮差包，未拆封包裹，多功能工具",
  "酒保：酒吧刀（d6），酒瓶，香烟，查获的假证件",
  "治疗师：录音笔，笔记本和钢笔，名片，小左轮枪（d6）",
  "行政助理：广泛人脉，公司信用卡，折叠公文包，电击枪（d6 敏捷）",
  "演员：试镜文件夹，便携充电器，备用化妆品，替换衣物",
  "工程师：笔记本电脑及设计软件，防水笔记本，无线路由器，九九新安全防具",
  "社工：笔记本电脑及背包，证件，折叠刀（d6），笔记本和钢笔",
  "教师：咖啡杯，剪刀，大包",
  "承包商：满载工具腰带，美工刀（d6），探照灯，钻机"
];

const BLOOM_ARCHETYPES = [
  "《真实犯罪》：当下每位有麦克风的人都能开播客，而你的收听率却在直线下降。冷水镇周边的谜团在幕后渠道中流传已久，而你恰好想成为找出事情真相的人。携带：迷你霰弹枪形麦克风、智能手机三脚架、LED 灯。",
  "浪子回头：你在孩提时候曾经在湖边的家庭木屋里度过夏天，自从上次来到此地已经过去十年了。小镇比起你记忆中的样子大相径庭。携带：过时的旅游指南、一套生锈的钥匙、旧鱼竿。",
  "无踪大脚怪：作为领域内的专家，你多年来一直在追寻行踪飘忽的大脚怪，寻找最终能让公众信服的佐证，而所有的证据都指向了这里。携带：热成像摄像机、防熊喷雾（d4，群攻，非致命）、吉利迷彩服。",
  "聚会迟到：你做好了调查，选好了日期，定好了露营地，但始料未及的工作任务却让你无法和朋友一同出发，如今他们人间蒸发了。携带：睡袋、露营背包（+2 栏位）、小型生存套件。",
  "隐退作家：你已经很久没把作品交到编辑的桌上了，也许呼吸一下新鲜空气，远离喧嚣的城市，创作灵感就能源源不断。携带：电子书写平板、折叠木工刀（d6）、瓶装酒水。",
  "蓝魔乐手：整个「单飞生涯」并没有按计划进行，只剩下一长串报酬微薄的三流演出，接下来的「蓝莓节」表演也不过是其中之一。携带：自选乐器、复古动圈式麦克风、便携式扩音器。",
  "只是路过：你正打算前往某座城市，而那名卡车司机最远只能送你到冷水镇，但这里有一股让人愉悦的魅力，也许你会在本地留上一阵。携带：背包（+2 栏位）、雨衣、手杖（d6）、折叠刀（d6）。",
  "正如规划：你的名声当之无愧，镇民为了确保那蠢到家的小庆典能顺利进行可是花了不少钱，而你已经完美地规划好了一切。携带：笔记本电脑、多功能工具、数码单反相机、名片。",
  "随时待命：冷水镇没有兽医办公点，但大家都会在农场动物生病时打电话给你。这一次，是野生动物举止异常，乡亲们对此有所顾虑。携带：手术刀（d6）、镊子、瓶装消毒液、手术钳。",
  "枯萎蔓延：冷水镇周边有一些迷人的真菌种类。不幸的是，其中某些也具备破坏性。农民一直在抱怨产量下降，所以可能爆发了枯萎病。携带：便携显微镜、小型采样套件、探木钻（d6）。",
  "小镇专题：虽然你对本地区域满怀热情，但当前负责的专题已经多年都没出现过吸引眼球的专栏了，希望蓝莓节的热度足以让你在岗位上多留几天。携带：录音机、数码相机、笔记本、电击枪（d6，目标敏捷）。",
  "恐怖片导演：你「下一部爆火砍杀片」的剧本已经卖出去了，但制片方希望能在下次会议前确定拍摄地点，否则这部电影就要被束之高阁。携带：360 度摄像机和吊杆、剧本、测光表、一沓空白的租赁协议。",
  "前卫大厨：城市里正流行着某些非常奔放的烹饪潮流，据说冷水镇还是一片尚未开发的大金矿，这里可以找到独特的食材。没准你生来就是要干这行。携带：带钩小刀（d6）、可折叠铲子（d6）、采集篮。",
  "摩托新秀：尽管还是个新手，但本地的摩托车公园对你而言已经不在话下。你得要去没有跑过的小路上训练才能成为职业选手。携带：山地摩托车、防撞服（+1 护甲）、全覆面头盔（穿戴时+1 护甲）、运动相机。",
  "毕业难关：虽然激情尚存，但你的硕士论文《小镇：从繁荣到毁灭》的实地调研让人沮丧，希望冷水镇会是最后一站。携带：笔记本电脑、装满冷水镇研究的活页夹、介绍信。",
  "骗保查勘：你的公司在过去一年接到了成吨来自这个地区的保险索赔，含糊的报告导致审计得要亲自上阵。携带：保险索赔、胡椒喷雾（d6，非致命）、数码相机。",
  "生意兴隆：你效力的公司最初是只是一个「家庭经营」式的总承包商，但几份幸运的活计带来了充裕的资金，其希望能向房地产领域扩张。携带：公司信用卡、安全帽（+1 护甲）、反光背心。",
  "黄金岁月：你在几十年紧张的工作后最终得以提前几年安享退休！远离城市喧嚣的冷水镇似乎会是个安顿度日的好地方。携带：冷水镇内的房子、可折叠登山杖（d6）、安娜·史东的小说。",
  "首次环评：政府出乎意料地将拨款分配给冷水镇用以振兴公共土地，你受命前来进行初步评估。携带：注释地图、储物式写字板夹、16 英尺测量杆（d6）。",
  "盲抛踩点：有传言称，冷水湖里面有区域内最好的钓点。大伙都愿意出高价包船去最好的地方钓鱼，所以是时候去看看了。携带：脚踏小艇、锁鳃鱼串、折叠鱼竿（d6）、钓具箱。"
];

const APPEARANCES = ["随时商务","街头风","乐队文化恤","统统涂黑","运动休闲","清爽熨烫","休闲舒适","正宗复古","风靡一时","工作制服","超大码卫衣","海岛花风情","量身定制","实用胜于时尚","货运口袋","牛仔配 T 恤","犹在 2009","粗犷极简","千禧虫","牛仔裤搭牛仔衫"];

const FIRST_ENCOUNTERS = ["在神秘事况下痛失所爱","网上证据太多，不容忽视","在黑暗中看见了什么东西","幸存于一次无法解释的袭击","有东西潜伏在梦里","身边某人正在拉你入伙，或是赶你远离","异教活动（或许他们招募了重要人物）","秘密社团的持卡会员","你读到了一些凡人无法理解的材料","还没，所以来跑团！"];

const IDEOLOGIES = ["世间万事都有植根于科学的合理解释","个人可以有所作为","认同某种特定政治意识形态","特定宗教指引着你","道德是非黑白的","你相信命运直接影响你的生活","相信更高的力量，譬如占星术、灵修等","自由意志是唯一真理","世人皆醉我独醒。答案就在眼前","相信社群的力量"];

const TRAITS = {
  physique:  ["运动","健硕","曲线","瘦长","小巧","僵硬","矮胖","高耸","健壮","丰满"],
  face:      ["骨感","破碎","棱角","拉长","酒窝","完美","圆润","锋利","难忘","易忘"],
  speech:    ["粗钝","沙哑","洪亮","严谨","隐晦","尖锐","正式","口音","单调","生涩"],
  virtue:    ["诚实","荣耀","谨慎","谦逊","勇敢","仁慈","自律","沉着","合群","宽容"],
  vice:      ["易怒","懒惰","悲观","紧张","怯懦","粗鲁","狡诈","虚荣","贪婪","记仇"],
  misfortune:["遗弃","遇骗","成瘾","降职","勒索","辱没","蒙罪","决裂","诅咒","流放"]
};

const COND_KEYS = ['hungry','thirsty','fatigued','scared','deprived','wounded','poisoned','depleted','weary'];
const COND_LABELS = { hungry:'🍞 饥饿', thirsty:'💧 干渴', fatigued:'😴 疲惫', scared:'😱 惊恐', deprived:'🚫 匮乏', wounded:'🩹 创伤', poisoned:'☠️ 中毒', depleted:'🌀 衰竭', weary:'💀 疲乏' };

const SHOP_ITEMS = [
  // 武器
  { cat:'武器', name:'小刀',            desc:'d6',                bulky:false, price:50 },
  { cat:'武器', name:'棒球棍',          desc:'d6',                bulky:false, price:80 },
  { cat:'武器', name:'撬棍',            desc:'d6',                bulky:false, price:100 },
  { cat:'武器', name:'斧头',            desc:'d6',                bulky:true,  price:150 },
  { cat:'武器', name:'小左轮枪',        desc:'d6',                bulky:false, price:400 },
  { cat:'武器', name:'手枪',            desc:'d6',                bulky:false, price:500 },
  { cat:'武器', name:'霰弹枪',          desc:'d8',                bulky:true,  price:600 },
  { cat:'武器', name:'电击枪',          desc:'d6，非致命',        bulky:false, price:200 },
  { cat:'武器', name:'防身喷雾',        desc:'针对敏捷，非致命',   bulky:false, price:120 },
  { cat:'武器', name:'防熊喷雾',        desc:'d4，群攻，非致命',   bulky:false, price:180 },
  // 护甲
  { cat:'护甲', name:'防割手套',        desc:'+1 护甲',           bulky:false, price:100 },
  { cat:'护甲', name:'工业围裙',        desc:'+1 护甲',           bulky:false, price:120 },
  { cat:'护甲', name:'安全帽',          desc:'+1 护甲',           bulky:false, price:80 },
  { cat:'护甲', name:'防撞服',          desc:'+1 护甲',           bulky:false, price:200 },
  { cat:'护甲', name:'全覆面头盔',      desc:'穿戴时 +1 护甲',    bulky:false, price:250 },
  { cat:'护甲', name:'防弹背心',        desc:'+2 护甲',           bulky:true,  price:800 },
  { cat:'护甲', name:'吉利迷彩服',      desc:'隐蔽',              bulky:false, price:300 },
  // 工具
  { cat:'工具', name:'智能手机',        desc:'摄像头、手电筒',     bulky:false, price:800 },
  { cat:'工具', name:'手电筒',          desc:'',                  bulky:false, price:40 },
  { cat:'工具', name:'急救包',          desc:'',                  bulky:false, price:100 },
  { cat:'工具', name:'多功能工具',      desc:'',                  bulky:false, price:120 },
  { cat:'工具', name:'开锁器',          desc:'',                  bulky:false, price:150 },
  { cat:'工具', name:'绳索（25\'）',    desc:'',                  bulky:false, price:60 },
  { cat:'工具', name:'双筒望远镜',      desc:'',                  bulky:false, price:200 },
  { cat:'工具', name:'笔记本电脑',      desc:'',                  bulky:false, price:2000 },
  { cat:'工具', name:'相机',            desc:'',                  bulky:false, price:500 },
  { cat:'工具', name:'录音笔',          desc:'',                  bulky:false, price:150 },
  { cat:'工具', name:'对讲机',          desc:'',                  bulky:false, price:200 },
  { cat:'工具', name:'便携工具箱',      desc:'',                  bulky:true,  price:250 },
  { cat:'工具', name:'灭火器',          desc:'',                  bulky:false, price:180 },
  { cat:'工具', name:'睡袋',            desc:'',                  bulky:false, price:80 },
  { cat:'工具', name:'帐篷',            desc:'',                  bulky:true,  price:300 },
  { cat:'工具', name:'折叠铲',          desc:'d6',                bulky:false, price:150 },
  { cat:'工具', name:'断线钳',          desc:'',                  bulky:false, price:200 },
  { cat:'工具', name:'热成像摄像机',    desc:'',                  bulky:false, price:1500 },
  { cat:'工具', name:'便携充电器',      desc:'',                  bulky:false, price:100 },
  { cat:'工具', name:'胶带',            desc:'',                  bulky:false, price:30 },
  { cat:'工具', name:'笔记本和钢笔',    desc:'',                  bulky:false, price:40 },
  // 载具
  { cat:'载具', name:'自行车',          desc:'',                  bulky:true,  price:500 },
  { cat:'载具', name:'滑板',            desc:'',                  bulky:false, price:200 },
  { cat:'载具', name:'山地摩托车',      desc:'',                  bulky:true,  price:3000 },
  // 杂物
  { cat:'杂物', name:'背包',            desc:'+2 行装栏',         bulky:false, price:100 },
  { cat:'杂物', name:'假证件',          desc:'',                  bulky:false, price:300 },
  { cat:'杂物', name:'香烟',            desc:'',                  bulky:false, price:30 },
  { cat:'杂物', name:'能量饮料',        desc:'',                  bulky:false, price:25 },
  { cat:'杂物', name:'瓶装酒水',        desc:'',                  bulky:false, price:50 },
  { cat:'杂物', name:'咖啡杯',          desc:'',                  bulky:false, price:30 },
  { cat:'杂物', name:'保温瓶',          desc:'',                  bulky:false, price:60 },
  { cat:'杂物', name:'反光背心',        desc:'',                  bulky:false, price:50 },
  { cat:'杂物', name:'护目镜',          desc:'',                  bulky:false, price:40 },
];

const MODULES = [
  { key: 'core',  label: '原版',  desc: 'LH 核心出身表',       backgrounds: null },
  { key: 'bloom', label: '繁孽',  desc: '冷水镇模组范型',       backgrounds: null }
];
// 延迟绑定数据引用（等 BACKGROUNDS / BLOOM_ARCHETYPES 初始化后）
MODULES[0].backgrounds = BACKGROUNDS;
MODULES[1].backgrounds = BLOOM_ARCHETYPES;

const MALE_NAMES = [
  '詹姆斯','约翰','罗伯特','迈克尔','威廉','大卫','理查德','约瑟夫','托马斯',
  '克里斯托弗','查尔斯','丹尼尔','马修','安东尼','马克','唐纳德','史蒂文','安德鲁',
  '保罗','约书亚','肯尼斯','凯文','布莱恩','乔治','蒂莫西'
];

const FEMALE_NAMES = [
  '玛丽','帕特里夏','詹妮弗','琳达','芭芭拉','伊丽莎白','苏珊','杰西卡','莎拉',
  '凯伦','丽莎','南希','贝蒂','桑德拉','阿什莉','多萝西','金伯利','艾米莉',
  '米歇尔','卡罗尔','阿曼达','梅丽莎','黛博拉','斯蒂芬妮','丽贝卡'
];

function fmtTime(ts) { const d = new Date(ts); const M = String(d.getMonth()+1).padStart(2,'0'); const D = String(d.getDate()).padStart(2,'0'); const h = String(d.getHours()).padStart(2,'0'); const m = String(d.getMinutes()).padStart(2,'0'); return M + '-' + D + ' ' + h + ':' + m; }

function roll(d) { return Math.floor(Math.random() * d) + 1; }
function rollD(n, d) { let t = 0; for (let i = 0; i < n; i++) t += roll(d); return t; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function parseBackground(bgStr) {
  const idx = bgStr.indexOf('：');
  const name = idx >= 0 ? bgStr.slice(0, idx) : bgStr;
  let rest = idx >= 0 ? bgStr.slice(idx + 1) : '';
  // 繁孽格式："描述。携带：物品列表" → 提取"携带："后的物品
  let itemsPart = rest;
  const carryIdx = rest.indexOf('携带：');
  if (carryIdx >= 0) {
    itemsPart = rest.slice(carryIdx + 3); // "携带："之后
  }
  itemsPart = itemsPart.replace(/。$/, '').trim();
  let armor = 0;
  const armorMatches = bgStr.match(/\+(\d+)\s*护甲/g);
  if (armorMatches) armor = armorMatches.reduce((s, m) => s + parseInt(m.match(/\+(\d+)/)[1]), 0);
  const items = itemsPart ? itemsPart.split(/[，,、]/).map(s => s.trim()).filter(Boolean) : [];
  return { name, armor, items };
}

function countSlots(inv) {
  return inv.reduce((s, item) => s + (item && item.trim() ? (item.includes('笨重') ? 2 : 1) : 0), 0);
}

Page({
  data: {
    step: 0, characters: [], char: null, _loadIndex: -1,
    invUsed: 0,
    diceSelected: {}, diceRolling: false, diceResult: null, diceHistory: [],
    showCheck: false, checkLabel: '', checkTarget: 0, checkRoll: 0, checkSuccess: false,
    showExportDialog: false,
    showShop: false, shopSearch: '', shopCats: [],
    showNameDialog: false, newCharName: '', activeModule: 'core',
    notesExpandable: false, notesExpanded: false,
    // 临时状态（步进1中编辑用）
    _deletePending: null
  },

  onLoad() { this.loadList(); },
  onShow() { this.loadList(); },

  loadList() {
    const list = wx.getStorageSync(STORAGE_KEY) || [];
    // 预格式化时间
    list.forEach(ch => {
      const ts = ch.updatedAt || ch.createdAt;
      ch._time = ts ? fmtTime(ts) : '';
    });
    this.setData({ characters: list });
  },
  saveList(list) {
    // 格式化显示时间（不持久化）
    list.forEach(ch => {
      const ts = ch.updatedAt || ch.createdAt;
      ch._time = ts ? fmtTime(ts) : '';
    });
    // 写入存储前剥离临时字段
    const clean = list.map(function(ch) {
      var copy = {};
      for (var k in ch) { if (k !== '_time') copy[k] = ch[k]; }
      return copy;
    });
    wx.setStorageSync(STORAGE_KEY, clean);
    this.setData({ characters: list });
  },

  /* ========== Step 0: 角色列表 ========== */
  startNew() {
    this.saveChar();
    this.setData({ showNameDialog: true, newCharName: '', activeModule: 'core' });
  },

  onNewNameInput(e) { this.setData({ newCharName: e.detail.value }); },

  pickMaleName() { this.setData({ newCharName: pick(MALE_NAMES) }); },
  pickFemaleName() { this.setData({ newCharName: pick(FEMALE_NAMES) }); },

  switchModule(e) {
    this.setData({ activeModule: e.currentTarget.dataset.key });
  },

  confirmNewChar() {
    const name = this.data.newCharName.trim();
    if (!name) { wx.showToast({ title: '请输入调查员姓名', icon: 'none' }); return; }
    this.setData({ showNameDialog: false });
    this._deletePending = null;
    const ch = this.generateRaw(name, this.data.activeModule);
    const list = this.data.characters;
    list.unshift(ch);
    this.saveList(list);
    this.openChar(0);
  },

  cancelNewChar() { this.setData({ showNameDialog: false }); },

  openChar(e) {
    const idx = typeof e === 'number' ? e : e.currentTarget.dataset.index;
    const list = this.data.characters;
    if (idx < 0 || idx >= list.length) return;
    const char = JSON.parse(JSON.stringify(list[idx]));
    const invUsed = countSlots(char.inventory);
    const noteLen = (char.notes || '').length;
    this.setData({
      step: 1, char, _loadIndex: idx, invUsed,
      diceSelected: {}, diceResult: null,
      notesExpanded: false, notesExpandable: noteLen > 120
    });
    this._deletePending = null;
  },

  deleteChar(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.characters;
    wx.showModal({
      title: '删除角色', content: '确定删除这个调查员吗？',
      success: (res) => {
        if (!res.confirm) return;
        list.splice(idx, 1);
        this.saveList(list);
        if (this.data._loadIndex === idx) this.setData({ step: 0, char: null, _loadIndex: -1 });
      }
    });
  },

  saveChar() {
    const list = this.data.characters;
    const idx = this.data._loadIndex;
    if (idx >= 0 && idx < list.length) {
      const data = JSON.parse(JSON.stringify(this.data.char));
      data.updatedAt = Date.now();
      list[idx] = data;
      this.saveList(list);
      wx.showToast({ title: '已保存', icon: 'success', duration: 1200 });
    }
  },

  backToList() {
    this._deletePending = null;
    this.saveChar();
    this.setData({ step: 0, char: null, _loadIndex: -1, diceSelected: {}, diceResult: null, diceHistory: [] });
  },

  /* ========== 角色生成 ========== */
  generateRaw(name, moduleKey) {
    const strVal = rollD(3, 6), agiVal = rollD(3, 6), wilVal = rollD(3, 6);
    const hpVal = roll(6), luckVal = rollD(3, 6), moneyVal = roll(6) * 100;
    const mod = MODULES.find(m => m.key === moduleKey) || MODULES[0];
    const bgStr = pick(mod.backgrounds);
    const bg = parseBackground(bgStr);

    const inventory = ['智能手机'];
    for (const item of bg.items) {
      if (inventory.length < 10) inventory.push(item);
    }
    while (inventory.length < 10) inventory.push('');

    const now = Date.now();
    return {
      id: now,
      name: name || '',
      module: moduleKey,
      background: bg.name,
      backgroundRaw: bgStr,
      strength: strVal, strengthMax: strVal,
      agility: agiVal, agilityMax: agiVal,
      will: wilVal, willMax: wilVal,
      hp: hpVal, hpMax: hpVal,
      armor: bg.armor,
      stability: 0,
      luck: luckVal, luckMax: luckVal,
      money: moneyVal,
      inventory,
      conditions: {},
      fallout: [],
      details: {
        appearance: pick(APPEARANCES),
        firstEncounter: pick(FIRST_ENCOUNTERS),
        ideology: pick(IDEOLOGIES),
        traits: {
          physique:   pick(TRAITS.physique),
          face:       pick(TRAITS.face),
          speech:     pick(TRAITS.speech),
          virtue:     pick(TRAITS.virtue),
          vice:       pick(TRAITS.vice),
          misfortune: pick(TRAITS.misfortune)
        }
      },
      notes: '',
      createdAt: now,
      updatedAt: now
    };
  },

  /* ========== 属性 & HP 增减 ========== */
  statDelta(e) {
    const { field, delta } = e.currentTarget.dataset;
    const c = this.data.char;
    const d = parseInt(delta);
    const maxField = field + 'Max';

    if (field === 'hp') {
      if (c.conditions && c.conditions.deprived) {
        wx.showToast({ title: '⚠ 处于"匮乏"状态，无法恢复 HP', icon: 'none', duration: 2000 });
        return;
      }
      c.hp = Math.max(0, Math.min(c.hpMax, c.hp + d));
    } else if (field === 'armor' || field === 'stability') {
      c[field] = Math.max(0, (c[field] || 0) + d);
    } else if (field === 'luck') {
      c.luck = Math.max(0, (c.luck || 0) + d);
    } else if (field === 'money') {
      c.money = Math.max(0, (c.money || 0) + d * 10);
    } else {
      c[field] = Math.max(0, c[field] + d);
      this.checkAttrZero(c);
    }
    this.setData({ char: c });
  },

  checkAttrZero(c) {
    if (c.strength <= 0) wx.showToast({ title: '⚠ 力量归零：调查员死亡！', icon: 'none', duration: 2500 });
    else if (c.agility <= 0) wx.showToast({ title: '⚠ 敏捷归零：调查员瘫痪！', icon: 'none', duration: 2500 });
    else if (c.will <= 0) wx.showToast({ title: '⚠ 意志归零：调查员迷失！', icon: 'none', duration: 2500 });
  },

  /* ========== 金钱输入 ========== */
  onMoneyInput(e) {
    const c = this.data.char;
    c.money = parseInt(e.detail.value) || 0;
    this.setData({ char: c });
  },

  onArmorInput(e) {
    let v = parseInt(e.detail.value) || 0;
    const c = this.data.char; c.armor = v; this.setData({ char: c });
  },

  onStabilityInput(e) {
    let v = parseInt(e.detail.value) || 0;
    const c = this.data.char; c.stability = v; this.setData({ char: c });
  },

  /* ========== 豁免检定 (d20 ≤ 属性) ========== */
  doCheck(e) {
    const attr = e.currentTarget.dataset.attr;
    const c = this.data.char;
    let target;
    if (attr === 'luck') {
      target = c.luck;
      this.setData({ showCheck: true, checkLabel: '幸运', checkTarget: target });
    } else {
      const map = { strength: '力量 STR', agility: '敏捷 AGI', will: '意志 WIL' };
      target = c[attr];
      this.setData({ showCheck: true, checkLabel: map[attr] || attr, checkTarget: target });
    }
    const r = roll(20);
    const success = r <= target;
    wx.vibrateShort({ type: success ? 'light' : 'heavy' });
    this.setData({ checkRoll: r, checkSuccess: success });
  },

  closeCheck() { this.setData({ showCheck: false }); },

  /* ========== 状态 toggle ========== */
  toggleCondition(e) {
    const key = e.currentTarget.dataset.key;
    const c = this.data.char;
    if (!c.conditions) c.conditions = {};
    if (c.conditions[key]) delete c.conditions[key];
    else c.conditions[key] = true;
    this.setData({ char: c });
  },

  /* ========== 背包 ========== */
  onInvInput(e) {
    const idx = e.currentTarget.dataset.index;
    const c = this.data.char;
    c.inventory[idx] = e.detail.value;
    // 确保始终有10个槽
    while (c.inventory.length < 10) c.inventory.push('');
    const used = countSlots(c.inventory);
    this.checkInvFull(c, used);
    this.setData({ char: c, invUsed: used });
  },

  deleteInvItem(e) {
    const idx = e.currentTarget.dataset.index;
    const now = Date.now();
    const prev = this._deletePending;
    if (prev && prev.idx === idx && now - prev.time < 800) {
      this._deletePending = null;
      const c = this.data.char;
      c.inventory[idx] = '';
      const used = countSlots(c.inventory);
      this.setData({ char: c, invUsed: used });
      return;
    }
    this._deletePending = { idx, time: now };
    wx.showToast({ title: '再次点击删除', icon: 'none', duration: 1200 });
  },

  addBulkItem() {
    const c = this.data.char;
    const used = countSlots(c.inventory);
    if (used + 2 > 10) { wx.showToast({ title: '⚠ 行装栏不足！', icon: 'none', duration: 1500 }); return; }
    // 找第一个空槽填入
    for (let i = 0; i < c.inventory.length; i++) {
      if (!c.inventory[i] || !c.inventory[i].trim()) { c.inventory[i] = '（笨重）'; break; }
    }
    const newUsed = countSlots(c.inventory);
    this.checkInvFull(c, newUsed);
    this.setData({ char: c, invUsed: newUsed });
  },

  checkInvFull(c, used) {
    if (used > 10 && c.hp > 0) {
      c.hp = 0;
      wx.showToast({ title: '⚠ 行装超载！HP 降至 0', icon: 'none', duration: 2500 });
    }
  },

  /* ========== 姓名 ========== */
  onNameInput(e) {
    const c = this.data.char;
    c.name = e.detail.value;
    this.setData({ char: c });
  },

  /* ========== 备注 ========== */
  onNotesInput(e) {
    const c = this.data.char;
    c.notes = e.detail.value;
    const noteLen = (c.notes || '').length;
    this.setData({ char: c, notesExpandable: noteLen > 120 });
  },
  toggleNotes() { this.setData({ notesExpanded: !this.data.notesExpanded }); },

  /* ========== 掷骰 ========== */
  _lastLongpress: 0,
  selectDice(e) {
    if (this.data.diceRolling) return;
    const now = Date.now();
    if (now - this._lastLongpress < 400) return;
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = Object.assign({}, this.data.diceSelected);
    sel[d] = (sel[d] || 0) + 1;
    this.setData({ diceSelected: sel, diceResult: null });
  },
  deselectDice(e) {
    if (this.data.diceRolling) return;
    this._lastLongpress = Date.now();
    const d = parseInt(e.currentTarget.dataset.d);
    const sel = Object.assign({}, this.data.diceSelected);
    if (sel[d]) { sel[d]--; if (sel[d] <= 0) delete sel[d]; }
    this.setData({ diceSelected: sel, diceResult: null });
  },
  clearDice() { this.setData({ diceSelected: {}, diceResult: null }); },
  clearHistory() { this.setData({ diceHistory: [] }); },

  rollSelected() {
    const sel = this.data.diceSelected;
    const keys = Object.keys(sel);
    if (keys.length === 0) { wx.showToast({ title: '⚠ 请先选择骰子', icon: 'none', duration: 1500 }); return; }
    this.setData({ diceRolling: true, diceResult: null });
    wx.vibrateShort({ type: 'medium' });
    const dice = [];
    let total = 0;
    keys.forEach(k => {
      const sides = parseInt(k), count = sel[k];
      for (let i = 0; i < count; i++) { const r = roll(sides); dice.push({ sides, result: r }); total += r; }
    });
    setTimeout(() => {
      const result = { dice, total, time: new Date().toLocaleTimeString() };
      const history = [result].concat(this.data.diceHistory).slice(0, 50);
      this.setData({ diceRolling: false, diceResult: result, diceHistory: history });
    }, 700);
  },

  /* ========== 商店 ========== */
  _buildShopCats(items) {
    const cats = ['武器','护甲','工具','载具','杂物'];
    const indexed = items.map(function(s, i) {
      var copy = {}; for (var k in s) copy[k] = s[k];
      copy._idx = i; return copy;
    });
    return cats.map(c => {
      const catItems = indexed.filter(s => s.cat === c);
      return { cat: c, count: catItems.length, items: catItems };
    }).filter(c => c.items.length > 0);
  },
  openShop() {
    this.setData({ showShop: true, shopCats: this._buildShopCats(SHOP_ITEMS), shopSearch: '' });
  },
  closeShop() { this.setData({ showShop: false }); },
  onShopSearch(e) {
    const v = e.detail.value;
    if (!v) { this.setData({ shopSearch: v, shopCats: this._buildShopCats(SHOP_ITEMS) }); return; }
    const filtered = SHOP_ITEMS.filter(s => s.name.includes(v) || s.desc.includes(v) || s.cat.includes(v));
    this.setData({ shopSearch: v, shopCats: this._buildShopCats(filtered) });
  },
  addShopItem(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const all = SHOP_ITEMS;
    const item = all[idx];
    if (!item) return;
    const c = this.data.char;
    const slotsNeeded = item.bulky ? 2 : 1;
    const used = countSlots(c.inventory);
    if (used + slotsNeeded > 10) {
      wx.showToast({ title: '⚠ 行装栏不足！', icon: 'none', duration: 2000 });
      return;
    }
    let itemName = item.name;
    if (item.desc) itemName += '（' + item.desc + '）';
    if (item.bulky) itemName += '（笨重）';
    for (let i = 0; i < c.inventory.length; i++) {
      if (!c.inventory[i] || !c.inventory[i].trim()) { c.inventory[i] = itemName; break; }
    }
    const newUsed = countSlots(c.inventory);
    this.checkInvFull(c, newUsed);
    this.setData({ char: c, invUsed: newUsed });
    wx.showToast({ title: '已添加「' + item.name + '」', icon: 'success', duration: 1200 });
  },

  /* ========== 导出导入 ========== */
  toggleExportDialog() { this.setData({ showExportDialog: !this.data.showExportDialog }); },

  doExportClipboard() {
    const char = this.data.char;
    if (!char) return;
    wx.setClipboardData({
      data: JSON.stringify(JSON.parse(JSON.stringify(char)), null, 2),
      success: () => { wx.showToast({ title: '角色数据已复制', icon: 'success', duration: 1500 }); this.toggleExportDialog(); },
      fail: () => { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  importCharacter() {
    const that = this;
    wx.getClipboardData({
      success(res) {
        let data;
        try { data = JSON.parse(res.data); } catch (e) { wx.showToast({ title: '剪贴板中没有有效的角色数据', icon: 'none', duration: 2000 }); return; }
        if (!data.strength === undefined || !data.inventory) {
          wx.showToast({ title: '数据格式不符，非 LH 调查员', icon: 'none', duration: 2000 });
          return;
        }
        data.id = Date.now();
        const list = that.data.characters;
        list.unshift(data);
        that.saveList(list);
        wx.showToast({ title: '已导入「' + (data.name || '未命名') + '」', icon: 'success', duration: 1500 });
      },
      fail() { wx.showToast({ title: '读取剪贴板失败', icon: 'none', duration: 2000 }); }
    });
  },

  preventTouchMove() {}
});
