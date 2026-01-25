# 共识编年史 - Consensus Chronicle

基于 GenLayer 的多人协作叙事游戏

## 合约信息

- **合约地址**: `0x4F5F132ba540f1C685B0188D59990302903aE186`
- **网络**: studionet

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 部署到 Vercel

```bash
npx vercel
```

或者登录 [Vercel](https://vercel.com)，导入此项目。

### 3. 开始游戏

1. 打开部署后的网址
2. 点击"连接钱包"，输入你的私钥
3. 首次使用会自动注册，获得 100 GEN
4. 选择主题创建房间（扣除 10 GEN）
5. 等待其他玩家加入，或分享链接邀请好友
6. 开始 5 轮史诗故事！

## 游戏规则

- **入场费**: 10 GEN
- **最少玩家**: 2 人
- **最多玩家**: 8 人
- **每轮流程**: 90秒辩论 → 30秒投票 → 结算
- **积分规则**: 投票获胜方 +30 分，发言 +10 分
- **奖励**: 游戏结束后根据积分获得 GEN 奖励

## 文件结构

```
consensus-game/
├── api/
│   └── genlayer.js    # Vercel API 连接合约
├── index.html         # 游戏前端
├── package.json
├── vercel.json
└── README.md
```

## 技术栈

- **智能合约**: GenLayer (Python)
- **前端**: 原生 HTML/CSS/JS
- **后端**: Vercel Serverless Functions
- **链**: GenLayer studionet
