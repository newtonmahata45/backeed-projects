const express = require("express")
const mongoose = require("mongoose")
const route = require("./src/routes/route")

const app = express()

app.use(express.json())

mongoose.connect("mongodb+srv://group22:1234@group22databse.uvtoalh.mongodb.net/group9Database",
{useNewUrlParser:true})
.then(()=> console.log("MongoDb is connected"))
.catch((err)=> console.log(err) )
 
app.use("/",route)

const PORT = 3000
app.listen(PORT,()=>{
    console.log(`Express app is running on port ${PORT}`)
})