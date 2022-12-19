const userModel = require("../model/userModel")
const { isIdValid, isValidString, isValidISBN, isValidDate, isValidName,isValidImage } = require("../validators/validator")


     //<<<<<<<<------------------- Get-User-Api -------------------->>>>>>>>>>>>>

     const getUserProfile = function(req,res) {
        try{
             let userId = req.params.userId
             if(!userId) {
                return res.status(400).send({status:false,message:"Please provide userId"})
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