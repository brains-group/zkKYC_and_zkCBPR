import datetime
from cryptography import x509
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID

# Generate the root CA's private key
root_key = ec.generate_private_key(ec.SECP256R1())

# Root CA information
root_subject = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "NY"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, "NYC"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "NY Supreme Court"),
    x509.NameAttribute(NameOID.COMMON_NAME, "Government Root NY State"),
])

# Create the root CA certificate
root_cert = x509.CertificateBuilder().subject_name(
    root_subject
).issuer_name(
    root_subject
).public_key(
    root_key.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.datetime.now(datetime.timezone.utc)
).not_valid_after(
    datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650)  # Certificate validity period: 10 years
).add_extension(
    x509.BasicConstraints(ca=True, path_length=None),
    critical=True,
).add_extension(
    x509.KeyUsage(
        digital_signature=True,
        key_cert_sign=True,
        crl_sign=True,
        content_commitment=False,
        key_encipherment=False,
        data_encipherment=False,
        key_agreement=False,
        encipher_only=False,
        decipher_only=False,
    ),
    critical=True,
).add_extension(
    x509.SubjectKeyIdentifier.from_public_key(root_key.public_key()),
    critical=False,
).sign(root_key, hashes.SHA256())

# Save the root CA's private key and certificate to files
with open("/Users/kaiyang/Documents/kyc/Certificate/root_key.pem", "wb") as f:
    f.write(root_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(), 
    ))

with open("/Users/kaiyang/Documents/kyc/Certificate/root_cert.pem", "wb") as f:
    f.write(root_cert.public_bytes(serialization.Encoding.PEM))

print("Root CA certificate and private key have been generated and saved to root_key.pem and root_cert.pem")
