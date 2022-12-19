// userapi
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const userModel = require("../model/userModel")
const aws = require("../aws")

const { isValidObjectId, isValidPassword, isValidName, isValidString, isValidImage, isValidEmail, isValidPincode, isValidMobile } = require("../validator/validator")

const registerUser = async (req, res) => {
    try {
        const data = req.body
        const profileImage = req.files
        let { fname, lname, phone, email, password, address } = data
        address = JSON.parse(address)
        //  CHECK  if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })

        if (!fname) { return res.status(400).send({ status: false, message: "fname is mandatory" }) }
        if (!lname) { return res.status(400).send({ status: false, message: "lname is mandatory" }) }
        if (!email) { return res.status(400).send({ status: false, message: "email is mandatory" }) }
        if (profileImage.length === 0) { return res.status(400).send({ status: false, message: "profileImage is mandatory" }) }
        if (!phone) { return res.status(400).send({ status: false, message: "phone is mandatory" }) }
        if (!password) { return res.status(400).send({ status: false, message: "password is mandatory" }) }
        if (!address) { return res.status(400).send({ status: false, message: "address is mandatory" }) }
        if (!address.shipping) { return res.status(400).send({ status: false, message: "shipping address is mandatory" }) }
        if (!address.shipping.street) { return res.status(400).send({ status: false, message: "street is mandatory in shipping address" }) }
        if (!address.shipping.city) { return res.status(400).send({ status: false, message: "city is mandatory in shipping address" }) }
        if (!address.shipping.pincode) { return res.status(400).send({ status: false, message: "pincode is mandatory in shipping address" }) }
        if (!address.billing) { return res.status(400).send({ status: false, message: "billing address is mandatory" }) }
        if (!address.billing.street) { return res.status(400).send({ status: false, message: "street is mandatory in billing address" }) }
        if (!address.billing.city) { return res.status(400).send({ status: false, message: "city is mandatory in billing address" }) }
        if (!address.billing.pincode) { return res.status(400).send({ status: false, message: "pincode is mandatory in billing address" }) }

        if (!isValidName(fname)) { return res.status(400).send({ status: false, message: "fname is not valid" }) }
        if (!isValidName(lname)) { return res.status(400).send({ status: false, message: "lname is not valid" }) }
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, message: "email is not valid" }) }
        if (!isValidImage(profileImage[0].originalname)) { return res.status(400).send({ status: false, message: "Profile Image formate is not valid" }) }
        if (!isValidMobile(phone)) { return res.status(400).send({ status: false, message: "Mobile no is not valid" }) }
        if (!isValidPassword(password)) { return res.status(400).send({ status: false, message: "Choose a Strong Password,Use a mix of letters (uppercase and lowercase), numbers, and symbols in between 8-15 characters" }) }
        if (!isValidString(address.shipping.street)) { return res.status(400).send({ status: false, message: "street is not valid in shipping address" }) }
        if (!isValidName(address.shipping.city)) { return res.status(400).send({ status: false, message: "city is not valid in shipping address" }) }
        if (!isValidPincode(address.shipping.pincode)) { return res.status(400).send({ status: false, message: "pincode is not valid in shipping address" }) }
        if (!isValidString(address.billing.street)) { return res.status(400).send({ status: false, message: "street is not valid in billing address" }) }
        if (!isValidName(address.billing.city)) { return res.status(400).send({ status: false, message: "city is not valid in billing address" }) }
        if (!isValidPincode(address.billing.pincode)) { return res.status(400).send({ status: false, message: "pincode is not valid in billing address" }) }

        const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone })
        if (isPhoneAlreadyUsed) return res.status(400).send({ status: false, message: `This ${phone} mobile no is number already exists, please provide another mobile number` })

        const isEmailAlreadyUsed = await userModel.findOne({ email: email })
        if (isEmailAlreadyUsed) return res.status(400).send({ status: false, message: `This ${email} email is  already exists, please provide another email` })

        // ENCRYPTING PASSWORD
        let saltRounds = 10;
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(password, salt);
        password = hash

        //  Create : aws link for profile image
        if (profileImage.length > 0) { var uploadedFileURL = await aws.uploadFile(profileImage[0]) }
        else { return res.status(400).send({ status: false, message: 'please provide profile image' }) }
    
        data.address = address
        data.profileImage = uploadedFileURL;
        const createUser = await userModel.create(data)
        return res.status(201).send({ status: true, message: "User created successfully", data: createUser })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


