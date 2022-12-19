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
       if (profileImage && profileImage.length > 0) var uploadedFileURL = await aws.uploadFile(profileImage[0])
       else return res.status(400).send({ status: false, message: 'please provide profile image' })

       //  CREATE :  user
       const user = {
           fname: data.fname,
           lname: data.lname,
           email: email,
           profileImage: uploadedFileURL,
           phone: phone,
           password: password,
           address: {
               shipping: {
                   street: address.shipping.street,
                   city: address.shipping.city,
                   pincode: address.shipping.pincode
               },
               billing: {
                   street: address.billing.street,
                   city: address.billing.city,
                   pincode: address.billing.pincode
               }
           }
       }
       const createUser= await userModel.create(user)
       return res.status(201).send({status: true, message: "User created successfully",data:createUser})
   }catch(err){
       return res.status(500).send({status: false, message:err.message})
   }}

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



    module.exports= {getUserProfile,registerUser}
    

    //<<<<<<<<------------------- Put-User-Api -------------------->>>>>>>>>>>>>

    exports.updateUserProfile = async function(req,res) {
        try {
            let userId = req.params.userId
            let body = req.body
            let {address,fname,lname,email,password,phone,profileImage} = body
            if(object.keys(body).length == 0) return res.send({status:false, message:"Provide some data inside the body to update"})

            if(!userId) return res.status(400).send({status:false, message:"Please provide UserId"})
            let findUserInDb = await userModel.findOne({_id:userId})
            if(!findUserInDb) return res.status(404).send({status:false, message:"User not found"})
            
            let updateUserData = await userModel.findOneAndUpdate({_id:userId},{$set:body},{new:true})
            return res.status(200).send({status:true,message:"Data Updated Successfully",data:updateUserData})
        } catch (err) {
            return res.status(500).send({status:false,message:err.message})
        }
    }