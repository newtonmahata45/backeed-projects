const productModel = require("../model/productModel")
const aws = require("../aws")
const { isValidObjectId, isValidPassword, isValidName, isValidString, isValidImage, isValidEmail, isValidPincode, isValidMobile } = require("../validator/validator")
//=========================================================// CREATE PRODUCT //=============================================================//
let createProduct = async (req, res) => {
    try {
        const data = req.body
        const productImage = req.files
       

        //  CHECK : if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })

        let { title, description, currencyId, currencyFormat, isFreeShipping, style,availableSizes } = data

        //  CHECK : if any data field is empty
        if (!title) { return res.status(400).send({ status: false, message: "title is mandatory" }) }
        if (!description) { return res.status(400).send({ status: false, message: "description is mandatory" }) }
        if (!data.price) { return res.status(400).send({ status: false, message: "price is mandatory" }) }
        //  CHECK : if any data field is empty
        if (!validator.isValidString(title)) return res.status(400).send({ status: false, message: 'please provide title' })
        if (!validator.isValidString(description)) return res.status(400).send({ status: false, message: 'please provide description' })
        if (!validator.isNumber(data.price)) return res.status(400).send({ status: false, message: 'please provide price in digits' })
 
        if (isFreeShipping ) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
        }
        if (style) {
            if (!validator.isValid(style)) return res.status(400).send({ status: false, message: 'please provide style' })
        }
        if (!validator.isNumber(data.installments)) return res.status(400).send({ status: false, message: 'please provide installments in digits' })

        if (currencyId) {
            if (currencyId != "INR") return res.status(400).send({ status: false, message: 'please provide valid currencyId' })
         }
        else {data.currencyId = "INR"}
        if (currencyFormat) {
            if (currencyFormat != "₹") return res.status(400).send({ status: false, message: 'please provide valid currencyFormat' })
        }
        else data.currencyFormat= "₹"

        if (!data.availableSizes) return res.status(400).send({ status: false, message: 'please provide Sizes' })
        if (data.availableSizes.length==0) return res.status(400).send({ status: false, message: 'please provide Sizes in Array ' })
        if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
       

        const isTitleAlreadyUsed = await productModel.findOne({ title: title })
        if (isTitleAlreadyUsed) return res.status(400).send({ status: false, message: "This  is title already exists, please provide another title" })

        // Create : aws link for profile image
        if (productImage.length > 0) {var uploadedFileURL = await aws.uploadFile(productImage[0])}
        else {return res.status(400).send({ status: false, message: 'please provide product image' })}
        data.productImage = uploadedFileURL
        
        
        const createdUser = await productModel.create(data)
        return res.status(201).send({ status: true, message: "User created successfully", data: createdUser })
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
            return res.status(200).send({ status: true, message: "Product List", data: allProducts })
        }
        else if (priceSort == "-1") {
            const allProducts = await productModel.find(finalFilters).sort({ price: -1 })
            if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
            return res.status(200).send({ status: true, message: "Product List", data: allProducts })
        }
    }

    const allProducts = await productModel.find(finalFilters).select({
        title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
    }).sort({ price: 1 })
    
    if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
    
    return res.status(200).send({ status: true, message: "Product List", data: allProducts })
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
        return res.status(200).send({status:true,message:"Searched Result",data:products})
        
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
            if (!validator.isValidString(title)) return res.status(400).send({ status: false, message: 'please provide title in String' })
            const isTitleAlreadyUsed = await productModel.findOne({ title })
            if (isTitleAlreadyUsed) return res.status(400).send({ status: false, message: "This  is title already in use,please provide another title" })
           
        }
        if (description) {
            if (!validator.isValidString(description)) return res.status(400).send({ status: false, message: 'please provide description' })
            updateData.description = description
        }
    
        if (isFreeShipping) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
    
            updateData.isFreeShipping = isFreeShipping
        }
        if (style ) {
            if (!validator.isValid(style)) return res.status(400).send({ status: false, message: 'please provide style' })
            updateData.style= style
        }
        
        if (installments) {
            installments = JSON.parse(installments)
            if (!validator.isNumber(installments)) return res.status(400).send({ status: false, message: 'please provide installments in digits' })
            updateData.installments = installments
        }
        
        if (dataForUpdates.price) {
            price = JSON.parse(price)
            if (!validator.isValid(dataForUpdates.price)) return res.status(400).send({ status: false, message: 'please provide price' })
            if (!validator.isNumber(dataForUpdates.price)) return res.status(400).send({ status: false, message: 'please provide price in digits' })
            updateData.price= price
        }
        if (productImage.length > 0 ) {
            var updateFileURL = await aws.uploadFile(productImage[0])
            updateData.productImage= updateFileURL
        }
        if (availableSizes) {
            if (!validator.isValid(availableSizes)) return res.status(400).send({ status: false, message: 'please provide Sizes' })
            if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
        
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
        return res.status(200).send({ status: true, message: "Product updated successfully", data: updatedProduct })
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
	   
	   await productModel.findByIdAndUpdate({_id:productId}, {$set:{isDeleted:true}},{new:true})
	   return res.status(200).send({status:true,message:"Success"})
} catch (error) {
	return res.status(500).send({error:error.message})
}
}

module.exports ={ createProduct, getproducts, getProductsById, updateProductById, deleteProduct }