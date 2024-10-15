import datetime
from cryptography import x509
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID

# Load the root CA's private key and certificate from files
with open("/..../Certificate/root_key.pem", "rb") as f:
    root_key = serialization.load_pem_private_key(f.read(), password=None)

with open("/..../Certificate/root_cert.pem", "rb") as f:
    root_cert = x509.load_pem_x509_certificate(f.read())

# Generate the intermediate CA's private key
int_key = ec.generate_private_key(ec.SECP256R1())

# Intermediate CA information
int_subject = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "NY"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, "NYC"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Bank Of America"),
    x509.NameAttribute(NameOID.COMMON_NAME, "Government Intermediate BOA"),
])

# Create the intermediate CA certificate
int_cert = x509.CertificateBuilder().subject_name(
    int_subject
).issuer_name(
    root_cert.subject
).public_key(
    int_key.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.datetime.now(datetime.timezone.utc)
).not_valid_after(
    datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1095)  # Certificate validity period: 3 years
).add_extension(
    x509.BasicConstraints(ca=True, path_length=0),
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
    x509.SubjectKeyIdentifier.from_public_key(int_key.public_key()),
    critical=False,
).add_extension(
    x509.AuthorityKeyIdentifier.from_issuer_subject_key_identifier(
        root_cert.extensions.get_extension_for_class(x509.SubjectKeyIdentifier).value
    ),
    critical=False,
).sign(root_key, hashes.SHA256())

# Save the intermediate CA's private key and certificate to files
with open("/..../Certificate/int_key.pem", "wb") as f:
    f.write(int_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),  # Encryption should be used in production environments
    ))

with open("/..../Certificate/int_cert.pem", "wb") as f:
    f.write(int_cert.public_bytes(serialization.Encoding.PEM))

print("Intermediate CA certificate and private key have been generated and saved to int_key.pem and int_cert.pem")