let userLogin = async function (req, res) {

    try {
        let credentials = req.body
        let { email, password } = credentials
        if (Object.keys(credentials) == 0) {
            return res.status(400).send({ status: false, message: "email and password are required for Log in" })
        }
        if (!email) { return res.status(400).send({ status: false, message: "email is mandatory" }) }
        if (!password) { return res.status(400).send({ status: false, message: "password is mandatory" }) }

        if (email.trim().length == 0 || password.trim().length == 0) {
            return res.status(400).send({ status: false, message: "both fields are required." })
        }

        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "email is not valid" })
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "password is not valid" })
        }

        let userDetail = await userModel.findOne({ email: email })
        if (!userDetail) {
            return res.status(404).send({ status: false, message: "User not found with this EmailId" })
        }
        let passwordHash = userDetail.password;
        const passwordMatch = await bcrypt.compare(password, passwordHash)
        if (!passwordMatch) {
            return res.status(404).send({ status: false, message: "Password dose not match with EmailId" })
        }

        let token = jwt.sign({
            userId: userDetail._id.toString(),

        }, "the-secret-key", { expiresIn: '1d' })
        res.setHeader("x-api-key", token)

        return res.status(200).send({ status: true, message: "Success", data: token })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }

}

//<<<<<<<<------------------- Get-User-Api -------------------->>>>>>>>>>>>>

const getUserProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        // UserId Validation :-
        if (!userId) {
            return res.status(400).send({ status: false, message: "Please provide userId" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is not valid" })
        }

        const findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        res.status(200).send({ status: true, message: "User profile details", "data": findUser })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//<<<<<<<<------------------- Put-User-Api -------------------->>>>>>>>>>>>>
    
let updateUserProfile = async function(req,res) {
    try {
        let userId = req.params.userId
        let body = req.body
        let profileImage = req.files
        let {address,fname,lname,email,password,phone} = body
        
        
        
        if(Object.keys(body).length == 0) return res.send({status:false, message:"Provide some data inside the body to update"})
        
        if(!userId) return res.status(400).send({status:false, message:"Please provide UserId"})
        if (!isValidObjectId(userId)) {  return res.status(400).send({ status: false, message: "userId is not valid" }) }

        if(fname){
        if (!isValidName(fname)) { return res.status(400).send({ status: false, message: "fname is not valid" }) }
        }
        if(lname){
        if (!isValidName(lname)) { return res.status(400).send({ status: false, message: "lname is not valid" }) }
        }
        if(email){
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, message: "email is not valid" }) }
        }
        if(profileImage.length == 0){
        if (!isValidImage(profileImage[0].originalname)) { return res.status(400).send({ status: false, message: "Profile Image formate is not valid" }) }
        }
        if(phone){
        if (!isValidMobile(phone)) { return res.status(400).send({ status: false, message: "Mobile no is not valid" }) }
        }
        if(password){
        if (!isValidPassword(password)) { return res.status(400).send({ status: false, message: "Choose a Strong Password,Use a mix of letters (uppercase and lowercase), numbers, and symbols in between 8-15 characters" }) }
        let saltRounds = 10;
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(password, salt);
        password = hash
        }
    if(address){
        address = JSON.parse(address)
        if(address.shipping.street){
        if (!isValidString(address.shipping.street)) { return res.status(400).send({ status: false, message: "street is not valid in shipping address" }) }
        }
        if(address.shipping.city ){
        if (!isValidName(address.shipping.city)) { return res.status(400).send({ status: false, message: "city is not valid in shipping address" }) }
        }
        if(address.shipping.pincode){
        if (!isValidPincode(address.shipping.pincode)) { return res.status(400).send({ status: false, message: "pincode is not valid in shipping address" }) }
        }
        if(address.billing.street){
        if (!isValidString(address.billing.street)) { return res.status(400).send({ status: false, message: "street is not valid in billing address" }) }
        }
        if( address.billing.city ){
        if (!isValidName(address.billing.city)) { return res.status(400).send({ status: false, message: "city is not valid in billing address" }) }
        }
        if(address.billing.pincode){
        if (!isValidPincode(address.billing.pincode)) { return res.status(400).send({ status: false, message: "pincode is not valid in billing address" }) }
        }
        body.address = address
    }
        let findUserInDb = await userModel.findOne({_id:userId})
        if(!findUserInDb) return res.status(404).send({status:false, message:"User not found"})
        const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone })
        if (isPhoneAlreadyUsed) return res.status(400).send({ status: false, message: `This ${phone} mobile no is number already exists, please provide another mobile number` })

        const isEmailAlreadyUsed = await userModel.findOne({ email: email })
        if (isEmailAlreadyUsed) return res.status(400).send({ status: false, message: `This ${email} email is  already exists, please provide another email` })
        
        //  Create : aws link for profile image
        if (profileImage.length > 0) { var uploadedFileURL = await aws.uploadFile(profileImage[0])
            body.profileImage = uploadedFileURL; 
        }

        let updateUserData = await userModel.findOneAndUpdate({_id:userId},{$set:body},{new:true})
        return res.status(200).send({status:true,message:"Data Updated Successfully",data:updateUserData})
    } catch (err) {
        return res.status(500).send({status:false,message:err.message})
    }
}

    module.exports= {getUserProfile,registerUser}
    