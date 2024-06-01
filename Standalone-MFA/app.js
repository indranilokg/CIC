const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
var fs = require('fs');
var jose = require('node-jose');
const dotenv = require('dotenv');

var isAuthenticated = false;
var authenticatedUser = null;
var oobCode = null;
var mfaToken = null;


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

app.use(express.urlencoded({extended:true}));

dotenv.config();

router.get('/',function(req,res){
  console.log(isAuthenticated ? 'Logged in' : 'Logged out');
  res.render('index.html');
});

router.get('/profile', async function(req,res){
  res.render('profile.html', {authenticatedUser});
});

router.get('/mfa', async function(req,res){
  res.render('mfa.html');
});


router.post('/loginNative', async function(req,res){
  console.log(req.body);
  const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  console.log(users);
  const authuser = users.filter((user) => user.username === req.body.username);
  if (authuser.length == 0){
    res.status(401).send("Username not found");
  }
  else if (authuser[0].password !== req.body.password){
    res.status(401).send("Invalid credential");
  } else{
    isAuthenticated = true;
    authenticatedUser = {"username": authuser[0].username, "email": authuser[0].username, firstname: "Demo", lastname: "User"};

    const ks = fs.readFileSync('keys.json')
    const keyStore = await jose.JWK.asKeyStore(ks.toString())

    const [key] = keyStore.all({ use: "sig" });
    const opt = { compact: true, jwk: key, fields: { typ: "jwt" } };

    var claims = JSON.stringify({
      username: authuser[0].username,
    });

    const authToken= await jose.JWS.createSign(opt, key).update(claims).final();
    console.log(authToken);
    
    let data = qs.stringify({
      'grant_type': 'http://auth0.com/oauth/grant-type/password-realm',
      'scope': 'openid offline_access',
      'client_id': process.env.clientId,
      'client_secret': process.env.clientSecret,
      'username': req.body.username,
      'password': authToken,
      'realm': process.env.connection 
    });

    let config = {
      method: 'post',
      url: process.env.tokenUrl,
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/x-www-form-urlencoded', 
      },
      data : data
    };

    axios.request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      if ((error.response.status == 403) && (error.response.data.error == 'mfa_required')){
        console.log(error.response.data.mfa_token);
        mfaToken = error.response.data.mfa_token;
        let data2 = JSON.stringify({
          "client_id": process.env.clientId,
          "client_secret": process.env.clientSecret,
          "challenge_type": "oob",
          "mfa_token": mfaToken,
          "authenticator_id": process.env.authenticatorId
        });
        
        let config2 = {
          method: 'post',
          url: process.env.mfaUrl,
          headers: { 
            'Accept': 'application/json', 
            'Content-Type': 'application/json', 
          },
          data : data2
        };
        
        axios.request(config2)
        .then((response2) => {
          console.log(JSON.stringify(response2.data));
          oobCode = response2.data.oob_code;
          res.redirect("/mfa");
        })
        .catch((error2) => {
          console.log(error2);
        });
      }else{
        console.log(error);
      }
    });
  }
});

router.post('/mfaVerify', async function(req,res){
  console.log(req.body);
  
  const otp = req.body.otp;

  let data = qs.stringify({
    'grant_type': 'http://auth0.com/oauth/grant-type/mfa-oob',
    'mfa_token': mfaToken,
    'oob_code': oobCode,
    'binding_code': otp,
    'client_id': process.env.clientId,
    'client_secret': process.env.clientSecret 
  });

  let config = {
    method: 'post',
    url: process.env.tokenUrl,
    headers: { 
      'Accept': 'application/json', 
      'Content-Type': 'application/x-www-form-urlencoded', 
    },
    data : data
  };

  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
    authenticatedUser.access_token = response.data.access_token;
    authenticatedUser.id_token = response.data.id_token;
    res.redirect("/profile");
  })
  .catch((error) => {
    console.log(error);
  });
  
});

//add the router
app.use('/', router);
app.listen(process.env.port || 3000);

console.log('Running at Port 3000');

