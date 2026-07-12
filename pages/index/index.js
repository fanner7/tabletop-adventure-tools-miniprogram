// pages/index/index.js — 工具箱主页（导航入口）
Page({
  data: {
    tools: [
      {
        id: 'cairn-gen',
        icon: '⛰️',
        title: '石冢 角色生成器',
        desc: 'Cairn TTRPG 随机角色生成，包含属性、装备与背景故事。',
        url: '/pages/cairn-gen/cairn-gen'
      },
      {
        id: 'liminal-horror-gen',
        icon: '🚪',
        title: '阈限恐怖 调查员生成',
        desc: '快速生成 Liminal Horror 角色，包含属性与初始装备。',
        url: '/pages/liminal-horror-gen/liminal-horror-gen'
      },
      {
        id: 'liminal-horror-gen-bloom',
        icon: '🫐',
        title: '阈限恐怖 调查员生成器 (繁孽版)',
        desc: '基于模组的版本。',
        url: '/pages/liminal-horror-gen-bloom/liminal-horror-gen-bloom'
      },
      {
        id: 'tes-botse-skills',
        icon: '🐉',
        title: 'TES: BotSE 技能速查',
        desc: '上古卷轴：第二纪元的背叛 - 技能速查工具。',
        url: '/pages/tes-botse-skills/tes-botse-skills'
      },
      {
        id: 'coc7-gen',
        icon: '🐙',
        title: 'COC7 调查员创建',
        desc: '克苏鲁的呼唤 7版 调查员角色创建工具。',
        url: '/pages/coc7-gen/coc7-gen'
      }
    ]
  },

  onTapCard(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  }

})
