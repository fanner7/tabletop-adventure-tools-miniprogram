// pages/index/index.js — 工具箱主页（导航入口）
Page({
  data: {
    tools: [
      {
        id: 'dice-roller',
        icon: '🎲',
        title: '掷骰',
        desc: 'd4~d100 多面骰投掷，摇一摇即掷。',
        url: '/pages/dice-roller/dice-roller'
      },
      {
        id: 'cairn-gen',
        icon: '⛰️',
        title: '石冢 冒险者工具',
        desc: 'Cairn TTRPG 角色生成、游玩记录与掷骰。',
        url: '/pages/cairn-gen/cairn-gen'
      },
      {
        id: 'coc7-gen',
        icon: '🐙',
        title: 'COC 调查员工具',
        desc: '克苏鲁的呼唤 7版 调查员角色创建工具。',
        url: '/pages/coc7-gen/coc7-gen'
      },
      {
        id: 'coc-keeper',
        icon: '🔮',
        title: 'COC 守密人助手',
        desc: '任务管理、玩家卡与NPC卡导入监看、疯狂发作抽取。',
        url: '/pages/coc-keeper/coc-keeper'
      },
      {
        id: 'liminal-horror-gen',
        icon: '🚪',
        title: '阈限恐怖 调查员工具',
        desc: 'Liminal Horror 角色生成、游玩记录、掷骰与装备商店。',
        url: '/pages/liminal-horror-gen/liminal-horror-gen'
      },
      {
        id: 'tes-botse-skills',
        icon: '🐉',
        title: 'TES: BotSE 技能速查',
        desc: '上古卷轴：第二纪元的背叛 - 技能速查工具。',
        url: '/pages/tes-botse-skills/tes-botse-skills'
      },
      {
        id: 'about',
        icon: 'ℹ️',
        title: '设置&关于',
        desc: '外观模式、应用介绍与开源信息。',
        url: '/pages/about/about'
      }
    ]
  },

  onTapCard(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  }

})
