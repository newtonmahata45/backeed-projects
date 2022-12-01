const jwt = require("jsonwebtoken")

const bookModel = require("../Models/bookModel")
const userModel = require("../Models/userModel")
const { isValidObjectId } = require("../validator/validator")

//================================================Authentication======================================================

const authenticate = function (req, res, next) {
    try {
        const token = req.headers["x-api-key"]


        if (!token) {
            return res.status(400).send({ status: false, message: "token must be present in headers" })
        }
        else {
            jwt.verify(token, "project/booksManagementGroup22", function (err, decodedToken) {

                if (err) {
                    return res.status(401).send({ status: false, message: err.message })
                }
                req.loginUserId = decodedToken.id
                next()
            })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



const authorisation = async function (req, res, next) {
    try {


        let idParams = req.params.bookId


        if (idParams) {
            if (!isValidObjectId(idParams)) { return res.status(400).send({ status: false, message: 'Please provide a valid bookId' }) }
            let checkId = await bookModel.findById(idParams )
            
            if(!checkId){return res.status(404).send({ status: false, message: 'bookId does not exists' }) }

            let userId = checkId.userId//.map(x => x.userId)

            let tokenUserId = req.loginUserId // token Id

            if (tokenUserId != userId) { return res.status(403).send({ status: false, msg: "You are not authorised to perform this task 1" }) }

        }
        else {
            let idBody = req.body.userId
            if (!isValidObjectId(idBody)) { return res.status(400).send({ status: false, message: 'Please provide a valid UserId' }) }
            
            let checkId = await userModel.findById(idBody )
            
            if(!checkId){return res.status(404).send({ status: false, message: 'userId does not exists' }) }
            
            let tokenUserId = req.loginUserId
            if (idBody != tokenUserId) { return res.status(403).send({ status: false, msg: 'You are not authorised to perform this activity' }) }

        }

        next();
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ msg: error.message })
    }
}



module.exports.authenticate = authenticate
module.exports.authorisation = authorisation