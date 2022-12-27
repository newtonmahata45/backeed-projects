const productModel = require("../model/productModel")
const aws = require("../aws")
const { isValidObjectId, isValidPassword, isValidName, isValidString, isValidImage, isValidEmail, isValidPincode, isValidMobile,isValidSize,isNumber } = require("../validator/validator")

//=========================================================// CREATE PRODUCT //=============================================================//
let createProduct = async (req, res) => {
    try {
        var data = req.body
        const productImage = req.files

        //  CHECK : if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, message: "Please enter data" })
         
        const { title, description, currencyId, currencyFormat, isFreeShipping, style } = data

        if (!title) { return res.status(400).send({ status: false, message: "title is mandatory" }) }
        if (!description) { return res.status(400).send({ status: false, message: "description is mandatory" }) }
        if (!data.price) { return res.status(400).send({ status: false, message: "price is mandatory" }) }
        if (!data.availableSizes) return res.status(400).send({ status: false, message: 'please provide Sizes' })
        if (!style) { return res.status(400).send({ status: false, message: 'style is mandatory' }) }
        if (productImage.length === 0) { return res.status(400).send({ status: false, message: "productImage is mandatory" }) }
        if (productImage.length > 1) { return res.status(400).send({ status: false, message: 'please select only one product image' }) }
        let price = (+data.price)
        let installments = (+data.installments)
        data.price = price
        data.installments = installments
        if (!isValidString(title)) return res.status(400).send({ status: false, message: 'please provide title' })
        if (!isValidString(description)) return res.status(400).send({ status: false, message: 'please provide description' })
        if (!isValidImage(productImage[0].originalname)) { return res.status(400).send({ status: false, message: "Image formate of product is not valid" }) }

        if (!price) { return res.status(400).send({ status: false, message: 'please provide price in digits' }) }
        if (!installments) return res.status(400).send({ status: false, message: 'please provide installments in digits' })
        if (isFreeShipping) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
        }
       
        if (currencyId) {
            if (currencyId != "INR") return res.status(400).send({ status: false, message: 'currencyId only be `INR`' })
        }
        else {data.currencyId = "INR"}

        if (currencyFormat) {
            if (currencyFormat != "₹") return res.status(400).send({ status: false, message: 'currencyFormat only be `₹`' })
        }
        else {data.currencyFormat = "₹"}

        let availableSizes = data.availableSizes
        availableSizes = availableSizes.toUpperCase().split(",")
        for (let i = 0; i < availableSizes.length; i++) {
            if (!["S", "XS", "M", "X", "L", "XXL", "XL",].includes(availableSizes[i])) {
                return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
        }
        data.availableSizes = availableSizes
        const productDetails = await productModel.findOne({ title: title })
        if (productDetails) return res.status(409).send({ status: false, message: "This title is already exists, please provide another title" })

        // Create : aws link for profile image
        let uploadedFileURL = await aws.uploadFile(productImage[0])
        data.productImage = uploadedFileURL

        // return res.status(456).send({ status: false, message: "boom" })
        const createdUser = await productModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: createdUser })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


