const aws = require("aws-sdk")
const productModel = require("../model/productModel")
let validator = require("../validator/validator")

let createProduct = async (req, res) => {
    try {
        let data = req.body
        const productImage = req.files

        //  CHECK : if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })

        let { title, description, currencyId, currencyFormat, isFreeShipping, style,availableSizes } = data

        //  CHECK : if any data field is empty
        if (!title) { return res.status(400).send({ status: false, message: "title is mandatory" }) }
        if (!description) { return res.status(400).send({ status: false, message: "description is mandatory" }) }
        if (!data.price) { return res.status(400).send({ status: false, message: "price is mandatory" }) }
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



let getProducts = async (req, res) => {
    if (Object.keys(req.query).length == 0) {
        const products = await productModel.find({ isDeleted: false })
        return res.status(200).send({ status: true, message: "Searched Results", data: products })
    }

    if(Object.keys(req.query).length > 0){
        req.query.isDeleted = false
        let size = req.query.size //availableSizes
        let name = req.query.name // title
        let priceGreaterThan = req.query.priceGreaterThan
        let priceLessThan = req.query.priceLessThan
        if(size){ size = size.toUpperCase()}

        const filteredProducts = await productModel.find({$or:[{availableSizes:{$in:size}},{title:{$regex:name}},{price:{$gt:priceGreaterThan}},{price:{$lt:priceLessThan}}]})

        if(!filteredProducts) return res.status(400).send({status:false,message:"No Results Found"})
        return res.status(200).send({status:true,message:"Search Results",data:filteredProducts})
    }



    const productQuery = req.query;
    // Object Manupulation
    const filter = { isDeleted: false };
    // Destructuring  
    const { size, name, priceGreaterThan, priceLessThan, priceSort } = productQuery;

    //size validation
    if (isValidSize(size)) {
      const sizeArray = size.split(","||" ").map((s) => s.trim())
      // The "$all" operator selects the documents where the value of a field is an array that contains all the specified elements.
      filter.availableSizes = { $all: sizeArray }
    };

    //product name validation
    if (name) {
      productQuery.title = name
      // product name validation => if key is present then value must not be empty
      if (!objectValue(name)) { return res.status(400).send({ status: false, message: "Product name is invalid!" }) }
      // product name must be in alphabate only
      if (!validator.isValidName(name)) { return res.status(400).send({ status: false, message: "Please enter Product name is alphabets only!" }) }
      filter.title = name.trim()
    }

    // product filter by price greatherThan the given price
    if (priceGreaterThan) filter.price = { $gt: priceGreaterThan }
    // product filter by price lessThan the given price
    if (priceLessThan) filter.price = { $lt: priceLessThan }

    // product filter by both greatherThan and lessThan price
    if (priceGreaterThan && priceLessThan) {
      filter.price = { $gte: priceGreaterThan, $lte: priceLessThan }
    }

    if (objectValue(priceSort)) {
      if (!(priceSort == 1 || priceSort == -1)) {
          return res.status(400).send({ status: false, msg: "we can only sort price by value 1 or -1!" })
      }
    }
    else {
      return res.status(400).send({ status: false, msg: "enter valid priceSort of 1 or -1 to filter products!" })
    }

        //DB call => select product from DB by price filter sort the product min price to max price
        const productList = await productModel.find(filter).sort({ price: priceSort })

        // no produt found by price filter
        if (productList.length === 0) return res.status(404).send({ status: false, message: "no product found!" })

        //Successfull execution response with productDetails
        res.status(200).send({ status: true, message: 'Product list', data: productList })
}



let getProductsById = async (req, res) => {
    let productId = req.params.productId
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid ObjectId" })

    const products = await productModel.findById({ _id: productId, isDeleted: false })
    return res.status(200).send({ status: true, message: "Searched Result", data: products })
}

module.exports = {createProduct,getProductsById,getProducts}





