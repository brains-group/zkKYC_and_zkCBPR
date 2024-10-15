#!/bin/bash

# Set script to exit on any errors.
set -e

# Define variables
CIRCUIT_NAME="Verifier"
PTAU_FILE="pot18_final.ptau"  # Increased power from 12 to 18
ZKEY_FILE="${CIRCUIT_NAME}_final.zkey"
INPUT_FILE="input.json"
WASM_DIR="${CIRCUIT_NAME}_js"

# Step 1: Compile the circuit
echo "Compiling the circuit..."
circom ${CIRCUIT_NAME}.circom --r1cs --wasm --sym

# Step 2: Powers of Tau ceremony
echo "Running Powers of Tau ceremony..."
snarkjs powersoftau new bn128 15 pot18_0000.ptau -v
snarkjs powersoftau contribute pot18_0000.ptau pot18_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot18_0001.ptau ${PTAU_FILE} -v

# Step 3: Generate proving and verification keys
echo "Setting up the circuit..."
snarkjs groth16 setup ${CIRCUIT_NAME}.r1cs ${PTAU_FILE} ${CIRCUIT_NAME}_0000.zkey
snarkjs zkey contribute ${CIRCUIT_NAME}_0000.zkey ${ZKEY_FILE} --name="Second contribution" -v
snarkjs zkey export verificationkey ${ZKEY_FILE} verification_key.json

# Step 4: Create a witness
echo "Calculating witness..."
snarkjs wtns calculate ${WASM_DIR}/${CIRCUIT_NAME}.wasm ${INPUT_FILE} witness.wtns

# Step 5: Generate proof
echo "Generating proof..."
snarkjs groth16 prove ${ZKEY_FILE} witness.wtns proof.json public.json

# Step 6: Verify the proof
echo "Verifying proof..."
snarkjs groth16 verify verification_key.json public.json proof.json

# Export Solidity verifier (comment out if not needed)
# echo "Exporting Solidity verifier..."
# snarkjs zkey export solidityverifier ${ZKEY_FILE} Verifier.sol

echo "All steps completed successfully!"
