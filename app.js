require('dotenv').config();

const express = require('express');
const session = require('express-session');
const res = require('express/lib/response');
const NodeCache = require('node-cache');
const axios=require("axios");
const bodyParser=require("body-parser");
// require('./db/connect_db')

const Access=require("./access.js")
const Contacts=require('./contacts.js')
// const {Data}  =require("./src/models/contactsdb.js");


const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


const PORT =3000;



const userCache = new NodeCache({ deleteOnExpire: true });


const CLIENT_ID = "07f94d35-172a-4c67-b274-d9d39335d1a6";
const CLIENT_SECRET ="1083637c-98ab-45ec-9302-4d2c51e2577b";
const scopes=`crm.objects.contacts.read%20crm.objects.contacts.write`


const REDIRECT_URI = `https://migration.niswey.net/vipul/auth`;

class Stack {
  items = []
  push = (element) => this.items.push(element)
  pop = () => this.items.pop()
  top=()=> this.items[this.items.length-1]
  isempty = () => this.items.length === 0
  empty = () => (this.items.length = 0)
  size = () => this.items.length
}

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

var next=undefined;

var page = new Stack();
page.push(undefined)

app.get("/contacts",async(req,res)=>{
  if (Access.isAuthorized(req.sessionID)) {
    var accessToken = await Access.getAccessToken(req.sessionID);
    
    
    console.log(page.top());
    next=page.top()
   
    console.log(accessToken);
    
   
    var count=0;
    var contacts=[];
    // console.log(contacts.size);
    
     
    while(contacts.length<5){

      var details=await Contacts.getContacts(accessToken,next);
     
    if (details.results[0].properties.phone !=null){
      contacts.push(details.results[0].properties);
    }
    // contacts.push(details.results[0].properties);
    if(details.paging==undefined){
      break;
    }
   
    next=details.paging.next.after;
    
  }
     console.log(contacts);
    
    
    res.render("contacts", {contacts: contacts,userdata:userCache.get(req.sessionID)});;
  }
else {
  res.render("install");
}
res.end();
})

app.post("/contacts",async(req,res)=>{
  console.log(req.body);
  if(req.body.next!=undefined){
    page.push(next);
  }
  if(req.body.prev!=undefined){
    
    next=page.pop()
    // next=page.pop()
  }
  res.redirect("/vipul/contacts");
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



