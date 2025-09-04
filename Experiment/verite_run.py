import json
import time
import uuid
import argparse
from jwcrypto import jwk, jws
from jwcrypto.common import json_encode, json_decode

VC_LIFESPAN_SECONDS = 30 * 24 * 60 * 60

def make_ed25519_jwk() -> jwk.JWK:
    return jwk.JWK.generate(kty="OKP", crv="Ed25519")

def sign_jwt(payload: dict, key: jwk.JWK, kid: str) -> str:
    protected_header = {"alg": "EdDSA", "kid": kid, "typ": "JWT"}
    token = jws.JWS(json_encode(payload).encode('utf-8'))
    token.add_signature(key, alg="EdDSA", protected=json_encode(protected_header))
    return token.serialize(compact=True)

def verify_jwt(token: str, key: jwk.JWK) -> bool:
    try:
        verifier = jws.JWS()
        verifier.deserialize(token)
        verifier.verify(key)
        return True
    except Exception:
        return False

def issue_vc_from_transaction(transaction: dict, issuer_jwk: jwk.JWK, issuer_did: str) -> str:
    now = int(time.time())
    subject_did = f"did:example:tx:{transaction.get('id', uuid.uuid4())}"
    
    vc_payload = {
        "jti": f"urn:uuid:{uuid.uuid4()}",
        "iss": issuer_did,
        "sub": subject_did,
        "nbf": now - 10,
        "iat": now,
        "exp": now + VC_LIFESPAN_SECONDS,
        "vc": {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            "type": ["VerifiableCredential", "TransactionCredential"],
            "credentialSubject": transaction
        }
    }
    return sign_jwt(vc_payload, issuer_jwk, kid=f"{issuer_did}#keys-1")

def main():
    parser = argparse.ArgumentParser(description="Batch process transactions into Verifiable Credentials.")
    parser.add_argument("transactions_file", help="Path to the JSON file containing a list of transactions.")
    args = parser.parse_args()

    try:
        with open(args.transactions_file, 'r', encoding='utf-8') as f:
            transactions = json.load(f)
        if not isinstance(transactions, list):
            raise TypeError("JSON file must contain a list of transactions.")
        print(f"Successfully loaded {len(transactions)} transactions from '{args.transactions_file}'")
    except Exception as e:
        raise SystemExit(f"Failed to load or parse file: {e}")

    if not transactions:
        print("File is empty, nothing to process.")
        return

    print("\n--- Phase 1: Issuer Batch Issuance ---")
    issuer_key = make_ed25519_jwk()
    issuer_did = "did:example:batch_issuer_123"
    print(f"Issuer DID: {issuer_did}")

    start_time = time.perf_counter()

    issued_vcs = []
    for tx in transactions:
        vc_jwt = issue_vc_from_transaction(tx, issuer_key, issuer_did)
        issued_vcs.append(vc_jwt)

    issuance_time = time.perf_counter()
    print(f"Completed issuance of {len(issued_vcs)} credentials.")


    print("\n--- Phase 2: Verifier Batch Verification ---")
    
    verified_count = 0
    for vc_jwt in issued_vcs:
        if verify_jwt(vc_jwt, issuer_key):
            verified_count += 1
            
    verification_end_time = time.perf_counter()
    print(f"Completed verification of {len(issued_vcs)} credentials.")

    total_time = verification_end_time - start_time
    issuance_duration = issuance_time - start_time
    verification_duration = verification_end_time - issuance_time
    
    print("\n--- Performance Summary ---")
    print(f"Total transactions processed: {len(transactions)}")
    print(f"Successfully verified credentials: {verified_count}")
    print(f"  - Total issuance time: {issuance_duration:.4f} seconds")
    print(f"  - Total verification time: {verification_duration:.4f} seconds")
    print(f"Total workflow time: {total_time:.4f} seconds")


if __name__ == "__main__":
    main()