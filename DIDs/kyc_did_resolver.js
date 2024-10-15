const { Resolver } = require('did-resolver');
const didDatabase = new Map();

// Issuer's DID and its corresponding DID document
const issuerDID = 'did:kyc:government'; // Updated to match the correct issuer DID
const publicKeyHex = '04fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea535847946393f8145252eea68afe67e287b3ed9b31685ba6c3b00060a73b9b1242d68f7';
const issuerDidDoc = {
  '@context': 'https://www.w3.org/ns/did/v1',
  id: issuerDID,
  verificationMethod: [{
    id: `${issuerDID}#controller`,
    type: 'EcdsaSecp256k1RecoveryMethod2020',
    controller: issuerDID,
    publicKeyHex: publicKeyHex
  }],
  authentication: [`${issuerDID}#controller`],
  assertionMethod: [`${issuerDID}#controller`]
};

// Add the issuer DID document to the database
didDatabase.set(issuerDID, issuerDidDoc);

function getResolver() {
  async function resolve(did, parsed, didResolver, options) {
    console.log(`Resolving DID: ${did}`);
    console.log('Current DIDs in didDatabase:', [...didDatabase.keys()]);
    
    const didDoc = didDatabase.get(did);
    if (!didDoc) {
      console.error(`DID document for ${did} not found in didDatabase.`);
      throw new Error(`DID document for ${did} not found`);
    }
    console.log(`Found DID document for ${did}`);
    return {
      didResolutionMetadata: { contentType: 'application/did+ld+json' },
      didDocument: didDoc,
      didDocumentMetadata: {}
    };
  }

  // Ensure the resolver handles the `government_kyc` method
  return { 'kyc': resolve };
}

module.exports = { getResolver, didDatabase, issuerDID };



