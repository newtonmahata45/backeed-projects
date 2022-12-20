const { isValidObjectId } = require("mongoose")
const productModel = require("../model/productModel")


exports.getProducts = async(req,res)=>{
    if(Object.keys(req.query).length == 0){
    const products = await productModel.find({isDeleted:false})
    return res.status(200).send({status:true,message:"Searched Results",data:products})
    }
    if(Object.keys(req.query).length > 0){
        req.query.isDeleted = false
        let size = req.query.size//.toUpperCase() //availableSizes
        let name = req.query.name // title

        const filteredProducts = await productModel.find({$or:[{availableSizes:{$in:size}},{title:{$regex:name}}]})

        if(!filteredProducts) return res.status(400).send({status:false,message:"No Results Found"})
        return res.status(200).send({status:true,message:"Search Results",data:filteredProducts})
    }
}


exports.getProductsById = async(req,res) =>{
    let productId = req.params.productId
    if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:"Invalid ObjectId"})

    const products = await productModel.findById({_id:productId,isDeleted:false})
    return res.status(200).send({status:true,message:"Searched Result",data:products})
}