# 🎮 共识编年史 (Consensus Chronicle)

GenLayer 链上多人协作叙事游戏

## 📁 项目结构

```
consensus-game/
├── contracts/
│   └── game.py          # GenLayer 智能合约
├── api/
│   └── genlayer.js      # Vercel 后端 API
├── index.html           # 游戏前端
├── package.json
├── vercel.json
└── README.md
```

## 🚀 部署步骤

### 方法一：使用 GenLayer Studio（推荐新手）

1. **打开 GenLayer Studio**
   - 访问 https://studio.genlayer.com
   - 登录你的账号

2. **切换到 Testnet**
   - 确保 MetaMask 连接到 GenLayer Asimov Testnet
   - 如果余额不足，去 https://www.genlayer.com/faucet 领取测试币

3. **部署合约**
   - 点击 "New Contract" 创建新合约
   - 将 `contracts/game.py` 的内容粘贴进去
   - 点击 "Deploy" 部署
   - **记下合约地址**（类似 `0x1234...abcd`）

4. **配置 API**
   - 打开 `api/genlayer.js`
   - 将第 5 行的 `你的合约地址` 替换为你的实际合约地址

5. **部署到 Vercel**
   ```bash
   npm install
   npx vercel
   ```

### 方法二：使用 CLI（高级用户）

```bash
# 1. 安装 GenLayer CLI
npm install -g genlayer

# 2. 切换到 testnet
genlayer network set testnet-asimov

# 3. 导入钱包
genlayer account import --name default --private-key 0x你的私钥

# 4. 部署合约
genlayer deploy contracts/game.py

# 5. 记下合约地址，修改 api/genlayer.js

# 6. 部署到 Vercel
npm install
npx vercel
```

## 🎯 游戏规则

1. **注册**: 输入名字开始游戏，获得 100 GLT 初始代币
2. **创建/加入房间**: 消耗 10 GLT 入场费
3. **5轮投票**: 每轮辩论 + 投票，多数票决定故事走向
4. **获得奖励**: 投票获胜方 +20 分，发言 +10 分
5. **排行榜**: 游戏结束后根据得分排名

## 🎭 四个故事主题

| 主题 | 图标 | 描述 |
|------|------|------|
| 奇幻冒险 | 🏰 | 黑龙觉醒，王国危亡 |
| 科幻未来 | 🚀 | 末日方舟，星际求生 |
| 悬疑推理 | 🔍 | 密室谋杀，真相追寻 |
| 宫廷权谋 | 👑 | 皇位之争，权力博弈 |

## 📝 智能合约方法

### 读取方法（不需要签名）
- `get_player(address)` - 获取玩家信息
- `get_balance(address)` - 获取余额
- `list_rooms()` - 列出所有房间
- `get_game_state(room_id)` - 获取游戏状态
- `get_leaderboard()` - 获取排行榜

### 写入方法（需要签名）
- `register_player(name, avatar)` - 注册玩家
- `create_room(theme)` - 创建房间
- `join_room(room_id)` - 加入房间
- `start_game(room_id)` - 开始游戏
- `submit_vote(room_id, round, choice)` - 提交投票
- `finalize_round(room_id)` - 结算轮次

## 🔗 资源链接

- GenLayer 文档: https://docs.genlayer.com/
- GenLayer Discord: https://discord.gg/VpfmXEMN66
- 测试币水龙头: https://www.genlayer.com/faucet

## ⚠️ 注意事项

- 私钥仅保存在本地浏览器，不会上传服务器
- 测试网代币无实际价值
- 游戏为演示目的，可能存在 bug

---

Made with ❤️ for GenLayer
