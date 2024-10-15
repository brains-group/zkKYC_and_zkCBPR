const { buildMimcSponge } = require('circomlibjs');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');


// hash
function calculateHash(mimc, left, right) {
    return mimc.F.toString(mimc.multiHash([left, right]));
}

// root and path
function calculateMerkleRootAndPath(mimc, levels, elements, element) {
    let layers = [];
    layers[0] = elements.slice();

    for (let level = 1; level <= levels; level++) {
        layers[level] = [];
        for (let i = 0; i < Math.ceil(layers[level - 1].length / 2); i++) {
            const left = layers[level - 1][i * 2];
            const right = i * 2 + 1 < layers[level - 1].length ? layers[level - 1][i * 2 + 1] : left;
            layers[level][i] = calculateHash(mimc, left, right);
        }
    }

    const root = layers[levels][0];

    let pathElements = [];
    let pathIndices = [];

    if (element) {
        let index = layers[0].findIndex(e => e === element);
        for (let level = 0; level < levels; level++) {
            pathIndices[level] = (index % 2).toString();
            pathElements[level] = (index ^ 1) < layers[level].length ? layers[level][index ^ 1] : layers[level][index];
            index >>= 1;
        }
    }

    return {
        root,
        pathElements,
        pathIndices,
        levels
    };
}

async function generateMerkleTree(inputs) {
    const mimc = await buildMimcSponge();

    // input to hash value
    const hashedLeaves = inputs.map(input => mimc.F.toString(mimc.multiHash([input.toString()])));

    // calcualte hash and path
    const levels = Math.ceil(Math.log2(hashedLeaves.length)); // level
    const element = hashedLeaves[0]; // set leaf for verify
    const { root, pathElements, pathIndices, levels: treeLevels } = calculateMerkleRootAndPath(mimc, levels, hashedLeaves, element);

    // print
    console.log(`Leaf: ${element}`);
    console.log(`Levels: ${treeLevels}`);
    console.log(`Root: ${root}`);
    console.log(`Path Elements: ${pathElements.join(', ')}`);
    console.log(`Path Indices: ${pathIndices.join(', ')}`);

    return {
        leaf: element,
        pathElements,
        pathIndices,
        root,
        levels: treeLevels
    };
}

(async () => {
    // Read the JSON file containing transaction data
    const transactionFilePath = '/Users/kaiyang/Documents/kyc/Merkle_tree/transactions.json';
    const transactionData = JSON.parse(fs.readFileSync(transactionFilePath, 'utf-8'));

    // Extract and format inputs from the transaction data
    const inputs = transactionData.map(tx => {
        const amount = parseInt(tx["Transaction Amount"], 10);
        const date = new Date(tx["Finished_Date"]);
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        return `${amount}${formattedDate}`;
    });

    console.log('Formatted Inputs:', inputs);

    const { leaf, pathElements, pathIndices, root,levels } = await generateMerkleTree(inputs);

    const circuitInput = {
        nullifier: leaf,
        secret: levels, 
        pathElements,
        pathIndices
    };
    
    const filePath = path.join('/Users/kaiyang/Documents/kyc/Circuits/zkMerkleTree', 'input.json');
    fs.writeFileSync(filePath, JSON.stringify(circuitInput, null, 2));

    console.log(`Circuit input generated and saved to ${filePath}`);

    const rootFilePath = path.join('/Users/kaiyang/Documents/kyc/Circuits/zkMerkleTree', 'merkleRoot.json');
    fs.writeFileSync(rootFilePath, JSON.stringify({ merkleRoot: root }, null, 2));

    console.log(`Merkle root saved to ${rootFilePath}`);

})();
