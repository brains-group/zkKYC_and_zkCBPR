const express = require('express');
const { ethers } = require('ethers');
const { formatEther } = require('ethers');
const { parseEther } = require('ethers')
const { exec } = require('child_process');
const fs = require('fs');
const { createDidJWT } = require('./DIDs/create_jwt'); 
const MerkleTreeWithDID = require('./ContractABI/MerkleTreeWithDID.json');
const TransferFundsContractABI =require('./ContractABI/CBPRPaymentSystem.json');
const { sign } = require('crypto');
const app = express();
app.use(express.json()); 

// Serve static files like app.html
app.use(express.static(__dirname));

// conect Anvil 
const provider = new ethers.JsonRpcProvider('local host');
const CAprivateKey = 'Your Fist CA private key'; // CA private key
const caWallet = new ethers.Wallet(CAprivateKey, provider);

const intermediateprivateKey = ' private key for IE'; 
const intermediateWallet = new ethers.Wallet(intermediateprivateKey, provider); // Intermediate wallet (address 1)

const debtorprivateKey = 'private key for debtor bank'; 
const debtorWallet = new ethers.Wallet(debtorprivateKey, provider); 

const intermediarybankprivateKey = 'private keyfor Intermediary bank'; 
const intermeediarybankWallet = new ethers.Wallet(intermediarybankprivateKey, provider); 

const creditorbankprivateKey = 'Private key for creditor bank'; 
const creditorbankWallet = new ethers.Wallet(creditorbankprivateKey, provider); 

const merkleContractAddress =  'Contract address'; // Address of the MerkleTreeWithDID Contract
const contractCA = new ethers.Contract(merkleContractAddress, MerkleTreeWithDID.abi, caWallet);
const contractIntermediate = new ethers.Contract(merkleContractAddress, MerkleTreeWithDID.abi, intermediateWallet);

const transferContractAddress = 'Contract address'; // Address of the TransferFunds contract
const debtorContract = new ethers.Contract(transferContractAddress, TransferFundsContractABI.abi, debtorWallet); // Transfer contract (Intermediate wallet)
const intermediarybankContract = new ethers.Contract(transferContractAddress, TransferFundsContractABI.abi, intermeediarybankWallet); // Transfer contract (Intermediate wallet)
const creditorbankContract = new ethers.Contract(transferContractAddress, TransferFundsContractABI.abi, creditorbankWallet); // Transfer contract (Intermediate wallet)



app.post('/generate-did', async (req, res) => {
  const { realName, realID, additionalInfo } = req.body;
  try {
    const did = await createDidJWT(realName, realID, additionalInfo);
    res.json({ did });
  } catch (error) {
    console.error('fail', error);
    res.status(500).json({ error: 'fail' });
  }
});

app.post('/register-did', async (req, res) => {
  const { did } = req.body;
  try {
    const tx = await contractCA.registerDID(did);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('fail', error);
    res.status(500).json({ error: 'fail' });
  }
});

app.post('/add-intermediate', async (req, res) => {
  const { intermediateAddress } = req.body; 
  try {
    const tx = await contractCA.addIntermediate(intermediateAddress);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('fail:', error);
    res.status(500).json({ error: 'fail' });
  }
});

const csrScriptPath = '/..../Certificate/CSR.py';
app.post('/generate-csr', (req, res) => {
  const { debtor_DID, debtor_bank, debtor_wallet_addresses, transaction_wallet_address, creditor_bank } = req.body;
  // Full path to the csr.pem file
  const csrFilePath = '/..../Certificate/csr.pem';
  // Construct the command with the full path to CSR.py and the necessary arguments
  const command = `python3 "${csrScriptPath}" "${debtor_DID}" "${debtor_bank}" "${debtor_wallet_addresses}" "${transaction_wallet_address}" "${creditor_bank}"`;
  // Execute the Python script
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating CSR: ${error.message}`);
      return res.status(500).json({ error: 'Failed to generate CSR' });
    }
    // Return the file path to the front-end
    res.json({ message: 'CSR generated successfully', filePath: csrFilePath });
  });
});

app.post('/decode-csr', (req, res) => {
  const csrFilePath = '/..../Certificate/csr.pem'; // CSR file path
  const decodeCsrScriptPath = '/..../Certificate/Decode_CSR.py'; // Decode_CSR.py 
  const command = `python "${decodeCsrScriptPath}" "${csrFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`fail: ${error.message}`);
      return res.status(500).json({ error: 'fal' });
    }
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);

    try {
      const decodedInfo = JSON.parse(stdout); 
      res.json({ decodedInfo });
    } catch (parseError) {
      console.error('fail:', parseError);
      res.status(500).json({ error: 'fail' });
    }
  });
});

