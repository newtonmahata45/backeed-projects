// userapi
const jwt = require("jsonwebtoken") 
const bcrypt =require("bcrypt") 
const userModel = require("../model/userModel")

const userModel = require("../model/userModel")
const { isIdValid, isValidString, isValidISBN, isValidDate, isValidName,isValidImage } = require("../validators/validator")



let userLogin = async function (req,res){
    let credentials = req.body
    let { email, password } = credentials  
    
    
    if (Object.keys(credentials) == 0) {
        return res.status(400).send({ status: false, message: "email and password are required for Log in" })
    }
    if (!email) { return res.status(400).send({ status: false, message: "email is mandatory" }) }
    if (!password) { return res.status(400).send({ status: false, message: "password is mandatory" }) }

    if (email.length == 0 || password.length == 0) {
        return res.status(400).send({ status: false, message: "both fields are required." })
    }
    
    if (!isValidEmail(email)) {
        return res.status(400).send({ status: false, message: "email is not valid" })
    }
    if (!isValidPassword(password)) {
        return res.status(400).send({ status: false, message: "password is not valid" })
    }
    
    let userDetail = await userModel.findOne({ email: email})
    let passwordHash = userDetail.password;
    const passwordMatch = await bcrypt.compare(password,passwordHash)
    
    if (!userDetail) {
        return res.status(404).send({ status: false, message: "User not found with this EmailId and Password" })
    }
    if (!passwordMatch) {
        return res.status(404).send({ status: false, message: "Password dose not match with EmailId" })
    }
    
    let token = jwt.sign({                        
        userId: userDetail._id.toString(),

    }, "the-secret-key", { expiresIn: '1d' })
    res.setHeader("x-api-key", token)
    
    return res.status(200).send({ status: true, message: "Success", data: token })

}

//<<<<<<<<------------------- Get-User-Api -------------------->>>>>>>>>>>>>

const getUserProfile = function(req,res) {
    try{
        let userId = req.params.userId
        // UserId Validation :-
        if(!userId) {
            return res.status(400).send({status:false,message:"Please provide userId"})
        }
        if(isIdValid(userId)) {
            return res.status(400).send({status:false,message:"userId not valid"})
        }
        
        const findUser = userModel.findbyId(userId)
        if(!findUser) {
            return res.status(404).send({status:false,message:"User not found"})
        }
        res.status(200).send({status:true,message:"User profile details","data":findUser})
    }
catch(err){
res.status(500).send({status:false,message:err.message})
}
}

module.exports.getUserProfile = getUserProfile
module.exports = {userLogin}
    