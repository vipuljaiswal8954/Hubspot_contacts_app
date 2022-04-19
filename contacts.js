const hubspot=require("@hubspot/api-client");

const getContacts=async(accessToken,next)=>{
  const hubspotClient = new hubspot.Client({"accessToken":accessToken});

const limit = 10;
const after = next;
const properties = [
"phone",
"firstname",
"lastname",
"email"
];
const propertiesWithHistory = undefined;
const associations = undefined;
const archived = false;

try {
const apiResponse = await hubspotClient.crm.contacts.basicApi.getPage(limit, after, properties, propertiesWithHistory, associations, archived);
console.log(JSON.stringify(apiResponse, null, 2));
const details= JSON.parse(JSON.stringify(apiResponse, null, 2));

return details;
} catch (e) {
e.message === 'HTTP request failed'
  ? console.error(JSON.stringify(e.response, null, 2))
  : console.error(e)
}

}



module.exports={
    getContacts:getContacts
}