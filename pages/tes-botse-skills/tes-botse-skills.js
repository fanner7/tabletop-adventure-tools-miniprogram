// pages/tes-botse-skills/tes-botse-skills.js
// ---------- 静态数据表（拆分至 data/ 目录） ----------
var SKILLS_RAW = require('./data/skills');
Page({

  data: {
    searchValue: '',
    searchResults: [],
    searchResultsActive: false,
    activeSkills: []
  },

  rawData: SKILLS_RAW,

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
