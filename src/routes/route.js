const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");


router.post("/register",userController.registerUser)

router.post("/login",userController.userLogin);
//<<<<<<<<------------------- Get User Api -------------------->>>>>>>>>>>>>
router.get("/user/:userId/profile",  userController. getUserProfile)
router.put("/user/:userId/profile",  userController.updateUserProfile )



module.exports = router;
