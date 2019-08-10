var express = require('express');
var router = express.Router();
const jsonwebtoken = require('jsonwebtoken');

const oauth_provider = {
  "cognito": "sessiontoken",
  "github": "githubtoken"
}

// Cognito Provider
/* GET Oauth token. */
router.get('/cognito/authorize', function(req, res, next) {
  res.render('oauth', { title: 'Token', action: '/oauth/cognito/access_token', provider: 'cognito' });
});

/* Return OAuth token */
router.post('/cognito/access_token', function(req, res, next) {
  var token = req.body.token;
  if(!token) {
    var payload = { iat: Math.floor(Date.now() / 1000 ), exp: Math.floor(Date.now()/1000) + 3600, token_use: "access" };
    token = jsonwebtoken.sign(payload, "secret");
  }
  res.redirect('/?' + oauth_provider[req.body.provider] + "=" + token);
});


// Github Provider
/* GET Oauth token. */
router.get('/github/authorize', function(req, res, next) {
  res.render('oauth', { title: 'Token', action: '/oauth/github/access_token', provider: 'github' });
});

/* Return OAuth token */
router.post('/github/access_token', function(req, res, next) {
  res.redirect('/?' + oauth_provider[req.body.provider] + "=" + req.body.token);
});
module.exports = router;
