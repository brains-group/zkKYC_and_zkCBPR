# Decentralized Identity Protocol Experiment Suite

This folder contains the benchmarking scripts for evaluating and comparing the performance of four decentralized identity protocols:

- **Quadrata**
- **Verite**
- **Holonym**
- **Privado ID**

Each experiment uses a shared dataset (`transactions.json`) to run multiple identity-related operations such as credential issuance, verification, and proof lookups, while measuring the time and success rate of each process.

---

## ⚙️ Environment Configuration (`.env`)

Before running any scripts, you **must** configure environment variables to enable access to external APIs and services.

> ✅ Copy the provided `.env.example` to `.env`, then fill in the values.  
> ⚠️ **Do NOT commit or share your `.env` file** — it may contain sensitive credentials.

```env
# ─── Quadrata ───────────────────────────────────────────────
QUADRATA_ENV=int                       # Use 'int' for integration/test environment
QUADRATA_API_KEY=your_quadrata_api_key
QUADRATA_TEST_WALLET=0x0000000000000000000000000000000000000000

# ─── Privado ID / Zeeve ID ─────────────────────────────────
PRIVADO_ISSUER_BASE=http://localhost:3002   # Your Issuer Node base URL
PRIVADO_VERIFIER_BASE=http://localhost:8080 # (Optional) Verifier Backend base URL
PRIVADO_SCHEMA_URL=https://schema.prod.example.com/KYCAgeCredential-1.json
PRIVADO_CRED_TYPE=KYCAgeCredential
PRIVADO_HOLDER_DID=did:polygonid:polygon:amoy:replaceWithHolderDid
PRIVADO_EXP_DAYS=180

# ─── Holonym / Human ID ────────────────────────────────────
HOLO_ACTION_ID=123456789              
HOLO_NETWORK=base-sepolias                 # Options: optimism, base-sepolia, etc.
HOLO_SAMPLE_ADDRESS=0x0000000000000000000000000000000000000000
```

> 🔒 Security Warning
Never upload or commit your .env file to version control (GitHub, GitLab, etc).

Replace all placeholder values (your_quadrata_company_api_key, replaceWithHolderDid, etc) before running experiments.

If you accidentally leak credentials, rotate them immediately.


## 📂 Input File: `transactions.json`

All experiments require a shared input file in the following format:

```json
[
  {
    "id": "tx_001",
    "wallet_address": "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    "holder_did": "did:polygonid:polygon:amoy:2qH1ZqV8ZgY5cSAMPLE",
    "birthday": "1991-05-20",
    "documentType": 1
  }
]
```

# How to Run Experiments
Make sure you have installed all dependencies listed in requirements.txt and have configured .env in the root directory.

## Quadrata
Query decentralized identity attributes from Quadrata for each wallet.

```python
python quadrata_run.py transactions.json
```

## Verite
Issue and verify VC-JWT credentials locally for each entry (fully offline).

```python
python verite_run.py transactions.json
```

## Holonym
Verify if each wallet in the list has a valid Holonym uniqueness or residency proof.

```python
python holonym_run.py transactions.json
```

## Privado ID
Create a credential for each holder DID using your local or remote Privado Issuer Node.

```python
python privado_run.py transactions.json
```

## Output

Number of successful operations

Number of failures

Total execution time

Per-record tracking

# Notes
Each protocol handles identity issuance and verification differently; 
the time costs and failure rates may vary significantly.

Network/API-based scripts (e.g. Quadrata, Holonym, Privado) require valid keys and server availability.
Verite runs fully locally and is useful as a reference benchmark.

