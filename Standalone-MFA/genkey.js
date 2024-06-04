const fs = require('fs');
const jose = require('node-jose');
const keyStore = jose.JWK.createKeyStore();

// Generate and store the private-public key pair
keyStore.generate('RSA', 2048, {alg: 'RS256', use: 'sig' })
.then(result => {
  fs.writeFileSync(
    'keys.json', 
    JSON.stringify(keyStore.toJSON(true), null, '  ')
  );

  fs.writeFileSync(
    'publickey.json', 
    JSON.stringify(keyStore.toJSON(), null, '  ')
  );
})