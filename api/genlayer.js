import { createClient } from 'genlayer-js';

const CONTRACT_ADDRESS = '0x4F5F132ba540f1C685B0188D59990302903aE186';

const client = createClient({
  chain: 'studionet',
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, params, privateKey } = req.body;

  try {
    // 读取方法 (不需要签名)
    const readMethods = ['get_player', 'get_room', 'list_rooms'];
    
    if (readMethods.includes(method)) {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: method,
        args: params || [],
      });
      return res.status(200).json({ success: true, data: result });
    }

    // 写入方法 (需要签名)
    if (!privateKey) {
      return res.status(400).json({ success: false, error: 'Private key required for write operations' });
    }

    const account = client.createAccount(privateKey);
    
    const result = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args: params || [],
      account,
    });

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('Contract error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
