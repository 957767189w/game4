import { createClient, createAccount } from 'genlayer-js';
import { testnetAsimov } from 'genlayer-js/chains';

// ⚠️ 部署后把这里换成你的合约地址
const CONTRACT_ADDRESS = '你的合约地址';

// 创建 GenLayer 客户端
const client = createClient({
  chain: testnetAsimov,
});

// 读取方法（不需要私钥）
const READ_METHODS = [
  'get_player',
  'get_balance', 
  'list_rooms',
  'get_game_state',
  'get_leaderboard'
];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { method, args = [], privateKey } = req.body;
    
    if (!method) {
      return res.status(400).json({ error: 'Method required' });
    }
    
    // 读取操作
    if (READ_METHODS.includes(method)) {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: method,
        args: args,
      });
      
      return res.json({ success: true, result });
    }
    
    // 写入操作（需要私钥）
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key required for write operations' });
    }
    
    // 从私钥创建账户
    const account = createAccount(privateKey);
    
    // 创建带账户的客户端
    const writeClient = createClient({
      chain: testnetAsimov,
      account: account,
    });
    
    // 发送交易
    const hash = await writeClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args: args,
    });
    
    // 等待确认
    const receipt = await writeClient.waitForTransactionReceipt({
      hash: hash,
      status: 'FINALIZED',
      retries: 30,
    });
    
    return res.json({
      success: true,
      hash: hash,
      result: receipt.result,
    });
    
  } catch (error) {
    console.error('GenLayer API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
}
