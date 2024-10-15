# zkKYC and zkCBPR Simulation

This README provides detailed steps to set up and simulate zkKYC and zkCBPR using Foundry, Anvil, and Node.js.

## Foundry

**Foundry is a blazing fast, portable, and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat, and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions, and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache or Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose Solidity REPL.

## Documentation

For detailed documentation, please refer to: https://book.getfoundry.sh/

---

## Running zkKYC and zkCBPR

### Update File Paths

Before proceeding, update the file paths in the following files:

- `test/intermediate_Verification.sh`
- `test/update_transaction.js`
- `all the python file in Certificate folder`
- `Merkle_tree/merkleTree.js`

for example:
Replace the `....` in the path 
```shell
/..../Certificate/root_key.pem
```
with your actual file directory where files are stored.
```shell
/User/your_root/Documents/Certificate/root_key.pem
```
## Install Foundry
### To download and install Foundry, follow these steps:
```shell
# Download and install Foundry
$ curl -L https://foundry.paradigm.xyz | bash

# Set up Foundry in your environment
$ foundryup
```
This will install Foundry and all the necessary components such as Forge, Cast, Anvil, and Chisel.

## Build the Project
### In the project directory, build the project using the following command:
```shell
# Build the project using Forge
$ forge build
```
This command compiles your Solidity contracts and prepares the environment for testing and deployment.

## Start Anvil
### Anvil is the local Ethereum node provided by Foundry. To start Anvil, run:
```shell
# Start Anvil, the local Ethereum blockchain simulator
$ anvil
```
## Deploy Smart Contracts
### Deploy MerkleTreeWithDID Contract
In a new terminal window (while keeping Anvil running), deploy the MerkleTreeWithDID contract:
```shell
# Deploy the MerkleTreeWithDID contract
$ forge script script/DeployMerkleTreeWithDID.s.sol --rpc-url <your_rpc_url> --private-key <your_private_key>
```
Replace <your_rpc_url> with the actual RPC URL from your Anvil or Ethereum network, and replace <your_private_key> with the private key of your wallet.
After deploying the MerkleTreeWithDID, deploy the CBPRPaymentSystem contract using:
```shell
# Deploy the CBPRPaymentSystem contract
$ forge script script/CBPRPaymentSystem.s.sol --rpc-url <your_rpc_url> --private-key <your_private_key>
```
This will deploy the CBPR payment system contract, allowing it to interact with zkKYC and zkCBPR processes.

## Update server.js
### In the server.js file, update the following:
- Contract Addresses: Replace the placeholder addresses with the actual contract addresses you obtained from the previous deployment steps.
- Private Key: Replace the placeholder private key with your anvil wallet private key.
- File Paths: Update any paths in the file from /..../ to your local machine's root directory structure.

## Start the Server
Now that the contracts are deployed and the server is set up, start the server by running:
```shell
# Start the local server
$ node server.js
```
This will start the server that communicates with your smart contracts and zkKYC/zkCBPR systems.

## Launch the Application
Once the server is running, open the app.html file in your browser to begin interacting with the zkKYC and zkCBPR processes.
