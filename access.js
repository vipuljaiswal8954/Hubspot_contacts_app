const request = require('request-promise-native');
const NodeCache = require('node-cache');


const refreshTokenStore = {};
const accessTokenCache = new NodeCache({ deleteOnExpire: true });
const CLIENT_ID = "07f94d35-172a-4c67-b274-d9d39335d1a6";
const CLIENT_SECRET ="1083637c-98ab-45ec-9302-4d2c51e2577b";
const REDIRECT_URI = `http://localhost:3000/auth`;


const exchangeForTokens = async (userId,code) => {
    const exchangeProof = {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      };
    try {
      const responseBody = await request.post('https://api.hubapi.com/oauth/v1/token', {
        form: exchangeProof
      });
      const tokens = JSON.parse(responseBody);
      console.log(JSON.parse(responseBody));
      
      refreshTokenStore[userId] = tokens.refresh_token;
      accessTokenCache.set(userId, tokens.access_token, Math.round(tokens.expires_in * 0.75));
  
      console.log('       > Received an access token and refresh token');
      return tokens.access_token;
    } catch (e) {
      console.error(`       > Error exchanging ${exchangeProof.grant_type} for access token`);
      return JSON.parse(e.response.body);
    }
  };
  
  const refreshAccessToken = async (userId) => {
    const refreshTokenProof = {
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      refresh_token: refreshTokenStore[userId]
    };
    return await exchangeForTokens(userId, refreshTokenProof);
  };
  
  
  const getAccessToken = async (userId) => {
  
    if (!accessTokenCache.get(userId)) {
      console.log('Refreshing expired access token');
      await refreshAccessToken(userId);
    }
    
    return accessTokenCache.get(userId);
  };
  
  
  const isAuthorized = (userId) => {
    return refreshTokenStore[userId] ? true : false;
  };

module.exports={
    getAccessToken:getAccessToken,
    isAuthorized:isAuthorized,
    exchangeForTokens:exchangeForTokens
}