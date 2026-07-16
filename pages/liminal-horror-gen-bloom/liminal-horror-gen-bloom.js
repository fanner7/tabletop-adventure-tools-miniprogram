// pages/liminal-horror-gen-bloom/liminal-horror-gen-bloom.js
Page({

  data: {
    generated: false,
    strength: 0,
    agility: 0,
    will: 0,
    hp: 0,
    cash: 0,
    backgroundString: '',
    appearance: '',
    firstEncounter: '',
    ideology: '',
    traits: { physique: '', face: '', speech: '', virtue: '', vice: '', misfortune: '' },
    jsonOutput: ''
  },
  goToAppHome() { wx.navigateBack(); },

  archetypes: [
    "《真实犯罪》：当下每位有麦克风的人都能开播客，而你的收听率却在直线下降。冷水镇周边的谜团在幕后渠道中流传已久，而你恰好想成为找出事情真相的人。携带：迷你霰弹枪形麦克风、智能手机三脚架、LED 灯。", "浪子回头：你在孩提时候曾经在湖边的家庭木屋里度过夏天，自从上次来到此地已经过去十年了。小镇比起你记忆中的样子大相径庭。携带：过时的旅游指南、一套生锈的钥匙、旧鱼竿。", "无踪大脚怪：作为领域内的专家，你多年来一直在追寻行踪飘忽的大脚怪，寻找最终能让公众信服的佐证，而所有的证据都指向了这里。携带：热成像摄像机、防熊喷雾（d4，群攻，非致命）、吉利迷彩服。", "聚会迟到：你做好了调查，选好了日期，定好了露营地，但始料未及的工作任务却让你无法和朋友一同出发，如今他们人间蒸发了。携带：睡袋、露营背包（+2 栏位）、小型生存套件。", "隐退作家：你已经很久没把作品交到编辑的桌上了，也许呼吸一下新鲜空气，远离喧嚣的城市，创作灵感就能源源不断。携带：电子书写平板、折叠木工刀（d6）、瓶装酒水。", "蓝魔乐手：整个“单飞生涯”并没有按计划进行，只剩下一长串报酬微薄的三流演出，接下来的“蓝莓节”表演也不过是其中之一。携带：自选乐器、复古动圈式麦克风、便携式扩音器。", "只是路过：你正打算前往某座城市，而那名卡车司机最远只能送你到冷水镇，但这里有一股让人愉悦的魅力，也许你会在本地留上一阵。携带：背包（+2 栏位）、雨衣、手杖（d6）、折叠刀（d6）。", "正如规划：你的名声当之无愧，镇民为了确保那蠢到家的小庆典能顺利进行可是花了不少钱，而你已经完美地规划好了一切。携带：笔记本电脑、多功能工具、数码单反相机、名片。", "随时待命：冷水镇没有兽医办公点，但大家都会在农场动物生病时打电话给你。这一次，是野生动物举止异常，乡亲们对此有所顾虑。携带：手术刀（d6）、镊子、瓶装消毒液、手术钳。", "枯萎蔓延：冷水镇周边有一些迷人的真菌种类。不幸的是，其中某些也具备破坏性。农民一直在抱怨产量下降，所以可能爆发了枯萎病。携带：便携显微镜、小型采样套件、探木钻（d6）。", "小镇专题：虽然你对本地区域满怀热情，但当前负责的专题已经多年都没出现过吸引眼球的专栏了，希望蓝莓节的热度足以让你在岗位上多留几天。携带：录音机、数码相机、笔记本、电击枪（d6，目标敏捷）。", "恐怖片导演：你“下一部爆火砍杀片”的剧本已经卖出去了，但制片方希望能在下次会议前确定拍摄地点，否则这部电影就要被束之高阁。携带：360 度摄像机和吊杆、剧本、测光表、一沓空白的租赁协议。", "前卫大厨：城市里正流行着某些非常奔放的烹饪潮流，据说冷水镇还是一片尚未开发的大金矿，这里可以找到独特的食材。没准你生来就是要干这行。携带：带钩小刀（d6）、可折叠铲子（d6）、采集篮。", "摩托新秀：尽管还是个新手，但本地的摩托车公园对你而言已经不在话下。你得要去没有跑过的小路上训练才能成为职业选手。携带：山地摩托车、防撞服（+1 护甲）、全覆面头盔（穿戴时+1 护甲）、运动相机。", "毕业难关：虽然激情尚存，但你的硕士论文《小镇：从繁荣到毁灭》的实地调研让人沮-丧，希望冷水镇会是最后一站。携带：笔记本电脑、装满冷水镇研究的活页夹、介绍信。", "骗保查勘：你的公司在过去一年接到了成吨来自这个地区的保险索赔，含糊的报告导致审计得要亲自上阵。携带：保险索赔、胡椒喷雾（d6，非致命）、数码相机。", "生意兴隆：你效力的公司最初是只是一个“家庭经营”式的总承包商，但几份幸运的活计带来了充裕的资金，其希望能向房地产领域扩张。携带：公司信用卡、安全帽（+1 护甲）、反光背心。", "黄金岁月：你在几十年紧张的工作后最终得以提前几年安享退休！远离城市喧嚣的冷水镇似乎会是个安顿度日的好地方。携带：冷水镇内的房子、可折叠登山杖（d6）、安娜·史东的小说。", "首次环评：政府出乎意料地将拨款分配给冷水镇用以振兴公共土地，你受命前来进行初步评估。携带：注释地图、储物式写字板夹、16 英尺测量杆（d6）。", "盲抛踩点：有传言称，冷水湖里面有区域内最好的钓点。大伙都愿意出高价包船去最好的地方钓鱼，所以是时候去看看了。携带：脚踏小艇、锁鳃鱼串、折叠鱼竿（d6）、钓具箱。"
  ],

  appearances: ["随时商务", "街头风", "乐队文化恤", "统统涂黑", "运动休闲", "清爽熨烫", "休闲舒适", "正宗复古", "风靡一时", "工作制服", "超大码卫衣", "海岛花风情", "量身定制", "实用胜于时尚", "货运口袋", "牛仔配 T 恤", "犹在 2009", "粗犷极简", "千禧虫", "牛仔裤搭牛仔衫"],

  firstEncounters: ["在神秘事况下痛失所爱。", "网上证据太多，不容忽视。", "在黑暗中看见了什么东西。", "幸存于一次无法解释的袭击。", "有东西潜伏在梦里。", "身边某人正在拉你入伙，或是赶你远离。", "异教活动（或许他们招募了重要人物）。", "秘密社团的持卡会员。", "你读到了一些凡人无法理解的材料。", "还没，所以来跑团！"],

  ideologies: ["世间万事都有植根于科学的合理解释。", "个人可以有所作为。", "认同某种特定政治意识形态。", "特定宗教指引着你。", "道德是非黑白的。", "你相信命运直接影响你的生活。", "相信更高的力量，譬如占星术、灵修等。", "自由意志是唯一真理。", "世人皆醉我独醒。答案就在眼前。", "相信社群的力量。"],

  traits: { physique: ["运动", "健硕", "曲线", "瘦长", "小巧", "僵硬", "矮胖", "高耸", "健壮", "丰满"], face: ["骨感", "破碎", "棱角", "拉长", "酒窝", "完美", "圆润", "锋利", "难忘", "易忘"], speech: ["粗钝", "沙哑", "洪亮", "严谨", "隐晦", "尖锐", "正式", "口音", "单调", "生涩"], virtue: ["诚实", "荣耀", "谨慎", "谦逊", "勇敢", "仁慈", "自律", "沉着", "合群", "宽容"], vice: ["易怒", "懒惰", "悲观", "紧张", "怯懦", "粗鲁", "狡诈", "虚荣", "贪婪", "记仇"], misfortune: ["遗弃", "遇骗", "成瘾", "降职", "勒索", "辱没", "蒙罪", "决裂", "诅咒", "流放"] },

  rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  },

  rollDice(count, sides) {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += this.rollDie(sides);
    }
    return total;
  },

  getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  generateCharacter() {
    const strength = this.rollDice(3, 6);
    const agility = this.rollDice(3, 6);
    const will = this.rollDice(3, 6);
    const hp = this.rollDie(6);
    const cash = this.rollDie(6) * 100;
    const backgroundString = this.getRandomItem(this.archetypes);
    const appearance = this.getRandomItem(this.appearances);
    const firstEncounter = this.getRandomItem(this.firstEncounters);
    const ideology = this.getRandomItem(this.ideologies);
    const traitIndex = this.rollDie(10) - 1;

    const backgroundParts = backgroundString.split('：');
    const backgroundName = backgroundParts[0].replace(/^\d+\.\s*/, '');

    let armor = 0;
    if (backgroundString.includes('护甲')) {
      const armorMatch = backgroundString.match(/\+(\d+)\s*护甲/g) || [];
      armor = armorMatch.length;
    }

    const items = ['智能手机'];
    if (backgroundParts.length > 1 && backgroundParts[backgroundParts.length - 1]) {
      const backgroundItemsString = backgroundParts[backgroundParts.length - 1].replace(/。$/, '').trim();
      if (backgroundItemsString) {
        const backgroundItems = backgroundItemsString.split('、').map(item => item.trim());
        items.push(...backgroundItems);
      }
    }

    const characterData = {
      name: "",
      background: backgroundName,
      attributes: {
        strength: { current: strength, max: strength },
        agility: { current: agility, max: agility },
        will: { current: will, max: will }
      },
      hp: { current: hp, max: hp },
      status: { armor: armor, stability: 0, deprived: "" },
      money: cash,
      inventory: items.slice(0, 10),
      details: {
        appearance: appearance,
        firstEncounter: firstEncounter,
        ideology: ideology,
        traits: {
          physique: this.traits.physique[traitIndex],
          face: this.traits.face[traitIndex],
          speech: this.traits.speech[traitIndex],
          virtue: this.traits.virtue[traitIndex],
          vice: this.traits.vice[traitIndex],
          misfortune: this.traits.misfortune[traitIndex]
        }
      },
      notes: backgroundParts.slice(1, -1).join('：')
    };

    this.setData({
      generated: true,
      strength,
      agility,
      will,
      hp,
      cash,
      backgroundString,
      appearance,
      firstEncounter,
      ideology,
      traits: {
        physique: this.traits.physique[traitIndex],
        face: this.traits.face[traitIndex],
        speech: this.traits.speech[traitIndex],
        virtue: this.traits.virtue[traitIndex],
        vice: this.traits.vice[traitIndex],
        misfortune: this.traits.misfortune[traitIndex]
      },
      jsonOutput: JSON.stringify(characterData, null, 2)
    });
  },

  copyJson() {
    const json = this.data.jsonOutput;
    if (!json) return;
    wx.setClipboardData({
      data: json,
      success: () => {
        wx.showToast({ title: '已复制！', icon: 'success', duration: 2000 });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  onLoad() {
    this.generateCharacter();
  }

});
