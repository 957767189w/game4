from genlayer import *

@gl.contract
class ConsensusChronicle:
    """共识编年史 - 多人协作叙事游戏"""
    
    # 玩家数据: {address: {name, avatar, balance, exp}}
    players: TreeMap[Address, dict]
    
    # 房间数据: {room_id: {host, theme, players, status, round, votes, scores}}
    rooms: TreeMap[str, dict]
    
    # 房间计数器
    room_counter: u256
    
    # 排行榜
    leaderboard: DynArray[dict, 100]
    
    # 游戏常量
    ENTRY_FEE: u256
    BASE_REWARD: u256
    WIN_BONUS: u256
    
    def __init__(self):
        self.players = TreeMap[Address, dict]()
        self.rooms = TreeMap[str, dict]()
        self.room_counter = u256(0)
        self.leaderboard = []
        self.ENTRY_FEE = u256(10)
        self.BASE_REWARD = u256(50)
        self.WIN_BONUS = u256(20)
    
    @gl.public.write
    def register_player(self, name: str, avatar: str) -> dict:
        """注册新玩家"""
        sender = gl.message.sender_account
        
        if sender in self.players:
            return {"success": False, "error": "Player already registered"}
        
        player = {
            "name": name,
            "avatar": avatar,
            "balance": 100,  # 初始100代币
            "exp": 1000,
            "games_played": 0,
            "wins": 0
        }
        self.players[sender] = player
        
        return {"success": True, "player": player}
    
    @gl.public.view
    def get_player(self, address: str) -> dict:
        """获取玩家信息"""
        addr = Address(address)
        if addr in self.players:
            return {"success": True, "player": self.players[addr]}
        return {"success": False, "error": "Player not found"}
    
    @gl.public.view
    def get_balance(self, address: str) -> dict:
        """获取玩家余额"""
        addr = Address(address)
        if addr in self.players:
            return {"success": True, "balance": self.players[addr]["balance"]}
        return {"success": False, "balance": 0}
    
    @gl.public.write
    def create_room(self, theme: str) -> dict:
        """创建房间"""
        sender = gl.message.sender_account
        
        if sender not in self.players:
            return {"success": False, "error": "Player not registered"}
        
        player = self.players[sender]
        if player["balance"] < int(self.ENTRY_FEE):
            return {"success": False, "error": "Insufficient balance"}
        
        # 扣除入场费
        player["balance"] -= int(self.ENTRY_FEE)
        self.players[sender] = player
        
        # 创建房间
        self.room_counter += u256(1)
        room_id = f"room_{self.room_counter}"
        
        room = {
            "id": room_id,
            "host": str(sender),
            "theme": theme,
            "players": [str(sender)],
            "status": "waiting",  # waiting, playing, ended
            "round": 0,
            "total_rounds": 5,
            "votes": {},
            "scores": {str(sender): 0},
            "story_path": [],
            "created_at": gl.block.timestamp
        }
        self.rooms[room_id] = room
        
        return {"success": True, "room": room}
    
    @gl.public.write
    def join_room(self, room_id: str) -> dict:
        """加入房间"""
        sender = gl.message.sender_account
        
        if sender not in self.players:
            return {"success": False, "error": "Player not registered"}
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "waiting":
            return {"success": False, "error": "Game already started"}
        
        if len(room["players"]) >= 8:
            return {"success": False, "error": "Room is full"}
        
        if str(sender) in room["players"]:
            return {"success": False, "error": "Already in room"}
        
        player = self.players[sender]
        if player["balance"] < int(self.ENTRY_FEE):
            return {"success": False, "error": "Insufficient balance"}
        
        # 扣除入场费
        player["balance"] -= int(self.ENTRY_FEE)
        self.players[sender] = player
        
        # 加入房间
        room["players"].append(str(sender))
        room["scores"][str(sender)] = 0
        self.rooms[room_id] = room
        
        return {"success": True, "room": room}
    
    @gl.public.write
    def start_game(self, room_id: str) -> dict:
        """开始游戏"""
        sender = gl.message.sender_account
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["host"] != str(sender):
            return {"success": False, "error": "Only host can start"}
        
        if len(room["players"]) < 2:
            return {"success": False, "error": "Need at least 2 players"}
        
        if room["status"] != "waiting":
            return {"success": False, "error": "Game already started"}
        
        room["status"] = "playing"
        room["round"] = 1
        room["votes"] = {}
        self.rooms[room_id] = room
        
        return {"success": True, "room": room}
    
    @gl.public.write
    def submit_vote(self, room_id: str, round_num: int, choice: str) -> dict:
        """提交投票 (choice: 'A' or 'B')"""
        sender = gl.message.sender_account
        
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "playing":
            return {"success": False, "error": "Game not in progress"}
        
        if str(sender) not in room["players"]:
            return {"success": False, "error": "Not in this room"}
        
        if room["round"] != round_num:
            return {"success": False, "error": "Wrong round"}
        
        if choice not in ["A", "B"]:
            return {"success": False, "error": "Invalid choice"}
        
        # 记录投票
        if "votes" not in room or not isinstance(room["votes"], dict):
            room["votes"] = {}
        
        room["votes"][str(sender)] = choice
        self.rooms[room_id] = room
        
        return {"success": True, "votes_count": len(room["votes"])}
    
    @gl.public.write
    def finalize_round(self, room_id: str) -> dict:
        """结算本轮投票"""
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        
        if room["status"] != "playing":
            return {"success": False, "error": "Game not in progress"}
        
        # 计算投票结果
        votes = room.get("votes", {})
        count_a = sum(1 for v in votes.values() if v == "A")
        count_b = sum(1 for v in votes.values() if v == "B")
        
        # 确定赢家
        winner = "A" if count_a >= count_b else "B"
        
        # 更新分数
        for player_addr, vote in votes.items():
            if vote == winner:
                room["scores"][player_addr] = room["scores"].get(player_addr, 0) + int(self.WIN_BONUS)
        
        # 记录故事路径
        room["story_path"].append(winner)
        
        # 下一轮或结束
        if room["round"] >= room["total_rounds"]:
            room["status"] = "ended"
            self._distribute_rewards(room)
        else:
            room["round"] += 1
            room["votes"] = {}
        
        self.rooms[room_id] = room
        
        return {
            "success": True,
            "winner": winner,
            "count_a": count_a,
            "count_b": count_b,
            "round": room["round"],
            "status": room["status"],
            "scores": room["scores"]
        }
    
    def _distribute_rewards(self, room: dict):
        """分发奖励"""
        for player_addr in room["players"]:
            addr = Address(player_addr)
            if addr in self.players:
                player = self.players[addr]
                score = room["scores"].get(player_addr, 0)
                reward = int(self.BASE_REWARD) + score // 2
                player["balance"] += reward
                player["games_played"] += 1
                player["exp"] += score
                self.players[addr] = player
    
    @gl.public.view
    def get_game_state(self, room_id: str) -> dict:
        """获取游戏状态"""
        if room_id not in self.rooms:
            return {"success": False, "error": "Room not found"}
        
        room = self.rooms[room_id]
        return {
            "success": True,
            "room_id": room["id"],
            "host": room["host"],
            "theme": room["theme"],
            "players": room["players"],
            "status": room["status"],
            "round": room["round"],
            "total_rounds": room["total_rounds"],
            "votes_count": len(room.get("votes", {})),
            "scores": room["scores"],
            "story_path": room["story_path"]
        }
    
    @gl.public.view
    def list_rooms(self) -> dict:
        """列出所有等待中的房间"""
        waiting_rooms = []
        for room_id in self.rooms:
            room = self.rooms[room_id]
            if room["status"] == "waiting":
                waiting_rooms.append({
                    "id": room["id"],
                    "host": room["host"],
                    "theme": room["theme"],
                    "player_count": len(room["players"])
                })
        return {"success": True, "rooms": waiting_rooms}
    
    @gl.public.view
    def get_leaderboard(self) -> dict:
        """获取排行榜"""
        return {"success": True, "leaderboard": list(self.leaderboard)}
