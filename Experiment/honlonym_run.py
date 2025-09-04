import os
import argparse
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

HOLO_API_BASE = "https://api.holonym.io"

def check_api(address: str, proof_type: str, network: str, action_id: str | None) -> bool:
    url = f"{HOLO_API_BASE}/sybil-resistance/{proof_type}/{network}"
    params = {"user": address}
    if action_id:
        params["action-id"] = action_id
    
    try:
        r = requests.get(url, params=params, timeout=20)
        r.raise_for_status()
        return r.json().get('isUnique', False)
    except requests.exceptions.RequestException as e:
        print(f"  - Query failed for address {address}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Batch check Holonym proofs for a list of wallets.")
    parser.add_argument("transactions_file", help="Path to the JSON file containing transactions with 'wallet_address'.")
    args = parser.parse_args()

    try:
        with open(args.transactions_file, 'r', encoding='utf-8') as f:
            transactions = json.load(f)
        print(f"Successfully loaded {len(transactions)} items.")
    except Exception as e:
        raise SystemExit(f"Failed to load file: {e}")

    print("\n🔄 Starting batch processing...")
    
    start_time = time.perf_counter()
    success_count = 0
    failure_count = 0
    network = os.getenv("HOLO_NETWORK", "optimism")
    action_id = os.getenv("HOLO_ACTION_ID")
    proof_type_to_check = "gov-id"

    for i, tx in enumerate(transactions):
        wallet = tx.get("wallet_address")
        if not wallet:
            print(f"  - Item {i+1} is missing 'wallet_address' field, skipping.")
            failure_count += 1
            continue
        
        if check_api(wallet, proof_type_to_check, network, action_id):
            success_count += 1
        else:
            failure_count += 1
            
    total_time = time.perf_counter() - start_time

    print("\n--- Performance Summary (Holonym) ---")
    print(f"Total items processed: {len(transactions)}")
    print(f"Successful queries (isUnique=true): {success_count}")
    print(f"Failed/Skipped/isUnique=false: {failure_count}")
    print(f"Total execution time: {total_time:.4f} seconds")

if __name__ == "__main__":
    main()