app.post('/sign-csr', (req, res) => {
  const csrPath = req.body.csrPath || '/..../Certificate/csr.pem'; // CSR 
  const signCsrScriptPath = '/..../Certificate/Sign_CSR.py';

  const command = `python3 "${signCsrScriptPath}" "${csrPath}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`fail: ${error.message}`);
      return res.status(500).json({ error: 'fail' });
    }

    console.log("Signing sucess", stdout);
    res.json({ signedCSR: stdout });
  });
});

app.post('/generate-merkle-root', (req, res) => {
  // Path to the merkleTree.js script
  const merkleScriptPath = '/..../Merkle_tree/merkleTree.js';

  // Execute the script to generate the Merkle Tree root and circuit input
  exec(`node ${merkleScriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating Merkle tree: ${error.message}`);
      return res.status(500).json({ error: 'Failed to generate Merkle tree root' });
    }

    // Read the Merkle root from the saved file
    const rootFilePath = '/..../Circuits/zkMerkleTree/merkleRoot.json';
    const merkleRootData = JSON.parse(fs.readFileSync(rootFilePath, 'utf-8'));

    res.json({ merkleRoot: merkleRootData.merkleRoot }); // Send the root back to the frontend
  });
});

// Backend route to update Merkle Tree root based on DID and new root
app.post('/update-merkle-root', async (req, res) => {
  const { did, newMerkleRoot } = req.body;

  try {
    // Call smart contract to update the root
    const tx = await contractIntermediate.updateMerkleRoot(did, newMerkleRoot);  // Pass DID and new root
    await tx.wait();

    console.log(`Merkle Tree Root for DID ${did} updated to: ${newMerkleRoot}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    console.error(`Error updating Merkle Tree root for DID ${did}: ${error.message}`);
    res.status(500).json({ error: 'Failed to update Merkle Tree root' });
  }
});

app.post('/get-merkle-root', async (req, res) => {
  const { did } = req.body; // Get DID from the request body

  try {
    // Call the smart contract to get the Merkle Root for the given DID
    const merkleRoot = await contractIntermediate.getMerkleRoot(did);
    console.log(`Merkle Root for DID ${did}: ${merkleRoot}`);
    
    // Send Merkle Root back to the frontend
    res.json({ success: true, merkleRoot });
  } catch (error) {
    console.error(`Error fetching Merkle Root for DID ${did}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch Merkle Root' });
  }
});

// Get Debtor Bank Balance
app.get('/get-debtor-balance', async (req, res) => {
  try {
    const balance = await provider.getBalance(debtorWallet.address);
    console.log('Raw Balance (in Wei):', balance.toString());

    // Use formatEther directly (if using ethers v6)
    const formattedBalance = formatEther(balance);
    console.log('Formatted Balance (in Ether):', formattedBalance);

    res.json({ balance: formattedBalance });
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get Intermediary Bank Balance
app.get('/get-intermediary-balance', async (req, res) => {
  try {
    const balance = await provider.getBalance(intermeediarybankWallet.address);
    console.log('Raw Balance (in Wei):', balance.toString());

    // Use formatEther directly (if using ethers v6)
    const formattedBalance = formatEther(balance);
    console.log('Formatted Balance (in Ether):', formattedBalance);

    res.json({ balance: formattedBalance });
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get Creditor Bank Balance
app.get('/get-creditor-balance', async (req, res) => {
  try {
    const balance = await provider.getBalance(creditorbankWallet.address);
    console.log('Raw Balance (in Wei):', balance.toString());

    // Use formatEther directly (if using ethers v6)
    const formattedBalance = formatEther(balance);
    console.log('Formatted Balance (in Ether):', formattedBalance);

    res.json({ balance: formattedBalance });
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.post('/generate-zkp', (req, res) => {
  const { transactionAmount, totalAsset, privateKey } = req.body;

  // Log the inputs for debugging purposes
  console.log(`ZKP generation started with Transaction Amount: ${transactionAmount}, Total Asset: ${totalAsset}, Private Key: ${privateKey}`);

  // Simulate a delay for ZKP generation
  // Send an immediate response
  res.json({ message: 'The ceremony contribution will take 5-7 minutes. The proof already exists.' });

  // Here you would trigger the actual ZKP generation logic
  // Example: Simulate actual computation with a delay
  setTimeout(() => {
    console.log('ZKP generated successfully.');
  }, 300000); // Simulate 5 minutes delay (5 minutes = 300,000ms)
});

app.post('/debtor-transfer', async (req, res) => {
  const { recipientBankAddress, paymentAmount, note } = req.body;

  try {
    // Convert ETH to Wei
    const amountInWei = parseEther(paymentAmount);

    // Initiate the payment with the amount in Wei
    const tx = await debtorContract.initiatePayment(recipientBankAddress, note, {
      value: amountInWei
    });

    await tx.wait();

    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('Error initiating transfer:', error.message);
    res.status(500).json({ error: 'Failed to initiate transfer' });
  }
});

app.post('/intermediary-transfer', async (req, res) => {
  const { recipientBankAddress, paymentAmount, note } = req.body;

  try {
    // Convert ETH to Wei
    const amountInWei = parseEther(paymentAmount);

    // Initiate the payment with the amount in Wei
    const tx = await intermediarybankContract.initiatePayment(recipientBankAddress, note, {
      value: amountInWei
    });

    await tx.wait();

    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('Error initiating transfer:', error.message);
    res.status(500).json({ error: 'Failed to initiate transfer' });
  }
});

const filePaths = [
  "/..../Circuits/Debtor_Bank_zkp/verification_key.json",
  "/..../Circuits/Debtor_Bank_zkp/public.json",
  "/..../Circuits/Debtor_Bank_zkp/proof.json",
  "/..../Circuits/zkMerkleTree/verification_key.json",
  "/..../Circuits/zkMerkleTree/public.json",
  "/..../Circuits/zkMerkleTree/proof.json",
  "/..../Certificate/VerifyCer.py"
];

// Check if all files exist
app.post('/check-files', (req, res) => {
  let missingFiles = [];
  
  filePaths.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      missingFiles.push(filePath);
    }
  });

  if (missingFiles.length === 0) {
    res.json({ success: true });
  } else {
    res.json({ success: false, missingFiles });
  }
});

app.post('/verify-proofs', (req, res) => {
  const scriptPath = '/..../test/Intermediate_Verification.sh';  // Path to your shell script

  exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error verifying proofs: ${stderr}`);
          return res.status(500).json({ message: 'Verification failed' });
      }
      console.log(`Verification output: ${stdout}`);
      res.json({ message: 'All proofs and certificate verified successfully!' });
  });
});


