#!/usr/bin/env python3
"""
Consensus Chronicle - Contract Deployment Script

Deploy to GenLayer testnet or mainnet.

Usage:
    python deploy.py --network testnet
    python deploy.py --network mainnet
"""

import argparse
import json
from pathlib import Path

NETWORKS = {
    "testnet": {
        "rpc_url": "https://studio.genlayer.com/api",
        "chain_id": 61000,
        "explorer": "https://studio.genlayer.com"
    },
    "mainnet": {
        "rpc_url": "https://mainnet.genlayer.com/api",
        "chain_id": 61001,
        "explorer": "https://explorer.genlayer.com"
    }
}

def deploy_contract(network: str):
    """Deploy contract to specified network"""
    if network not in NETWORKS:
        raise ValueError(f"Unknown network: {network}")
    
    config = NETWORKS[network]
    
    print(f"\n{'='*60}")
    print(f"CONSENSUS CHRONICLE - CONTRACT DEPLOYMENT")
    print(f"{'='*60}")
    print(f"\nNetwork: {network}")
    print(f"RPC URL: {config['rpc_url']}")
    print(f"Chain ID: {config['chain_id']}")
    print(f"\n{'='*60}")
    
    print("\nDEPLOYMENT INSTRUCTIONS:")
    print("-" * 40)
    print(f"\n1. Open GenLayer Studio: {config['explorer']}")
    print("\n2. Connect your wallet")
    print("\n3. Go to 'Deploy Contract' section")
    print("\n4. Paste the contract code from: contracts/ConsensusChronicle.py")
    print("\n5. Click 'Deploy'")
    print("\n6. Copy the contract address")
    print("\n7. Update index.html CONFIG.GENLAYER_CONTRACT")
    print("\n" + "="*60)
    
    deployment_config = {
        "network": network,
        "chain_id": config["chain_id"],
        "rpc_url": config["rpc_url"],
        "contract_name": "ConsensusChronicle",
        "deployed_at": None,
        "contract_address": None
    }
    
    config_path = Path(__file__).parent / "deployment-config.json"
    with open(config_path, "w") as f:
        json.dump(deployment_config, f, indent=2)
    
    print(f"\nConfig saved to: {config_path}")

def main():
    parser = argparse.ArgumentParser(description="Deploy Consensus Chronicle to GenLayer")
    parser.add_argument("--network", choices=["testnet", "mainnet"], default="testnet")
    args = parser.parse_args()
    deploy_contract(args.network)

if __name__ == "__main__":
    main()
