const didJWT = require('did-jwt');
const { hexToBytes } = require('did-jwt');
const { ec } = require('elliptic');
const crypto = require('crypto'); // New

const EC = new ec('secp256k1');
const { didDatabase } = require('./kyc_did_resolver');

// Government's private key and DID
const privateKey = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f';
const signer = didJWT.ES256KSigner(hexToBytes(privateKey));

const issuerDID = `did:kyc:government`; // Government issuer DID

// Generate public key
const key = EC.keyFromPrivate(privateKey);
const publicKey = key.getPublic('hex');

async function createDidJWT(realName, realID, additionalInfo) {
  // Generate hash based on user information
  const hash = crypto.createHash('sha256').update(`${realName}${realID}${additionalInfo}`).digest('hex');
  const did = `did:kyc:${hash}`;

  if (didDatabase.has(did)) {
    throw new Error(`DID ${did} already exists`);
  }

  const didDoc = {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    verificationMethod: [{
      id: `${did}#controller`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      publicKeyHex: publicKey
    }],
    authentication: [`${did}#controller`],
    assertionMethod: [`${did}#controller`]
  };

  // Store DID document
  didDatabase.set(did, didDoc);

  const jwt = await didJWT.createJWT(
    { aud: did, iat: undefined, realName, realID, additionalInfo },
    { issuer: issuerDID, signer },
    { alg: 'ES256K' }
  );

  return did;
}

module.exports = { createDidJWT };
