# 桌面冒险工具集 — Tabletop Adventure Tools

一个微信小程序，为桌面角色扮演游戏（TTRPG）玩家提供角色生成和主持辅助工具。

## 📱 使用方式

<p align="center">
  <img src="mpcode.jpg" alt="小程序码" width="200" />
</p>

- **扫码体验**：使用微信扫描上方小程序码
- **搜索访问**：在微信小程序中搜索「**桌面冒险工具集**」

## ✨ 功能

### 🎯 通用工具
| 工具 | 说明 |
|------|------|
| **🎲 掷骰** | 多面骰投掷器，支持 d4~d100，摇一摇即掷 |

### 🎲 角色创建工具
| 工具 | 说明 |
|------|------|
| **🐙 CoC7 调查员创建** | 克苏鲁的呼唤第 7 版调查员角色卡生成器，含 126 个职业、专攻技能系统、武器表 |
| **🔮 CoC 守密人助手** | 任务管理、玩家卡/NPC 卡导入监看、疯狂发作抽取 |
| **⛰️ 石冢 (Cairn) 生成器** | Cairn RPG 随机角色生成，包含属性、装备与背景故事 |
| **🚪 阈限恐怖 (Liminal Horror) 生成器** | Liminal Horror 调查员快速生成 |
| **🫐 阈限恐怖·繁孽版 (Bloom)** | Liminal Horror Bloom 变体规则角色生成器 |

### 📖 参考资料
| 工具 | 说明 |
|------|------|
| **🐉 TES:BotSE 技能速查** | 上古卷轴：第二纪元的背叛 技能速查工具 | 

## 🚀 快速开始

1. 克隆本仓库
2. 使用**微信开发者工具**打开项目根目录
3. 填入你的 AppID（或使用测试 ID）
4. 编译预览

> 本项目使用原生微信小程序框架（WXML + WXSS + JavaScript），无需 npm 安装。

## 🗂️ 项目结构

```
├── app.js                        # 全局应用逻辑
├── app.json                      # 页面路由与窗口配置
├── app.wxss                      # 全局样式
├── project.config.json           # 开发者工具配置
├── sitemap.json                  # 微信搜索配置
├── pages/
│   ├── index/                    # 主页 / 导航
│   ├── dice-roller/              # 掷骰工具
│   ├── coc7-gen/                 # CoC7 调查员创建
│   ├── coc-keeper/               # CoC 守密人助手
│   ├── cairn-gen/                # 石冢角色生成
│   ├── liminal-horror-gen/       # 阈限恐怖生成器
│   ├── liminal-horror-gen-bloom/ # 阈限恐怖·繁孽版
│   ├── tes-botse-skills/         # TES:BotSE 技能速查
│   ├── about/                    # 关于页
│   └── logs/                     # 日志页
└── utils/
    └── util.js                   # 通用工具函数
```

## 📝 开发状态

- ✅ 掷骰 — 已发布
- ✅ CoC7 调查员创建 — 已发布，持续完善中
- ✅ CoC 守密人助手 — 已发布
- ✅ 石冢角色生成 — 已发布
- ✅ 阈限恐怖角色生成 — 已发布
- ✅ 阈限恐怖·繁孽版 — 已发布
- ✅ TES:BotSE 技能速查 — 已发布

## 📄 许可

本项目的代码部分基于 [MIT](LICENSE) © 2026 fanner7。

石冢 (Cairn) 角色生成器使用了 Cairn RPG 的游戏数据，原始文本由 Yochai Gal 创作，基于 [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可。
中文本地化翻译由 [ZzNoah](https://github.com/ZzNoah/cairn-cn/) 提供。
数据来源：[cn.cairnrpg.com](https://cn.cairnrpg.com/tools/character-generator/)，已适配微信小程序。
