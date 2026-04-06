# 李诞.skill + 蛋总在线

两个东西打包在一个仓库里：

1. **[李诞.skill](#1-李诞skill)** — Claude Code Skill，让 Claude 变成李诞
2. **[蛋总在线 Chat](#2-蛋总在线-chat)** — 像素风 AI 聊天机器人，用李诞 persona 驱动

---

## 1. 李诞.skill

`lidan.skill` 是一个 Claude Code Skill 文件。装上之后，Claude 会融合《脱口秀工作手册》的创作方法论，用李诞的方式帮你：

- 写自媒体文案（小红书、公众号、抖音脚本、微博金句、播客脚本）
- 写段子 / 脱口秀稿
- 读稿会模式（给你的文章做修改建议）
- 聊人生 / 聊失恋 / 反鸡汤式建议

**触发条件：** 提到「李诞」「段子」「脱口秀风格」「吐槽」「人间不值得」，或者需要轻松幽默有洞察力的自媒体内容时自动激活。

### 安装方式

将 `lidan.skill` 文件放到你的 Claude Code Skill 目录即可。

### Skill 内容

| 文件 | 内容 |
|------|------|
| `lidan/SKILL.md` | Skill 定义：创作方法论 + 人物 persona + 运行规则 |
| `lidan/methodology.md` | 《脱口秀工作手册》全书 18 章结构化提炼 |
| `lidan/references/quotes.md` | 李诞语录库（按主题分类，供风格参考） |

---

## 2. 蛋总在线 Chat

一个像素风格 AI 聊天机器人，以李诞为角色，回复时真人动画循环播放。

**技术栈：** React 19 + TypeScript + Vite + Tailwind CSS v4 + Express + DeepSeek

### 本地运行

**前置条件：** Node.js

```bash
npm install
```

在 `.env` 中设置 DeepSeek API Key：

```
DEEPSEEK_API_KEY=your_key_here
```

启动（同时启动前端 + 后端）：

```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173`

### 功能

- **流式输出**：回复实时逐字出现，角色动画同步播放
- **三态角色动画**：思考中（2× 快放）→ 说话中（正常播放）→ 待机（静止）
- **李诞 Persona**：不说教、不端着、不虚无。道理裹在段子里
- **自媒体创作**：直接让他帮你写稿，或者把稿子发给他让他给建议
- **读稿会模式**：发文章过去，他会像在读稿会上一样给修改意见

### 项目结构

```
├── src/App.tsx              # 前端主组件（聊天界面 + 视频角色）
├── server.ts                # Express 后端（DeepSeek streaming）
├── public/lidan.mp4         # 说话动画
├── public/lidan-thinking.mp4 # 思考动画（2× 快放）
└── lidan.skill              # Claude Code Skill 文件
```
