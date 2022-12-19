const {express} = require("express");
const route = require(express.Route());

const userController = require("../controller/userController");

route.post("/login",userController.userLogin);

module.exports = route;