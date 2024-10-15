const didJWT = require('did-jwt');
const { getResolver } = require('./kyc_did_resolver');
const { Resolver } = require('did-resolver');

// verify JWT
async function verifyDidJWT(jwt) {
    try {
        const decoded = didJWT.decodeJWT(jwt);
        const audience = decoded.payload.aud;

        // Create resolver with KYC resolver
        const resolver = new Resolver(getResolver());

        // Verify the JWT
        const verificationResponse = await didJWT.verifyJWT(jwt, {
            resolver,
            audience: audience
        });

        console.log(verificationResponse);
        return verificationResponse;
    } catch (error) {
        console.error('Verification failed:', error.message);
        throw error;
    }
}

module.exports = { verifyDidJWT };