//==========================================================// GET PRODUCT //============================================================================//
 let getproducts = async function(req,res){
    try{
    const filters = req.query
    const finalFilters = { isDeleted: false }

    const { name, size, priceGreaterThan, priceLessThan, priceSort } = filters

    if (name) {
        finalFilters.title= { $regex: `.*${name.trim()}.*`, $options:"i" }
    }
    if (size ) {
        if (!isValidSize(size)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
        finalFilters.availableSizes = size.toUpperCase()
    }
    if(priceLessThan){
        finalFilters.price = {$lte: priceLessThan}
    }
    if(priceGreaterThan){
        finalFilters.price = { $gte:priceGreaterThan}
    }
    if (priceLessThan && priceGreaterThan ) {
      finalFilters.price= { $lte: priceLessThan, $gte: priceGreaterThan }
    }
    if (priceSort) {
        if (!(priceSort == "1" || priceSort == "-1")) return res.status(400).send({status: false, message: "value priceSort can either be 1 or -1"
        })

        if (priceSort == "1") {
            const allProducts = await productModel.find(finalFilters).sort({ price: 1 })
            if (allProducts.length == 0) return res.status(404).send({ status: false, message: "No Product Found" })
            return res.status(200).send({ status: true, message: "Success", data: allProducts })
        }
        else if (priceSort == "-1") {
            const allProducts = await productModel.find(finalFilters).sort({ price: -1 })
            if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
            return res.status(200).send({ status: true, message: "Success", data: allProducts })
        }
    }

    const allProducts = await productModel.find(finalFilters).select({ _id: 0,__v:0}).sort({ price: 1 })
    
    if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
    
    return res.status(200).send({ status: true, message: "Success", data: allProducts })
    }
    
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
    }

//=========================================================// GET PRODUCTS BY ID //========================================================//
let getProductsById = async (req,res) => {
    try {
        let productId = req.params.productId

        if(!productId) return res.status(400).send({status:false,message:"Please provide the productId"})
        if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:"Invalid ObjectId"})
    
        const products = await productModel.findById({_id:productId,isDeleted:false})
        return res.status(200).send({status:true,message:"Success",data:products})
        
    } catch (error) {
        return res.status(500).send({error:error.message})
    }
}
//===========================================================// UPDATE PRODUCT //=======================================================================//
let updateProductById = async (req, res) => {
    try {
        const productId = req.params.productId
        const dataForUpdates = req.body
        const productImage = req.files
        
        const updateData={}

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId" })

        //  CHECK : if there is no data for updatation
        if (!(dataForUpdates && productImage)) return res.status(400).send({ status: false, message: 'please provide some data for upadte profile' })

        //  Searching : user details 
        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) return res.status(404).send({ status: false, message: "Product not Found" })

        let { title, description, isFreeShipping, style,availableSizes,installments ,price} = dataForUpdates
        

        //  CHECK : If any data field is Empty
        if (title) {
            if (!isValidString(title)) return res.status(400).send({ status: false, message: 'please provide title in String' })
            const isTitleAlreadyUsed = await productModel.findOne({ title })
            if (isTitleAlreadyUsed) return res.status(400).send({ status: false, message: "This  is title already in use,please provide another title" })
           
        }
        if (description) {
            if (!isValidString(description)) return res.status(400).send({ status: false, message: 'please provide description' })
            updateData.description = description
        }
    
        if (isFreeShipping) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
    
            updateData.isFreeShipping = isFreeShipping
        }
        if (style ) {
            if (!isValid(style)) return res.status(400).send({ status: false, message: 'please provide style' })
            updateData.style= style
        }
        
        if (installments) {
            installments = JSON.parse(installments)
            if (!isNumber(installments)) return res.status(400).send({ status: false, message: 'please provide installments in digits' })
            updateData.installments = installments
        }
        
        if (dataForUpdates.price) {
            price = JSON.parse(price)
        
            if (!isNumber(dataForUpdates.price)) return res.status(400).send({ status: false, message: 'please provide price in digits' })
            updateData.price= price
        }
        if (productImage.length > 0 ) {
            var updateFileURL = await aws.uploadFile(productImage[0])
            updateData.productImage= updateFileURL
        }
        if (availableSizes) {
            if (!isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
        
            const updatedProduct = await productModel.findByIdAndUpdate(
                {_id: productId,isDeleted:false},
                {
                    $set:{...updateData},
                    $addToSet:{availableSizes:availableSizes}
                },
                {new:true}
            )
            return res.status(200).send({ status: true, message: "Product updated successfully", data: updatedProduct })
        }

        const updatedProduct = await productModel.findByIdAndUpdate({ _id: productId },{...updateData}, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updatedProduct })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}
//============================================================// DELETE PRODUCT //=================================================================//
let deleteProduct = async (req,res) => {
    try {
	let productId = req.params.productId
	
	    if(!productId) return res.status(400).send({status:false,message:"You have to provide productId to delete the product"})
	    if(!isValidObjectId(productId)) return res.status(400).send({status:false,message:"Invalid ObjectId"})
	
	    let productExist = await productModel.findById({_id:productId})
	   
	    if(!productExist || productExist.isDeleted == true){
	    return res.status(404).send({status:false, message:"Product is already removed or never existed"})
	   }
	   
	   await productModel.findByIdAndUpdate({_id:productId}, {$set:{isDeleted:true,deletedAt:Date.now()}},{new:true})
	   return res.status(200).send({status:true,message:"Success"})
} catch (error) {
	return res.status(500).send({error:error.message})
}
}

module.exports ={ createProduct, getproducts, getProductsById, updateProductById, deleteProduct }
