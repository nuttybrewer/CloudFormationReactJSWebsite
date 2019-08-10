const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/oauth/cognito/authorize', { target: 'http://localhost:4000/' }));
  app.use(proxy('/oauth/cognito/access_token', { target: 'http://localhost:4000/' }));
  app.use(proxy('/oauth/github/authorize', { target: 'http://localhost:4000/' }));
  app.use(proxy('/oauth/github/access_token', { target: 'http://localhost:4000/' }));
};
