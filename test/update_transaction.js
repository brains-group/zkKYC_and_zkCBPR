const fs = require('fs');
const path = '/Users/kaiyang/Documents/kyc/Merkle_tree/transactions.json';

// Transaction data to be added
const newTransaction = {
    "DID": "did:kyc:245466ccd1f4c67de35c99d7fdc528bcc636b23aa8b6b6e71af0885908a34896",
    "Transaction Amount": "500",
    "Finished_Date": "2024-10-01",
    "Bank": "Bank A",
    "Creditor_Bank": "Bank B"
};

// Read the existing transactions from the file
fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    
    let transactions;
    try {
        transactions = JSON.parse(data);
    } catch (err) {
        console.error('Error parsing JSON:', err);
        return;
    }

    // Add the new transaction to the array
    transactions.push(newTransaction);

    // Write the updated transactions back to the file
    fs.writeFile(path, JSON.stringify(transactions, null, 4), 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Transaction added successfully.');
    });
});
