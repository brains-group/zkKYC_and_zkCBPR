import json
from cryptography import x509
from cryptography.hazmat.backends import default_backend

csr_file = "/..../Certificate/csr.pem"

with open(csr_file, "rb") as f:
    csr_data = f.read()

csr = x509.load_pem_x509_csr(csr_data, default_backend())

decoded_info = {}

decoded_info['subject'] = {attr.oid._name: attr.value for attr in csr.subject}

decoded_info['extensions'] = []
for extension in csr.extensions:
    decoded_info['extensions'].append(str(extension.value))

print(json.dumps(decoded_info))
