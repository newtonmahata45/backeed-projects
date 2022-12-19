const userModel = require("../model/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const aws = require("../aws")

const { isIdValid, isValidString, isValidISBN, isValidDate, isValidName,isValidImage } = require("../validator/validator")


const registerUser = async (req, res) => {
   try {
       const data = req.body
       const profileImage = req.files
  
//  CHECK  if request body is empty
       if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })
//------------------
// if (!validator.isValidType(data.fname)) return res.status(400).send({ status: false, message: 'please provide first name' })
// if (!validator.isValidType(data.lname)) return res.status(400).send({ status: false, message: 'please provide last name' })
// if (!validator.isValidType(data.address)) return res.status(400).send({ status: false, message: 'please provide Address' })

// let { shipping, billing } = data.address

// if (!validator.isValidType(billing)) return res.status(400).send({ status: false, message: 'please provide billing Address'})
// if (!validator.isValidType(billing.street)) return res.status(400).send({ status: false, message: 'please provide billing street' })
// if (!validator.isValidType(billing.city)) return res.status(400).send({ status: false, message: 'please provide billing city' })
if (!validator.isValidType(billing.city)) return res.status(400).send({ status: false, message: 'please provide billing city' })

let { phone, email, password } = data
       const isPhoneAlreadyUsed = await userModel.findOne({ phone })
       if (isPhoneAlreadyUsed) return res.status(400).send({ status: false, message: "This mobile is number already in use,please provide another mobile number" })

       const isEmailAlreadyUsed = await userModel.findOne({ email })
       if (isEmailAlreadyUsed) return res.status(400).send({ status: false, message: "This  is email already in use,please provide another email" })


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



    module.exports= {getUserProfile,registerUser}
    