#!/bin/bash

# Paths for Debtor Bank Signature ZKP
debtor_vk_path="/..../Circuits/Debtor_Bank_zkp/verification_key.json"
debtor_public_path="/..../Circuits/Debtor_Bank_zkp/public.json"
debtor_proof_path="/..../Circuits/Debtor_Bank_zkp/proof.json"

# Paths for ZKMerkleTree ZKP
zkmt_vk_path="/..../Circuits/zkMerkleTree/verification_key.json"
zkmt_public_path="/..../Circuits/zkMerkleTree/public.json"
zkmt_proof_path="/..../Circuits/zkMerkleTree/proof.json"

# Python script path for certificate verification
python_cert_script="/..../Certificate/VerifyCer.py"

# Function to verify ZKP using snarkjs
verify_zkp() {
    local vk=$1
    local public=$2
    local proof=$3

    snarkjs groth16 verify "$vk" "$public" "$proof"
    if [ $? -eq 0 ]; then
        echo "ZKP Verification Passed"
        echo " "
    else
        echo "ZKP Verification Failed"
        exit 1
    fi
}

# Verify Debtor Bank Signature ZKP
echo "Verifying Debtor Bank Signature ZKP..."
verify_zkp "$debtor_vk_path" "$debtor_public_path" "$debtor_proof_path"

# Verify ZKMerkleTree ZKP
echo "Verifying ZKMerkleTree ZKP..."
verify_zkp "$zkmt_vk_path" "$zkmt_public_path" "$zkmt_proof_path"

# Verify Certificate Chain using Python script
echo "Verifying Certificate Chain..."
echo 
python /..../Certificate/Decode_CSR.py
echo

python "$python_cert_script"
if [ $? -eq 0 ]; then
    echo "Certificate verification successful!"
else
    echo "Certificate verification failed."
    exit 1
fi

echo "All verifications completed successfully."
