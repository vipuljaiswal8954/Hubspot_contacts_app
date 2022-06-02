const mongoose = require('mongoose')
const Schema = mongoose.Schema


const ContactsSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    phone: {
        type: String,
        required: true
    }
}
   
    )

const Data=mongoose.model("Data", ContactsSchema);


module.exports = {Data:Data}
