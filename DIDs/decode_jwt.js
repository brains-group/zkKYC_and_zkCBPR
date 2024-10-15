const didJWT = require('did-jwt');

// decode JWT
async function decodeDidJWT(jwt) {
  const decoded = didJWT.decodeJWT(jwt);
  console.log(decoded);
  return decoded;
}

module.exports = { decodeDidJWT };
