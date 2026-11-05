# 调查员角色「剪贴板角色码」数据格式设计（C7C2）

> 设计文档 · 2026 · 桌面冒险工具集
> 目标：COC 调查员工具的剪贴板导入导出从「全量 JSON」改为紧凑角色码，减少数据量、便于保存与交换，导入后角色与原样一致（无损往返）。
> 前置研究：`docs/char-import-export-research.md`。
> **实现状态：已实现（utils/char-codec.js + coc7-gen 导出/导入 + coc-keeper 剪贴板导入 + 单元测试），本文档为最终规格。**
> **v2 修订（C7C2）**：职业与六文本块改为**明文段**（人眼可辨、可手工修改）；**删除 CRC / 表指纹校验**（校验可能造成实际使用问题，如技能表更新后旧角色码被拒）；解码端保留 **C7C1 旧码兼容**。

---

## 1. 设计目标与约束

| 约束 | 数值 | 来源 |
|---|---|---|
| 微信剪贴板可靠容量 | 远大于 2 KB | 现状导出 23.1 KB 已接近体验红线 |
| 导入后角色「与原样一样」 | 全字段无损往返（文本字节级） | 用户需求 |
| 格式可读性 | 职业/背景/随身/神话/法术/伙伴/资产**明文可见**，便于辨认与手工修改 | 用户需求（v2） |
| 校验策略 | **无 CRC / 无表指纹**；解码只做结构检查，宽容优先 | 用户需求（v2）：不需要那么严谨，校验可能导致实际使用问题 |
| 兼容历史导出 | 旧 JSON 仍可导入；**C7C1 旧角色码仍可导入** | 已导出数据不可作废 |
| 项目无 npm 依赖 | 编解码为单文件纯 JS | 项目现状 |
| 与 C7K2 二维码通道互不干扰 | 各自独立魔数 | 二维码场景保留 CRC/指纹（传输信道有损，校验必要） |

## 2. 体积实测（真实完整卡，`tools/test/harness.js` 脚手架构建）

| 方案 | 真实卡（含日志 + 骰史） | 说明 |
|---|---|---|
| 全量 JSON（2 空格缩进） | 约 23 KB | 缩进浪费 41% |
| 全量 JSON（compact） | 约 13 KB | 冗余字段仍在 |
| **C7C2 角色码（明文）** | **约 2 KB** | 文本块明文占大头（真实内容） |
| 简卡示例（上节实测） | 513 B | 职业/文本全明文 |

**三个关键设计决策：**
1. **可重建字段不导出**：`derived / derivedItems / attrDisplay / sortedSkillsByCat` 由导入端现有逻辑重算（`importCharacter` 重算 derived，`applyCharData` 载入时重建显示字段），共省 ~6.7 KB；
2. **技能/武器索引化**：技能（点表/专攻/自由技能/成长勾选）用 `ALL_SKILLS` 下标、表内武器用 `WEAPONS_1920S` 下标——紧凑且稳定；
3. **职业与文本块明文**（v2）：职业直接写名字（解码端查职业表还原整对象，表漂移时降级 `{ name }` 保留显示）；背景/随身/神话/法术/伙伴/资产各占一段，仅转义分隔符/换行（`\n`、`\|` 等），正文人眼可读。

## 3. 载荷格式规范 v2（魔数 C7C2，29 段，无校验）

```
C7C2|<name>|<player>|<age>|<gender>|<era>|<occ>|<a9>|<rolls9>|<attrDesc>
     |<occPts>|<intPts>|<specs>|<free>|<ticked>|<pts4>|<weapons>|<vitals>|<tag>
     |<completed>|<ts>|<backstory>|<gear>|<mythos>|<spells>|<companions>|<assets>
     |<playlog>|<dice>
```

