const express = require('express');
const { ethers } = require('ethers');
const { formatEther } = require('ethers');
const { parseEther } = require('ethers')
const { exec } = require('child_process');
const fs = require('fs');
const { createDidJWT } = require('./DIDs/create_jwt'); 
const MerkleTreeWithDID = require('./ContractABI/MerkleTreeWithDID.json'); // 合约 ABI
const TransferFundsContractABI =require('./ContractABI/CBPRPaymentSystem.json')
const app = express();
app.use(express.json()); // 解析 JSON 数据

// Serve static files like app.html
app.use(express.static(__dirname));

// 连接到 Anvil 测试网
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const CAprivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // CA 的私钥
const caWallet = new ethers.Wallet(CAprivateKey, provider);

const intermediateprivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // CA 的私钥
const intermediateWallet = new ethers.Wallet(intermediateprivateKey, provider); // Intermediate wallet (address 1)

const debtorprivateKey = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'; 
const debtorWallet = new ethers.Wallet(debtorprivateKey, provider); 

const intermediarybankprivateKey = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'; 
const intermeediarybankWallet = new ethers.Wallet(intermediarybankprivateKey, provider); 

const creditorbankprivateKey = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'; 
const creditorbankWallet = new ethers.Wallet(creditorbankprivateKey, provider); 

// 设置合约地址
const merkleContractAddress =  '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // 确保在这里输入你部署的合约地址
const contractCA = new ethers.Contract(merkleContractAddress, MerkleTreeWithDID.abi, caWallet);
const contractIntermediate = new ethers.Contract(merkleContractAddress, MerkleTreeWithDID.abi, intermediateWallet);

const transferContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // Address of the TransferFunds contract
const debtorContract = new ethers.Contract(transferContractAddress, TransferFundsContractABI.abi, debtorWallet); // Transfer contract (Intermediate wallet)
const intermediarybankContract = new ethers.Contract(transferContractAddress, TransferFundsContractABI.abi, intermeediarybankWallet); // Transfer contract (Intermediate wallet)
const creditorbankContract = new ethers.Contract(transferContractAddress, TransferFundsContractABI.abi, creditorbankWallet); // Transfer contract (Intermediate wallet)



// 生成 DID 的端点
app.post('/generate-did', async (req, res) => {
  const { realName, realID, additionalInfo } = req.body;
  try {
    // 调用生成 DID 的逻辑
    const did = await createDidJWT(realName, realID, additionalInfo);
    // 将生成的 DID 发送回前端
    res.json({ did });
  } catch (error) {
    console.error('生成 DID 时出错:', error);
    res.status(500).json({ error: '生成 DID 失败' });
  }
});

// 注册 DID 的端点
app.post('/register-did', async (req, res) => {
  const { did } = req.body; // 从请求体中获取 DID
  try {
    // 调用智能合约的 registerDID 方法
    const tx = await contractCA.registerDID(did);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('注册 DID 时出错:', error);
    res.status(500).json({ error: '注册 DID 失败' });
  }
});

// 添加中介的端点
app.post('/add-intermediate', async (req, res) => {
  const { intermediateAddress } = req.body; // 从请求体中获取中介地址
  try {
    // 调用智能合约的 addIntermediate 方法
    const tx = await contractCA.addIntermediate(intermediateAddress);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('添加中介时出错:', error);
    res.status(500).json({ error: '添加中介失败' });
  }
});

const csrScriptPath = '/Users/kaiyang/Documents/kyc/Certificate/CSR.py';
app.post('/generate-csr', (req, res) => {
  const { debtor_DID, debtor_bank, debtor_wallet_addresses, transaction_wallet_address, creditor_bank } = req.body;
  // Full path to the csr.pem file
  const csrFilePath = '/Users/kaiyang/Documents/kyc/Certificate/csr.pem';
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
  const csrFilePath = '/Users/kaiyang/Documents/kyc/Certificate/csr.pem'; // CSR 文件的路径
  const decodeCsrScriptPath = '/Users/kaiyang/Documents/kyc/Certificate/Decode_CSR.py'; // Decode_CSR.py 的路径

  // 确保使用 python3 来执行 Python 脚本
  const command = `python "${decodeCsrScriptPath}" "${csrFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行解码时出错: ${error.message}`);
      return res.status(500).json({ error: '解码 CSR 失败' });
    }

    // 调试：打印 Python 脚本的输出
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);

    // 返回解码后的信息到前端
    try {
      const decodedInfo = JSON.parse(stdout); // 确保 Python 输出是有效的 JSON
      res.json({ decodedInfo });
    } catch (parseError) {
      console.error('解析 JSON 失败:', parseError);
      res.status(500).json({ error: '解析解码后的 CSR 信息失败' });
    }
  });
});

app.post('/sign-csr', (req, res) => {
  const csrPath = req.body.csrPath || '/Users/kaiyang/Documents/kyc/Certificate/csr.pem'; // CSR 文件的路径
  const signCsrScriptPath = '/Users/kaiyang/Documents/kyc/Certificate/Sign_CSR.py'; // 签名脚本路径

  // 执行签名脚本
  const command = `python3 "${signCsrScriptPath}" "${csrPath}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`签名 CSR 时出错: ${error.message}`);
      return res.status(500).json({ error: '签名 CSR 失败' });
    }

    console.log("Signing sucess", stdout);
    res.json({ signedCSR: stdout });
  });
});

app.post('/generate-merkle-root', (req, res) => {
  // Path to the merkleTree.js script
  const merkleScriptPath = '/Users/kaiyang/Documents/kyc/Merkle_tree/merkleTree.js';

  // Execute the script to generate the Merkle Tree root and circuit input
  exec(`node ${merkleScriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating Merkle tree: ${error.message}`);
      return res.status(500).json({ error: 'Failed to generate Merkle tree root' });
    }

    // Read the Merkle root from the saved file
    const rootFilePath = '/Users/kaiyang/Documents/kyc/Circuits/zkMerkleTree/merkleRoot.json';
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
  "/Users/kaiyang/Documents/kyc/Circuits/Debtor_Bank_zkp/verification_key.json",
  "/Users/kaiyang/Documents/kyc/Circuits/Debtor_Bank_zkp/public.json",
  "/Users/kaiyang/Documents/kyc/Circuits/Debtor_Bank_zkp/proof.json",
  "/Users/kaiyang/Documents/kyc/Circuits/zkMerkleTree/verification_key.json",
  "/Users/kaiyang/Documents/kyc/Circuits/zkMerkleTree/public.json",
  "/Users/kaiyang/Documents/kyc/Circuits/zkMerkleTree/proof.json",
  "/Users/kaiyang/Documents/kyc/Certificate/VerifyCer.py"
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
  const scriptPath = '/Users/kaiyang/Documents/kyc/test/Intermediate_Verification.sh';  // Path to your shell script

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

  fs.writeFile('/Users/kaiyang/Documents/kyc/Merkle_tree/CBPRtransaction.json', JSON.stringify(transactionData, null, 4), 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
      return res.status(500).json({ error: 'Failed to create JSON file' });
    }
    
    console.log('Transaction JSON file created successfully.');
    res.json({ message: 'Transaction JSON file created successfully.' });
  });
});


const cbprPath = '/Users/kaiyang/Documents/kyc/Merkle_tree/CBPRtransaction.json';
const transactionsPath = '/Users/kaiyang/Documents/kyc/Merkle_tree/transactions.json';

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
