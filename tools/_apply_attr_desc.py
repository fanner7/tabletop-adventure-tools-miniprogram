# -*- coding: utf-8 -*-
"""Apply remaining edits: add attrDesc to data, integrate desc generation into roll functions, add wxml."""
import re, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# --- 1. JS: add attrDesc to data block ---
path_js = '../pages/coc7-gen/coc7-gen.js'
with open(path_js, 'r', encoding='utf-8') as f:
    js = f.read()

# Add attrDesc after allRolled
js = js.replace(
    "    allRolled: false,\n    // 基础信息",
    "    allRolled: false,\n    attrDesc: '',\n    // 基础信息"
)

# --- 2. JS: integrate desc generation into rollAllAttrs ---
# After setData that sets allRolled/canNext/attrDisplay, also set attrDesc
# Pattern: the setData call that includes attrDisplay
old_rollall_end = "this.setData({\n            allRolled: true, attrDiceRolling: '',\n            canNext: true, attrDisplay: makeAttrDisplay(this.data.attrValues)\n        });"
new_rollall_end = "this.setData({\n            allRolled: true, attrDiceRolling: '',\n            canNext: true, attrDisplay: makeAttrDisplay(this.data.attrValues),\n            attrDesc: generateAttrDesc(this.data.attrValues)\n        });"
if old_rollall_end in js:
    js = js.replace(old_rollall_end, new_rollall_end)
    print("rollAllAttrs: desc generation added")
else:
    print("WARNING: rollAllAttrs pattern not found")

# --- 3. JS: integrate desc generation into rerollAttr ---
old_reroll = "this.setData({\n          attrValues: newVal,\n          attrRolls: { ...this.data.attrRolls, [attr]: result.rolls.join(',') },\n          attrDiceRolling: '',\n          attrDisplay: makeAttrDisplay(newVal)\n      });"
new_reroll = "this.setData({\n          attrValues: newVal,\n          attrRolls: { ...this.data.attrRolls, [attr]: result.rolls.join(',') },\n          attrDiceRolling: '',\n          attrDisplay: makeAttrDisplay(newVal),\n          attrDesc: generateAttrDesc(newVal)\n      });"
if old_reroll in js:
    js = js.replace(old_reroll, new_reroll)
    print("rerollAttr: desc generation added")
else:
    print("WARNING: rerollAttr pattern not found")

with open(path_js, 'w', encoding='utf-8') as f:
    f.write(js)

# --- 4. WXML: add description display area in Step 1 ---
path_wxml = '../pages/coc7-gen/coc7-gen.wxml'
with open(path_wxml, 'r', encoding='utf-8') as f:
    wxml = f.read()

# Add after the attr-grid closing </view>, before the roll button
old_block = '    </view>\n    <button class="btn btn-primary" bindtap="rollAllAttrs" wx:if="{{!allRolled}}">🎲 全部掷骰</button>'
new_block = '    </view>\n    <view class="attr-desc-box" wx:if="{{attrDesc}}">\n      <text class="attr-desc-text">{{attrDesc}}</text>\n    </view>\n    <button class="btn btn-primary" bindtap="rollAllAttrs" wx:if="{{!allRolled}}">🎲 全部掷骰</button>'
if old_block in wxml:
    wxml = wxml.replace(old_block, new_block)
    print("WXML: desc display added")
else:
    print("WARNING: WXML pattern not found")

with open(path_wxml, 'w', encoding='utf-8') as f:
    f.write(wxml)

# --- 5. Add CSS ---
path_wxss = '../pages/coc7-gen/coc7-gen.wxss'
with open(path_wxss, 'r', encoding='utf-8') as f:
    wxss = f.read()

css_block = '''
.attr-desc-box {
  background: #fdf8f0;
  border: 1rpx solid #d4c5a9;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-top: 16rpx;
  line-height: 1.8;
}
.attr-desc-text {
  font-size: 26rpx;
  color: #5a4a3a;
}
'''
if '.attr-desc-box' not in wxss:
    wxss += css_block
    print("WXSS: styles added")
else:
    print("WXSS: styles already present")

with open(path_wxss, 'w', encoding='utf-8') as f:
    f.write(wxss)

print("\nDone.")
