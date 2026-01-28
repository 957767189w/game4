# 共识编年史 - 部署指南

## 文件说明
- `index.html` - 完整的单文件应用
- `vercel.json` - Vercel部署配置

## 一键部署到Vercel

### 方法1: 拖拽部署（最简单）
1. 新建一个文件夹，把 `index.html` 和 `vercel.json` 放进去
2. 打开 https://vercel.com/new
3. 拖拽整个文件夹到页面
4. 等待30秒部署完成
5. 获得你的网址

### 方法2: CLI部署
```bash
npm i -g vercel
vercel
```

## 游戏架构

```
玩家 ──────▶ Firebase (实时同步) ◀────── 其他玩家
  │
  │ 0.01 GEN入场费
  ▼
MetaMask ──▶ GenLayer合约
            (记录游戏结果)
```

## 游戏流程
1. 🦊 连接MetaMask
2. ✏️ 输入名字
3. 🚪 创建/加入房间 (支付0.01 GEN)
4. ⏳ 等待玩家 (AI自动加入)
5. 🎮 开始游戏
6. 💬 5轮辩论+投票
7. 🏆 结束上链

## 技术栈
- React 18 (CDN)
- Firebase Realtime DB
- MetaMask + ethers
- GenLayer智能合约
