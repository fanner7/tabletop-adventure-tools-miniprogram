# COC 调查员 角色导入导出数据优化 — 研究文档

> 研究文档 · 2026 · 桌面冒险工具集
> 目标：剪贴板导入导出从「全量 JSON」改为紧凑角色码，减少数据量、便于保存与交换，且导入后角色与原样一致（无损往返）。
> **状态：研究完成 + 原型验证通过（tmp/char-codec-proto.js），尚未正式实施。**

---

## 1. 现状调查

### 1.1 导入导出链路（coc7-gen 调查员工具）

| 通道 | 位置 | 现状 |
|---|---|---|
| 剪贴板导出 | `coc7-gen.js doExportClipboard()` | `JSON.stringify(charData, null, 2)` — 全量角色对象 + 2 空格缩进 |
| 剪贴板导入 | `coc7-gen.js importCharacter()` | `JSON.parse` → 校验 `attrValues && charInfo` → 重算 derived → 入库 |
| 骰娘导出 | `doExportDice()` | 海豹骰 .st 文本（不受本次影响） |
| 文本导出 | `doExportText()` | 可读文本卡（不受本次影响） |
| 守密人剪贴板导入 | `coc-keeper.js doImportPlayer()` | 同一 JSON 格式（PC 端守密人无 `wx.scanCode`，走此通道） |
| 守密人扫码导入 | `keeper-qr.js` C7K2 | **已有**紧凑格式（233 B，子集：无文本块/日志/点表拆分） |

### 1.2 实测体积（真实完整卡，`tools/test/harness.js` 脚手架构建）

```
当前导出 pretty（null, 2）: 23,104 B  ← 用户实际拿到的
当前导出 compact          : 12,920 B
C7K2 二维码载荷（对照）    :    233 B（子集格式，98x）
```

**缩进一项就浪费 41%**（9,364 B）。

## 2. 数据量根因（compact JSON 13 KB 的构成）

| 字段 | 体积 | 占比 | 性质 |
|---|---|---|---|
| `sortedSkillsByCat` | 5,476 B | 40.3% | **可重建**：occPts+intPts+skillSpecs+attrValues+静态技能表 |
| `playLog` | 2,451 B | 18.0% | **无任何 UI 渲染**（全仓库 WXML 无引用，纯积累数据） |
| `diceHistory` | 1,361 B | 10.0% | 有 UI（dice-log 区），结构可压缩 |
| `charWeapons` | 582 B | 4.3% | 表内武器可索引化（C7K2 已验证） |
| `selectedOcc` | 519 B | 3.8% | 完整职业对象，实际只需职业表索引 |
| `attrDisplay` | 515 B | 3.8% | **可重建**（attrValues → 固定标签） |
| 文本块 ×6 | ~1,400 B | ~10% | 真实用户内容，不可再压（保真前提） |
| `derivedItems` / `derived` | 204 B | 1.5% | **可重建 / 可重算** |
| 其余（点表/专攻/状态/标签等） | ~500 B | ~4% | 必须携带，但量小 |

**结论：90% 以上是「可从静态表 / 输入确定性重建」的冗余 + 无 UI 的日志 + 缩进。**

## 3. 方案研究与实测：C7C1 角色码（原型已验证）

沿用 C7K2 已验证的设计哲学（技能/武器索引化 + 表指纹 + CRC16），扩展为**全保真**格式：

```
C7C1|<fp>|<name>|<player>|<age>|<gender>|<era>|<occIdx>|<a9>|<rolls9>|<attrDesc>
     |<occPts>|<intPts>|<specs>|<free>|<ticked>|<pts4>|<weapons>|<vitals>|<tag>
     |<completed>|<ts>|<texts-json>|<playlog>|<dice>*<crc>
```

### 3.1 关键设计决策

1. **可重建字段不导出**：`derived/derivedItems/attrDisplay/sortedSkillsByCat` 全部由导入端现有逻辑重算（`importCharacter` 重算 derived；`applyCharData` 载入时重建显示字段）——省 6,746 B；
2. **职业 → 职业表下标**（2-3 位数字）：解码端按 `OCCUPATIONS[idx]` 还原整对象（name/cr_range/skills/skill_formula 全有，step5 角色卡与编辑逻辑零差异；仅缺 `filteredOccs` 附加的 `occPointValue/intPointValue` 两个**职业选择列表专用缓存**，角色卡不使用）；
3. **技能点表/专攻/自由技能/成长勾选 → 技能表下标**：`0=40`（会计 40 职业点）、`47.斗殴`（格斗① 专攻斗殴）、未知技能 `n<名>=值` 兜底；
4. **武器 → 表内 `w<idx>` / 自定义 `c<name>=...` 内联**（与 C7K2 §3.3 相同）；
5. **文本块 → JSON 段 + 全转义**：区别于 C7K2 的「保留字符替换为 `_`（有损）」，C7C1 用**可逆转义**（`\`→`\\`、`|`→`\|`、换行→`\n` 等），用户文本**字节级保真**；
6. **分隔符拆分必须转义感知**（`splitUnescaped`）：转义后的 `\|` 等序列不能用裸 `split('|')`，否则段数错乱（原型 v1 踩坑，v2 修复）；
7. **游玩日志/骰子历史压缩段**：类型单字母（n/h/g/d）+ 字段压缩（日志 ~31 B/条 vs 原 ~98 B/条）；
8. **CRC16 校验 + 表指纹**：篡改/截断拒绝（`*<crc>` 尾段），技能表/武器表漂移给出明确错误（同 C7K2 的 TABLE 语义）。

### 3.2 实测结果（原型 tmp/char-codec-proto.js + tmp/char-codec-verify.js）

```
典型完整卡（含 25 条日志 + 20 条骰子历史）:
  当前 pretty 23,104 B → C7C1 2,294 B   = 10.1x
  当前 compact 12,920 B → C7C1 2,294 B  = 5.6x

