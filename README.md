# 蛋总在线 — 李诞风格 AI 聊天机器人

一个以李诞为 persona 的像素风格聊天机器人。融合《脱口秀工作手册》创作方法论，能写自媒体文案、段子、脱口秀脚本，也能聊人生聊失恋。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **后端**: Express + [Vercel AI SDK](https://sdk.vercel.ai/) + DeepSeek
- **角色**: 李诞真人 MP4 动画（回复时循环播放）
- **Streaming**: 原生 `ReadableStream`，实时逐字输出

## 本地运行

**前置条件:** Node.js

1. 安装依赖:
   ```bash
   npm install
   ```

2. 在 `.env` 中设置 DeepSeek API Key:
   ```
   DEEPSEEK_API_KEY=your_key_here
   ```

3. 启动（同时启动前端 + 后端）:
   ```bash
   npm run dev
   ```

4. 打开浏览器访问 `http://localhost:5173`

## 功能

- **李诞 Persona**: 不说教、不端着、不虚无。道理裹在段子里，写字像聊天
- **自媒体创作**: 支持公众号长文、小红书、抖音脚本、微博金句、播客脚本
- **读稿会模式**: 发文章给他，他会像在读稿会上一样给你改稿建议
- **流式输出**: 回复实时逐字出现，角色动画同步播放

## 项目结构

```
├── src/
│   └── App.tsx          # 前端主组件（聊天界面 + 视频角色）
├── server.ts            # Express 后端（DeepSeek streaming）
├── public/
│   └── lidan.mp4        # 李诞角色动画
└── lidan.skill          # Claude Code Skill 定义文件
```