// Endpoint to create a JSON file with the transaction data
app.post('/create-transaction', (req, res) => {
  console.log("Received request body:", req.body);
  
  const { did_debtor, transactionAmount, finishedDate, d_bank, c_bank } = req.body;

  if (!did_debtor || !transactionAmount || !finishedDate || !d_bank || !c_bank) {
    console.log("Missing fields in request");
    return res.status(400).json({ error: 'All fields are required' });
  }


  const transactionData = {
    "DID": did_debtor,
    "Transaction Amount": transactionAmount,
    "Finished_Date": finishedDate,
    "Debtor_Bank": d_bank,
    "Creditor_Bank": c_bank
  };

  fs.writeFile('/..../Merkle_tree/CBPRtransaction.json', JSON.stringify(transactionData, null, 4), 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
      return res.status(500).json({ error: 'Failed to create JSON file' });
    }
    
    console.log('Transaction JSON file created successfully.');
    res.json({ message: 'Transaction JSON file created successfully.' });
  });
});


const cbprPath = '/..../Merkle_tree/CBPRtransaction.json';
const transactionsPath = '/..../Merkle_tree/transactions.json';

app.post('/update-transaction', (req, res) => {
    // Read the CBPRtransaction.json
    fs.readFile(cbprPath, 'utf8', (err, cbprData) => {
        if (err) {
            console.error('Error reading CBPRtransaction.json:', err);
            return res.status(500).json({ error: 'Failed to read CBPRtransaction.json' });
        }

        let newTransaction;
        try {
            newTransaction = JSON.parse(cbprData);
        } catch (err) {
            console.error('Error parsing CBPRtransaction.json:', err);
            return res.status(500).json({ error: 'Failed to parse CBPRtransaction.json' });
        }

        // Read the transactions.json
        fs.readFile(transactionsPath, 'utf8', (err, transactionsData) => {
            if (err) {
                console.error('Error reading transactions.json:', err);
                return res.status(500).json({ error: 'Failed to read transactions.json' });
            }

            let transactions;
            try {
                transactions = JSON.parse(transactionsData);
            } catch (err) {
                console.error('Error parsing transactions.json:', err);
                return res.status(500).json({ error: 'Failed to parse transactions.json' });
            }

            // Add the new transaction to the transactions array
            transactions.push(newTransaction);

            // Write the updated transactions back to transactions.json
            fs.writeFile(transactionsPath, JSON.stringify(transactions, null, 4), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing to transactions.json:', err);
                    return res.status(500).json({ error: 'Failed to update transactions.json' });
                }

                console.log('Transaction updated successfully.');
                res.json({ message: 'Transaction updated successfully.' });
            });
        });
    });
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is runing on: ${PORT}`);
});
