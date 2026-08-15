// pages/coc7-gen/data/presets.js — 静态数据表（由 coc7-gen.js 引入，请勿手改数据）

var OCCUPATIONS = require('./occupations').OCCUPATIONS;

// 预置调查员（洛氏经典职业，可直接选用开始游戏）
// 字段与 buildCharacterData 输出一致；derived/derivedItems/
// sortedSkillsByCat/timestamp 由加载逻辑动态生成。
// 属性值已包含年龄修正结果，attrRolls 记录对应骰面。
// ===================================================================
const PRESET_CHARACTERS = [
  {
    id: 'campbell',
    emoji: '🎩',
    tagline: '南极冰原下的秘密，刻在他带回的石板拓片上',
    data: {
      attrValues: { str: 40, con: 60, dex: 50, app: 45, pow: 70, siz: 60, int: 85, edu: 90, luck: 55 },
      attrRolls: { str: '1,3,5', con: '3,4,5', dex: '2,3,5', app: '1,4,5', pow: '4,5,5', siz: '3,3', int: '5,6', edu: '5,6', luck: '3,4,4' },
      charInfo: { name: '埃德温·坎贝尔', player: '', age: '45', gender: '男', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '考古学家（原作向）'),
      occPts: { '考古学': 89, '历史': 55, '图书馆使用': 40, '外语①': 39, '侦查': 23, '估价': 15, '机械维修': 10, '导航': 10, '科学': 39, '信用评级': 40 },
      intPts: { '攀爬': 10, '急救': 20, '格斗①': 15, '神秘学': 25, '外语②': 29, '驾驶①': 20, '潜行': 10, '聆听': 15, '跳跃': 10, '心理学': 16 },
      skillSpecs: { '格斗①': '斗殴', '外语①': '拉丁语', '外语②': '德语', '科学': '地质学' },
      usedOccPoints: 360, totalOccPoints: 360, usedIntPoints: 170, totalIntPoints: 170,
      charWeapons: [
        { name: '.38(9mm)左轮手枪', skill: '手枪', skillId: '射击①', damage: '1D10', range: '15', impale: '√', attacks: '1(3)', ammo: '6', malfunction: '100', rare: false }
      ],
      charBackstory: '密斯卡托尼克大学考古学教授，曾主持美索不达米亚与南极两处发掘。1924 年，南极考察队在冰层下发现巨大的石造废墟——那些比人类文明古老千万年的墙垣上，刻满了不属于任何已知文字的符号。随行的三名同事在废墟中失踪，一人自尽。他被送回国内时，随身皮箱里多了一卷黑色石板的拓片。此后十年，他穷尽余生追索那些符号的出处：禁书室的卷宗、博物馆的未编号藏品，以及深夜打来的、操着含混口音的匿名电话。',
      charGear: '笔记本与钢笔、怀表、双筒望远镜、考古工具包（刷子、凿子、卷尺）、南极带回的黑色石板拓片、.38 左轮手枪（6 发）',
      charMythos: '黑色石板拓片——来源不明的符号，与已知所有文字体系均无法对应；拓片边缘有烧灼痕迹',
      charSpells: '',
      charCompanions: '密斯卡托尼克大学档案馆管理员马库斯·皮博迪——愿意为他调阅禁书；前学生艾达·斯托克斯，现为波士顿博物馆助理',
      charAssets: '大学教授薪金（年收入约 $4,000）；阿卡姆旧宅一所；少量藏书',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'morton',
    emoji: '📰',
    tagline: '照片冲洗出来时，总多出一些不该存在的东西',
    data: {
      attrValues: { str: 45, con: 50, dex: 65, app: 75, pow: 65, siz: 50, int: 75, edu: 75, luck: 60 },
      attrRolls: { str: '1,3,5', con: '2,3,5', dex: '3,5,5', app: '4,5,6', pow: '3,5,5', siz: '1,3', int: '4,5', edu: '4,5', luck: '2,4,6' },
      charInfo: { name: '格蕾丝·莫顿', player: '', age: '28', gender: '女', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '记者(原作向)-调查记者'),
      occPts: { '话术': 85, '技艺①': 45, '历史': 35, '图书馆使用': 50, '心理学': 45, '信用评级': 40 },
      intPts: { '侦查': 45, '聆听': 30, '潜行': 10, '格斗①': 10, '驾驶①': 15, '投掷': 10, '游泳': 5, '攀爬': 5, '跳跃': 5, '妙手': 15 },
      skillSpecs: { '技艺①': '摄影', '格斗①': '斗殴' },
      usedOccPoints: 300, totalOccPoints: 300, usedIntPoints: 150, totalIntPoints: 150,
      charWeapons: [],
      charBackstory: '《阿卡姆公报》调查记者。1927 年秋，她奉命追踪一名失踪的古董商，线索指向缅因州沿海的渔镇。镇上的居民对来客异常沉默，码头上晾晒的渔网散发着不属于海洋的腥气，教堂地窖里传出的合唱声让她整夜难眠。她拍下的照片在冲洗后，总会出现一些画面里并不存在的东西。她的编辑说她"想象力过于丰富"，但她知道，那些东西是真的。',
      charGear: '记者证、莱卡相机与胶卷、速记本、便携打字机、海雾镇地图与剪报',
      charMythos: '古董商留下的手抄笔记——提及"海底的教会"与一份名为《死灵之书》的手稿',
      charSpells: '',
      charCompanions: '摄影师杰克·奥康纳——在暗房里见过她照片里的"多余之物"后仍愿意同行',
      charAssets: '《阿卡姆公报》记者薪金（年收入约 $2,500）；阿卡姆租房一间',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'blackwood',
    emoji: '🕵️',
    tagline: '山谷里的呢喃像无数飞蛾振翅，他决定亲自去听',
    data: {
      attrValues: { str: 60, con: 65, dex: 70, app: 55, pow: 60, siz: 65, int: 70, edu: 65, luck: 70 },
      attrRolls: { str: '2,4,6', con: '3,4,6', dex: '4,5,5', app: '2,4,5', pow: '3,4,5', siz: '2,5', int: '2,6', edu: '2,5', luck: '4,5,5' },
      charInfo: { name: '罗兰·布莱克伍德', player: '', age: '38', gender: '男', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '私家侦探'),
      occPts: { '侦查': 40, '心理学': 30, '话术': 40, '法律': 30, '图书馆使用': 15, '技艺①': 10, '乔装': 5, '锁匠': 19, '格斗①': 41, '射击①': 25, '信用评级': 15 },
      intPts: { '潜行': 55, '聆听': 40, '驾驶①': 20, '急救': 10, '追踪': 10, '妙手': 5 },
      skillSpecs: { '格斗①': '斗殴', '射击①': '手枪', '技艺①': '摄影' },
      usedOccPoints: 270, totalOccPoints: 270, usedIntPoints: 140, totalIntPoints: 140,
      charWeapons: [
        { name: '.38(9mm)左轮手枪', skill: '手枪', skillId: '射击①', damage: '1D10', range: '15', impale: '√', attacks: '1(3)', ammo: '6', malfunction: '100', rare: false },
        { name: '黄铜指虎', skill: '斗殴', skillId: '格斗①', damage: '1D3+1+DB', range: '接触', impale: '×', attacks: '1', ammo: '——', malfunction: '——', rare: false }
      ],
      charBackstory: '前波士顿警察，因一桩无法结案的失踪案辞职，在查尔斯街开了家侦探社。委托大多是寻人、盯梢的普通活计，直到一位佛蒙特州的农场主登门——他说自己听到了山谷里的声音：低沉的呢喃，像无数飞蛾振翅。他声称自家谷仓夜里会亮起诡异的光，而他的弟弟已经失踪了三个星期。布莱克伍德本打算把这当作疯话，直到他看见委托人手背上那三道平行的、细如发丝的伤口。',
      freeOccSkills: ['锁匠', '格斗①', '射击①'],
      charGear: '.38 左轮手枪（6 发）、黄铜指虎、旧警徽、记事本、手电筒、折叠刀',
      charMythos: '农场主的信件与谷仓照片——照片一角有一团无法解释的模糊阴影，形状似带翼的人形',
      charSpells: '',
      charCompanions: '前搭档汤姆·哈里斯——仍在警局，偶尔给他递线索',
      charAssets: '侦探社收入（年收入约 $3,000）；波士顿查尔斯街办公室一间',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'winters',
    emoji: '💉',
    tagline: '病人的素描里，是一座不属于这个时代的黑色城市',
    data: {
      attrValues: { str: 40, con: 60, dex: 55, app: 60, pow: 75, siz: 50, int: 80, edu: 85, luck: 50 },
      attrRolls: { str: '2,3,4', con: '3,4,5', dex: '2,4,5', app: '3,4,6', pow: '4,5,6', siz: '1,3', int: '4,6', edu: '3,5', luck: '2,3,5' },
      charInfo: { name: '克拉拉·温特斯', player: '', age: '41', gender: '女', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '精神病医生（古典）'),
      occPts: { '医学': 89, '精神分析': 73, '心理学': 50, '法律': 25, '聆听': 20, '外语①': 19, '科学': 29, '信用评级': 35 },
      intPts: { '话术': 25, '说服': 30, '侦查': 25, '图书馆使用': 30, '急救': 20, '神秘学': 15, '催眠': 15 },
      skillSpecs: { '外语①': '德语', '科学': '生物学' },
      usedOccPoints: 340, totalOccPoints: 340, usedIntPoints: 160, totalIntPoints: 160,
      charWeapons: [],
      charBackstory: '阿卡姆圣玛丽医院精神科医生。1928 年她接诊了一位自称"纳撒尼尔"的病人——对方坚称自己在昏迷中"去过未来"，看见巨大的黑色圆锥体城市与半植物般的统治者，并反复绘制那些建筑的草图。温特斯起初诊断为妄想症，但病人描述的细节精确得令人生畏，且病情在电击治疗后毫无改善。她开始私下查阅古老的病例档案，发现五十年前也有医生记录过几乎一模一样的症状。病历室的灯，最近总在她背后无端熄灭。',
      charGear: '医疗包（听诊器、血压计、镇静剂）、日记本、钢笔、圣玛丽医院档案室钥匙、病人绘制的圆锥体城市素描',
      charMythos: '病人"纳撒尼尔"绘制的素描集——圆锥体城市与无面翼人；她自己的日记中记录了三次无法解释的记忆空白',
      charSpells: '',
      charCompanions: '护士长艾格尼丝·豪——医院里少数愿意谈论"档案室传闻"的人',
      charAssets: '圣玛丽医院医生薪金（年收入约 $4,500）；阿卡姆住所一所',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'cartwright',
    emoji: '📚',
    tagline: '禁书区的书最近总是自己换位置',
    data: {
      attrValues: { str: 40, con: 55, dex: 55, app: 65, pow: 65, siz: 50, int: 85, edu: 85, luck: 60 },
      attrRolls: { str: '1,3,4', con: '3,4,4', dex: '2,4,5', app: '3,5,5', pow: '3,4,5', siz: '1,3', int: '5,6', edu: '5,6', luck: '2,4,6' },
      charInfo: { name: '伊芙琳·卡特赖特', player: '', age: '35', gender: '女', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '图书馆管理员（原作向）'),
      occPts: { '图书馆使用': 79, '外语①': 49, '历史': 50, '神秘学': 50, '会计': 35, '估价': 28, '侦查': 25, '考古学': 24, '母语': 0 },
      intPts: { '攀爬': 10, '急救': 15, '格斗①': 5, '潜行': 10, '聆听': 20, '驾驶①': 10, '游泳': 5, '投掷': 5, '外语②': 29, '妙手': 10, '话术': 15, '取悦': 5, '侦查': 10, '闪避': 10, '母语': 11 },
      skillSpecs: { '外语①': '拉丁语', '外语②': '法语', '格斗①': '斗殴', '驾驶①': '汽车' },
      freeOccSkills: ['历史', '神秘学', '估价', '侦查', '考古学'],
      usedOccPoints: 340, totalOccPoints: 340, usedIntPoints: 170, totalIntPoints: 170,
      charWeapons: [],
      charBackstory: '阿卡姆公共图书馆禁书区管理员。她比任何人都清楚哪些书"不该被借走"——1928 年深秋，一位身形怪异、头裹围巾的外乡人凭一张皱巴巴的介绍信借走了《死灵之书》的馆藏抄本，三天后归还时书页间夹着一片干枯的、不属于任何已知生物的鳞片。自那以后，禁书区的书架总是在夜里发出轻微的挪动声，而她按字母排序的索引卡，也总会出现在不该出现的位置。',
      charGear: '索引卡盒、老花镜、钢笔、图书馆备用钥匙、一把防身的黄铜镇纸',
      charMythos: '《死灵之书》馆藏抄本的书页夹层——一片来历不明的干枯鳞片；她自己的索引卡上多出的一些不认识的书名',
      charSpells: '',
      charCompanions: '图书馆门房老伯伦纳德——值夜班时听见禁书区有"翻书声"，但从不进去看',
      charAssets: '图书馆管理员薪金（年收入约 $1,800）；阿卡姆旧公寓一间',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'grant',
    emoji: '🗿',
    tagline: '那尊绿色小雕像，像章鱼，又像别的东西',
    data: {
      attrValues: { str: 45, con: 55, dex: 50, app: 55, pow: 75, siz: 55, int: 80, edu: 75, luck: 60 },
      attrRolls: { str: '2,4,5', con: '3,5,5', dex: '2,4,5', app: '3,4,5', pow: '4,5,6', siz: '2,3', int: '5,5', edu: '2,5', luck: '2,4,6' },
      charInfo: { name: '西奥多·格兰特', player: '', age: '52', gender: '男', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '古董商'),
      occPts: { '会计': 41, '估价': 89, '驾驶①': 10, '历史': 45, '图书馆使用': 40, '导航': 5, '信用评级': 30, '话术': 40 },
      intPts: { '侦查': 35, '聆听': 20, '心理学': 20, '神秘学': 25, '格斗①': 10, '妙手': 10, '外语①': 19, '投掷': 5, '图书馆使用': 16 },
      skillSpecs: { '格斗①': '斗殴', '外语①': '法语', '驾驶①': '汽车' },
      usedOccPoints: 300, totalOccPoints: 300, usedIntPoints: 160, totalIntPoints: 160,
      charWeapons: [],
      charBackstory: '普罗维登斯的老牌古董商，经营一间积灰的铺子，擅长从遗嘱拍卖里挑出被低估的物件。1927 年秋，一位新奥尔良的客户寄来一件包裹：约 20 厘米高的奇异小雕像，石材绿得发黑，造型似章鱼、似龙、又似某种更古老的东西。他想转手卖掉它赚一笔，却开始整夜梦见海底的巨石城市，以及那些缓慢升起的、湿漉漉的尖顶。',
      charGear: '放大镜、鉴定工具、账本、店门钥匙、一支旧左轮（很少上膛）',
      charMythos: '那尊绿色小雕像——底座刻着无人认识的文字，最近它似乎"挪动"过位置',
      charSpells: '',
      charCompanions: '杂货店老板威尔·麦卡锡——他的侄子从新奥尔良码头带来过一箱"石头鱼"，此后就失踪了',
      charAssets: '古董店收入（年收入约 $2,000）；普罗维登斯店面一间',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'norton',
    emoji: '✒️',
    tagline: '他笔下的怪物太真实了——因为模特是真的',
    data: {
      attrValues: { str: 50, con: 50, dex: 60, app: 65, pow: 70, siz: 55, int: 75, edu: 70, luck: 65 },
      attrRolls: { str: '2,4,4', con: '2,4,4', dex: '3,4,5', app: '3,4,6', pow: '4,5,5', siz: '2,3', int: '4,5', edu: '2,6', luck: '3,4,6' },
      charInfo: { name: '埃德加·诺顿', player: '', age: '29', gender: '男', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '作家（原作向）'),
      occPts: { '技艺①': 35, '历史': 41, '图书馆使用': 60, '博物学': 10, '神秘学': 60, '外语①': 19, '心理学': 55, '母语': 0 },
      intPts: { '侦查': 25, '聆听': 15, '乔装': 5, '话术': 15, '格斗①': 10, '攀爬': 10, '驾驶①': 10, '游泳': 5, '技艺②': 5, '技艺①': 20, '神秘学': 15, '图书馆使用': 15 },
      skillSpecs: { '技艺①': '写作', '技艺②': '摄影', '外语①': '法语', '格斗①': '斗殴', '驾驶①': '汽车' },
      usedOccPoints: 280, totalOccPoints: 280, usedIntPoints: 150, totalIntPoints: 150,
      charWeapons: [],
      charBackstory: '波士顿的地下刊物诗人与短篇作者，专写那些畸形、令人作呕却莫名真实的生物。编辑称赞他"想象力过于丰盛"，读者来信问他是不是疯了。只有他自己知道，那些面孔来自城北一条小巷尽头的阁楼——他雇的模特从不摘下面纱，报酬也只收旧银币。最近，他画中生物的姿态，开始在他夜归的路上出现。',
      charGear: '笔记本与钢笔、莱卡相机、速写本、波士顿街区地图',
      charMythos: '阁楼模特留下的半张素描——画中的生物长着他不记得画过的第三只眼',
      charSpells: '',
      charCompanions: '地下刊物编辑玛莎·柯林斯——知道他的"模特"从哪来，但从不多问',
      charAssets: '稿费收入（年收入约 $1,200）；波士顿租房一间',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
  {
    id: 'brooks',
    emoji: '🎓',
    tagline: '旧报纸里那桩未结案的失踪，她决定自己查',
    data: {
      attrValues: { str: 45, con: 55, dex: 60, app: 70, pow: 60, siz: 50, int: 75, edu: 70, luck: 70 },
      attrRolls: { str: '1,3,5', con: '2,4,5', dex: '2,4,6', app: '3,5,6', pow: '3,4,5', siz: '1,3', int: '4,5', edu: '2,6', luck: '3,5,6' },
      charInfo: { name: '玛格丽特·布鲁克斯', player: '', age: '20', gender: '女', era: '1920s' },
      selectedOcc: OCCUPATIONS.find(o => o.name === '学生、实习生'),
      occPts: { '外语①': 19, '图书馆使用': 70, '聆听': 40, '历史': 55, '人类学': 40, '神秘学': 36, '信用评级': 20 },
      intPts: { '侦查': 45, '格斗①': 5, '攀爬': 10, '游泳': 5, '骑术': 5, '驾驶①': 10, '话术': 10, '技艺②': 5, '妙手': 10, '母语': 15, '神秘学': 10, '聆听': 10, '历史': 10 },
      skillSpecs: { '外语①': '法语', '格斗①': '斗殴', '技艺②': '摄影', '驾驶①': '汽车' },
      freeOccSkills: ['母语', '外语①', '历史', '人类学', '神秘学'],
      usedOccPoints: 280, totalOccPoints: 280, usedIntPoints: 150, totalIntPoints: 150,
      charWeapons: [],
      charBackstory: '密斯卡托尼克大学二年级学生，校刊兼职撰稿。她在图书馆地下室的旧报纸堆里翻到 1928 年一桩未结案的失踪——失踪者最后一次被人看见时，手里攥着一张画着五角星与怪异符号的纸片。校方说那是"恶作剧"，但最近，档案馆那间上锁的阅览室，钥匙总是无故出现在她的口袋里。',
      charGear: '笔记本、校刊记者证、自行车、莱卡相机、宿舍钥匙',
      charMythos: '旧报纸剪报——1928 年失踪案的报道，边角有一枚铅笔画的五角星',
      charSpells: '',
      charCompanions: '室友多萝西·怀特——睡在上铺，凌晨三点听过走廊里的脚步声',
      charAssets: '学生津贴（年收入约 $600）；大学宿舍床位',
      tickedSkills: {}, playLog: [], diceHistory: [],
      majorWound: false, dying: false, sessionSanLoss: 0, completed: true,
    }
  },
];

module.exports = {
  PRESET_CHARACTERS: PRESET_CHARACTERS
};