| 段 | 含义 | 示例 | 说明 |
|---|---|---|---|
| `C7C2` | 魔数 + 格式版本 | `C7C2` | 版本演进 bump 魔数 |
| `<name>` `...` | 姓名/玩家/年龄/性别/时代 | `哈维·怀特` `小明` `25` `男` `1920s` | 均转义；可空 |
| `<occ>` | **职业（明文）** | `律师` | 解码端按名查职业表还原整对象；查不到降级 `{ name }` |
| `<a9>` | 九属性 | `60,65,70,55,80,62,75,85,50` | 固定顺序 str,con,dex,app,pow,siz,int,edu,luck |
| `<rolls9>` | 九属性掷骰记录 | `3,5,2,6,4,5,3,6,5` 或 `购点` | 展示用，逐位转义 |
| `<attrDesc>` | 属性描述文本 | 可空 | — |
| `<occPts>` `<intPts>` | 职业/兴趣点表 | `0=40,4=30` | 见 §3.1 |
| `<specs>` | 技能专攻 | `47.斗殴,56.拉丁语` | 见 §3.1 |
| `<free>` `<ticked>` | 自由职业技能 / 幕间成长勾选 | `5,8` | 技能下标逗号分隔 |
| `<pts4>` | 点预算 | `70,340,120,150` | used/totalOcc, used/totalInt |
| `<weapons>` | 武器表 | `w26;c秘制毒药瓶=...` | 见 §3.2 |
| `<vitals>` | 游玩状态 | `10,62,14,30,0,0,70,8` | HP,SAN,MP,LUCK,重伤,濒死,当日SAN起点,当日损失；空=未设置 |
| `<tag>` | 标签 | `主调查员` | 转义 |
| `<completed>` `<ts>` | 完成标记 / 时间戳 | `1` `178...` | — |
| `<backstory>` ... `<assets>` | **六文本块（明文段）** | `哈维·怀特出生于波士顿...` | 背景/随身/神话/法术/伙伴/资产各一段；伙伴数组按行连接 |
| `<playlog>` | 游玩日志 | `h=理智损失=70 → 68=21:30;...` | 见 §3.3 |
| `<dice>` | 骰子历史 | `42.21:30.d100:42;...` | 见 §3.3 |

**无校验**：C7C2 不携带 CRC、不携带表指纹。解码只做结构检查（魔数 + 段数），内容篡改/版本漂移一律宽容处理（职业查不到→降级 `{ name }`；点表技能下标越界→跳过该条）。**C7C1 旧码（带 `*crc` + 指纹）解码端仍兼容**：先按 29 段 C7C2 尝试，失败再按 25 段 C7C1 + CRC 校验尝试。

