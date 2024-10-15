const fs = require('fs');
const readline = require('readline');
const { buildEddsa } = require("circomlibjs");
const buildBabyjub = require("circomlibjs").buildBabyjub;
const path = require('path');


async function main() {
  const eddsa = await buildEddsa();
  const babyJub = await buildBabyjub();
  const F = babyJub.F;

  //generate a private key for debtor bank
  const privateKey = Buffer.alloc(32, Math.random() * 256).toString('hex');


  const publicKey = eddsa.prv2pub(privateKey);
  const Ax = F.toObject(publicKey[0]);
  const Ay = F.toObject(publicKey[1]);

  console.log(`Public Key Ax: ${Ax}`);
  console.log(`Public Key Ay: ${Ay}`);

  // Interactive input for transaction amount and total asset value
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Enter transaction amount: ", (amount) => {
    rl.question("Enter total asset value: ", (total_asset) => {

      const msg = BigInt(amount);
      const msgF = eddsa.babyJub.F.e(msg);
      const signature = eddsa.signMiMCSponge(privateKey, msgF);

      const R8x = F.toObject(signature.R8[0]);
      const R8y = F.toObject(signature.R8[1]);
      const S = signature.S;

      // Create input JSON object
      const input = {
        enabled: '1',  // Assuming enabled is always 1
        debtor_Ax: Ax.toString(),
        debtor_Ay: Ay.toString(),
        debtor_S: S.toString(),
        debtor_R8x: R8x.toString(),
        debtor_R8y: R8y.toString(),
        transaction_amount: amount.toString(),
        total_asset: total_asset.toString()
      };

      // Write the input JSON object to a file
    const filePath = path.join('/..../Circuits/Debtor_Bank_zkp', 'input.json');
    fs.writeFileSync(filePath, JSON.stringify(input, null, 2));

      rl.close();
    });
  });
}

main();
