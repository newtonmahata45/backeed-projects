// authentication
const jwt = require("jsonwebtoken")

const bookModel = require("../Models/bookModel")
const userModel = require("../Models/userModel")
const { isValidObjectId } = require("../validator/validator")

//================================================Authentication======================================================//

const authenticate = function (req, res, next) {
    try {
        const token = req.headers["x-api-key"]  // token from headers

        if (!token) {
            return res.status(400).send({ status: false, message: "token must be present in headers" })
        }
        else {
            jwt.verify(token, "the-secret-key", function (err, decodedToken) {

                if (err) {
                    if(err.message=="invalid token"){
                        return res.status(401).send({ status: false, message: "Token in not valid" })}

                    if(err.message=="jwt expired"){
                        return res.status(401).send({ status: false, message: "Token has been expired" })
                    }
                    return res.status(401).send({ status: false, message: err.message })

                }
                else{
                    req.loginUserId = decodedToken.id       // golbelly  in  decodedToken.id 
                    next()

                }
            })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



//===============================================authorisation====================================================//



module.exports.authenticate = authenticate