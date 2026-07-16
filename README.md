# 桌面冒险工具集 — Tabletop Adventure Tools

一个微信小程序，为桌面角色扮演游戏（TTRPG）玩家提供角色生成和主持辅助工具。

## ✨ 功能

### 🎲 角色创建工具
| 工具 | 说明 |
|------|------|
| **CoC7 角色创建** | 克苏鲁的呼唤第 7 版调查员角色卡生成器 |
| **CoC 守密人助手** | 克苏鲁的呼唤守密人辅助工具 |
| **石冢 (Cairn) 生成器** | Cairn 角色生成器 |
| **阈限恐怖 (Liminal Horror) 生成器** | Liminal Horror 调查员生成器 |
| **阈限恐怖·繁孽版 (Bloom)** | Liminal Horror Bloom 变体规则角色生成器 |

### 📖 参考资料
| 工具 | 说明 |
|------|------|
| **TES:BotSE 技能速查** | 上古卷轴:第二纪元的背叛-技能速查工具 | 

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
│   ├── coc7-gen/                 # CoC7 角色创建
│   ├── coc-keeper/               # 守密人助手
│   ├── cairn-gen/                # 石冢角色生成
│   ├── liminal-horror-gen/       # 阈限恐怖生成器
│   ├── liminal-horror-gen-bloom/ # 阈限恐怖·繁孽版
│   ├── tes-botse-skills/         # TES 技能速查
│   └── logs/                     # 日志页
└── utils/
    └── util.js                   # 通用工具函数
```

## 📝 开发状态

- ✅ CoC7 角色创建 — 基本功能可用，持续完善中
- ✅ 石冢角色生成 — 已发布
- ✅ 阈限恐怖角色生成 — 已发布
- ✅ 阈限恐怖·繁孽版 — 已发布
- ✅ TES 技能速查 — 已发布
- 🚧 CoC 守密人助手 — 开发中

## 📄 许可

[MIT](LICENSE) © 2026 fanner7
