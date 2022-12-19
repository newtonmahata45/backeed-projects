const express = require("express")
const router = express.Router();
const userController =  require ("../controller/userController")


//<<<<<<<<------------------- User Api -------------------->>>>>>>>>>>>>
router.post("/register",  userController. getUserProfile)



module.exports = router;