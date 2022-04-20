require('dotenv').config();
const express = require('express');
const session = require('express-session');
const res = require('express/lib/response');
const NodeCache = require('node-cache');
const axios=require("axios");

const Access=require("./access.js")
const Contacts=require('./contacts.js')


const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');

const PORT =3000;


const nextCache = new NodeCache({ deleteOnExpire: true });
const prevCache=new NodeCache({deleteOnExpire:true});
const userCache = new NodeCache({ deleteOnExpire: true });


const CLIENT_ID = "e8ab04bd-dac5-4f4e-9d81-be34a8865fb0";
const CLIENT_SECRET ="292f97a2-b4c3-44cd-8bc7-e8ae3730c19d";
const scopes=`crm.objects.contacts.read%20crm.objects.contacts.write`


const REDIRECT_URI = `https://migration.niswey.net/vipul/auth`;

//===========================================================================//

app.use(session({
  secret: Math.random().toString(36).substring(2),
  resave: false,
  saveUninitialized: true
}));
//homepage if not authorised then user will install the app
app.get('/', async (req, res) => {

     
  if (Access.isAuthorized(req.sessionID)) {
    const accessToken = await Access.getAccessToken(req.sessionID);
    const details = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`)
      const user_id = details.data.user
      const portal_id = details.data.hub_id
      

      const userdata = {user_id :user_id, portal_id: portal_id};
      userCache.set(req.sessionID,userdata,18000)
    
    res.render("home",{userdata:userCache.get(req.sessionID)});
    
  } else {
    res.render("install");
  }
  res.end();
});

 
const authUrl =
  `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}`; // where to send the user after the consent page

// Redirect the user from the installation page to
// the authorization URL
app.get('/install', (req, res) => {
  
 
  res.redirect(authUrl);
  
});

//get authorization code from oauth server and then pass it to get access token and refresh token

app.get('/auth', async (req, res) => {
  
  if (req.query.code) {
  
    const token = await Access.exchangeForTokens(req.sessionID, req.query.code);
    if (token.message) {
      return res.redirect(`/vipul/error?msg=${token.message}`);
    }
    res.redirect(`/vipul`);
  }
});



app.get("/contacts",async(req,res)=>{
  if (Access.isAuthorized(req.sessionID)) {
    const accessToken = await Access.getAccessToken(req.sessionID);
    console.log(nextCache.get(req.sessionID));
   
    
    
    if (!nextCache.get(req.sessionID)) {

      var contacts=await Contacts.getContacts(accessToken,nextCache.get(req.sessionID));
           }
           else

          {
            var  contacts=await Contacts.getContacts(accessToken,nextCache.get(req.sessionID));
          }

    
    
    
    
    const items = contacts.paging
    if(items!=undefined){
      nextCache.set(req.sessionID,items.next.after, 1800);
    }
    else{
      nextCache.del(req.sessionID);
      
    }
    
    
    res.render("contacts", {contacts: contacts.results,status: items ,userdata:userCache.get(req.sessionID)});

  }
else {
  res.render("install");
}
res.end();
})


app.get("/logout",async(req,res)=>{
  req.session.destroy();
  res.render("logout");
})




app.get('/error', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(`<h4>Error: ${req.query.msg}</h4>`);
  res.end();
});

app.listen(PORT, () => console.log(`=== Starting your app on http://localhost:${PORT} ===`));



