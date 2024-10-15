from cryptography.x509 import load_pem_x509_certificate
from cryptography.x509.verification import PolicyBuilder, Store, VerificationError
from datetime import datetime, timezone

# Load the root CA certificate
with open("/..../Certificate/root_cert.pem", "rb") as f:
    root_cert = load_pem_x509_certificate(f.read())

# Load the bank's intermediate CA certificate
with open("/..../Certificate/int_cert.pem", "rb") as f:
    int_cert = load_pem_x509_certificate(f.read())

# Load the user certificate
with open("/..../Certificate/user_cert.pem", "rb") as f:
    user_cert = load_pem_x509_certificate(f.read())

# Create a certificate store and add the root CA and intermediate CA certificates to it
store = Store([root_cert, int_cert])

# Create a verification policy and set the trust store and verification time
builder = PolicyBuilder().store(store).time(datetime.now(timezone.utc))

# In this scenario, we assume the user certificate is used for client authentication
verifier = builder.build_client_verifier()  # Use ClientVerifier to verify the client certificate

try:
    # Verify the user certificate; verification will check the intermediate certificate chain and root certificate
    chain = verifier.verify(user_cert, [int_cert])
except VerificationError as e:
    print(f"Certificate verification failed: {e}")
