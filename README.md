# 共识编年史 - Consensus Chronicle

**GenLayer 链上多人协作叙事游戏**

⚠️ **这不是单机游戏** - 所有数据存储在 GenLayer 区块链上！

---

## 🚀 完整部署流程

### 步骤 1：部署智能合约到 GenLayer

1. 打开 [GenLayer Studio](https://studio.genlayer.com)
2. 创建新合约
3. 复制 `ConsensusChronicle.py` 全部代码，粘贴
4. 点击 **Deploy** 部署
5. ⚠️ **复制合约地址**（如 `0x1a2b3c...`）

### 步骤 2：配置前端

打开 `index.html`，找到第 25 行：

```javascript
// ⚠️ 部署合约后，把合约地址填在这里！
CONTRACT_ADDRESS: '', 
```

改成：

```javascript
CONTRACT_ADDRESS: '0x你的合约地址',
```

### 步骤 3：部署到 Vercel

1. 打开 [vercel.com](https://vercel.com)
2. New Project → Upload
3. 上传 `index.html`
4. Deploy

### 步骤 4：开始游戏

1. 分享 Vercel URL 给其他玩家
2. **所有人必须用同一个合约地址！**
3. 一人创建房间，其他人加入
4. 房主点击开始

---

## 📁 文件清单

| 文件 | 用途 | 部署位置 |
|------|------|----------|
| `ConsensusChronicle.py` | 智能合约 | GenLayer Studio |
| `index.html` | 前端界面 | Vercel |

---

## 🔗 链上存储的数据

```python
self.rooms = {}      # 游戏房间
self.balances = {}   # 玩家余额  
self.players = {}    # 玩家信息
self.leaderboard = [] # 排行榜
```

**不是 localStorage，是真正的区块链！**

---

## 🎮 多人游戏流程

```
玩家A创建房间 ──→ 链上记录房间
       ↓
玩家B刷新看到房间 ──→ 从链上读取
       ↓
玩家B点击加入 ──→ 链上更新玩家列表
       ↓
玩家A开始游戏 ──→ 链上更新状态
       ↓
所有玩家投票 ──→ 链上记录投票
       ↓
全部投完后结算 ──→ 链上更新分数
       ↓
5轮后结束 ──→ 链上发放奖励
```

---

## ❓ 常见问题

**Q: 页面显示"配置合约地址"怎么办？**
→ 你没部署合约，或者没填地址

**Q: 别人看不到我的房间？**
→ 确认大家的 CONTRACT_ADDRESS 一样

**Q: 怎么一起玩？**
→ 同一个合约地址 + 同一个 Vercel URL

---

## 技术架构

```
┌──────────┐      ┌─────────────┐      ┌────────────┐
│  Vercel  │ ───▶ │ GenLayer    │ ───▶ │ Blockchain │
│ (前端)   │ ◀─── │ RPC API     │ ◀─── │ (合约)     │
└──────────┘      └─────────────┘      └────────────┘
     ↑                                       ↑
   玩家A ────────────────────────────────────┤
   玩家B ────────────────────────────────────┤
   玩家C ────────────────────────────────────┘
```
