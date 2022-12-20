const { isValidObjectId } = require("mongoose")
const productModel = require("../model/productModel")


exports.getProducts = async(req,res)=>{
    if(Object.keys(req.query).length == 0){
    const products = await productModel.find({isDeleted:false})
    }
    if(Object.keys(req.query).length > 0){
        req.query.isDeleted = false
        const filteredProducts = await productModel.find(req.query)
    }
}


exports.getProductsById = async(req,res) =>{
    let productId = req.params.productId
    if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:"Invalid ObjectId"})

    const products = await productModel.findById({_id:productId,isDeleted:false})
    return res.status(200).send({status:true,message:"Searched Result",data:products})
}