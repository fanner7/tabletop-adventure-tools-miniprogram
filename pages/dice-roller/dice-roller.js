const DICE = [
  { sides: 4,   color: '#e74c3c', icon: '△', name: 'd4' },
  { sides: 6,   color: '#e67e22', icon: '◆', name: 'd6' },
  { sides: 8,   color: '#f1c40f', icon: '◇', name: 'd8' },
  { sides: 10,  color: '#2ecc71', icon: '⬠', name: 'd10' },
  { sides: 12,  color: '#3498db', icon: '⬡', name: 'd12' },
  { sides: 20,  color: '#9b59b6', icon: '△', name: 'd20' },
  { sides: 100, color: '#95a5a6', icon: '◈', name: 'd100' },
];

const QUICK_ROLLS = [
  { label: '1d4',  dice: [{ sides: 4,  count: 1 }] },
  { label: '1d6',  dice: [{ sides: 6,  count: 1 }] },
  { label: '2d6',  dice: [{ sides: 6,  count: 2 }] },
  { label: '3d6',  dice: [{ sides: 6,  count: 3 }] },
  { label: '1d8',  dice: [{ sides: 8,  count: 1 }] },
  { label: '2d8',  dice: [{ sides: 8,  count: 2 }] },
  { label: '1d10', dice: [{ sides: 10, count: 1 }] },
  { label: '2d10', dice: [{ sides: 10, count: 2 }] },
  { label: '1d12', dice: [{ sides: 12, count: 1 }] },
  { label: '1d20', dice: [{ sides: 20, count: 1 }] },
  { label: '2d20', dice: [{ sides: 20, count: 2 }] },
  { label: 'd100', dice: [{ sides: 100, count: 1 }] },
];

function roll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

Page({
  data: {
    DICE,
    QUICK_ROLLS,
    diceSelected: {},
    rolling: false,
    result: null,
    history: [],
    showHistory: false,
    shakeEnabled: false,
  },

  onLoad() {
    this._initShake();
  },

  onShow() {
    this._startShake();
  },

  onHide() {
    this._stopShake();
  },

  onUnload() {
    this._stopShake();
  },

  /* ---- 摇动投掷 ---- */
  _initShake() {
    if (typeof wx.startAccelerometer !== 'function') return;
    this._shakeLast = { x: 0, y: 0, z: 0 };
    this._shakeTime = 0;
    this._shakeHandler = null;
  },

  _startShake() {
    if (this._shakeHandler) return;
    const that = this;
    try {
      wx.startAccelerometer({
        interval: 'game',
        success() {
          that.setData({ shakeEnabled: true });
        },
        fail() {}
      });
      this._shakeHandler = function(res) {
        const curX = res.x, curY = res.y, curZ = res.z;
        const prev = that._shakeLast;
        const delta = Math.abs(curX - prev.x) + Math.abs(curY - prev.y) + Math.abs(curZ - prev.z);
        prev.x = curX; prev.y = curY; prev.z = curZ;

        if (delta > 1.8) {
          const now = Date.now();
          if (now - that._shakeTime > 1500 && !that.data.rolling) {
            that._shakeTime = now;
            const sel = that.data.diceSelected;
            if (Object.keys(sel).length > 0) {
              that.doRoll(sel);
            }
          }
        }
      };
      wx.onAccelerometerChange(this._shakeHandler);
    } catch (e) { /* ignore */ }
  },

  _stopShake() {
    if (this._shakeHandler) {
      try {
        wx.offAccelerometerChange(this._shakeHandler);
        wx.stopAccelerometer();
      } catch (e) { /* ignore */ }
      this._shakeHandler = null;
    }
  },

  /* ---- 骰子操作 ---- */

  onTapDice(e) {
    if (this.data.rolling) return;
    const sides = parseInt(e.currentTarget.dataset.sides);
    const sel = { ...this.data.diceSelected };
    sel[sides] = (sel[sides] || 0) + 1;
    this.setData({ diceSelected: sel, result: null });
  },

  onLongPressDice(e) {
    if (this.data.rolling) return;
    const sides = parseInt(e.currentTarget.dataset.sides);
    const sel = { ...this.data.diceSelected };
    if (sel[sides]) {
      sel[sides]--;
      if (sel[sides] <= 0) delete sel[sides];
    }
    this.setData({ diceSelected: sel, result: null });
  },

  onQuickRoll(e) {
    if (this.data.rolling) return;
    const idx = e.currentTarget.dataset.index;
    const qr = QUICK_ROLLS[idx];
    const sel = {};
    qr.dice.forEach(d => { sel[d.sides] = d.count; });
    this.setData({ diceSelected: sel, result: null });
    this.doRoll(sel);
  },

  onRoll() {
    const sel = this.data.diceSelected;
    if (Object.keys(sel).length === 0) {
      wx.showToast({ title: '请先选择骰子', icon: 'none', duration: 1500 });
      return;
    }
    this.doRoll(sel);
  },

  doRoll(sel) {
    const keys = Object.keys(sel);
    this.setData({ rolling: true, result: null });
    wx.vibrateShort({ type: 'medium' });

    const diceResults = [];
    let total = 0;
    keys.forEach(k => {
      const sides = parseInt(k), count = sel[k];
      const color = (DICE.find(d => d.sides === sides) || {}).color || '#95a5a6';
      for (let i = 0; i < count; i++) {
        const r = roll(sides);
        diceResults.push({ sides, result: r, color });
        total += r;
      }
    });

    setTimeout(() => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const entry = { dice: diceResults, total, time };
      const hist = [entry, ...this.data.history].slice(0, 80);
      this.setData({
        rolling: false,
        result: entry,
        history: hist,
      });
    }, 600);
  },

  onClear() {
    this.setData({ diceSelected: {}, result: null });
  },

  onClearHistory() {
    this.setData({ history: [] });
  },

  onToggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },
});
