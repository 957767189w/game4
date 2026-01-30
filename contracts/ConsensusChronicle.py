# Consensus Chronicle - GenLayer Smart Contract
# Contract Address (Testnet): 0x4F5F132ba540f1C685B0188D59990302903aE186

from genlayer import *

@contract
class ConsensusChronicle:
    """
    Consensus Chronicle Smart Contract
    
    Records game results on the GenLayer blockchain.
    Stores:
    - Room ID, Theme, Story path
    - Player scores and rankings
    - Timestamps
    """
    
    def __init__(self):
        self.chronicles = {}
        self.player_stats = {}
        self.total_games = 0
        self.owner = msg.sender
    
    @external
    def record_chronicle(
        self,
        room_id: str,
        theme: str,
        path: str,
        players: list,
        scores: dict,
        ending_type: str
    ) -> bool:
        """Record a completed chronicle on-chain"""
        if not room_id or not theme or not path:
            return False
        if room_id in self.chronicles:
            return False
        
        self.chronicles[room_id] = {
            "theme": theme,
            "path": path,
            "players": players,
            "scores": scores,
            "ending_type": ending_type,
            "timestamp": block.timestamp,
            "recorder": msg.sender
        }
        
        for player in players:
            if player not in self.player_stats:
                self.player_stats[player] = {
                    "games_played": 0,
                    "total_score": 0,
                    "wins": 0
                }
            
            self.player_stats[player]["games_played"] += 1
            player_score = scores.get(player, 0)
            self.player_stats[player]["total_score"] += player_score
            
            max_score = max(scores.values()) if scores else 0
            if player_score == max_score and player_score > 0:
                self.player_stats[player]["wins"] += 1
        
        self.total_games += 1
        return True
    
    @external
    def pay_fee(self) -> bool:
        """Process game fee (0 GEN for beta)"""
        return True
    
    @view
    def get_chronicle(self, room_id: str) -> dict:
        """Get chronicle by room ID"""
        return self.chronicles.get(room_id, {})
    
    @view
    def get_player_stats(self, player: str) -> dict:
        """Get player statistics"""
        return self.player_stats.get(player, {
            "games_played": 0,
            "total_score": 0,
            "wins": 0
        })
    
    @view
    def get_total_games(self) -> int:
        """Get total game count"""
        return self.total_games
    
    @view
    def get_leaderboard(self, limit: int = 50) -> list:
        """Get top players by score"""
        sorted_players = sorted(
            self.player_stats.items(),
            key=lambda x: x[1].get("total_score", 0),
            reverse=True
        )
        return sorted_players[:limit]
