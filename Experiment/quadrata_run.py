import os
import argparse
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv()

def get_base_url():
    env = os.getenv("QUADRATA_ENV", "int").strip()
    if env == "prod":
        return "https://prod.quadrata.com"
    return "https://int.quadrata.com"

def login(api_key: str) -> str:
    url = f"{get_base_url()}/api/v1/login"
    try:
        resp = requests.post(url, json={"apiKey": api_key}, timeout=15)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise SystemExit(f"❌ Login failed: {e}")
    data = resp.json().get("data", {})
    token = data.get("accessToken")
    if not token:
        raise RuntimeError(f"Login failed, no token received. Response: {resp.text}")
    return token

def query_attributes(access_token: str, wallet: str, attributes: list[str]) -> bool:
    url = f"{get_base_url()}/api/v1/attributes/query"
    params = [("wallet", wallet)] + [("attributes", a) for a in attributes]
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json().get('success', True)
    except requests.exceptions.RequestException as e:
        print(f"  - Query failed for wallet {wallet}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Batch query Quadrata attributes for a list of wallets.")
    parser.add_argument("transactions_file", help="Path to the JSON file containing transactions with 'wallet_address'.")
    args = parser.parse_args()

    api_key = os.getenv("QUADRATA_API_KEY")
    if not api_key or api_key == "replace_with_your_key":
        raise SystemExit("❌ Please set a valid QUADRATA_API_KEY in your .env file.")

    try:
        with open(args.transactions_file, 'r', encoding='utf-8') as f:
            transactions = json.load(f)
        print(f"Successfully loaded {len(transactions)} items.")
    except Exception as e:
        raise SystemExit(f"❌ Failed to load file: {e}")

    print("\nStarting batch processing...")
    print("  - Logging into Quadrata...")
    access_token = login(api_key)
    print("  - Login successful.")

    start_time = time.perf_counter()
    success_count = 0
    failure_count = 0
    attributes_to_query = ["AML", "COUNTRY", "DID"]

    for i, tx in enumerate(transactions):
        wallet = tx.get("wallet_address")
        if not wallet:
            print(f"  - Item {i+1} is missing 'wallet_address' field, skipping.")
            failure_count += 1
            continue
        
        if query_attributes(access_token, wallet, attributes_to_query):
            success_count += 1
        else:
            failure_count += 1

    total_time = time.perf_counter() - start_time

    print("\n--- Performance Summary (Quadrata) ---")
    print(f"Total items processed: {len(transactions)}")
    print(f"✅ Successful queries: {success_count}")
    print(f"❌ Failed/Skipped queries: {failure_count}")
    print(f"⏱️ Total execution time: {total_time:.4f} seconds")

if __name__ == "__main__":
    main()