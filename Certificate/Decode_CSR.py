import json
from cryptography import x509
from cryptography.hazmat.backends import default_backend

# 加载 CSR 文件
csr_file = "/Users/kaiyang/Documents/kyc/Certificate/csr.pem"

with open(csr_file, "rb") as f:
    csr_data = f.read()

# 解析 CSR
csr = x509.load_pem_x509_csr(csr_data, default_backend())

# 准备存储解码信息的字典
decoded_info = {}

# 提取 subject 名字
decoded_info['subject'] = {attr.oid._name: attr.value for attr in csr.subject}

# 提取扩展信息
decoded_info['extensions'] = []
for extension in csr.extensions:
    decoded_info['extensions'].append(str(extension.value))

# 输出 JSON 格式
print(json.dumps(decoded_info))
