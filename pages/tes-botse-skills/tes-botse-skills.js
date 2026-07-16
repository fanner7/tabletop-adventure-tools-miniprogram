// pages/tes-botse-skills/tes-botse-skills.js
Page({

  data: {
    searchValue: '',
    searchResults: [],
    searchResultsActive: false,
    activeSkills: []
  },
  goToAppHome() { wx.navigateBack(); },

  rawData: [
    // --- 敌人技能 ---
    {t: 'enemy', n: '奥术', a: 'as', d: '此单位造成的伤害为真实伤害。'},
    {t: 'enemy', n: '半影', a: 'by', d: '此单位被击败后，其代替最弱的非任务盟友单位，并具有该单位的生命值和状态骰。将被代替的单位放回其敌人袋。'},
    {t: 'enemy', n: '报复', a: 'bf', d: '此单位增加等同于敌对冒险者数量的战斗值。'},
    {t: 'enemy', n: '撤退', a: 'ct', d: '在此单位的回合结束时，如果本回合没有单位受到伤害，则此单位获得1颗潜行状态骰并治疗1点生命值。'},
    {t: 'enemy', n: '惩击', a: 'cj', d: '如果此单位在其回合中没有指定所有小队成员为目标，则其战斗值翻倍。'},
    {t: 'enemy', n: '冲锋', a: 'cf', d: '如果此单位在移动结束后无法指定一个敌对单位为目标，则其转而再移动一次。'},
    {t: 'enemy', n: '地域', a: 'dy', d: '此单位拥有当前行省特有的技能。'},
    {t: 'enemy', n: '冻疮', a: 'dc', d: '在此单位被一位没有使用🔨武器卡牌的冒险者交战后，该冒险者获得等同于👤玩家人数的轻度疲劳骰。'},
    {t: 'enemy', n: '恫吓', a: 'dh', d: '此单位在其交战结束后，对其目标施加1颗恐惧状态骰。如果该目标已经有1颗恐惧状态骰，则转而将其移除。'},
    {t: 'enemy', n: '放肆', a: 'fs', d: '在此单位造成伤害前，投掷1颗D6。如果掷骰结果为"3-6"，则其投掷的伤害为真实伤害，且此单位对每位冒险者额外造成1点真实伤害。如果本场作战发生在高岩行省，则在掷骰结果为"3-6"时再将动乱值加1。'},
    {t: 'enemy', n: '粉碎', a: 'fs', d: '在每个回合中，当此单位首次被一位没有使用一张🔨武器卡牌的超负荷效果的冒险者交战时，该冒险者必须在本次交战后弃置其预备槽中的1张武器卡牌。'},
    {t: 'enemy', n: '腐化', a: 'fh', d: '在此单位被1位冒险者击败后，该冒险者获得1颗过度疲劳骰。'},
    {t: 'enemy', n: '腐朽', a: 'fx', d: '此单位在其回合结束时受到1点真实伤害。'},
    {t: 'enemy', n: '感测', a: 'gc', d: '当指定目标时，此单位忽略潜行状态骰。'},
    {t: 'enemy', n: '还击#', a: 'hj', d: '在每个回合中，当此单位首次被1个相邻敌对单位造成伤害时，只要此单位尚未被击败，则其将对该敌对单位造成#点伤害。'},
    {t: 'enemy', n: '好斗', a: 'hd', d: '在投掷敌人战斗骰后，此单位在对其目标造成伤害前重掷1次所有未命中的结果。'},
    {t: 'enemy', n: '虹吸', a: 'hx', d: '在此单位的回合结束时，移除在其范围内的每个非任务单位的1个生命值筹码。将所有移除的生命值筹码放到此单位的筹码底下（可超过生命值属性）。'},
    {t: 'enemy', n: '坏疽', a: 'hj', d: '在此单位的回合结束时，其对所有相邻单位各造成1点真实伤害。'},
    {t: 'enemy', n: '恢复', a: 'hf', d: '在此单位的回合开始时，其治疗等同于👤玩家人数的生命值。'},
    {t: 'enemy', n: '激励', a: 'jl', d: '在此单位的回合开始时，所有与其相邻的盟友单位各获得1点坚韧点，所有与其相邻的敌对单位各失去1点坚韧点。'},
    {t: 'enemy', n: '汲取', a: 'jq', d: '此单位在其交战结束后，其目标必须将1颗可用的战斗技能骰枯竭。'},
    {t: 'enemy', n: '奖励', a: 'jl', d: '在此单位被击败后，每位冒险者选择并获得以下奖励之一：1创奇物品🎁 / 5点坚韧点 / 将生命值属性提升1点（若可能的话）'},
    {t: 'enemy', n: '利刃', a: 'lr', d: '此单位与一个相邻目标交战时，对该目标额外造成2点伤害。'},
    {t: 'enemy', n: '领主', a: 'lz', d: '在此单位的回合开始时，从敌人袋中拿取1名5级😈放到一旁。如果没有可用的5级😈，则在本回合的交战中，此单位的战斗值加2。在此单位的回合结束时，将放到一旁的单位部署至距离其最近且未被占据的六角格。'},
    {t: 'enemy', n: '庞然大物', a: 'prdw', d: '部署此单位时，其额外获得等同于所有冒险者已训练的技能数的生命值。'},
    {t: 'enemy', n: '驱散', a: 'qs', d: '在一位🧙法术作战形式的冒险者或1个😈 单位与此单位交战后，此单位对交战单位造成等同于 👤玩家人数的真实伤害（即使此单位被击败）。'},
    {t: 'enemy', n: '燃烧', a: 'rs', d: '在此单位确定其目标后，该目标必须选择失去1点坚韧点，弃置1张物品卡牌或对自己造成1点真实伤害。'},
    {t: 'enemy', n: '扰乱', a: 'rl', d: '当此单位确定1个目标后，该目标必须消耗其激活槽中的1颗骰子。'},
    {t: 'enemy', n: '煽动', a: 'sd', d: '此单位被击败后，每位冒险者立即抽取1名敌人，并将其部署至距离自己最近且未被占据的六角格。'},
    {t: 'enemy', n: '闪避', a: 'sb', d: '当1个敌对单位与此单位交战时，此单位防止等同于敌对单位所投掷的未造成伤害的技能骰数量的伤害。'},
    {t: 'enemy', n: '伤残', a: 'sc', d: '此单位在其交战结束后，对其目标施加1颗伤残状态骰。'},
    {t: 'enemy', n: '神出鬼没', a: 'scgm', d: '此单位防止在当前回合开始时不与之相邻的单位造成的所有伤害（包括真实伤害）。'},
    {t: 'enemy', n: '视野', a: 'sy', d: '此单位忽略视线限制。'},
    {t: 'enemy', n: '衰弱#', a: 'sr', d: '此单位在其交战结束后，其目标获得#颗轻度疲劳骰。'},
    {t: 'enemy', n: '死灵法术', a: 'slfs', d: '在此单位的回合结束时，将被击败敌人堆叠最顶部的单位以等同于👤玩家人数的生命值部署至距离此单位最近且未被占据的六角格。该新敌人在本轮不执行回合。'},
    {t: 'enemy', n: '铁树皮', a: 'tsp', d: '当此单位被非相邻单位造成伤害时，其在该次交战防御值加1。'},
    {t: 'enemy', n: '停留', a: 'tl', d: '如果此单位在其回合没有移动，则在其回合结束时治疗其2点生命值。'},
    {t: 'enemy', n: '偷盗', a: 'td', d: '当此单位确定一个目标后，投掷1颗D6。如果掷骰结果大于等于其目标的当前生命值，则该目标弃置其预备槽中的1张非🍎食物物品卡牌。'},
    {t: 'enemy', n: '顽抗', a: 'wk', d: '此单位不能在一个回合中失去超过1点生命值。'},
    {t: 'enemy', n: '虚无缥缈', a: 'xwpm', d: '当此单位被1位非🧙法术作战形式的冒险者造成伤害时，此单位防止等同于👤玩家人数的伤害。'},
    {t: 'enemy', n: '眩晕', a: 'xy', d: '此单位在其交战结束后，对其目标施加1颗眩晕状态骰。'},
    {t: 'enemy', n: '迅速', a: 'xs', d: '此单位的可移动格数等同于当前的作战轮次（疲劳轮=6）。'},
    {t: 'enemy', n: '仪式#', a: 'ys', d: '在此单位的回合结束时，所有在其视线内的盟友单位分别治疗#点生命值。'},
    {t: 'enemy', n: '移形换位', a: 'yxhw', d: '此单位视被占据的六角格为未被占据。当此单位移动至一个被占据的六角格时，将该六角格的占据者放置到此单位进入该六角格前所处的六角格。'},
    {t: 'enemy', n: '灾祸', a: 'zh', d: '此单位在其交战结束后，对其目标施加1颗灾祸状态骰。'},
    {t: 'enemy', n: '召集', a: 'zj', d: '在此单位被击败后，如果其不是场上最后一名敌人，则将一名等级比其低一级别的敌人部署至此单位被击败的六角格。然后，将此单位放回其敌人袋。'},
    {t: 'enemy', n: '真实打击', a: 'zsdj', d: '如果此单位投掷的所有敌人战斗骰的结果都为"1"，则此单位造成真实伤害。'},
    {t: 'enemy', n: '制服', a: 'zf', d: '在此单位造成伤害前，其目标将失去与此单位即将造成的伤害值相等的坚韧点数。'},
    {t: 'enemy', n: '致盲', a: 'zm', d: '此单位在其交战结束后，对其目标施加1颗致盲状态骰。'},
    {t: 'enemy', n: '转移', a: 'zy', d: '除非此单位在承受伤害前的生命值已经为1，否则其不会失去最后1点生命值。'},
    {t: 'enemy', n: '走投无路', a: 'ztwl', d: '部署此单位时，每有1位未被击败的冒险者，此单位就额外获得2点生命值。'},
    {t: 'enemy', n: '阻遏', a: 'ze', d: '此单位移动结束后，所有在其3个六角格内的敌对单位朝其移动1个六角格（若可能的话）。'},
    
    // --- 地域技能 ---
    {t: 'region', n: '冻结（天际）', a: 'djtj', d: '当此单位确定一个目标后，该目标必须将预备槽中的1张物品卡牌移入其背包。如果小队当前位于一个被围攻城镇，则该目标必须将其所有物品卡牌移入其背包。'},
    {t: 'region', n: '风暴先知（黑沼泽）', a: 'fbxz', d: '当此单位确定一个目标后，该目标必须根据当前天气状况从其激活槽中消耗对应数量的骰子：晴朗=1 / 下雨=2 / 泛洪=3'},
    {t: 'region', n: '鼓动（高岩）', a: 'gd', d: '此单位被击败后，其所有盟友单位治疗等同于当前动乱值的生命值。'},
    {t: 'region', n: '铁树皮（瓦伦森林）', a: 'tsp', d: '当此单位被非相邻单位造成伤害时，其在该次交战防御值加1。'},
    {t: 'region', n: '烟雾迷惑（晨风）', a: 'ywmh', d: '此单位在被一个敌对单位交战后，对该敌对单位施加1颗致盲状态骰。'},
    {t: 'region', n: '阻留（西罗帝尔）', a: 'zl', d: '当此单位确定一个目标后，该目标必须消耗1颗可用技能骰。如果"旧帝国残党"为主导阵营，则转而将该技能骰枯竭。'},

    // --- 状态效果 ---
    {t: 'status', n: '灾祸', a: 'zh', d: '此单位在其每个回合开始时受到1点真实伤害。'},
    {t: 'status', n: '致盲', a: 'zm', d: '此单位视所有单位为敌对单位。如果此单位进行交战，则其只能指定最强的相邻单位为目标。'},
    {t: 'status', n: '眩晕', a: 'xy', d: '此单位不能在其移动的回合掷骰，也不能在其掷骰的回合移动。在此单位的回合结束时，移除此状态骰。'},
    {t: 'status', n: '恐惧', a: 'kj', d: '无视此单位的非战斗技能的效果。此效果对已经在激活槽中或冷却轨上的技能骰无效。'},
    {t: 'status', n: '伤残', a: 'sc', d: '当此单位投掷战斗技能骰时，将投掷的总伤害减半，向下取整。此效果对真实伤害无效。'},
    {t: 'status', n: '潜行', a: 'qx', d: '此单位只能被在当前回合开始时与之相邻的敌对单位指定为目标。此单位造成伤害后，移除此骰子。'}
  ],

  onLoad() {
    const saved = wx.getStorageSync('gameSkillTracker');
    if (saved) {
      this.setData({ activeSkills: saved });
    }
  },

  save() {
    wx.setStorageSync('gameSkillTracker', this.data.activeSkills);
  },

  onSearchInput(e) {
    const val = e.detail.value.toLowerCase().trim();
    this.setData({ searchValue: e.detail.value });

    if (!val) {
      this.setData({ searchResults: [], searchResultsActive: false });
      return;
    }

    const matches = this.rawData.map((item, index) => ({...item, originalIndex: index}))
      .filter(item => item.a.includes(val) || item.n.includes(val));

    this.setData({ searchResults: matches, searchResultsActive: matches.length > 0 });
  },

  onSearchFocus() {
    if (this.data.searchResults.length > 0) {
      this.setData({ searchResultsActive: true });
    }
  },

  onSearchBlur() {
    setTimeout(() => {
      this.setData({ searchResultsActive: false });
    }, 200);
  },

  addSkill(e) {
    const index = e.currentTarget.dataset.index;
    const skill = this.rawData[index];
    const activeSkills = this.data.activeSkills;
    activeSkills.unshift(skill);
    this.setData({
      activeSkills,
      searchValue: '',
      searchResults: [],
      searchResultsActive: false
    });
    this.save();
  },

  removeSkill(e) {
    const index = e.currentTarget.dataset.index;
    const activeSkills = this.data.activeSkills;
    activeSkills.splice(index, 1);
    this.setData({ activeSkills });
    this.save();
  },

  clearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有当前技能吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ activeSkills: [] });
          this.save();
        }
      }
    });
  }

});
