# Consensus Chronicle

> Blockchain-powered multiplayer storytelling game where collective decisions shape the narrative.

[![GenLayer](https://img.shields.io/badge/Powered%20by-GenLayer-gold)](https://genlayer.com)
[![Firebase](https://img.shields.io/badge/Real--time-Firebase-orange)](https://firebase.google.com)

## Overview

**Consensus Chronicle** is a real-time multiplayer game combining collaborative storytelling with blockchain technology. Players join "chronicle rooms" to collectively write a story through debate and democratic voting. Results are permanently recorded on the GenLayer blockchain.

### Features

- **Real-time Multiplayer**: 4-8 players per room with AI companions
- **Collaborative Storytelling**: 5 rounds of debate and voting per game
- **Four Epic Themes**: Fantasy, Sci-Fi, Mystery, Political Intrigue
- **Blockchain Integration**: Results recorded on GenLayer
- **MetaMask Authentication**: Secure wallet-based identity
- **Global Leaderboard**: Rankings by experience points

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React (Single HTML) | Game interface |
| Real-time | Firebase Realtime DB | Live game state |
| Blockchain | GenLayer | Result recording |
| Wallet | MetaMask | Authentication |
| Hosting | Vercel | Deployment |

## Quick Start

### 1. Configure Firebase

Update `CONFIG.FIREBASE` in `index.html`:

```javascript
FIREBASE: {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id"
}
```

### 2. Deploy Contract (Optional)

```bash
cd contracts
python deploy.py --network testnet
```

Update `CONFIG.GENLAYER_CONTRACT` in `index.html` with your contract address.

### 3. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or simply upload `index.html` to any static host.

## Game Flow

```
1. Connect Wallet (MetaMask)
2. Enter Player Name
3. Choose Theme (Fantasy/Sci-Fi/Mystery/Political)
4. Create or Join Room (GenLayer TX: 0 GEN)
5. Wait for Players (AI fills if needed)
6. Game Loop (5 rounds):
   - Debate Phase (60s): Discuss options A and B
   - Vote Phase (20s): Choose your preferred option
   - Result: Winning option advances story
7. Chronicle Complete: Results saved to blockchain
```

## Scoring

| Action | Points |
|--------|--------|
| Vote for winning option | +30 Influence |
| Send debate message | +10 Debate |
| Tie vote | +0 (random path selected) |

## Project Structure

```
consensus-chronicle/
├── index.html              # Main application
├── contracts/
│   ├── ConsensusChronicle.py   # Smart contract
│   └── deploy.py               # Deployment script
├── docs/
│   └── PROJECT_INTRODUCTION.md # Detailed overview
├── vercel.json             # Vercel config
└── README.md               # This file
```

## Smart Contract

**Testnet Address**: `0x4F5F132ba540f1C685B0188D59990302903aE186`

Key Functions:
- `pay_fee()` - Process game fee (0 GEN in beta)
- `record_chronicle()` - Save game results on-chain
- `get_player_stats()` - Query player statistics
- `get_leaderboard()` - Get top players

## Firebase Structure

```
firebase-root/
├── rooms/{roomId}/         # Room data
├── games/{roomId}/         # Game state
├── players/{address}/      # Player profiles
└── userHistory/{address}/  # Game history
```

## License

MIT License

---

**Made for storytellers and blockchain enthusiasts**
