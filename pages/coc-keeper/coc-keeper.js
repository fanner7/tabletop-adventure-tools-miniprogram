// pages/coc-keeper/coc-keeper.js — COC 守密人助手
const STORAGE_KEY = 'coc_keeper_tasks';

Page({
  data: {
    tasks: [],
    currentTaskId: null,
    currentTask: null,
    // Detail view
    viewingType: '',   // 'player' | 'npc' | ''
    viewingData: null,
    viewingIndex: -1,
    detailScrollTop: 0,
    // Create task dialog
    showCreateTask: false,
    createTaskName: '',
    // Combat order
    showCombatOrder: false,
    combatOrder: [],
    combatHasTies: false,
    combatTieNames: '',
  },
  goToAppHome() { wx.navigateBack(); },

  onLoad() { this.loadTasks(); },
  onShow() { this.loadTasks(); },

  // ==================== 任务存储 ====================
  loadTasks() {
    const tasks = wx.getStorageSync(STORAGE_KEY) || [];
    this.setData({ tasks });
    // If we have a currentTaskId, refresh its data
    if (this.data.currentTaskId) {
      const task = tasks.find(t => t.id === this.data.currentTaskId);
      if (task) this.setData({ currentTask: task });
      else this.setData({ currentTaskId: null, currentTask: null });
    }
  },

  saveTasks(tasks) {
    wx.setStorageSync(STORAGE_KEY, tasks);
    this.setData({ tasks });
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
    const name = this.data.createTaskName.trim();
    if (!name) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' });
      return;
    }
    const tasks = this.data.tasks;
    const task = {
      id: Date.now(),
      name: name,
      createdAt: Date.now(),
      players: [],
      npcs: [],
    };
    tasks.unshift(task);
    this.saveTasks(tasks);
    this.selectTaskById(task.id);
    this.setData({ showCreateTask: false, createTaskName: '' });
  },

  selectTask(e) {
    const id = e.currentTarget.dataset.id;
    this.selectTaskById(id);
  },

  selectTaskById(id) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      this.setData({ currentTaskId: id, currentTask: task, viewingType: '', viewingData: null });
    }
  },

  deleteTask(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t.id === id);
    wx.showModal({
      title: '删除任务',
      content: `确定删除「${task ? task.name : ''}」及其所有数据吗？`,
      success: (res) => {
        if (!res.confirm) return;
        const tasks = this.data.tasks.filter(t => t.id !== id);
        this.saveTasks(tasks);
        if (this.data.currentTaskId === id) {
          this.setData({ currentTaskId: null, currentTask: null, viewingType: '', viewingData: null });
        }
      }
    });
  },

  backToList() {
    this.setData({ currentTaskId: null, currentTask: null, viewingType: '', viewingData: null });
  },

  // ==================== 导入 ====================
  importPlayer() {
    wx.getClipboardData({
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (!data.attrValues || !data.charInfo) {
            wx.showToast({ title: '剪贴板内容不是有效的调查员数据', icon: 'none' });
            return;
          }
          const tasks = this.data.tasks;
          const task = tasks.find(t => t.id === this.data.currentTaskId);
          if (!task) return;
          const name = data.charInfo.name || '未命名';
          // Check for duplicate name
          if (task.players.find(p => p.charInfo && p.charInfo.name === name)) {
            wx.showToast({ title: `已存在同名调查员「${name}」`, icon: 'none' });
            return;
          }
          task.players.push(data);
          this.saveTasks(tasks);
          this.setData({ currentTask: task });
          wx.showToast({ title: `✅ 已导入「${name}」`, icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '数据解析失败，请检查剪贴板', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '读取剪贴板失败，请先复制调查员数据', icon: 'none' });
      }
    });
  },

  // ==================== NPC 导入 ====================
  importNPC() {
    wx.getClipboardData({
      success: (res) => {
        const text = (res.data || '').trim();
        if (!text) {
          wx.showToast({ title: '剪贴板为空，请先复制 NPC 数据', icon: 'none' });
          return;
        }
        // 第一行作为名称
        const lines = text.split('\n');
        const name = lines[0].trim() || '未命名 NPC';
        // 提取 DEX 值
        const dexMatch = text.match(/DEX\s*(\d+)/i);
        const dex = dexMatch ? parseInt(dexMatch[1]) : null;

        const tasks = this.data.tasks;
        const task = tasks.find(t => t.id === this.data.currentTaskId);
        if (!task) return;
        task.npcs.push({ id: Date.now(), name, dex, data: text });
        this.saveTasks(tasks);
        this.setData({ currentTask: task });
        const dexInfo = dex !== null ? ` (DEX ${dex})` : '';
        wx.showToast({ title: `✅ 已导入「${name}」${dexInfo}`, icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '读取剪贴板失败，请先复制 NPC 数据', icon: 'none' });
      }
    });
  },

  // ==================== 详情查看 ====================
  viewPlayer(e) {
    const index = e.currentTarget.dataset.index;
    const player = this.data.currentTask.players[index];
    this.setData({ viewingType: 'player', viewingData: player, viewingIndex: index });
  },

  viewNPC(e) {
    const index = e.currentTarget.dataset.index;
    const npc = this.data.currentTask.npcs[index];
    this.setData({ viewingType: 'npc', viewingData: npc, viewingIndex: index });
  },

  onPlayerSwiperChange(e) {
    const index = e.detail.current;
    const player = this.data.currentTask.players[index];
    this.setData({ viewingIndex: index, viewingData: player });
  },

  onNPCSwiperChange(e) {
    const index = e.detail.current;
    const npc = this.data.currentTask.npcs[index];
    this.setData({ viewingIndex: index, viewingData: npc });
  },

  onDetailScroll(e) {
    this.setData({ detailScrollTop: e.detail.scrollTop });
  },

  closeDetail() {
    this.setData({ viewingType: '', viewingData: null, viewingIndex: -1, detailScrollTop: 0 });
  },

  // ==================== 战斗轮排序 ====================
  openCombatOrder() {
    // 如果已显示则隐藏
    if (this.data.showCombatOrder) {
      this.setData({ showCombatOrder: false });
      return;
    }
    const task = this.data.currentTask;
    if (!task) return;
    const items = [];

    task.players.forEach((p, i) => {
      const dex = (p.attrValues && p.attrValues.dex) ? p.attrValues.dex : 0;
      items.push({ key: 'p' + i, name: p.charInfo.name || '未命名', dex, type: 'player' });
    });

    task.npcs.forEach((n, i) => {
      const dex = n.dex !== null && n.dex !== undefined ? n.dex : 0;
      items.push({ key: 'n' + i, name: n.name, dex, type: 'npc' });
    });

    items.sort((a, b) => b.dex - a.dex);

    const ties = new Set();
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].dex === items[i + 1].dex && items[i].dex > 0) {
        ties.add(i);
        ties.add(i + 1);
      }
    }
    const tieNames = [];
    items.forEach((item, i) => {
      item.tie = ties.has(i);
      if (item.tie) tieNames.push(item.name);
    });

    this.setData({
      showCombatOrder: true,
      combatOrder: items,
      combatHasTies: ties.size > 0,
      combatTieNames: [...new Set(tieNames)].join('、'),
    });
  },

  // ==================== 删除卡片 ====================
  deletePlayer(e) {
    const index = e.currentTarget.dataset.index;
    const tasks = this.data.tasks;
    const task = tasks.find(t => t.id === this.data.currentTaskId);
    if (!task) return;
    const name = task.players[index].charInfo.name || '未命名';
    wx.showModal({
      title: '删除调查员',
      content: `确定从任务中移除「${name}」吗？`,
      success: (res) => {
        if (!res.confirm) return;
        task.players.splice(index, 1);
        this.saveTasks(tasks);
        this.setData({ currentTask: task, viewingType: '', viewingData: null, viewingIndex: -1 });
      }
    });
  },

  deleteNPC(e) {
    const index = e.currentTarget.dataset.index;
    const tasks = this.data.tasks;
    const task = tasks.find(t => t.id === this.data.currentTaskId);
    if (!task) return;
    const name = task.npcs[index].name;
    wx.showModal({
      title: '删除 NPC',
      content: `确定删除 NPC「${name}」吗？`,
      success: (res) => {
        if (!res.confirm) return;
        task.npcs.splice(index, 1);
        this.saveTasks(tasks);
        this.setData({ currentTask: task, viewingType: '', viewingData: null, viewingIndex: -1 });
      }
    });
  },
});