**转义规则**：所有文本字段先转反斜杠（`\`→`\\`）再转保留字符（`|`→`\|`、`;`→`\;`、`,`→`\,`、`=`→`\=`、`.`→`\.`、换行→`\n`、回车丢弃）；解码端 `unesc` 还原。中文与普通文本保持明文。
**拆分规则**：`|`（外层）/ `;` / `,` / `=` / `.`（内层）一律用**转义感知拆分** `splitUnescaped`（裸 `split` 会被转义序列内的分隔符误切）。

### 3.1 技能编码

| 形态 | 含义 | 示例 |
|---|---|---|
| `idx=val` | 点表：`ALL_SKILLS[idx]` 投入 val 点 | `0=40` → 会计 +40 职业点 |
| `n<名>=val` | 兜底：点表未知技能名 | `n驯鹰=20` |
| `idx.专攻名` | 专攻：槽位下标 + 文本 | `47.斗殴` → 格斗① 专攻斗殴 |
| `n<名>=专攻名` | 兜底：未知槽位专攻 | — |
| `idx` 列表 | 自由技能 / 成长勾选：仅下标 | `5,8` |

解码端用下标查表还原技能名，`occPts`/`intPts` 拆分保留（编辑技能、骰娘导出、幕间成长、信用评级校验都依赖拆分，区别于 C7K2 只存 total）。

### 3.2 武器编码

| 形态 | 含义 | 示例 |
|---|---|---|
| `w<idx>` | 表内武器：`WEAPONS_1920S[idx]` 查表还原全部字段 | `w26` |
| `c<name>=<skill>=<damage>=<range>=<attacks>=<ammo>=<malfunction>=<impale>` | 自定义武器全字段内联 | `c秘制毒药瓶=科学=1D4=投掷6码=1=一次性=100=×` |

解码端为每件武器生成 `_id`（WXML 武器行 `wx:key="_id"`）。

### 3.3 日志 / 骰子历史编码

- 游玩日志：`<typeCode>=<title>=<meta>=<time>`，type 单字母 `n/h/g/d`（note/harm/heal/dice），三字段转义；解码端重新生成 `id`；
- 骰子历史：`<total>.<time>.<d6:3,d100:42>`，每枚骰 `d<面数>:<结果>`。

## 4. 编码 / 解码契约

### 4.1 共享模块 `utils/char-codec.js`（单文件，纯 JS，无依赖）✅ 已实现

```js
encode(charData) → string                          // coc7-gen 剪贴板导出调用（C7C2）
decode(text)     → { player } | { error: 'FORMAT'|'TABLE' }
// C7C2 无校验：结构错误 → FORMAT；C7C1 旧码指纹不符 → TABLE
crc16 / tableFingerprint      // 仅 C7C1 旧码兼容路径使用
esc / unesc / splitUnescaped
```

- 内部 require `../pages/coc7-gen/data/{skills,occupations,weapons}.js`（单一数据源）；
- 解码产物含**显示字段重建**（`derived/derivedItems/attrDisplay/sortedSkillsByCat`，与建卡器等价实现），coc7-gen 与 coc-keeper 均可直接消费；
- 解码产物 `source: 'c7c'`。

### 4.2 解码产物（字段矩阵）

```js
{
  schemaVersion: 2,
  charInfo:  { name, player, age, gender, era },
  selectedOcc: 职业表整对象（明文名查表；查不到降级 { name }；空则 undefined）,
  attrValues / attrRolls / attrDesc,
  attrDisplay: [×9], derived: {hp,san,mp,db,build,mov}, derivedItems: [×6],
  occPts / intPts / skillSpecs / freeOccSkills / usedOccPoints / totalOccPoints / usedIntPoints / totalIntPoints,
  sortedSkillsByCat: [ {catName, cat, skills:[{name,displayName,base,total,hard,extreme}]} ],
  charWeapons: [（含 _id）],
  playHP / playSAN / playMP / playLuck / majorWound / dying / sanDayStart / sessionSanLoss,
  tickedSkills, playLog, diceHistory,
  charBackstory / charGear / charMythos / charSpells / charCompanions（文本，数组按行连接）/ charAssets,
  tag, completed, timestamp, source: 'c7c',
}
```

## 5. 页面集成 ✅ 已实现

### 5.1 coc7-gen（调查员工具）

- **导出** `doExportClipboard()`：`CharCodec.encode(buildCharacterData(true))` → 剪贴板；toast 显示体积；导出弹窗文案「复制角色码」；
- **导入** `importCharacter()` → `parseImportText(text)` 三通道：
  1. `JSON.parse` 成功且含 `attrValues && charInfo` → 旧 JSON（历史导出兼容）；
  2. `CharCodec.decode` → C7C2（兼容 C7C1 旧码）；
  3. `DiceSt.parseSt` → 骰娘 .st。
- 导入后流程不变：重算 derived/derivedItems、completed=true、timestamp=now、入库。

### 5.2 coc-keeper（守密人工具）

- `doImportPlayer()` 三通道（旧 JSON → C7C2/C7C1 → 骰娘 .st）→ 共用 `importPlayerObject()`；
- 解码产物渲染字段就绪（技能分组/属性格/衍生区/武器 8 列）。

## 6. 健壮性与版本演进（v2 取舍）

| 风险 | 对策 |
|---|---|
| 内容被手工修改 / 表版本漂移 | **无校验，宽容解码**（v2 设计）：结构完整即可导入；职业查不到降级 `{ name }`、技能下标越界跳过——「校验可能导致实际使用问题」故放弃校验 |
| 文本含分隔符/反斜杠/换行 | 可逆转义（先转 `\` 再转保留字符），字节级还原 |
| 转义序列被裸 split 误切 | 统一 `splitUnescaped`（转义感知） |
| 载荷被截断/错乱 | 段数不足 → FORMAT 拒绝（其余宽容） |
| C7C1 旧角色码 | 解码端保留 `*crc` + 表指纹兼容路径 |
| 旧 JSON 导出 | 导入端保留 JSON 通道，多通道并存 |
| 未来字段扩展 | 魔数版本位演进（C7C3），解码端按版本分发 |
| 二维码通道（C7K2） | **不受影响**：传输信道有损，CRC/指纹校验保留 |

## 7. 实现清单

- [x] `utils/char-codec.js`：C7C2 encode / decode（29 段明文、无校验）+ C7C1 兼容解码 + 显示字段重建 helper
- [x] `coc7-gen.js`：`doExportClipboard` 用角色码；`parseImportText` 三通道导入；WXML 导出弹窗（含分享卡片、用途徽标）
- [x] `coc-keeper.js`：`doImportPlayer` 三通道
- [x] `tools/test/char-codec.test.js`：50+ 项断言（体积/明文可见性/无校验断言/全字段往返/重编码幂等/边界字符/错误分支/降级/C7C1 兼容/集成），`npm test` 全绿
- [ ] 真机验证矩阵：iOS 导出→导入 / Android 导出→导入 / 微信内跨设备粘贴（待发布前执行）

## 8. 备选方案否决记录（详见研究文档）

- **精简 JSON（短键）**：~7.3 KB，JSON 结构开销（引号/键名/缩进）仍在；
- **gzip+base64**：~4.1 KB，不可读、需解压逻辑；
- **C7C1（v1：索引化 + 转义 JSON 文本 + CRC/指纹）**：体积更小但职业/文本块不可读、校验可能造成使用问题 → v2 修订为明文 + 无校验（本版）。
