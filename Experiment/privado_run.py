import os
import argparse
import requests
import json
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

def get_issuer_base() -> str:
    base = os.getenv("PRIVADO_ISSUER_BASE", "").rstrip("/")
    if not base:
        raise SystemExit("PRIVADO_ISSUER_BASE is not set in .env file.")
    return base

def create_identity(issuer_base_url: str) -> str:
    url = f"{issuer_base_url}/v1/identities"
    body = {
        "didMetadata": { "method": "polygonid", "blockchain": "polygon", "network": "amoy", "type": "BJJ" },
        "credentialStatusType": "Iden3commRevocationStatusv1.0"
    }
    try:
        r = requests.post(url, json=body, timeout=30)
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise SystemExit(f"Failed to create Issuer DID: {e}")
    data = r.json()
    did = data.get("identifier") or data.get("id") or data.get("did") or data.get("data", {}).get("identifier")
    if not did:
        raise RuntimeError(f"Could not find DID in response: {data}")
    return did

def create_credential(issuer_base_url: str, issuer_did: str, schema_url: str, cred_type: str, tx_data: dict, days_valid: int) -> bool:
    url = f"{issuer_base_url}/v1/credentials/{issuer_did}"
    expiration_date = (datetime.now(timezone.utc) + timedelta(days=days_valid)).isoformat().replace("+00:00", "Z")
    
    holder_did = tx_data.get("holder_did")
    if not holder_did:
        print(f"  Item is missing 'holder_did', skipping: {tx_data}")
        return False
        
    credential_subject = tx_data.copy()
    credential_subject['id'] = holder_did

    body = {
        "credentialSchema": schema_url,
        "type": cred_type,
        "credentialSubject": credential_subject,
        "expiration": expiration_date
    }
    try:
        r = requests.post(url, json=body, timeout=60)
        r.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Failed to issue credential for {holder_did}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Batch issue Privado ID credentials.")
    parser.add_argument("transactions_file", help="Path to the JSON file containing data for credential issuance.")
    args = parser.parse_args()

    schema_url = os.getenv("PRIVADO_SCHEMA_URL")
    cred_type = os.getenv("PRIVADO_CRED_TYPE")
    if not schema_url or not cred_type:
        raise SystemExit("Please set PRIVADO_SCHEMA_URL and PRIVADO_CRED_TYPE in your .env file.")

    try:
        with open(args.transactions_file, 'r', encoding='utf-8') as f:
            transactions = json.load(f)
        print(f"Successfully loaded {len(transactions)} items.")
    except Exception as e:
        raise SystemExit(f"Failed to load file: {e}")

    print("\n Starting batch processing...")
    issuer_url = get_issuer_base()
    
    print("  - Creating Issuer DID...")
    issuer_did = create_identity(issuer_url)
    print(f" Issuer DID created: {issuer_did}")

    start_time = time.perf_counter()
    success_count = 0
    failure_count = 0
    days_valid = int(os.getenv("PRIVADO_EXP_DAYS", "180"))

    for tx in transactions:
        if create_credential(issuer_url, issuer_did, schema_url, cred_type, tx, days_valid):
            success_count += 1
        else:
            failure_count += 1
            
    total_time = time.perf_counter() - start_time

    print("\n--- Performance Summary (Privado ID) ---")
    print(f"Total items processed: {len(transactions)}")
    print(f"Successfully issued: {success_count}")
    print(f"Failed/Skipped: {failure_count}")
    print(f"Total execution time: {total_time:.4f} seconds")

if __name__ == "__main__":
    main()