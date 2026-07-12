// pages/liminal-horror-gen/liminal-horror-gen.js
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

  backgrounds: [
    "流水线工人： 工业围裙（+1 护甲），安全背带，保温瓶。", "公交司机： 饭盒，交通路线图，电击枪（d6，非致命）。", "机械师： 活动扳手（d6），便携工具箱，电工胶带，刹车清洁剂。", "拾荒家： 防割手套（+1 护甲），反光背心，拾物器，护目镜。", "救护员： 急救包，创伤剪，听诊器，卫生袋。", "店员： 开箱刀（d6），对讲机，胸牌，舒适无比的鞋子。", "艺术家： 自选艺术工具，笔记本，相机，小型热情粉丝圈。", "运动员： 自选运动器材，汗带，运动饮料粉。", "滑板手： 滑板，摄像机，断线钳。", "键盘侠： 笔记本电脑及背包，网络粉丝，假证件，能量饮料。", "志愿消防员： 折叠梯（笨重），斧头（d6），灭火器，手电筒。", "单车快递员： 自行车，头盔（+1 护甲），邮差包，未拆封包裹，多功能工具。", "酒保： 酒吧刀（d6），酒瓶，香烟，查获的假证件。", "治疗师： 录音笔，笔记本和钢笔，名片，小左轮枪（d6）。", "行政助理： 广泛人脉，公司信用卡，折叠公文包，电击枪（d6 敏捷）。", "演员： 试镜文件夹，便携充电器，备用化妆品，替换衣物。", "工程师： 笔记本电脑及设计软件，防水笔记本，无线路由器，九九新安全防具。", "社工： 笔记本电脑及背包，证件，折叠刀（d6），笔记本和钢笔。", "教师： 咖啡杯，剪刀，大包。", "承包商： 满载工具腰带，美工刀（d6），探照灯，钻机。"
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
    const backgroundString = this.getRandomItem(this.backgrounds);
    const appearance = this.getRandomItem(this.appearances);
    const firstEncounter = this.getRandomItem(this.firstEncounters);
    const ideology = this.getRandomItem(this.ideologies);
    const traitIndex = this.rollDie(10) - 1;

    const backgroundName = backgroundString.split('：')[0];
    let armor = 0;
    if (backgroundString.includes('护甲')) {
      const armorMatch = backgroundString.match(/\+(\d+)\s*护甲/);
      if (armorMatch) armor = parseInt(armorMatch[1], 10);
    }

    const items = ['智能手机'];
    const backgroundItemsString = backgroundString.split('：')[1] ? backgroundString.split('：')[1].replace(/。$/, '').trim() : '';
    if (backgroundItemsString) {
      const backgroundItems = backgroundItemsString.split('，').map(item => item.trim());
      items.push(...backgroundItems);
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
      notes: ""
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
