const express = require("express")
const router = express.Router();
const userController =  require ("../controller/userController")


//<<<<<<<<------------------- Get User Api -------------------->>>>>>>>>>>>>
router.get("/user/:userId/profile",  userController. getUserProfile)



module.exports = router;