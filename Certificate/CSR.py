import sys
from cryptography import x509
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

# Check if enough arguments are passed
if len(sys.argv) < 6:
    print("Usage: python CSR.py <debtor_DID> <debtor_bank> <debtor_wallet_addresses> <transaction_wallet_address> <creditor_bank>")
    sys.exit(1)

# Get transaction-related information from command-line arguments
transaction_info = {
    "debtor_DID": sys.argv[1],
    "debtor_bank": sys.argv[2],
    "debtor_wallet_addresses": sys.argv[3].split(","),  # Comma-separated list of wallet addresses
    "transaction_wallet_address": sys.argv[4],
    "creditor_bank": sys.argv[5],
}

# Generate user private key
user_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Format the custom extensions
debtor_wallet_extension = f"Debtor Wallet Addresses: {', '.join(transaction_info['debtor_wallet_addresses'])}".encode('utf-8')
transaction_wallet_extension = f"Transaction Wallet Address: {transaction_info['transaction_wallet_address']}".encode('utf-8')
creditor_info_extension = f"Creditor Bank: {transaction_info['creditor_bank']}".encode('utf-8')

# Generate CSR with the custom extensions
csr = x509.CertificateSigningRequestBuilder().subject_name(x509.Name([
    x509.NameAttribute(NameOID.USER_ID, transaction_info["debtor_DID"]),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, transaction_info["debtor_bank"]),
])).add_extension(
    x509.UnrecognizedExtension(
        oid=x509.ObjectIdentifier("1.2.3.4.1"),  # OID for debtor's wallet addresses
        value=debtor_wallet_extension
    ),
    critical=False,
).add_extension(
    x509.UnrecognizedExtension(
        oid=x509.ObjectIdentifier("1.2.3.4.2"),  # OID for the transaction wallet address
        value=transaction_wallet_extension
    ),
    critical=False,
).add_extension(
    x509.UnrecognizedExtension(
        oid=x509.ObjectIdentifier("1.2.3.4.3"),  # OID for creditor's information
        value=creditor_info_extension
    ),
    critical=False,
).sign(user_key, hashes.SHA256())

# Serialize the CSR to PEM format and save to a file
csr_pem = csr.public_bytes(serialization.Encoding.PEM)
csr_file_path = "/Users/kaiyang/Documents/kyc/Certificate/csr.pem"

with open(csr_file_path, "wb") as f:
    f.write(csr_pem)

print(f"Transaction CSR has been generated and saved to {csr_file_path}")
