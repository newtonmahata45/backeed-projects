const userModel = require("../model/userModel")
const productModel = require("../model/productModel")
const cartModel = require("../model/cartModel")
const { isValidObjectId } = require("../validator/validator")
const orderModel = require("../model/orderModel")



const createOrder = async function(req,res) {
    try{
    let userId = req.params
    const userFind = await userModel.findById(userId)
    if(!userFind) {
        return res.status(404).send({status:false,message:"user not Exit"})
    }
    let cartId = req.body.cartId
    const findCart = await cartModel.findById(cartId)
    if(!findCart) {
        return res.status(404).send({status:false,message:"Cart not Exit or deleted"})
    }
    let cartUserId = findCart.userId
    if(!userId == cartUserId) {
        return res.status(404).send({status:false,message:"Please provide valid user cartId"})
    }
    if (findCart.items.length == 0) return res.status(404).send({ status: false, message: "Your cart is empty" })
    
    let itemArray = findCart.items

    for(let i=0; i<= itemArray.length; i++) {

        let product = await productModel.findOne({_id:itemArray[i].productId,isDeleted: false})
        if(!product) {
            itemArray.splice(itemArray[i], 1)
        }
    }

    // Total Price && Quantity => 
    let  totalPrice =  0;
    let totalQuantity =  0;
    for (let i=0; i<itemArray.length;i++) {
        totalPrice = totalPrice+(itemArray[i].quantity * product.price)
        totalQuantity = totalQuantity+itemArray[i].quantity 
    }

      // Total Quantity => 
    //   let totalQuantity =  0;
    //   for (let i=0; i<itemArray.length;i++) {
    //     totalQuantity = totalQuantity+itemArray[i].quantity 
    //   }


      let order = {
        userId: userId,
        items: itemArray,
        totalPrice: totalPrice,
        totalItems: itemArray.length,
        totalQuantity: totalQuantity,
    }

    const createOrder = await orderModel.create(order)
    await cartModel.updateOne({userId: userId}, {$set: {items: [], totalPrice: 0,totalQuantity: 0}})
    res.status(200).send({ status: true, data: createOrder })
}
catch(err) {
    return res.status(500).send({ status: false, message: err.message })

}
}




const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'Please provide a valid user Id' })
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: 'Please provide Data in request body' })

        const { orderId, status } = data
        if (status != "pending" && status != "completed" && status != "canceled") {
            return res.status(400).send({ status: false, message: "order status can only be pending,completed and canceled" })
        }

        const isOrderValid = await orderModel.findById(orderId)
        if (!isOrderValid) return res.status(404).send({ status: false, message: "oder Not found" })

        if (isOrderValid.status == "completed")
            return res.status(400).send({ status: false, message: "Can Not Update This Order, Because It's Completed Already" })

        if (isOrderValid.status == "cancelled")
            return res.status(400).send({ status: false, message: "Can Not Update This Order, Because It's Cancelled Already" })

        if (isOrderValid.userId != userId) return res.status(400).send({ status: false, message: "order is not bl " })

        if (status == "canceled") {
            if (!isOrderValid.cancellable) return res.status(400).send({ status: false, message: "this order is not cancled" })

        }
        const updateOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
        if (updateOrder.status == "completed") {

            let cartDatails = await cartModel.findOne({ userId: userId, isDeleted: false })
            if (!cartDatails) { return res.status(404).send({ status: false, message: "Cart not found of this User" }) }

            await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })

            return res.status(200).send({ status: true, message: "Success", data: updateOrder })

        } else {
            return res.status(200).send({ status: true, message: "Success", data: updateOrder })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
module.exports = { createOrder,updateOrder }