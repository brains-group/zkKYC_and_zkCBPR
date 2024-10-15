const { createDidJWT } = require('./create_jwt');
const { decodeDidJWT } = require('./decode_jwt');
const { verifyDidJWT } = require('./verify_jwt');
const readline = require('readline');
const { didDatabase } = require('./kyc_did_resolver');

// User input interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    // Input user information
    const realName = await askQuestion('Enter your real name: ');
    const realID = await askQuestion('Enter your real ID: ');
    const additionalInfo = await askQuestion('Enter additional verification information: ');

    rl.close();

    // Create JWT
    const jwt = await createDidJWT(realName, realID, additionalInfo);
    // console.log('Created JWT:', jwt);

    // Decode JWT
    const decoded = await decodeDidJWT(jwt);
    console.log('Decoded JWT:', decoded);

    // Verify JWT
    // const verificationResponse = await verifyDidJWT(jwt);
    // console.log('Verification Response:', verificationResponse);

}

main();

// const { createDidJWT } = require('./create_jwt');
// const { decodeDidJWT } = require('./decode_jwt');
// const { verifyDidJWT } = require('./verify_jwt');
// const readline = require('readline');
// const { didDatabase } = require('./kyc_did_resolver');

// // User input interface
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// function askQuestion(query) {
//     return new Promise(resolve => rl.question(query, resolve));
// }

// async function main() {
//     // Input user information
//     const name = await askQuestion('Enter your name: ');
//     const birthdate = await askQuestion('Enter your birthdate (YYYY-MM-DD): ');

//     rl.close();

//     // Create JWT
//     const jwt = await createDidJWT(name, birthdate);

//     // Decode JWT
//     const decoded = await decodeDidJWT(jwt);
//     // console.log('Decoded JWT:', decoded);

//     // Verify JWT
//     const verificationResponse = await verifyDidJWT(jwt);
//     console.log('Verification Response:', verificationResponse);

//     console.log('Current DIDs in the database:');
//     for (let key of didDatabase.keys()) {
//         console.log(key);
//     }
// }

// main();