段级分布（2,292 B）: 文本块 873 B（真实内容）· 日志 774 B · 骰子 339 B · 专攻 42 B
                    兴趣点 27 B · 属性 26 B · 状态 20 B · 其余 ~190 B
纯角色卡（无日志/骰子）: 1,179 B
最小角色（仅属性+信息）:   144 B
满卡压力（8 武器/高点数）: 1,140 B
```

### 3.3 保真度验证（26 项逐字段 + 端到端）

- **逐字段往返**：attrValues / attrRolls / attrDesc / charInfo / selectedOcc(表内字段) / occPts / intPts / skillSpecs / freeOccSkills / 点预算 / tickedSkills / 武器 / HP·SAN·MP·LUCK / majorWound / dying / sanDayStart / sessionSanLoss / tag / completed / timestamp / 文本块×6 / diceHistory / playLog —— 全部一致（仅 playLog 的 `id` 为导入时重新生成，属预期）；
- **边界字符**：文本含 `| ; , = . \ 换行` 均字节级往返（区别于 C7K2 的 `_` 替换）；
- **端到端**（tmp/char-codec-e2e.js）：导出 → C7C → 模拟 `importCharacter` → `applyCharData` 载入 → 角色卡状态（技能总值/显示名/武器/游玩状态/文本/标签/骰子历史/自由槽回填）逐项一致；
- **健壮性**：篡改载荷 → CRC 拒绝；空串/乱文本 → 拒绝。

## 4. 方案对比

| 方案 | 典型卡体积 | 保真 | 评价 |
|---|---|---|---|
| 现状 pretty JSON | 23.1 KB | 完整 | 缩进浪费 41%，交换不便 |
| 现状 compact JSON | 12.9 KB | 完整 | 冗余仍在 |
| 精简 JSON（短键+剔可重建字段） | ~7.3 KB | 完整 | JSON 结构开销仍在（引号/键名） |
| gzip(compact)+base64 | ~4.1 KB | 完整 | 不可读、依赖解压、剪贴板无优势 |
| **C7C1 角色码（原型）** | **2.3 KB** | **字节级** | 可读可粘贴、CRC、表指纹、与 C7K2 同哲学 |
| C7K2 二维码载荷 | 233 B | 子集 | 保持现状不动（扫码通道） |

## 5. 影响面与实施计划（待批准）

| 文件 | 改动 |
|---|---|
| `utils/char-codec.js`（新增） | 正式编解码器：encode / decode + 显示字段重建（decode 产物含 derived/attrDisplay/derivedItems/sortedSkillsByCat，供守密人直接渲染）+ splitUnescaped/crc16/表指纹（建议指纹扩到职业表） |
| `pages/coc7-gen/coc7-gen.js` | `doExportClipboard` → `encode()`；`importCharacter` → 双通道（先 JSON 兼容旧导出，失败再试 C7C）；导出弹窗文案「复制完整角色数据 JSON」→「复制紧凑角色码」 |
| `pages/coc-keeper/coc-keeper.js` | `doImportPlayer` → 双通道（PC 端守密人剪贴板导入同样受益） |
| `tools/test/char-codec.test.js`（新增） | 原型验证固化为回归测试（体积/往返/边界/CRC/降级） |
| `docs/char-codec-design.md`（新增） | 格式正式规格（对齐 qr-keeper-transfer-design.md 风格） |

### 5.1 兼容性结论

- **旧 JSON 导出仍可导入**：导入端保持 JSON 优先，C7C 其次，互不干扰；
- **表漂移**：技能/武器/职业表任一版本漂移 → 指纹不符 → 明确提示「角色卡版本较新，请更新小程序」（同 C7K2 TABLE 语义）；
- **playLog 建议**：无 UI 渲染，若追求极限可整体不出（省 ~774 B）；当前原型保留（压缩后 ~31 B/条），以最大化「原样」语义。

## 6. 研究结论

1. 现状导出是「全量角色对象 + 缩进」，冗余根源是**可从静态表/输入确定性重建的展示字段（~48%）+ 无 UI 的游玩日志（18%）+ 缩进（41%）**；
2. 项目内已有 C7K2 先例（98x 压缩），其「索引化 + 解码端反推」方法论可直接推广到剪贴板通道；
3. 原型 C7C1 实测 **23.1 KB → 2.3 KB（10.1x）**，26 项字段 + 端到端角色卡状态全部无损往返，边界字符字节级保真，CRC/指纹健壮性完备；
4. 实施成本可控：新增 1 个共享模块 + 3 处页面接线 + 1 组回归测试，旧格式兼容保留。

---

## 7. 实施修订（C7C1 → C7C2，2026）

正式实施后按用户反馈修订为 **C7C2**（规格见 `docs/char-codec-design.md`）：

1. **职业与六文本块明文段**：职业从数字索引改为明文职业名；背景故事/随身物品/神话相关/法术/调查员伙伴/资产从「转义 JSON 段」改为六个独立明文段（仅转义分隔符/换行）——角色码人眼可辨、可手工修改；
2. **删除 CRC 与表指纹校验**：校验可能导致实际使用问题（如技能表更新后旧角色码被拒），新格式只做结构检查，内容篡改/版本漂移宽容处理（职业查不到降级 `{ name }`）；
3. **C7C1 旧码兼容解码**：解码端先按 29 段 C7C2 尝试，失败再按 25 段 C7C1 + CRC 校验尝试；
4. 体积代价：明文版典型卡约 2 KB（仍为全量 JSON 的 ~1/10），简卡约 0.5 KB。

