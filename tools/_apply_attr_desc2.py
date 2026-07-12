# -*- coding: utf-8 -*-
"""Add attrDesc generation to roll functions and loadCharacter."""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path_js = '../pages/coc7-gen/coc7-gen.js'
with open(path_js, 'r', encoding='utf-8') as f:
    js = f.read()

edits = 0

# 1. rollAllAttrs final setData (line 771)
old = 'if (i === attrs.length - 1) this.setData({ allRolled: true, attrDiceRolling: \'\', canNext: true, attrDisplay: makeAttrDisplay(this.data.attrValues) });'
new = 'if (i === attrs.length - 1) this.setData({ allRolled: true, attrDiceRolling: \'\', canNext: true, attrDisplay: makeAttrDisplay(this.data.attrValues), attrDesc: generateAttrDesc(this.data.attrValues) });'
if old in js:
    js = js.replace(old, new)
    edits += 1
    print("1. rollAllAttrs: OK")
else:
    print("1. rollAllAttrs: NOT FOUND")

# 2. rerollAttr setData (line 781)
old2 = "this.setData({ attrValues: newVal, attrRolls: { ...this.data.attrRolls, [attr]: result.rolls.join(',') }, attrDiceRolling: '', attrDisplay: makeAttrDisplay(newVal) });"
new2 = "this.setData({ attrValues: newVal, attrRolls: { ...this.data.attrRolls, [attr]: result.rolls.join(',') }, attrDiceRolling: '', attrDisplay: makeAttrDisplay(newVal), attrDesc: generateAttrDesc(newVal) });"
if old2 in js:
    js = js.replace(old2, new2)
    edits += 1
    print("2. rerollAttr: OK")
else:
    print("2. rerollAttr: NOT FOUND")

# 3. loadCharacter (line 720) — adds attrDesc after attrDisplay
old3 = '        attrValues: attrVals,\n        attrDisplay: makeAttrDisplay(attrVals),\n        attrRolls: char.attrRolls || {},'
new3 = '        attrValues: attrVals,\n        attrDisplay: makeAttrDisplay(attrVals),\n        attrDesc: char.attrDesc || generateAttrDesc(attrVals),\n        attrRolls: char.attrRolls || {},'
if old3 in js:
    js = js.replace(old3, new3)
    edits += 1
    print("3. loadCharacter: OK")
else:
    print("3. loadCharacter: NOT FOUND")

with open(path_js, 'w', encoding='utf-8') as f:
    f.write(js)

print(f"\nTotal edits: {edits}")
