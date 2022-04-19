const request = require('request-promise-native');
const NodeCache = require('node-cache');


const refreshTokenStore = {};
const accessTokenCache = new NodeCache({ deleteOnExpire: true });
const CLIENT_ID = "e8ab04bd-dac5-4f4e-9d81-be34a8865fb0";
const CLIENT_SECRET ="292f97a2-b4c3-44cd-8bc7-e8ae3730c19d";
const REDIRECT_URI = `https://migration.niswey.net/vipul/auth`;


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