# =============================================================================
# CONSENSUS CHRONICLE - GenLayer Smart Contract
# 部署到 GenLayer Studio: https://studio.genlayer.com
# =============================================================================

from genvm.base.icontract import IContract

class ConsensusChronicle(IContract):
    """
    共识编年史 - 链上多人协作叙事游戏
    
    所有游戏数据存储在链上：
    - 游戏房间
    - 玩家信息
    - 投票记录
    - 代币余额
    """
    
    def __init__(self):
        # 游戏房间 {room_id: {theme, host, players[], status, round, votes[], path[], created_at}}
        self.rooms = {}
        # 玩家余额 {address: balance}
        self.balances = {}
        # 玩家信息 {address: {name, avatar, total_games, total_wins}}
        self.players = {}
        # 全局计数器
        self.room_count = 0
        # 排行榜 [{address, name, score, theme, timestamp}]
        self.leaderboard = []
        # 游戏配置
        self.ENTRY_FEE = 10
        self.BASE_REWARD = 50
        self.WIN_BONUS = 20
    
    # =========================================================================
    # 玩家管理
    # =========================================================================
    
    async def register_player(self, name: str, avatar: str) -> dict:
        """注册新玩家，初始化100代币"""
        addr = contract_runner.from_address
        
        if addr not in self.balances:
            self.balances[addr] = 100
        
        self.players[addr] = {
            "name": name,
            "avatar": avatar,
            "total_games": 0,
            "total_wins": 0,
            "registered_at": contract_runner.block_timestamp
        }
        
        return {
            "success": True,
            "address": addr,
            "balance": self.balances[addr],
            "player": self.players[addr]
        }
    
    async def get_player(self, address: str) -> dict:
        """获取玩家信息"""
        return {
            "address": address,
            "balance": self.balances.get(address, 0),
            "info": self.players.get(address, None)
        }
    
    async def get_balance(self, address: str) -> int:
        """获取玩家余额"""
        return self.balances.get(address, 0)
    
    # =========================================================================
    # 房间管理
    # =========================================================================
    
    async def create_room(self, theme: str) -> dict:
        """创建游戏房间，扣除入场费"""
        addr = contract_runner.from_address
        
        # 检查余额
        if self.balances.get(addr, 0) < self.ENTRY_FEE:
            return {"success": False, "error": "Insufficient balance"}
        
        # 扣除入场费
        self.balances[addr] -= self.ENTRY_FEE
        
        # 创建房间
        self.room_count += 1
        room_id = f"room_{self.room_count}"
        
        self.rooms[room_id] = {
            "id": room_id,
            "theme": theme,
            "host": addr,
            "players": [addr],
            "player_names": {addr: self.players.get(addr, {}).get("name", "Unknown")},
            "status": "waiting",  # waiting, playing, finished
            "round": 0,
            "votes": {},  # {round: {address: choice}}
            "path": [],   # 每轮获胜选项 ['A', 'B', ...]
            "scores": {addr: 0},
            "created_at": contract_runner.block_timestamp
        }
        
        return {
            "success": True,
            "room_id": room_id,
            "room": self.rooms[room_id],
            "balance": self.balances[addr]
        }
    
    async def join_room(self, room_id: str) -> dict:
        """加入游戏房间"""
        addr = contract_runner.from_address
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "waiting":
            return {"success": False, "error": "Game already started"}
        
        if len(room["players"]) >= 8:
            return {"success": False, "error": "Room is full"}
        
        if addr in room["players"]:
            return {"success": False, "error": "Already in room"}
        
        # 检查并扣除入场费
        if self.balances.get(addr, 0) < self.ENTRY_FEE:
            return {"success": False, "error": "Insufficient balance"}
        
        self.balances[addr] -= self.ENTRY_FEE
        
        # 加入房间
        room["players"].append(addr)
        room["player_names"][addr] = self.players.get(addr, {}).get("name", "Unknown")
        room["scores"][addr] = 0
        
        return {
            "success": True,
            "room": room,
            "balance": self.balances[addr]
        }
    
    async def leave_room(self, room_id: str) -> dict:
        """离开房间（仅限等待状态）"""
        addr = contract_runner.from_address
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "waiting":
            return {"success": False, "error": "Cannot leave during game"}
        
        if addr not in room["players"]:
            return {"success": False, "error": "Not in room"}
        
        # 退还入场费
        self.balances[addr] = self.balances.get(addr, 0) + self.ENTRY_FEE
        
        # 离开房间
        room["players"].remove(addr)
        del room["player_names"][addr]
        del room["scores"][addr]
        
        # 如果房主离开，转移房主或关闭房间
        if addr == room["host"]:
            if len(room["players"]) > 0:
                room["host"] = room["players"][0]
            else:
                room["status"] = "closed"
        
        return {"success": True, "balance": self.balances[addr]}
    
    async def get_room(self, room_id: str) -> dict:
        """获取房间信息"""
        return self.rooms.get(room_id, None)
    
    async def list_rooms(self) -> list:
        """获取所有等待中的房间"""
        waiting_rooms = []
        for room_id, room in self.rooms.items():
            if room["status"] == "waiting":
                waiting_rooms.append({
                    "id": room_id,
                    "theme": room["theme"],
                    "host": room["player_names"].get(room["host"], "Unknown"),
                    "player_count": len(room["players"]),
                    "created_at": room["created_at"]
                })
        return waiting_rooms
    
    # =========================================================================
    # 游戏流程
    # =========================================================================
    
    async def start_game(self, room_id: str) -> dict:
        """房主开始游戏"""
        addr = contract_runner.from_address
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if addr != room["host"]:
            return {"success": False, "error": "Only host can start"}
        
        if len(room["players"]) < 2:
            return {"success": False, "error": "Need at least 2 players"}
        
        if room["status"] != "waiting":
            return {"success": False, "error": "Game already started"}
        
        room["status"] = "playing"
        room["round"] = 1
        room["votes"] = {"1": {}}
        
        return {"success": True, "room": room}
    
    async def submit_vote(self, room_id: str, round_num: int, choice: str) -> dict:
        """提交投票 (choice: 'A' 或 'B')"""
        addr = contract_runner.from_address
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "playing":
            return {"success": False, "error": "Game not in progress"}
        
        if addr not in room["players"]:
            return {"success": False, "error": "Not in this game"}
        
        if room["round"] != round_num:
            return {"success": False, "error": "Wrong round"}
        
        if choice not in ["A", "B"]:
            return {"success": False, "error": "Invalid choice"}
        
        # 记录投票
        round_key = str(round_num)
        if round_key not in room["votes"]:
            room["votes"][round_key] = {}
        
        room["votes"][round_key][addr] = choice
        
        # 检查是否所有人都投票了
        all_voted = len(room["votes"][round_key]) == len(room["players"])
        
        return {
            "success": True,
            "all_voted": all_voted,
            "vote_count": len(room["votes"][round_key]),
            "total_players": len(room["players"])
        }
    
    async def finalize_round(self, room_id: str) -> dict:
        """结算当前轮次，进入下一轮或结束游戏"""
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "playing":
            return {"success": False, "error": "Game not in progress"}
        
        round_key = str(room["round"])
        votes = room["votes"].get(round_key, {})
        
        # 统计投票
        count_a = sum(1 for v in votes.values() if v == "A")
        count_b = sum(1 for v in votes.values() if v == "B")
        
        # 确定获胜选项
        winner = "A" if count_a >= count_b else "B"
        room["path"].append(winner)
        
        # 更新分数 - 投票给获胜选项的玩家得分
        for addr, vote in votes.items():
            if vote == winner:
                room["scores"][addr] = room["scores"].get(addr, 0) + self.WIN_BONUS
        
        # 检查游戏是否结束
        if room["round"] >= 5:
            room["status"] = "finished"
            return await self._end_game(room_id)
        else:
            room["round"] += 1
            room["votes"][str(room["round"])] = {}
            return {
                "success": True,
                "winner": winner,
                "count_a": count_a,
                "count_b": count_b,
                "next_round": room["round"],
                "path": room["path"]
            }
    
    async def _end_game(self, room_id: str) -> dict:
        """内部方法：结束游戏，发放奖励"""
        room = self.rooms[room_id]
        
        results = []
        for addr in room["players"]:
            score = room["scores"].get(addr, 0)
            reward = self.BASE_REWARD + (score // 2)
            
            # 发放奖励
            self.balances[addr] = self.balances.get(addr, 0) + reward
            
            # 更新玩家统计
            if addr in self.players:
                self.players[addr]["total_games"] += 1
            
            results.append({
                "address": addr,
                "name": room["player_names"].get(addr, "Unknown"),
                "score": score,
                "reward": reward,
                "balance": self.balances[addr]
            })
            
            # 更新排行榜
            self.leaderboard.append({
                "address": addr,
                "name": room["player_names"].get(addr, "Unknown"),
                "score": score,
                "theme": room["theme"],
                "timestamp": contract_runner.block_timestamp
            })
        
        # 排序排行榜，保留前100
        self.leaderboard = sorted(self.leaderboard, key=lambda x: x["score"], reverse=True)[:100]
        
        return {
            "success": True,
            "game_over": True,
            "winner": winner,
            "path": room["path"],
            "results": results
        }
    
    # =========================================================================
    # 查询接口
    # =========================================================================
    
    async def get_leaderboard(self, limit: int = 20) -> list:
        """获取排行榜"""
        return self.leaderboard[:limit]
    
    async def get_game_state(self, room_id: str) -> dict:
        """获取完整游戏状态（用于前端同步）"""
        if room_id not in self.rooms:
            return None
        
        room = self.rooms[room_id]
        return {
            "room": room,
            "current_round": room["round"],
            "current_votes": room["votes"].get(str(room["round"]), {}),
            "path": room["path"],
            "scores": room["scores"]
        }
