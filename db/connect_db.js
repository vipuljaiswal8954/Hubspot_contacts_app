const mongoose = require('mongoose')
const url = `mongodb+srv://admin-vipul:vipul123@cluster0.qh2ao.mongodb.net/?retryWrites=true&w=majority`

try {
    mongoose.connect(url,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            autoIndex: true,
        }).then(() => console.log('Connected with Database successfully!'))
} catch (e) {
    console.log(e.message)
}