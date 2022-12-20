const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const productController = require("../controller/productController");


router.post("/register",userController.registerUser)

router.post("/login",userController.userLogin);
//<<<<<<<<------------------- Get User Api -------------------->>>>>>>>>>>>>
router.get("/user/:userId/profile",  userController. getUserProfile)
router.put("/user/:userId/profile",  userController.updateUserProfile )
router.get("/products", productController.getProducts )





module.exports = router;
