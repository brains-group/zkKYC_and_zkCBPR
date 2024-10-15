import datetime
from cryptography import x509
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID
import sys


# Load the intermediate CA's private key and certificate from files
with open("/Users/kaiyang/Documents/kyc/Certificate/int_key.pem", "rb") as f:
    int_key = serialization.load_pem_private_key(f.read(), password=None)

with open("/Users/kaiyang/Documents/kyc/Certificate/int_cert.pem", "rb") as f:
    int_cert = x509.load_pem_x509_certificate(f.read())
    
# Load the user's CSR from file
with open("/Users/kaiyang/Documents/kyc/Certificate/csr.pem", "rb") as f:
    user_csr = x509.load_pem_x509_csr(f.read())

# Issue the user's certificate
user_cert = x509.CertificateBuilder().subject_name(
    user_csr.subject
).issuer_name(
    int_cert.subject
).public_key(
    user_csr.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.datetime.now(datetime.timezone.utc)
).not_valid_after(
    datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)  # Certificate validity period: 1 year
).add_extension(
    x509.BasicConstraints(ca=False, path_length=None),
    critical=True,
).add_extension(
    x509.KeyUsage(
        digital_signature=True,
        key_encipherment=True,
        content_commitment=False,
        data_encipherment=False,
        key_agreement=False,
        key_cert_sign=False,
        crl_sign=False,
        encipher_only=False,
        decipher_only=False,
    ),
    critical=True,
).add_extension(
    x509.SubjectAlternativeName([
        x509.DNSName("user.example.com"),
    ]),
    critical=False,
).add_extension(
    x509.AuthorityKeyIdentifier.from_issuer_subject_key_identifier(
        int_cert.extensions.get_extension_for_class(x509.SubjectKeyIdentifier).value
    ),
    critical=False,
).sign(int_key, hashes.SHA256())

# Save the user's certificate to file
with open("/Users/kaiyang/Documents/kyc/Certificate/user_cert.pem", "wb") as f:
    f.write(user_cert.public_bytes(serialization.Encoding.PEM))
print("Certificate has been generated")
